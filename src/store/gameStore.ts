import { create } from 'zustand';
import {
  applyMove,
  createEmptyBoard,
  getOpponent,
  isTerminal,
  validateBoard,
} from '../algorithm/board';
import { runMinimaxWithSteps } from '../algorithm/minimax';
import { runAlphaBetaWithSteps } from '../algorithm/alphabeta';
import {
  BenchmarkResult,
  Board,
  Cell,
  MoveOrdering,
  Player,
  SearchResult,
  Step,
} from '../algorithm/types';
import { TreeSnapshot, TreeStateCache } from './treeState';

export interface PresetPosition {
  id: string;
  name: string;
  description: string;
  board: Board;
  currentTurn: Player;
}

export const PRESETS: PresetPosition[] = [
  {
    id: 'empty',
    name: 'Empty Board (Benchmark ready)',
    description: 'Fresh game start. Visualizable with depth limit or in Benchmark mode.',
    board: createEmptyBoard(),
    currentTurn: 'X',
  },
  {
    id: 'mid-game-3',
    name: 'Mid-Game: 3 Moves Played',
    description: 'Human X played center and bottom-right; AI O played top-left. AI turn.',
    board: [
      'O', null, null,
      null, 'X', null,
      null, null, 'X',
    ],
    currentTurn: 'O',
  },
  {
    id: 'block-win',
    name: 'Block-the-Win Scenario',
    description: 'Human X has two in a row [0, 1]. AI O must immediately block at cell 2.',
    board: [
      'X', 'X', null,
      'O', null, null,
      null, null, null,
    ],
    currentTurn: 'O',
  },
  {
    id: 'fork-defense',
    name: 'Fork Threat & Defense',
    description: 'X placed in opposite corners [0, 8]; AI O in center [4]. AI must prevent a fork.',
    board: [
      'X', null, null,
      null, 'O', null,
      null, null, 'X',
    ],
    currentTurn: 'O',
  },
  {
    id: 'late-game-2',
    name: 'Late Game: 2 Empty Cells',
    description: '7 moves played, only 2 remaining moves. Quick, compact search tree.',
    board: [
      'X', 'O', 'X',
      'X', 'O', 'O',
      null, 'X', null,
    ],
    currentTurn: 'O',
  },
  {
    id: 'immediate-win',
    name: 'Immediate AI Win in 1 Move',
    description: 'AI O has cells 1 and 4. Cell 7 delivers an immediate victory!',
    board: [
      'X', 'O', null,
      'X', 'O', null,
      null, null, null,
    ],
    currentTurn: 'O',
  },
];

export type ActiveTab = 'stack' | 'visited' | 'pruned' | 'inspector' | 'comparison' | 'explain';

interface GameState {
  // Board & Game
  board: Board;
  humanPlayer: Player;
  aiPlayer: Player;
  currentTurn: Player;
  gameStatus: 'PLAYING' | 'X_WINS' | 'O_WINS' | 'DRAW';
  winningLine: number[] | null;
  moveHistory: Array<{ board: Board; move: number | null; player: Player }>;
  autoPlayAiMove: boolean;
  isAiThinking: boolean;

  // Algorithm configuration
  algorithm: 'alphabeta' | 'minimax';
  moveOrdering: MoveOrdering;
  maxDepthLimit: number;
  presetName: string;

