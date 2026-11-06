import {
  applyMove,
  getLegalMoves,
  getOpponent,
  isTerminal,
} from './board';
import {
  BenchmarkMetrics,
  BenchmarkResult,
  Board,
  MoveOrdering,
  Player,
} from './types';

/**
 * Fast, allocation-minimized plain Minimax (counters only, no step array).
 */
export function benchmarkMinimax(
  board: Board,
  aiPlayer: Player = 'O',
  moveOrdering: MoveOrdering = 'natural',
  onProgress?: (nodes: number) => void
): BenchmarkMetrics {
  const startTime = performance.now();
  const opponent = getOpponent(aiPlayer);

  let nodesExpanded = 0;
  let leavesEvaluated = 0;
  let maxDepth = 0;
  let nextProgressCheck = 20000;

  function dfs(b: Board, depth: number, isMax: boolean): number {
    nodesExpanded++;
    if (depth > maxDepth) maxDepth = depth;

    if (onProgress && nodesExpanded >= nextProgressCheck) {
      onProgress(nodesExpanded);
      nextProgressCheck += 20000;
    }

    const term = isTerminal(b);
    if (term.terminal) {
      leavesEvaluated++;
      if (term.winner === aiPlayer) return 10 - depth;
      if (term.winner === opponent) return depth - 10;
      return 0;
    }

    const moves = getLegalMoves(b, moveOrdering);
    if (isMax) {
      let maxScore = -Infinity;
      for (const m of moves) {
        const nextB = applyMove(b, m, aiPlayer);
        const score = dfs(nextB, depth + 1, false);
        if (score > maxScore) maxScore = score;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const m of moves) {
        const nextB = applyMove(b, m, opponent);
        const score = dfs(nextB, depth + 1, true);
        if (score < minScore) minScore = score;
      }
      return minScore;
    }
  }

  dfs(board, 0, true);
  const timeMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    nodesExpanded,
    nodesPruned: 0,
    leavesEvaluated,
    maxDepth,
    timeMs,
  };
}

/**
 * Fast, allocation-minimized Alpha-Beta (counters only, no step array).
 */
export function benchmarkAlphaBeta(
  board: Board,
  aiPlayer: Player = 'O',
  moveOrdering: MoveOrdering = 'natural',
  onProgress?: (nodes: number) => void
): BenchmarkMetrics {
  const startTime = performance.now();
  const opponent = getOpponent(aiPlayer);

  let nodesExpanded = 0;
  let nodesPruned = 0;
  let leavesEvaluated = 0;
  let maxDepth = 0;
  let nextProgressCheck = 20000;

  function dfs(
    b: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMax: boolean
  ): number {
    nodesExpanded++;
    if (depth > maxDepth) maxDepth = depth;

    if (onProgress && nodesExpanded >= nextProgressCheck) {
      onProgress(nodesExpanded);
      nextProgressCheck += 20000;
    }

    const term = isTerminal(b);
    if (term.terminal) {
      leavesEvaluated++;
      if (term.winner === aiPlayer) return 10 - depth;
      if (term.winner === opponent) return depth - 10;
      return 0;
    }

    const moves = getLegalMoves(b, moveOrdering);
    if (isMax) {
      let v = -Infinity;
      let a = alpha;
      for (let i = 0; i < moves.length; i++) {
        const nextB = applyMove(b, moves[i], aiPlayer);
        v = Math.max(v, dfs(nextB, depth + 1, a, beta, false));
        a = Math.max(a, v);
        if (beta <= a) {
          nodesPruned += moves.length - 1 - i;
          break;
        }
      }
      return v;
    } else {
      let v = Infinity;
      let bVal = beta;
      for (let i = 0; i < moves.length; i++) {
        const nextB = applyMove(b, moves[i], opponent);
        v = Math.min(v, dfs(nextB, depth + 1, alpha, bVal, true));
        bVal = Math.min(bVal, v);
        if (bVal <= alpha) {
          nodesPruned += moves.length - 1 - i;
          break;
        }
      }
      return v;
    }
  }

  dfs(board, 0, -Infinity, Infinity, true);
  const timeMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    nodesExpanded,
    nodesPruned,
    leavesEvaluated,
    maxDepth,
    timeMs,
  };
}

/**
 * Runs a complete benchmark suite comparing:
 * 1. Plain Minimax (natural ordering)
 * 2. Alpha-Beta (natural ordering)
 * 3. Alpha-Beta (strategic ordering: center, corners, edges)
 */
export function runFullBenchmark(
  board: Board,
  aiPlayer: Player = 'O',
  onStageChange?: (stage: string, currentNodes: number) => void
): BenchmarkResult {
  if (onStageChange) onStageChange('Running Plain Minimax...', 0);
  const minimax = benchmarkMinimax(board, aiPlayer, 'natural', (n) => {
    if (onStageChange) onStageChange('Running Plain Minimax...', n);
  });

  if (onStageChange) onStageChange('Running Alpha-Beta (Natural)...', 0);
  const alphaBetaNatural = benchmarkAlphaBeta(board, aiPlayer, 'natural', (n) => {
    if (onStageChange) onStageChange('Running Alpha-Beta (Natural)...', n);
  });

  if (onStageChange) onStageChange('Running Alpha-Beta (Strategic)...', 0);
  const alphaBetaStrategic = benchmarkAlphaBeta(board, aiPlayer, 'strategic', (n) => {
    if (onStageChange) onStageChange('Running Alpha-Beta (Strategic)...', n);
  });

  const reductionNaturalPct =
    minimax.nodesExpanded > 0
      ? Math.round(
          ((minimax.nodesExpanded - alphaBetaNatural.nodesExpanded) / minimax.nodesExpanded) *
            1000
        ) / 10
      : 0;

  const reductionStrategicPct =
    minimax.nodesExpanded > 0
      ? Math.round(
          ((minimax.nodesExpanded - alphaBetaStrategic.nodesExpanded) / minimax.nodesExpanded) *
            1000
        ) / 10
      : 0;

  return {
    minimax,
    alphaBetaNatural,
    alphaBetaStrategic,
    reductionNaturalPct,
    reductionStrategicPct,
  };
}

