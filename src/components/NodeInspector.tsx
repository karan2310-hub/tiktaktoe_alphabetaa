import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatAlphaBeta, formatScore, moveToString } from '../algorithm/board';
import { Search, History } from 'lucide-react';

export const NodeInspector: React.FC = () => {
  const {
    currentTreeSnapshot,
    selectedNodeId,
    hoveredNodeId,
    algorithm,
  } = useGameStore();

  const activeId = hoveredNodeId ?? selectedNodeId ?? currentTreeSnapshot?.activeNodeId;
  const node = activeId ? currentTreeSnapshot?.nodes.get(activeId) : null;

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Search className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <p className="text-xs">No node selected.</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Click or hover any node in the search tree to inspect its board state, bounds, and
          decision history.
        </p>
      </div>
    );
  }

  const isMax = node.nodeType === 'MAX';

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto max-h-[460px]">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 font-mono">
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              isMax ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-orange-950 text-orange-400 border border-orange-800'
            }`}
          >
            {node.nodeType} NODE
          </span>
          <span className="text-sm font-bold text-white">{node.id}</span>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            node.state === 'ACTIVE'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : node.state === 'ON_STACK'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : node.state === 'PRUNED'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {node.state}
        </span>
      </div>

      {/* Large 3x3 Board Preview */}
      <div className="flex flex-col items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Node Board State
        </span>
        <div className="grid grid-cols-3 gap-1.5 w-36 h-36 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {node.board.map((cell, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-center rounded-lg text-lg font-bold border ${
                cell === 'X'
                  ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60'
                  : cell === 'O'
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
                  : 'bg-slate-950/50 border-slate-800/40 text-slate-600'
              }`}
            >
              {cell === 'X' && '✕'}
              {cell === 'O' && '◯'}
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col">
          <span className="text-[10px] text-slate-400">Depth</span>
          <span className="text-sm font-bold text-slate-200 font-mono">{node.depth}</span>
        </div>

        <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col">
          <span className="text-[10px] text-slate-400">Move Leading Here</span>
          <span className="text-sm font-bold text-slate-200 font-mono">
            {moveToString(node.move)}
          </span>
        </div>

        {algorithm === 'alphabeta' && (
          <>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col">
              <span className="text-[10px] text-slate-400">Alpha (α)</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">
                {formatAlphaBeta(node.alpha ?? -Infinity)}
              </span>
            </div>

            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col">
              <span className="text-[10px] text-slate-400">Beta (β)</span>
              <span className="text-sm font-bold text-orange-400 font-mono">
                {formatAlphaBeta(node.beta ?? Infinity)}
              </span>
            </div>
          </>
        )}

        <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col col-span-2">
          <span className="text-[10px] text-slate-400">Current / Returned Value</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">
            {node.returnValue !== undefined
              ? `${formatScore(node.returnValue)} (Final Return Value)`
              : node.value !== undefined
              ? `${formatScore(node.value)} (Best so far)`
              : 'Evaluating...'}
          </span>
          {node.reason && (
            <span className="text-[10px] text-slate-400 mt-0.5">Terminal: {node.reason}</span>
          )}
        </div>
      </div>

      {/* Decision / Update History */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
          <History className="w-3 h-3 text-indigo-400" /> Event & Value History
        </span>

        <div className="flex flex-col gap-1">
          {node.history.map((ev, idx) => (
            <div
              key={idx}
              className="p-1.5 bg-slate-950/60 border border-slate-800/80 rounded text-[11px] font-mono text-slate-300 flex items-center justify-between"
            >
              <span className="text-indigo-400 font-medium">#{ev.stepIndex + 1} {ev.type}</span>
              <div className="flex items-center gap-2">
                {ev.alpha !== undefined && <span>α: {formatAlphaBeta(ev.alpha)}</span>}
                {ev.beta !== undefined && <span>β: {formatAlphaBeta(ev.beta)}</span>}
                {ev.value !== undefined && <span className="text-emerald-400">val: {formatScore(ev.value)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