  // Visualization & Playback
  searchResult: SearchResult | null;
  steps: Step[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.25 to 20
  treeCache: TreeStateCache | null;
  currentTreeSnapshot: TreeSnapshot | null;

  // Tree View State
  treeLayout: 'vertical' | 'horizontal';
  autoFollowCamera: boolean;
  autoCollapseFinished: boolean;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  collapsedNodeIds: string[];

  // UI Panels & Theme
  activeTab: ActiveTab;
  theme: 'dark' | 'light';
  isSetupEditorOpen: boolean;
  setupBoard: Board;
  setupFirstPlayer: Player;
  setupError: string | null;

  // Benchmark State
  benchmarkRunning: boolean;
  benchmarkProgress: string;
  benchmarkResult: BenchmarkResult | null;

  // Actions
  makeHumanMove: (cellIndex: number) => void;
  startAiThinking: (boardToSearch?: Board) => void;
  applyAiChosenMove: () => void;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBack: () => void;
  setStepIndex: (index: number) => void;
  resetSteps: () => void;
  skipToEnd: () => void;
  setPlaybackSpeed: (speed: number) => void;

  setAlgorithm: (alg: 'alphabeta' | 'minimax') => void;
  setMoveOrdering: (ordering: MoveOrdering) => void;
  setMaxDepthLimit: (limit: number) => void;
  setAutoPlayAiMove: (val: boolean) => void;

  resetGame: () => void;
  undoMove: () => void;
  swapSides: () => void;
  loadPreset: (presetId: string) => void;

  setTreeLayout: (layout: 'vertical' | 'horizontal') => void;
  setAutoFollowCamera: (val: boolean) => void;
  setAutoCollapseFinished: (val: boolean) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setHoveredNodeId: (nodeId: string | null) => void;
  toggleNodeCollapse: (nodeId: string) => void;

  setActiveTab: (tab: ActiveTab) => void;
  setTheme: (theme: 'dark' | 'light') => void;

  openSetupEditor: () => void;
  closeSetupEditor: () => void;
  setSetupCell: (index: number, cell: Cell) => void;
  setSetupFirstPlayer: (p: Player) => void;
  applySetup: () => boolean;

  setBenchmarkRunning: (running: boolean) => void;
  setBenchmarkProgress: (progress: string) => void;
  setBenchmarkResult: (result: BenchmarkResult | null) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createEmptyBoard(),
  humanPlayer: 'X',
  aiPlayer: 'O',
  currentTurn: 'X',
  gameStatus: 'PLAYING',
  winningLine: null,
  moveHistory: [{ board: createEmptyBoard(), move: null, player: 'X' }],
  autoPlayAiMove: true,
  isAiThinking: false,

  algorithm: 'alphabeta',
  moveOrdering: 'natural',
  maxDepthLimit: 9,
  presetName: 'Empty Board',

  searchResult: null,
  steps: [],
  currentStepIndex: -1,
  isPlaying: false,
  playbackSpeed: 1,
  treeCache: null,
  currentTreeSnapshot: null,

  treeLayout: 'vertical',
  autoFollowCamera: true,
  autoCollapseFinished: false,
  selectedNodeId: null,
  hoveredNodeId: null,
  collapsedNodeIds: [],

  activeTab: 'stack',
  theme: 'dark',
  isSetupEditorOpen: false,
  setupBoard: createEmptyBoard(),
  setupFirstPlayer: 'X',
  setupError: null,

  benchmarkRunning: false,
  benchmarkProgress: '',
  benchmarkResult: null,

  makeHumanMove: (cellIndex: number) => {
    const { board, currentTurn, humanPlayer, gameStatus, isAiThinking } = get();
    if (isAiThinking || gameStatus !== 'PLAYING') return;
    if (currentTurn !== humanPlayer) return;
    if (board[cellIndex] !== null) return;

    const nextBoard = applyMove(board, cellIndex, humanPlayer);
    const term = isTerminal(nextBoard);

    let nextStatus: 'PLAYING' | 'X_WINS' | 'O_WINS' | 'DRAW' = 'PLAYING';
    let winLine: number[] | null = null;

    if (term.terminal) {
      if (term.winner) {
        nextStatus = term.winner === 'X' ? 'X_WINS' : 'O_WINS';
        winLine = term.line ?? null;
      } else {
        nextStatus = 'DRAW';
      }
    }

    const nextTurn = getOpponent(humanPlayer);

    set((state) => ({
      board: nextBoard,
      currentTurn: nextTurn,
      gameStatus: nextStatus,
      winningLine: winLine,
      moveHistory: [
        ...state.moveHistory,
        { board: nextBoard, move: cellIndex, player: humanPlayer },
      ],
      selectedNodeId: null,
    }));

    if (nextStatus === 'PLAYING') {
      get().startAiThinking(nextBoard);
    }
  },

  startAiThinking: (boardToSearch?: Board) => {
    const {
      board,
      aiPlayer,
      algorithm,
      moveOrdering,
      maxDepthLimit,
      autoPlayAiMove,
    } = get();

    const targetBoard = boardToSearch ?? board;
    const term = isTerminal(targetBoard);
    if (term.terminal) return;

    set({ isAiThinking: true, isPlaying: false });

    // Run search
    const options = {
      aiPlayer,
      moveOrdering,
      maxDepthLimit,
      maxStepsCap: 40000,
    };

    const result =
      algorithm === 'alphabeta'
        ? runAlphaBetaWithSteps(targetBoard, options)
        : runMinimaxWithSteps(targetBoard, options);

    const cache = new TreeStateCache(result.steps);
    const initialSnap = cache.getStateAtStep(0);

    set({
      searchResult: result,
      steps: result.steps,
      currentStepIndex: 0,
      treeCache: cache,
      currentTreeSnapshot: initialSnap,
      selectedNodeId: initialSnap.activeNodeId,
      isPlaying: autoPlayAiMove ? true : false,
      isAiThinking: false,
    });
  },

  applyAiChosenMove: () => {
    const { searchResult, board, aiPlayer, gameStatus } = get();
    if (!searchResult || searchResult.bestMove === null || gameStatus !== 'PLAYING') return;

    const move = searchResult.bestMove;
    if (board[move] !== null) return;

    const nextBoard = applyMove(board, move, aiPlayer);
    const term = isTerminal(nextBoard);

    let nextStatus: 'PLAYING' | 'X_WINS' | 'O_WINS' | 'DRAW' = 'PLAYING';
    let winLine: number[] | null = null;

    if (term.terminal) {
      if (term.winner) {
        nextStatus = term.winner === 'X' ? 'X_WINS' : 'O_WINS';
        winLine = term.line ?? null;
      } else {
        nextStatus = 'DRAW';
      }
    }

    set((state) => ({
      board: nextBoard,
      currentTurn: getOpponent(aiPlayer),
      gameStatus: nextStatus,
      winningLine: winLine,
      moveHistory: [
        ...state.moveHistory,
        { board: nextBoard, move, player: aiPlayer },
      ],
      isPlaying: false,
    }));
  },

  play: () => {
    const { steps, currentStepIndex } = get();
    if (steps.length === 0) return;
    if (currentStepIndex >= steps.length - 1) {
      set({ currentStepIndex: 0 });
    }
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  stepForward: () => {
    const { steps, currentStepIndex, treeCache, autoPlayAiMove } = get();
    if (steps.length === 0 || !treeCache) return;

    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    const snap = treeCache.getStateAtStep(nextIndex);

    set({
      currentStepIndex: nextIndex,
      currentTreeSnapshot: snap,
      selectedNodeId: snap.activeNodeId,
    });

    if (nextIndex === steps.length - 1 && autoPlayAiMove) {
      get().pause();
      get().applyAiChosenMove();
    }
  },

  stepBack: () => {
    const { currentStepIndex, treeCache } = get();
    if (!treeCache) return;

    const prevIndex = Math.max(currentStepIndex - 1, 0);
    const snap = treeCache.getStateAtStep(prevIndex);

    set({
      isPlaying: false,
      currentStepIndex: prevIndex,
      currentTreeSnapshot: snap,
      selectedNodeId: snap.activeNodeId,
    });
  },

  setStepIndex: (index: number) => {
    const { steps, treeCache } = get();
    if (!treeCache || steps.length === 0) return;

    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    const snap = treeCache.getStateAtStep(clamped);

    set({
      currentStepIndex: clamped,
      currentTreeSnapshot: snap,
      selectedNodeId: snap.activeNodeId,
    });
  },

  resetSteps: () => {
    const { treeCache } = get();
    if (!treeCache) return;
    const snap = treeCache.getStateAtStep(0);
    set({
      isPlaying: false,
      currentStepIndex: 0,
      currentTreeSnapshot: snap,
      selectedNodeId: snap.activeNodeId,
    });
  },

  skipToEnd: () => {
    const { steps, treeCache, autoPlayAiMove } = get();
    if (!treeCache || steps.length === 0) return;

    const lastIndex = steps.length - 1;
    const snap = treeCache.getStateAtStep(lastIndex);

    set({
      isPlaying: false,
      currentStepIndex: lastIndex,
      currentTreeSnapshot: snap,
      selectedNodeId: snap.activeNodeId,
    });

    if (autoPlayAiMove) {
      get().applyAiChosenMove();
    }
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: Math.max(0.25, Math.min(20, speed)) });
  },

