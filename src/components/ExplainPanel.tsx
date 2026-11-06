import React from 'react';
import { BookOpen, Target, Scissors, Zap, Award } from 'lucide-react';

export const ExplainPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto max-h-[460px] text-xs text-slate-300 leading-relaxed">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-bold text-white">
        <BookOpen className="w-4 h-4 text-indigo-400" />
        <span>Algorithm Theory & Course Guide</span>
      </div>

      {/* Section 1: Minimax Concept */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5">
        <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-indigo-400" /> 1. The Minimax Principle
        </h4>
        <p>
          Minimax is a recursive decision-making algorithm for two-player, zero-sum, perfect-information games.
          One player is designated <strong>MAX</strong> (the AI, attempting to maximize the score), and the other
          is <strong>MIN</strong> (the human opponent, attempting to minimize the score).
        </p>
        <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-200">
          Terminal Utility: AI Win = +10 - depth | Opponent Win = depth - 10 | Draw = 0
        </div>
        <p className="text-[11px] text-slate-400">
          Depth discounting ensures the agent chooses faster wins and prefers to delay potential losses as long as possible.
        </p>
      </div>

      {/* Section 2: Alpha-Beta Pruning */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5">
        <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-rose-400" /> 2. Alpha-Beta Pruning
        </h4>
        <p>
          Alpha-Beta maintains a dynamic search window <code className="text-cyan-300">[α, β]</code> to prune branches that cannot influence the final outcome:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>
            <strong className="text-cyan-400">α (Alpha):</strong> The best (highest) score guaranteed to the MAX player along the path from root. Starts at <code className="text-slate-300">-∞</code>.
          </li>
          <li>
            <strong className="text-orange-400">β (Beta):</strong> The best (lowest) score guaranteed to the MIN player along the path from root. Starts at <code className="text-slate-300">+∞</code>.
          </li>
        </ul>
        <div className="p-2 bg-rose-950/40 border border-rose-900/60 rounded text-rose-200 font-mono text-[11px]">
          Cutoff Condition: If β ≤ α, prune remaining child branches!
        </div>
      </div>

      {/* Section 3: Tiny Worked Example */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5">
        <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> 3. Tiny Worked Example
        </h4>
        <p className="text-slate-400">
          Consider a MAX root node exploring two MIN children, A and B:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-slate-300 font-mono text-[11px]">
          <li>Child A evaluates its subtrees and returns value <strong className="text-emerald-400">+5</strong>. Root MAX updates α to <strong className="text-cyan-400">+5</strong>.</li>
          <li>Root enters Child B with window [α=+5, β=+∞].</li>
          <li>Child B explores its first move, which leads to terminal value <strong className="text-orange-400">+2</strong>. Child B (MIN) updates its β to <strong className="text-orange-400">+2</strong>.</li>
          <li>Condition check: β (+2) ≤ α (+5) is <strong>TRUE</strong>.</li>
          <li><strong>Cutoff!</strong> Child B prunes all its remaining moves because MAX will never choose Child B (MAX can already guarantee at least +5 by choosing A).</li>
        </ol>
      </div>

      {/* Section 4: Move Ordering Impact */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5">
        <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-emerald-400" /> 4. Importance of Move Ordering
        </h4>
        <p className="text-slate-400">
          With optimal move ordering (trying center and corners first), Alpha-Beta reduces the explored states from
          <strong> 549,946</strong> nodes down to just <strong>7,865</strong> nodes (a massive <strong>98.6% reduction</strong>) while proving mathematical optimality!
        </p>
      </div>
    </div>
  );
};

