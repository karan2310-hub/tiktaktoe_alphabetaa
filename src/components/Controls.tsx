import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Sliders,
  Layers,
  Info,
} from 'lucide-react';

export const Controls: React.FC = () => {
  const {
    steps,
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    algorithm,
    moveOrdering,
    maxDepthLimit,
    play,
    pause,
    stepForward,
    stepBack,
    resetSteps,
    skipToEnd,
    setStepIndex,
    setPlaybackSpeed,
    setAlgorithm,
    setMoveOrdering,
    setMaxDepthLimit,
  } = useGameStore();

  const timerRef = useRef<number | null>(null);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (steps.length === 0 || currentStepIndex >= steps.length - 1) {
      pause();
      return;
    }

    // Interval derived from playbackSpeed:
    // 1x = 500ms, 2x = 250ms, 5x = 100ms, 10x = 50ms, 20x = 25ms
    const intervalMs = Math.max(16, Math.round(500 / playbackSpeed));

    timerRef.current = window.setTimeout(() => {
      stepForward();
    }, intervalMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed, stepForward, pause]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) pause();
        else play();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBack();
      } else if (e.code === 'Home') {
        e.preventDefault();
        resetSteps();
      } else if (e.code === 'End') {
        e.preventDefault();
        skipToEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, stepForward, stepBack, resetSteps, skipToEnd]);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const stepsPerSec = Math.round((playbackSpeed / 0.5) * 10) / 10;

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
      {/* Prominent Description Bar */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 shadow-inner min-h-[64px] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-2">
            <span>
              Step {totalSteps > 0 ? currentStepIndex + 1 : 0} of {totalSteps}
            </span>
            {currentStep && (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">
                {currentStep.type}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed mt-0.5 break-words">
            {currentStep
              ? currentStep.description
              : totalSteps > 0
              ? 'Ready. Use playback controls or scrub timeline to explore search steps.'
              : 'Make a move on the board or load a preset to start visualizing the search.'}
          </p>
        </div>
      </div>

      {/* Scrubber Timeline */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>0</span>
          <span className="font-semibold text-slate-200">
            {totalSteps > 0 ? `${currentStepIndex + 1} / ${totalSteps}` : '0 / 0'}
          </span>
          <span>{totalSteps > 0 ? totalSteps : 0}</span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={totalSteps > 0 ? currentStepIndex : 0}
          disabled={totalSteps === 0}
          onChange={(e) => setStepIndex(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
        />
      </div>

      {/* Main Playback Control Buttons */}
      <div className="flex items-center justify-between gap-1">
        <button
          onClick={resetSteps}
          disabled={totalSteps === 0 || currentStepIndex <= 0}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Reset to Start [Home]"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={stepBack}
          disabled={totalSteps === 0 || currentStepIndex <= 0}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Step Backward [Left Arrow]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={isPlaying ? pause : play}
          disabled={totalSteps === 0}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-semibold text-sm transition-all shadow-md ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 ring-2 ring-amber-400/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/30'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
          title={isPlaying ? 'Pause [Space]' : 'Play [Space]'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          onClick={stepForward}
          disabled={totalSteps === 0 || currentStepIndex >= totalSteps - 1}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Step Forward [Right Arrow]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={skipToEnd}
          disabled={totalSteps === 0 || currentStepIndex >= totalSteps - 1}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Skip to End [End]"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Speed Slider */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 font-medium">
          <Gauge className="w-3.5 h-3.5 text-indigo-400" />
          <span>Speed: {playbackSpeed}x</span>
          <span className="text-[10px] text-slate-500 font-mono">({stepsPerSec}/s)</span>
        </div>
        <input
          type="range"
          min="0.25"
          max="10"
          step="0.25"
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Algorithm Config Section */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Search Configuration
          </span>
        </div>

        {/* Algorithm Radio Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setAlgorithm('alphabeta')}
            className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-all ${
              algorithm === 'alphabeta'
                ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Alpha-Beta Pruning
          </button>
          <button
            onClick={() => setAlgorithm('minimax')}
            className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-all ${
              algorithm === 'minimax'
                ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Plain Minimax
          </button>
        </div>

        {/* Move Ordering Toggle (relevant for alpha-beta) */}
        {algorithm === 'alphabeta' && (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-medium">Move Ordering:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setMoveOrdering('natural')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  moveOrdering === 'natural'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
                title="Natural order (0 to 8)"
              >
                Natural (0..8)
              </button>
              <button
                onClick={() => setMoveOrdering('strategic')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  moveOrdering === 'strategic'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
                title="Center, corners, edges for max pruning efficiency"
              >
                Strategic (Center/Corners)
              </button>
            </div>
          </div>
        )}

        {/* Depth limit selector */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" /> Depth Limit (plies):
          </span>
          <select
            value={maxDepthLimit}
            onChange={(e) => setMaxDepthLimit(parseInt(e.target.value, 10))}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value={9}>Full Search (Up to 9 plies)</option>
            <option value={6}>6 Plies</option>
            <option value={4}>4 Plies</option>
            <option value={3}>3 Plies</option>
            <option value={2}>2 Plies</option>
            <option value={1}>1 Ply</option>
          </select>
        </div>
      </div>
    </div>
  );
};