  setAlgorithm: (algorithm: 'alphabeta' | 'minimax') => {
    set({ algorithm });
    const { board, currentTurn, aiPlayer } = get();
    if (currentTurn === aiPlayer) {
      get().startAiThinking(board);
    }
  },

  setMoveOrdering: (moveOrdering: MoveOrdering) => {
    set({ moveOrdering });
    const { board, currentTurn, aiPlayer } = get();
    if (currentTurn === aiPlayer) {
      get().startAiThinking(board);
    }
  },

  setMaxDepthLimit: (maxDepthLimit: number) => {
    set({ maxDepthLimit });
    const { board, currentTurn, aiPlayer } = get();
    if (currentTurn === aiPlayer) {
      get().startAiThinking(board);
    }
  },

  setAutoPlayAiMove: (autoPlayAiMove: boolean) => {
    set({ autoPlayAiMove });
  },

  resetGame: () => {
    const empty = createEmptyBoard();
    set({
      board: empty,
      currentTurn: 'X',
      gameStatus: 'PLAYING',
      winningLine: null,
      moveHistory: [{ board: empty, move: null, player: 'X' }],
      searchResult: null,
      steps: [],
      currentStepIndex: -1,
      isPlaying: false,
      treeCache: null,
      currentTreeSnapshot: null,
      selectedNodeId: null,
      presetName: 'Empty Board',
    });
    if (get().humanPlayer === 'O') {
      // AI moves first
      get().startAiThinking(empty);
    }
  },

