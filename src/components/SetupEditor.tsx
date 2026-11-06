import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Cell } from '../algorithm/types';
import { X, AlertCircle, Sparkles, SlidersHorizontal } from 'lucide-react';

export const SetupEditor: React.FC = () => {
  const {
    isSetupEditorOpen,
    setupBoard,
    setupFirstPlayer,
    setupError,
    closeSetupEditor,
    setSetupCell,
    setSetupFirstPlayer,
    applySetup,
  } = useGameStore();

  if (!isSetupEditorOpen) return null;

  const cycleCell = (index: number) => {
    const current = setupBoard[index];
    let next: Cell = null;
    if (current === null) next = 'X';
    else if (current === 'X') next = 'O';
    else next = null;
    setSetupCell(index, next);
  };

  const handleClear = () => {
    for (let i = 0; i < 9; i++) {
      setSetupCell(i, null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Custom Position Setup</h3>
          </div>
          <button
            onClick={closeSetupEditor}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Click any cell to cycle through <strong>[Empty → X → O → Empty]</strong>. Ensure turn
          counts are valid (e.g. X count equals O count or is one more if X started first).
        </p>

        {/* 3x3 Editor Board */}
        <div className="relative aspect-square max-w-[240px] mx-auto w-full p-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner grid grid-cols-3 gap-2">
          {setupBoard.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => cycleCell(idx)}
              className={`flex items-center justify-center rounded-xl font-bold text-2xl select-none transition-all ${
                cell === null
                  ? 'bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/80 text-slate-600'
                  : 'bg-slate-900 border'
              } ${
                cell === 'X'
                  ? 'text-cyan-400 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : cell === 'O'
                  ? 'text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : ''
              }`}
            >
              {cell === 'X' && '✕'}
              {cell === 'O' && '◯'}
              {cell === null && <span className="text-xs font-mono text-slate-600">{idx}</span>}
            </button>
          ))}
        </div>

        {/* First Player / Next Turn Selector */}
        <div className="flex items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-300 font-medium">Whose turn to move next?</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSetupFirstPlayer('X')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                setupFirstPlayer === 'X'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Player X
            </button>
            <button
              onClick={() => setSetupFirstPlayer('O')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                setupFirstPlayer === 'O'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Player O
            </button>
          </div>
        </div>

        {/* Validation Error Message */}
        {setupError && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{setupError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Clear Board
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={closeSetupEditor}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applySetup}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze This Position</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
