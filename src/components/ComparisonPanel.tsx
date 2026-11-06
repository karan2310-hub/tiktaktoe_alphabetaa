import React from 'react';
import { useGameStore } from '../store/gameStore';
import { runBenchmarkAsync } from '../workers/benchmarkClient';
import { BarChart3, Sparkles, Loader2, Zap } from 'lucide-react';

export const ComparisonPanel: React.FC = () => {
  const {
    board,
    aiPlayer,
    algorithm,
    benchmarkRunning,
    benchmarkProgress,
    benchmarkResult,
    setAlgorithm,
    setBenchmarkRunning,
    setBenchmarkProgress,
    setBenchmarkResult,
  } = useGameStore();

  const handleRunComparison = async () => {
    try {
      setBenchmarkRunning(true);
      setBenchmarkProgress('Initializing Benchmark Worker...');

      const result = await runBenchmarkAsync(board, aiPlayer, (stage, nodes) => {
        setBenchmarkProgress(`${stage} (${nodes.toLocaleString()} nodes)`);
      });

      setBenchmarkResult(result);
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setBenchmarkRunning(false);
      setBenchmarkProgress('');
    }
  };

  const minimaxNodes = benchmarkResult?.minimax.nodesExpanded ?? 0;
  const abNaturalNodes = benchmarkResult?.alphaBetaNatural.nodesExpanded ?? 0;
  const abStrategicNodes = benchmarkResult?.alphaBetaStrategic.nodesExpanded ?? 0;

  const maxNodes = Math.max(1, minimaxNodes);
  const mmPct = 100;
  const abNatPct = Math.round((abNaturalNodes / maxNodes) * 1000) / 10;
  const abStratPct = Math.round((abStrategicNodes / maxNodes) * 1000) / 10;

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto max-h-[460px]">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Minimax vs Alpha-Beta Comparison
        </span>
        <button
          onClick={handleRunComparison}
          disabled={benchmarkRunning}
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
        >
          {benchmarkRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>Run Comparison</span>
            </>
          )}
        </button>
      </div>

      {benchmarkRunning && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>{benchmarkProgress || 'Benchmark in progress...'}</span>
        </div>
      )}

      {/* Switch Animated Algorithm Toggle */}
      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Currently Animating:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setAlgorithm('alphabeta')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              algorithm === 'alphabeta'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Alpha-Beta
          </button>
          <button
            onClick={() => setAlgorithm('minimax')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              algorithm === 'minimax'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Minimax
          </button>
        </div>
      </div>

      {benchmarkResult ? (
        <div className="flex flex-col gap-3">
          {/* Side by side comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="pb-1.5">Algorithm</th>
                  <th className="pb-1.5 text-right">Nodes</th>
                  <th className="pb-1.5 text-right">Leaves</th>
                  <th className="pb-1.5 text-right">Time</th>
                  <th className="pb-1.5 text-right">Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                <tr>
                  <td className="py-2 font-bold text-slate-300">Minimax</td>
                  <td className="py-2 text-right">{minimaxNodes.toLocaleString()}</td>
                  <td className="py-2 text-right">
                    {benchmarkResult.minimax.leavesEvaluated.toLocaleString()}
                  </td>
                  <td className="py-2 text-right">{benchmarkResult.minimax.timeMs}ms</td>
                  <td className="py-2 text-right text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-indigo-400">α-β (Natural)</td>
                  <td className="py-2 text-right">{abNaturalNodes.toLocaleString()}</td>
                  <td className="py-2 text-right">
                    {benchmarkResult.alphaBetaNatural.leavesEvaluated.toLocaleString()}
                  </td>
                  <td className="py-2 text-right">
                    {benchmarkResult.alphaBetaNatural.timeMs}ms
                  </td>
                  <td className="py-2 text-right font-bold text-emerald-400">
                    -{benchmarkResult.reductionNaturalPct}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-purple-400">α-β (Strategic)</td>
                  <td className="py-2 text-right">{abStrategicNodes.toLocaleString()}</td>
                  <td className="py-2 text-right">
                    {benchmarkResult.alphaBetaStrategic.leavesEvaluated.toLocaleString()}
                  </td>
                  <td className="py-2 text-right">
                    {benchmarkResult.alphaBetaStrategic.timeMs}ms
                  </td>
                  <td className="py-2 text-right font-bold text-emerald-400">
                    -{benchmarkResult.reductionStrategicPct}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pure SVG Bar Chart */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              State Space Reduction Chart (Nodes Explored)
            </span>

            <div className="flex flex-col gap-2 pt-1 font-mono text-xs">
              {/* Plain Minimax Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Plain Minimax:</span>
                  <span className="font-semibold text-slate-200">
                    {minimaxNodes.toLocaleString()} nodes (100%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-500"
                    style={{ width: `${mmPct}%` }}
                  />
                </div>
              </div>

              {/* Alpha-Beta Natural */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-indigo-400">Alpha-Beta (Natural):</span>
                  <span className="font-semibold text-indigo-300">
                    {abNaturalNodes.toLocaleString()} nodes ({abNatPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, abNatPct)}%` }}
                  />
                </div>
              </div>

              {/* Alpha-Beta Strategic */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-purple-400">Alpha-Beta (Center/Corner):</span>
                  <span className="font-semibold text-purple-300">
                    {abStrategicNodes.toLocaleString()} nodes ({abStratPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, abStratPct)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 border border-slate-800/60 rounded-xl">
          <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2 opacity-60" />
          <p>Click "Run Comparison" to benchmark Plain Minimax vs Alpha-Beta Pruning on this board.</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Benchmarks execute inside a background Web Worker so the page stays responsive.
          </p>
        </div>
      )}
    </div>
  );
};