  undoMove: () => {
    const { moveHistory, isAiThinking } = get();
    if (isAiThinking || moveHistory.length <= 1) return;

    // Pop last 2 moves (or 1 if at start)
    const newHistory = [...moveHistory];
    newHistory.pop();
    if (newHistory.length > 1 && newHistory[newHistory.length - 1].player !== get().humanPlayer) {
      newHistory.pop();
    }

    const lastEntry = newHistory[newHistory.length - 1];
    set({
      board: lastEntry.board,
      currentTurn: get().humanPlayer,
      gameStatus: 'PLAYING',
      winningLine: null,
      moveHistory: newHistory,
      searchResult: null,
      steps: [],
      currentStepIndex: -1,
      isPlaying: false,
      treeCache: null,
      currentTreeSnapshot: null,
      selectedNodeId: null,
    });
  },

  swapSides: () => {
    const { humanPlayer, aiPlayer } = get();
    const newHuman = aiPlayer;
    const newAi = humanPlayer;

    set({
      humanPlayer: newHuman,
      aiPlayer: newAi,
    });
    get().resetGame();
  },

  loadPreset: (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const term = isTerminal(preset.board);
    let status: 'PLAYING' | 'X_WINS' | 'O_WINS' | 'DRAW' = 'PLAYING';
    let winLine: number[] | null = null;

    if (term.terminal) {
      if (term.winner) {
        status = term.winner === 'X' ? 'X_WINS' : 'O_WINS';
        winLine = term.line ?? null;
      } else {
        status = 'DRAW';
      }
    }

    set({
      board: [...preset.board],
      currentTurn: preset.currentTurn,
      gameStatus: status,
      winningLine: winLine,
      presetName: preset.name,
      moveHistory: [{ board: [...preset.board], move: null, player: preset.currentTurn }],
      searchResult: null,
      steps: [],
      currentStepIndex: -1,
      isPlaying: false,
      treeCache: null,
      currentTreeSnapshot: null,
      selectedNodeId: null,
      collapsedNodeIds: [],
    });

    if (preset.currentTurn === get().aiPlayer && status === 'PLAYING') {
      get().startAiThinking(preset.board);
    }
  },

