import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatAlphaBeta, formatScore, moveToString } from '../algorithm/board';
import { Activity, GitBranch, Scissors, Layers, Trophy, Compass } from 'lucide-react';

export const StatsPanel: React.FC = () => {
  const {
    searchResult,
    currentTreeSnapshot,
    algorithm,
    currentStepIndex,
    steps,
  } = useGameStore();

  const counters = searchResult?.counters;
  const activeNode = currentTreeSnapshot?.activeNodeId
    ? currentTreeSnapshot.nodes.get(currentTreeSnapshot.activeNodeId)
    : null;

  const rootNode = currentTreeSnapshot?.nodes.get('node_0');
  const bestMove = currentTreeSnapshot?.bestMove ?? rootNode?.move;
  const pvMoves = searchResult?.principalVariation ?? [];

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto max-h-[460px]">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400" /> Live Search Metrics
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Step {steps.length > 0 ? currentStepIndex + 1 : 0}/{steps.length}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Nodes Expanded */}
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Nodes Expanded</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              {currentTreeSnapshot?.nodes.size.toLocaleString() ?? counters?.nodesExpanded.toLocaleString() ?? 0}
            </span>
          </div>
        </div>

        {/* Nodes Pruned */}
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Nodes Pruned</span>
            <span className="text-base font-bold text-rose-300 font-mono">
              {currentTreeSnapshot?.prunedIds.length ?? counters?.nodesPruned ?? 0}
            </span>
          </div>
        </div>

        {/* Leaves Evaluated */}
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Leaves Evaluated</span>
            <span className="text-base font-bold text-emerald-300 font-mono">
              {counters?.leavesEvaluated.toLocaleString() ?? 0}
            </span>
          </div>
        </div>

        {/* Max Depth */}
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Search Depth</span>
            <span className="text-base font-bold text-purple-300 font-mono">
              {activeNode ? `${activeNode.depth} / ${counters?.maxDepth ?? 0}` : counters?.maxDepth ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Current Alpha & Beta */}
      {algorithm === 'alphabeta' && (
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Current Alpha-Beta Window
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between">
              <span className="text-slate-400">α (Lower Bound):</span>
              <span className="font-bold text-cyan-300">
                {formatAlphaBeta(activeNode?.alpha ?? -Infinity)}
              </span>
            </div>
            <div className="p-1.5 rounded bg-orange-950/40 border border-orange-800/60 flex items-center justify-between">
              <span className="text-slate-400">β (Upper Bound):</span>
              <span className="font-bold text-orange-300">
                {formatAlphaBeta(activeNode?.beta ?? Infinity)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Root Move & Best So Far */}
      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Compass className="w-3 h-3 text-indigo-400" /> Root Recommendation
        </span>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Optimal Cell:</span>
          <span className="font-mono font-bold text-indigo-300">
            {bestMove !== null && bestMove !== undefined ? moveToString(bestMove) : 'Calculating...'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Expected Value:</span>
          <span className="font-mono font-bold text-emerald-400">
            {searchResult?.bestValue !== undefined
              ? formatScore(searchResult.bestValue)
              : 'Evaluating...'}
          </span>
        </div>
      </div>

      {/* Principal Variation (PV) Sequence */}
      {pvMoves.length > 0 && (
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Principal Variation (Optimal Path)
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {pvMoves.map((m, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono text-[11px] shrink-0 border border-slate-700"
              >
                #{idx + 1}: Move {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

