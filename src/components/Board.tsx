import React from 'react';
import { useGameStore, PRESETS } from '../store/gameStore';
import {
  RotateCcw,
  Undo2,
  ArrowLeftRight,
  SlidersHorizontal,
  Bot,
  User,
  Sparkles,
  FastForward,
} from 'lucide-react';

export const Board: React.FC = () => {
  const {
    board,
    humanPlayer,
    aiPlayer,
    currentTurn,
    gameStatus,
    winningLine,
    isAiThinking,
    autoPlayAiMove,
    isPlaying,
    steps,
    currentStepIndex,
    makeHumanMove,
    resetGame,
    undoMove,
    swapSides,
    openSetupEditor,
    loadPreset,
    setAutoPlayAiMove,
    skipToEnd,
  } = useGameStore();

  const isHumanTurn = currentTurn === humanPlayer && gameStatus === 'PLAYING' && !isAiThinking;

  const getStatusMessage = () => {
    if (gameStatus === 'X_WINS') {
      return {
        text: humanPlayer === 'X' ? '🎉 You Win!' : '🤖 AI Wins!',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      };
    }
    if (gameStatus === 'O_WINS') {
      return {
        text: humanPlayer === 'O' ? '🎉 You Win!' : '🤖 AI Wins!',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      };
    }
    if (gameStatus === 'DRAW') {
      return {
        text: "🤝 It's a Draw!",
        color: 'text-slate-300 bg-slate-800/80 border-slate-700',
      };
    }
    if (isAiThinking || (isPlaying && steps.length > 0)) {
      return {
        text: `🤖 AI (${aiPlayer}) is calculating...`,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 animate-pulse',
      };
    }
    return {
      text: isHumanTurn ? `👉 Your Turn (${humanPlayer})` : `⏳ AI (${aiPlayer})'s Turn`,
      color: isHumanTurn
        ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
        : 'text-slate-400 bg-slate-800/60 border-slate-700',
    };
  };

  const status = getStatusMessage();

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
      {/* Top Banner: Status & Quick Controls */}
      <div className="flex items-center justify-between gap-2">
        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${status.color}`}
        >
          {status.text}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setAutoPlayAiMove(!autoPlayAiMove)}
            className={`px-2 py-1 rounded border text-xs font-medium transition-all ${
              autoPlayAiMove
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="When active, AI plays its move immediately once reasoning animation completes."
          >
            Auto-play AI: {autoPlayAiMove ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 whitespace-nowrap font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Preset:
        </label>
        <select
          onChange={(e) => loadPreset(e.target.value)}
          defaultValue="empty"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3x3 Tic-Tac-Toe Board */}
      <div className="relative aspect-square max-w-[280px] mx-auto w-full p-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner grid grid-cols-3 gap-2">
        {board.map((cell, idx) => {
          const isWinningCell = winningLine?.includes(idx);
          const isClickable = isHumanTurn && cell === null;

          return (
            <button
              key={idx}
              onClick={() => isClickable && makeHumanMove(idx)}
              disabled={!isClickable}
              className={`relative flex items-center justify-center rounded-xl font-bold text-3xl select-none transition-all duration-200 ${
                cell === null
                  ? isHumanTurn
                    ? 'hover:bg-slate-800/80 active:scale-95 cursor-pointer bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40'
                    : 'bg-slate-900/30 border border-slate-800/40 cursor-not-allowed'
                  : 'bg-slate-900 border'
              } ${
                isWinningCell
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 animate-pulse'
                  : cell === 'X'
                  ? 'text-cyan-400 border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
              }`}
              title={`Cell ${idx + 1}`}
            >
              {cell === 'X' && (
                <span className="scale-up font-extrabold tracking-tight">✕</span>
              )}
              {cell === 'O' && (
                <span className="scale-up font-extrabold tracking-tight">◯</span>
              )}
              {cell === null && isHumanTurn && (
                <span className="opacity-0 hover:opacity-20 text-xs font-mono text-slate-400">
                  {idx}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Skip AI thinking shortcut if steps exist */}
      {steps.length > 0 && currentStepIndex < steps.length - 1 && (
        <button
          onClick={skipToEnd}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-medium transition-all"
        >
          <FastForward className="w-3.5 h-3.5" /> Skip AI Reasoning to Move Placement
        </button>
      )}

      {/* Bottom Button Toolbar */}
      <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800/80">
        <button
          onClick={resetGame}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-[10px] font-medium transition-colors"
          title="Reset to fresh board"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>New Game</span>
        </button>
        <button
          onClick={undoMove}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-[10px] font-medium transition-colors"
          title="Undo last human turn"
        >
          <Undo2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Undo</span>
        </button>
        <button
          onClick={swapSides}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-[10px] font-medium transition-colors"
          title="Swap sides: AI plays first vs Human plays first"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
          <span>Swap Sides</span>
        </button>
        <button
          onClick={openSetupEditor}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-[10px] font-medium transition-colors"
          title="Open custom position setup editor"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span>Setup</span>
        </button>
      </div>

      {/* Roles Indicator */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-cyan-400" />
          <span>You:</span>
          <span className="text-cyan-400 font-semibold">{humanPlayer}</span>
        </div>
        <div className="flex items-center gap-1">
          <Bot className="w-3 h-3 text-emerald-400" />
          <span>AI (MAX):</span>
          <span className="text-emerald-400 font-semibold">{aiPlayer}</span>
        </div>
      </div>
    </div>
  );
};

