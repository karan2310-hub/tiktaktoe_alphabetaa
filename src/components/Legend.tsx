import React from 'react';
import { HelpCircle } from 'lucide-react';

export const Legend: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl text-xs">
      <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800 text-slate-300 font-semibold">
        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
        <span>Visualizer Notation & Legend</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* Node Types & Shapes */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
          <div className="w-4 h-4 rounded bg-emerald-950 border border-emerald-500 flex items-center justify-center text-[8px] text-emerald-400 font-bold">
            ▲
          </div>
          <div>
            <span className="font-semibold text-emerald-400 block">MAX Node</span>
            <span className="text-[10px] text-slate-400">AI's turn (Maximizes score)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
          <div className="w-4 h-4 rounded-full bg-orange-950 border border-orange-500 flex items-center justify-center text-[8px] text-orange-400 font-bold">
            ▼
          </div>
          <div>
            <span className="font-semibold text-orange-400 block">MIN Node</span>
            <span className="text-[10px] text-slate-400">Opponent (Minimizes score)</span>
          </div>
        </div>

        {/* Node States */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
          <div className="w-4 h-4 rounded bg-purple-950 border-2 border-purple-400 ring-2 ring-purple-400/40 animate-pulse" />
          <div>
            <span className="font-semibold text-purple-300 block">Active Node</span>
            <span className="text-[10px] text-slate-400">Currently executing step</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
          <div className="w-4 h-4 rounded bg-slate-900 border-2 border-indigo-500" />
          <div>
            <span className="font-semibold text-indigo-300 block">On Stack</span>
            <span className="text-[10px] text-slate-400">Unfinished ancestor path</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
          <div className="w-4 h-4 rounded bg-emerald-900/60 border border-emerald-500 text-center text-[9px] text-emerald-200">
            ✓
          </div>
          <div>
            <span className="font-semibold text-emerald-300 block">Evaluated / Closed</span>
            <span className="text-[10px] text-slate-400">Computed return value</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
          <div className="w-4 h-4 rounded bg-slate-900 border border-dashed border-rose-500 flex items-center justify-center text-[10px] text-rose-400">
            ✂
          </div>
          <div>
            <span className="font-semibold text-rose-300 block">Pruned Cutoff</span>
            <span className="text-[10px] text-slate-400">Skipped (α ≥ β condition)</span>
          </div>
        </div>
      </div>

      {/* Alpha Beta Window Explanation */}
      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex flex-col gap-1">
        <div className="flex items-center justify-between font-mono">
          <span>
            <strong className="text-cyan-400">α</strong> = Best value guaranteed for MAX
          </span>
          <span>
            <strong className="text-orange-400">β</strong> = Best value guaranteed for MIN
          </span>
        </div>
        <p className="text-slate-500">
          Pruning occurs when <code className="text-rose-400 font-bold">β ≤ α</code>: the opponent
          already has a superior alternative, so evaluating further child moves cannot change the
          outcome.
        </p>
      </div>
    </div>
  );
};