  setTreeLayout: (treeLayout: 'vertical' | 'horizontal') => set({ treeLayout }),
  setAutoFollowCamera: (autoFollowCamera: boolean) => set({ autoFollowCamera }),
  setAutoCollapseFinished: (autoCollapseFinished: boolean) => set({ autoCollapseFinished }),
  setSelectedNodeId: (selectedNodeId: string | null) => set({ selectedNodeId }),
  setHoveredNodeId: (hoveredNodeId: string | null) => set({ hoveredNodeId }),

  toggleNodeCollapse: (nodeId: string) => {
    set((state) => {
      const exists = state.collapsedNodeIds.includes(nodeId);
      return {
        collapsedNodeIds: exists
          ? state.collapsedNodeIds.filter((id) => id !== nodeId)
          : [...state.collapsedNodeIds, nodeId],
      };
    });
  },

  setActiveTab: (activeTab: ActiveTab) => set({ activeTab }),
  setTheme: (theme: 'dark' | 'light') => {
    set({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  openSetupEditor: () => {
    const { board, currentTurn } = get();
    set({
      isSetupEditorOpen: true,
      setupBoard: [...board],
      setupFirstPlayer: currentTurn,
      setupError: null,
    });
  },

  closeSetupEditor: () => {
    set({ isSetupEditorOpen: false, setupError: null });
  },

  setSetupCell: (index: number, cell: Cell) => {
    set((state) => {
      const newB = [...state.setupBoard];
      newB[index] = cell;
      return { setupBoard: newB, setupError: null };
    });
  },

  setSetupFirstPlayer: (p: Player) => set({ setupFirstPlayer: p, setupError: null }),

  applySetup: () => {
    const { setupBoard, setupFirstPlayer, aiPlayer } = get();
    const val = validateBoard(setupBoard, setupFirstPlayer);
    if (!val.valid) {
      set({ setupError: val.reason ?? 'Invalid board configuration.' });
      return false;
    }

    const term = isTerminal(setupBoard);
    let status: 'PLAYING' | 'X_WINS' | 'O_WINS' | 'DRAW' = 'PLAYING';
    let winLine: number[] | null = null;

    if (term.terminal) {
      if (term.winner) {
        status = term.winner === 'X' ? 'X_WINS' : 'O_WINS';
        winLine = term.line ?? null;
      } else {
        status = 'DRAW';
      }
    }

    set({
      board: [...setupBoard],
      currentTurn: setupFirstPlayer,
      gameStatus: status,
      winningLine: winLine,
      isSetupEditorOpen: false,
      presetName: 'Custom Setup',
      moveHistory: [{ board: [...setupBoard], move: null, player: setupFirstPlayer }],
      searchResult: null,
      steps: [],
      currentStepIndex: -1,
      isPlaying: false,
      treeCache: null,
      currentTreeSnapshot: null,
      selectedNodeId: null,
    });

    if (setupFirstPlayer === aiPlayer && status === 'PLAYING') {
      get().startAiThinking(setupBoard);
    }

    return true;
  },

  setBenchmarkRunning: (benchmarkRunning: boolean) => set({ benchmarkRunning }),
  setBenchmarkProgress: (benchmarkProgress: string) => set({ benchmarkProgress }),
  setBenchmarkResult: (benchmarkResult: BenchmarkResult | null) => set({ benchmarkResult }),
}));
