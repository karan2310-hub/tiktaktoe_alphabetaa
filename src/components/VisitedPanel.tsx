import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatScore, moveToString } from '../algorithm/board';
import { CheckCircle2, Scissors } from 'lucide-react';

export const VisitedPanel: React.FC = () => {
  const { currentTreeSnapshot, selectedNodeId, setSelectedNodeId } = useGameStore();
  const [subTab, setSubTab] = useState<'visited' | 'pruned'>('visited');

  const visitedIds = currentTreeSnapshot?.visitedIds ?? [];
  const prunedIds = currentTreeSnapshot?.prunedIds ?? [];
  const nodesMap = currentTreeSnapshot?.nodes;

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[460px]">
      {/* Sub-tab pills */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
        <button
          onClick={() => setSubTab('visited')}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            subTab === 'visited'
              ? 'bg-slate-800 text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Closed Nodes ({visitedIds.length})</span>
        </button>

        <button
          onClick={() => setSubTab('pruned')}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            subTab === 'pruned'
              ? 'bg-slate-800 text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-rose-400" />
          <span>Pruned Cutoffs ({prunedIds.length})</span>
        </button>
      </div>

      {subTab === 'visited' && (
        <div className="flex flex-col gap-1.5 mt-1">
          {visitedIds.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No nodes evaluated and closed yet.
            </div>
          ) : (
            visitedIds.map((nodeId) => {
              const node = nodesMap?.get(nodeId);
              if (!node) return null;
              const isSelected = selectedNodeId === nodeId;
              const isMax = node.nodeType === 'MAX';

              return (
                <div
                  key={nodeId}
                  onClick={() => setSelectedNodeId(nodeId)}
                  className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                        isMax ? 'bg-emerald-950 text-emerald-400' : 'bg-orange-950 text-orange-400'
                      }`}
                    >
                      {node.nodeType}
                    </span>
                    <span className="font-semibold">{node.id}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">d={node.depth}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 text-[10px]">
                      {moveToString(node.move)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                      val: {formatScore(node.returnValue ?? node.value ?? 0)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {subTab === 'pruned' && (
        <div className="flex flex-col gap-1.5 mt-1">
          {prunedIds.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No pruned branches at this step.
            </div>
          ) : (
            prunedIds.map((nodeId) => {
              const node = nodesMap?.get(nodeId);
              if (!node) return null;
              const isSelected = selectedNodeId === nodeId;

              return (
                <div
                  key={nodeId}
                  onClick={() => setSelectedNodeId(nodeId)}
                  className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-rose-600/20 border-rose-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                      ✂ CUT
                    </span>
                    <span className="text-slate-300">{node.id}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                    <span>Move {moveToString(node.move)}</span>
                    <span className="text-rose-400">α ≥ β</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
