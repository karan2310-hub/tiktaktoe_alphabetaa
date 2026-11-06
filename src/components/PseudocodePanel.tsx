import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Code2 } from 'lucide-react';

interface PseudocodeLine {
  lineNum: number;
  text: string;
  indent: number;
  stepTypes: string[];
}

const PSEUDOCODE: PseudocodeLine[] = [
  { lineNum: 1, text: 'function alphabeta(node, depth, α, β, isMaximizing):', indent: 0, stepTypes: ['ENTER_NODE'] },
  { lineNum: 2, text: 'if isTerminal(node) or depth >= maxDepth:', indent: 1, stepTypes: ['EVALUATE_LEAF'] },
  { lineNum: 3, text: 'return evaluate(node)', indent: 2, stepTypes: ['EVALUATE_LEAF'] },
  { lineNum: 4, text: '', indent: 0, stepTypes: [] },
  { lineNum: 5, text: 'if isMaximizing: // MAX Node', indent: 1, stepTypes: [] },
  { lineNum: 6, text: 'value = -∞', indent: 2, stepTypes: [] },
  { lineNum: 7, text: 'for each child in getLegalMoves(node):', indent: 2, stepTypes: [] },
  { lineNum: 8, text: 'childVal = alphabeta(child, depth+1, α, β, false)', indent: 3, stepTypes: ['ENTER_NODE'] },
  { lineNum: 9, text: 'value = max(value, childVal)', indent: 3, stepTypes: ['UPDATE_VALUE'] },
  { lineNum: 10, text: 'α = max(α, value)', indent: 3, stepTypes: ['UPDATE_ALPHA'] },
  { lineNum: 11, text: 'if β <= α:', indent: 3, stepTypes: ['PRUNE'] },
  { lineNum: 12, text: 'break // Beta cutoff (Prune branch)', indent: 4, stepTypes: ['PRUNE'] },
  { lineNum: 13, text: 'return value', indent: 2, stepTypes: ['EXIT_NODE'] },
  { lineNum: 14, text: '', indent: 0, stepTypes: [] },
  { lineNum: 15, text: 'else: // MIN Node', indent: 1, stepTypes: [] },
  { lineNum: 16, text: 'value = +∞', indent: 2, stepTypes: [] },
  { lineNum: 17, text: 'for each child in getLegalMoves(node):', indent: 2, stepTypes: [] },
  { lineNum: 18, text: 'childVal = alphabeta(child, depth+1, α, β, true)', indent: 3, stepTypes: ['ENTER_NODE'] },
  { lineNum: 19, text: 'value = min(value, childVal)', indent: 3, stepTypes: ['UPDATE_VALUE'] },
  { lineNum: 20, text: 'β = min(β, value)', indent: 3, stepTypes: ['UPDATE_BETA'] },
  { lineNum: 21, text: 'if β <= α:', indent: 3, stepTypes: ['PRUNE'] },
  { lineNum: 22, text: 'break // Alpha cutoff (Prune branch)', indent: 4, stepTypes: ['PRUNE'] },
  { lineNum: 23, text: 'return value', indent: 2, stepTypes: ['EXIT_NODE'] },
];

export const PseudocodePanel: React.FC = () => {
  const { steps, currentStepIndex } = useGameStore();
  const currentStep = steps[currentStepIndex];

  const getIsActiveLine = (line: PseudocodeLine): boolean => {
    if (!currentStep) return false;
    return line.stepTypes.includes(currentStep.type);
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner font-mono text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Active Pseudocode Trace
        </span>
        <span className="text-[10px] text-indigo-400">
          {currentStep ? currentStep.type : 'IDLE'}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 overflow-x-auto py-1">
        {PSEUDOCODE.map((line) => {
          const isActive = getIsActiveLine(line);

          return (
            <div
              key={line.lineNum}
              className={`flex items-center gap-3 px-2 py-0.5 rounded transition-colors ${
                isActive
                  ? 'bg-indigo-600/30 text-indigo-200 border-l-2 border-indigo-500 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-600 select-none w-4 text-right">
                {line.text ? line.lineNum : ''}
              </span>
              <pre
                className="font-mono text-[11px] leading-tight"
                style={{ paddingLeft: `${line.indent * 14}px` }}
              >
                {line.text || ' '}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};

