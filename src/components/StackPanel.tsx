import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatAlphaBeta, formatScore, moveToString } from '../algorithm/board';
import { Layers, ArrowRight } from 'lucide-react';

export const StackPanel: React.FC = () => {
  const { currentTreeSnapshot, algorithm, selectedNodeId, setSelectedNodeId } = useGameStore();

  const stackIds = currentTreeSnapshot?.stack ?? [];
  const nodesMap = currentTreeSnapshot?.nodes;

  if (stackIds.length === 0 || !nodesMap) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Layers className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <p className="text-xs">The DFS call stack is currently empty.</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Play moves or step forward to watch the recursive call stack populate.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[460px]">
      <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
        <span className="font-semibold text-slate-300">DFS Call Stack ({stackIds.length})</span>
        <span className="text-[10px] font-mono">Root → Active (Top of Stack)</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {stackIds.map((nodeId, idx) => {
          const node = nodesMap.get(nodeId);
          if (!node) return null;
          const isSelected = selectedNodeId === nodeId;
          const isTopOfStack = idx === stackIds.length - 1;
          const isMax = node.nodeType === 'MAX';

          return (
            <div
              key={nodeId}
              onClick={() => setSelectedNodeId(nodeId)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                  : isTopOfStack
                  ? 'bg-slate-800/90 border-purple-500/50 text-slate-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isMax ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-orange-950 text-orange-400 border border-orange-800'
                    }`}
                  >
                    {node.nodeType}
                  </span>
                  <span className="font-bold text-slate-200">{node.id}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">d={node.depth}</span>
                </div>
                {isTopOfStack && (
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[9px] font-semibold animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span>Move: {moveToString(node.move)}</span>
                </span>
                {algorithm === 'alphabeta' && (
                  <span className="font-mono text-[10px] text-slate-300">
                    [α: {formatAlphaBeta(node.alpha ?? -Infinity)}, β:{' '}
                    {formatAlphaBeta(node.beta ?? Infinity)}]
                  </span>
                )}
              </div>

              {node.value !== undefined && (
                <div className="mt-1 text-[11px] font-mono text-emerald-400 flex items-center justify-end">
                  best-so-far: {formatScore(node.value)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

