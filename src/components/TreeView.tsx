import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, tree, HierarchyPointNode } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, ZoomTransform, ZoomBehavior } from 'd3-zoom';
import { useGameStore } from '../store/gameStore';
import { VisualNode } from '../store/treeState';
import { formatAlphaBeta, formatScore } from '../algorithm/board';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  LocateFixed,
  Split,
  FolderMinus,
  Sparkles,
} from 'lucide-react';

interface HierarchyDatum {
  id: string;
  node: VisualNode;
  children?: HierarchyDatum[];
  collapsedCount?: number;
}

interface LayoutNodeItem {
  id: string;
  node: VisualNode;
  x: number;
  y: number;
  collapsedCount?: number;
}

interface LayoutLinkItem {
  sourceId: string;
  targetId: string;
  targetNode: VisualNode;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

const NODE_WIDTH = 84;
const NODE_HEIGHT = 90;
const V_SPACING_X = 100;
const V_SPACING_Y = 120;
const H_SPACING_X = 130;
const H_SPACING_Y = 96;

export const TreeView: React.FC = () => {
  const {
    currentTreeSnapshot,
    treeLayout,
    autoFollowCamera,
    autoCollapseFinished,
    selectedNodeId,
    collapsedNodeIds,
    algorithm,
    setTreeLayout,
    setAutoFollowCamera,
    setAutoCollapseFinished,
    setSelectedNodeId,
    setHoveredNodeId,
    toggleNodeCollapse,
    setActiveTab,
  } = useGameStore();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [currentZoom, setCurrentZoom] = useState<ZoomTransform>(zoomIdentity);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Measure container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Setup d3-zoom
  useEffect(() => {
    if (!svgRef.current) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3.5])
      .on('zoom', (event) => {
        setCurrentZoom(event.transform);
        if (gRef.current) {
          select(gRef.current).attr('transform', event.transform.toString());
        }
      });

    zoomBehaviorRef.current = zoomBehavior;
    select(svgRef.current).call(zoomBehavior);

    return () => {
      if (svgRef.current) {
        select(svgRef.current).on('.zoom', null);
      }
    };
  }, []);

  // Build hierarchical data from current snapshot
  const { rootHierarchy, totalVisibleNodes } = useMemo(() => {
    if (!currentTreeSnapshot || !currentTreeSnapshot.nodes.has('node_0')) {
      return { rootHierarchy: null, totalVisibleNodes: 0 };
    }

    const nodesMap = currentTreeSnapshot.nodes;
    let visibleCount = 0;

    function countDescendants(nodeId: string): number {
      const node = nodesMap.get(nodeId);
      if (!node) return 0;
      let count = node.children.length;
      for (const chId of node.children) {
        count += countDescendants(chId);
      }
      return count;
    }

    function buildNode(nodeId: string): HierarchyDatum | null {
      const node = nodesMap.get(nodeId);
      if (!node) return null;
      visibleCount++;

      const isExplicitlyCollapsed = collapsedNodeIds.includes(nodeId);
      const isAutoCollapsed =
        autoCollapseFinished &&
        node.state === 'FINISHED' &&
        node.id !== currentTreeSnapshot?.activeNodeId &&
        node.children.length > 0;

      const isCollapsed = isExplicitlyCollapsed || isAutoCollapsed;

      if (isCollapsed && node.children.length > 0) {
        return {
          id: nodeId,
          node,
          children: undefined,
          collapsedCount: countDescendants(nodeId),
        };
      }

      const childrenData: HierarchyDatum[] = [];
      for (const childId of node.children) {
        const childData = buildNode(childId);
        if (childData) childrenData.push(childData);
      }

      return {
        id: nodeId,
        node,
        children: childrenData.length > 0 ? childrenData : undefined,
      };
    }

    const root = buildNode('node_0');
    return { rootHierarchy: root, totalVisibleNodes: visibleCount };
  }, [currentTreeSnapshot, collapsedNodeIds, autoCollapseFinished]);

  // Compute d3 tree coordinates
  const { layoutNodes, layoutLinks, activeNodePos, bounds } = useMemo(() => {
    if (!rootHierarchy) {
      return {
        layoutNodes: [] as LayoutNodeItem[],
        layoutLinks: [] as LayoutLinkItem[],
        activeNodePos: null as { x: number; y: number } | null,
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      };
    }

    const root = hierarchy<HierarchyDatum>(rootHierarchy);
    const isVertical = treeLayout === 'vertical';

    const treeGen = tree<HierarchyDatum>().nodeSize(
      isVertical ? [V_SPACING_X, V_SPACING_Y] : [H_SPACING_Y, H_SPACING_X]
    );

    const pointRoot: HierarchyPointNode<HierarchyDatum> = treeGen(root);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let activePos: { x: number; y: number } | null = null;

    const nodesList: LayoutNodeItem[] = pointRoot.descendants().map((d) => {
      const posX = isVertical ? d.x : d.y;
      const posY = isVertical ? d.y : d.x;

      if (posX < minX) minX = posX;
      if (posX > maxX) maxX = posX;
      if (posY < minY) minY = posY;
      if (posY > maxY) maxY = posY;

      if (d.data.id === currentTreeSnapshot?.activeNodeId) {
        activePos = { x: posX, y: posY };
      }

      return {
        id: d.data.id,
        node: d.data.node,
        x: posX,
        y: posY,
        collapsedCount: d.data.collapsedCount,
      };
    });

    const linksList: LayoutLinkItem[] = pointRoot.links().map((link) => {
      const sourceX = isVertical ? link.source.x : link.source.y;
      const sourceY = isVertical ? link.source.y : link.source.x;
      const targetX = isVertical ? link.target.x : link.target.y;
      const targetY = isVertical ? link.target.y : link.target.x;

      return {
        sourceId: link.source.data.id,
        targetId: link.target.data.id,
        targetNode: link.target.data.node,
        sourceX,
        sourceY,
        targetX,
        targetY,
      };
    });

    return {
      layoutNodes: nodesList,
      layoutLinks: linksList,
      activeNodePos: activePos,
      bounds: { minX, maxX, minY, maxY },
    };
  }, [rootHierarchy, treeLayout, currentTreeSnapshot?.activeNodeId]);

  // Auto-follow camera to active node
  useEffect(() => {
    if (!autoFollowCamera || !activeNodePos || !svgRef.current || !zoomBehaviorRef.current) return;

    const { width, height } = containerDimensions;
    const targetX = width / 2 - activeNodePos.x * currentZoom.k;
    const targetY = height / 3 - activeNodePos.y * currentZoom.k;

    select(svgRef.current).call(
      zoomBehaviorRef.current.transform,
      zoomIdentity.translate(targetX, targetY).scale(currentZoom.k)
    );
  }, [activeNodePos, autoFollowCamera, containerDimensions, currentZoom.k]);

  // Zoom controls
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleFitToScreen = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || layoutNodes.length === 0) return;

    const { width, height } = containerDimensions;
    const pad = 120;
    const boxWidth = Math.max(100, bounds.maxX - bounds.minX + pad * 2);
    const boxHeight = Math.max(100, bounds.maxY - bounds.minY + pad * 2);

    const scale = Math.min(1.8, Math.max(0.15, Math.min(width / boxWidth, height / boxHeight)));
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const tx = width / 2 - centerX * scale;
    const ty = height / 2 - centerY * scale;

    select(svgRef.current).call(
      zoomBehaviorRef.current.transform,
      zoomIdentity.translate(tx, ty).scale(scale)
    );
  }, [containerDimensions, bounds, layoutNodes.length]);

  const handleResetView = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const { width } = containerDimensions;
    select(svgRef.current).call(
      zoomBehaviorRef.current.transform,
      zoomIdentity.translate(width / 2, 80).scale(1)
    );
  };

  // Node Click: Inspect and highlight
  const handleNodeClick = (node: VisualNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setActiveTab('inspector');
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none"
    >
      {/* Top Floating View Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-1.5 shadow-lg">
          <button
            onClick={() => setTreeLayout(treeLayout === 'vertical' ? 'horizontal' : 'vertical')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle between Vertical (top-down) and Horizontal (left-right) layout"
          >
            <Split className="w-3.5 h-3.5 text-indigo-400 rotate-90" />
            <span>{treeLayout === 'vertical' ? 'Vertical' : 'Horizontal'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <button
            onClick={() => setAutoFollowCamera(!autoFollowCamera)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              autoFollowCamera
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Keep camera centered on the active node during animation"
          >
            <LocateFixed className="w-3.5 h-3.5 text-indigo-400" />
            <span>Follow Active</span>
          </button>

          <button
            onClick={() => setAutoCollapseFinished(!autoCollapseFinished)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              autoCollapseFinished
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Auto-collapse finished subtrees to keep large trees readable"
          >
            <FolderMinus className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Collapse</span>
          </button>
        </div>

        {/* Zoom & Fit Toolbar */}
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-1.5 shadow-lg">
          <button
            onClick={() => handleZoom(1.3)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.7)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitToScreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        onClick={() => setSelectedNodeId(null)}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g ref={gRef}>
          {/* Render Edge Links */}
          {layoutLinks.map((link) => {
            const isPruned = link.targetNode.state === 'PRUNED';
            const isOnStack =
              link.targetNode.state === 'ON_STACK' || link.targetNode.state === 'ACTIVE';

            const isVertical = treeLayout === 'vertical';
            let dPath = '';
            let midX = 0;
            let midY = 0;

            if (isVertical) {
              const sy = link.sourceY + NODE_HEIGHT / 2;
              const ty = link.targetY - NODE_HEIGHT / 2;
              const cy = (sy + ty) / 2;
              dPath = `M ${link.sourceX} ${sy} C ${link.sourceX} ${cy}, ${link.targetX} ${cy}, ${link.targetX} ${ty}`;
              midX = (link.sourceX + link.targetX) / 2;
              midY = cy;
            } else {
              const sx = link.sourceX + NODE_WIDTH / 2;
              const tx = link.targetX - NODE_WIDTH / 2;
              const cx = (sx + tx) / 2;
              dPath = `M ${sx} ${link.sourceY} C ${cx} ${link.sourceY}, ${cx} ${link.targetY}, ${tx} ${link.targetY}`;
              midX = cx;
              midY = (link.sourceY + link.targetY) / 2;
            }

            return (
              <g key={`${link.sourceId}->${link.targetId}`}>
                <path
                  d={dPath}
                  fill="none"
                  stroke={
                    isPruned
                      ? '#475569'
                      : isOnStack
                      ? '#6366f1'
                      : '#334155'
                  }
                  strokeWidth={isOnStack ? 2.5 : 1.5}
                  strokeDasharray={isPruned ? '4,4' : undefined}
                />

                {/* Move Pill on Edge */}
                {link.targetNode.move !== null && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-14}
                      y={-10}
                      width={28}
                      height={20}
                      rx={6}
                      fill="#0f172a"
                      stroke={isPruned ? '#475569' : isOnStack ? '#6366f1' : '#334155'}
                      strokeWidth={1}
                    />
                    <text
                      y={3.5}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-bold fill-slate-300 select-none pointer-events-none"
                    >
                      {link.targetNode.move}
                    </text>
                    {isPruned && (
                      <g transform="translate(14, -6)">
                        <circle cx={0} cy={0} r={7} fill="#ef4444" />
                        <text
                          y={3}
                          textAnchor="middle"
                          className="text-[9px] font-bold fill-white select-none pointer-events-none"
                        >
                          ✂
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Nodes */}
          {layoutNodes.map((item) => {
            const node = item.node;
            const isSelected = selectedNodeId === node.id;
            const isActive = node.state === 'ACTIVE';
            const isOnStack = node.state === 'ON_STACK';
            const isPruned = node.state === 'PRUNED';
            const isFinished = node.state === 'FINISHED';
            const isMax = node.nodeType === 'MAX';

            const strokeColor = isSelected
              ? '#38bdf8'
              : isActive
              ? '#a855f7'
              : isPruned
              ? '#64748b'
              : isOnStack
              ? '#6366f1'
              : isMax
              ? '#22c55e'
              : '#f97316';

            return (
              <g
                key={node.id}
                transform={`translate(${item.x}, ${item.y})`}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer group"
              >
                {/* Active Glowing Pulse */}
                {isActive && (
                  <rect
                    x={-NODE_WIDTH / 2 - 6}
                    y={-NODE_HEIGHT / 2 - 6}
                    width={NODE_WIDTH + 12}
                    height={NODE_HEIGHT + 12}
                    rx={16}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth={2}
                    className="animate-pulse"
                    filter="url(#glow)"
                  />
                )}

                {/* Node Main Container: Shape distinction (MAX = Square/Rounded Rect, MIN = Circle/Hexagon) */}
                <rect
                  x={-NODE_WIDTH / 2}
                  y={-NODE_HEIGHT / 2}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={isMax ? 10 : 20}
                  fill={
                    isPruned
                      ? '#1e293b'
                      : isActive
                      ? '#1e1b4b'
                      : isOnStack
                      ? '#0f172a'
                      : '#090d16'
                  }
                  stroke={strokeColor}
                  strokeWidth={isActive || isSelected ? 2.5 : isOnStack ? 2 : 1.5}
                  strokeDasharray={isPruned ? '4,4' : undefined}
                />

                {/* Type & Move Header */}
                <g transform={`translate(0, ${-NODE_HEIGHT / 2 + 10})`}>
                  <rect
                    x={-NODE_WIDTH / 2 + 4}
                    y={-7}
                    width={NODE_WIDTH - 8}
                    height={14}
                    rx={4}
                    fill={isMax ? '#14532d' : '#7c2d12'}
                    opacity={0.7}
                  />
                  <text
                    y={3}
                    textAnchor="middle"
                    className="text-[9px] font-bold font-mono tracking-tight fill-slate-200 select-none pointer-events-none"
                  >
                    {isMax ? '▲ MAX' : '▼ MIN'}{' '}
                    {node.move !== null ? `(#${node.move})` : '(Root)'}
                  </text>
                </g>

                {/* Mini Board 3x3 Grid */}
                <g transform="translate(0, -6)">
                  <rect
                    x={-18}
                    y={-18}
                    width={36}
                    height={36}
                    rx={4}
                    fill="#020617"
                    stroke="#1e293b"
                    strokeWidth={1}
                  />
                  {/* Grid Lines */}
                  <line x1={-6} y1={-18} x2={-6} y2={18} stroke="#1e293b" strokeWidth={0.75} />
                  <line x1={6} y1={-18} x2={6} y2={18} stroke="#1e293b" strokeWidth={0.75} />
                  <line x1={-18} y1={-6} x2={18} y2={-6} stroke="#1e293b" strokeWidth={0.75} />
                  <line x1={-18} y1={6} x2={18} y2={6} stroke="#1e293b" strokeWidth={0.75} />

                  {/* Cell Pieces */}
                  {node.board.map((cell, idx) => {
                    const row = Math.floor(idx / 3);
                    const col = idx % 3;
                    const cx = -12 + col * 12;
                    const cy = -12 + row * 12;

                    if (cell === 'X') {
                      return (
                        <text
                          key={idx}
                          x={cx}
                          y={cy + 3.5}
                          textAnchor="middle"
                          className="text-[9px] font-black fill-cyan-400 select-none pointer-events-none"
                        >
                          ✕
                        </text>
                      );
                    }
                    if (cell === 'O') {
                      return (
                        <text
                          key={idx}
                          x={cx}
                          y={cy + 3.5}
                          textAnchor="middle"
                          className="text-[9px] font-black fill-emerald-400 select-none pointer-events-none"
                        >
                          ◯
                        </text>
                      );
                    }
                    return null;
                  })}
                </g>

                {/* Values Footer: α, β, and value */}
                <g transform={`translate(0, ${NODE_HEIGHT / 2 - 12})`}>
                  {algorithm === 'alphabeta' && !isPruned ? (
                    <text
                      textAnchor="middle"
                      className="text-[8.5px] font-mono fill-slate-300 select-none pointer-events-none"
                    >
                      α:{formatAlphaBeta(node.alpha ?? -Infinity)} β:
                      {formatAlphaBeta(node.beta ?? Infinity)}
                    </text>
                  ) : isPruned ? (
                    <text
                      textAnchor="middle"
                      className="text-[8.5px] font-bold font-mono fill-rose-400 select-none pointer-events-none"
                    >
                      ✂ PRUNED
                    </text>
                  ) : (
                    <text
                      textAnchor="middle"
                      className="text-[8.5px] font-mono fill-slate-400 select-none pointer-events-none"
                    >
                      depth: {node.depth}
                    </text>
                  )}

                  {/* Return / Current Value Pill */}
                  {(node.value !== undefined || node.returnValue !== undefined) && !isPruned && (
                    <g transform="translate(0, -11)">
                      <rect
                        x={-18}
                        y={-8}
                        width={36}
                        height={13}
                        rx={3}
                        fill={isFinished ? '#047857' : '#4338ca'}
                      />
                      <text
                        y={2}
                        textAnchor="middle"
                        className="text-[8px] font-bold font-mono fill-white select-none pointer-events-none"
                      >
                        val: {formatScore(node.value ?? node.returnValue ?? 0)}
                      </text>
                    </g>
                  )}
                </g>

                {/* Subtree Collapsed Badge */}
                {item.collapsedCount !== undefined && item.collapsedCount > 0 && (
                  <g
                    transform={`translate(${NODE_WIDTH / 2 - 4}, ${NODE_HEIGHT / 2 - 4})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNodeCollapse(node.id);
                    }}
                    className="hover:scale-110 transition-transform"
                  >
                    <rect
                      x={-16}
                      y={-10}
                      width={32}
                      height={18}
                      rx={6}
                      fill="#d97706"
                      stroke="#fbbf24"
                      strokeWidth={1}
                    />
                    <text
                      y={3}
                      textAnchor="middle"
                      className="text-[9px] font-extrabold fill-slate-950 font-mono select-none"
                    >
                      +{item.collapsedCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Empty State Banner if no nodes */}
      {layoutNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">Search Tree Visualizer</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Play a move or select a preset to see the Minimax search tree expand with animated
            alpha-beta cutoffs.
          </p>
        </div>
      )}

      {/* Bottom Floating Stats Pill */}
      {layoutNodes.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg text-xs font-mono text-slate-400 flex items-center gap-3">
          <span>
            Visible Nodes: <strong className="text-slate-200">{totalVisibleNodes}</strong>
          </span>
          <span>•</span>
          <span>
            Zoom: <strong className="text-slate-200">{Math.round(currentZoom.k * 100)}%</strong>
          </span>
        </div>
      )}
    </div>
  );
};
