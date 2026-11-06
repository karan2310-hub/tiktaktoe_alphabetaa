import {
  applyMove,
  formatScore,
  getLegalMoves,
  getOpponent,
  isTerminal,
  moveToString,
} from './board';
import { Board, MoveOrdering, NodeType, Player, SearchCounters, SearchResult, Step } from './types';

export interface MinimaxOptions {
  aiPlayer?: Player; // Default 'O'
  moveOrdering?: MoveOrdering; // Default 'natural'
  maxDepthLimit?: number; // Optional depth cap for visualization
  maxStepsCap?: number; // e.g. 40,000 steps cap
}

/**
 * Plain Minimax search without alpha-beta pruning.
 * Records every step into an array for step-by-step interactive playback.
 */
export function runMinimaxWithSteps(
  board: Board,
  options: MinimaxOptions = {}
): SearchResult {
  const startTime = performance.now();
  const aiPlayer = options.aiPlayer ?? 'O';
  const opponent = getOpponent(aiPlayer);
  const moveOrdering = options.moveOrdering ?? 'natural';
  const maxDepthLimit = options.maxDepthLimit ?? 99;
  const maxStepsCap = options.maxStepsCap ?? 40000;

  const steps: Step[] = [];
  let nodeIdCounter = 0;
  let truncated = false;
  let warning: string | undefined;

  const counters: SearchCounters = {
    nodesExpanded: 0,
    nodesPruned: 0,
    prunedSubtreeEstimate: 0,
    leavesEvaluated: 0,
    maxDepth: 0,
    timeMs: 0,
  };

  const principalVariation: number[] = [];

  function fastEvaluate(b: Board, depth: number, isMax: boolean): number {
    const term = isTerminal(b);
    if (term.terminal) {
      if (term.winner === aiPlayer) return 10 - depth;
      if (term.winner === opponent) return depth - 10;
      return 0;
    }
    const moves = getLegalMoves(b, moveOrdering);
    if (isMax) {
      let maxScore = -Infinity;
      for (const m of moves) {
        const nextB = applyMove(b, m, aiPlayer);
        const score = fastEvaluate(nextB, depth + 1, false);
        if (score > maxScore) maxScore = score;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const m of moves) {
        const nextB = applyMove(b, m, opponent);
        const score = fastEvaluate(nextB, depth + 1, true);
        if (score < minScore) minScore = score;
      }
      return minScore;
    }
  }

  function dfs(
    currentBoard: Board,
    depth: number,
    isMax: boolean,
    parentId: string | null,
    moveLeadingHere: number | null
  ): { value: number; bestMove: number | null } {
    if (steps.length >= maxStepsCap) {
      truncated = true;
      warning = `Search truncated: exceeded visualization step cap of ${maxStepsCap.toLocaleString()} steps.`;
      return { value: 0, bestMove: null };
    }

    const nodeId = `node_${nodeIdCounter++}`;
    const nodeType: NodeType = isMax ? 'MAX' : 'MIN';
    counters.nodesExpanded++;
    if (depth > counters.maxDepth) {
      counters.maxDepth = depth;
    }

    // Step: ENTER_NODE
    steps.push({
      type: 'ENTER_NODE',
      nodeId,
      parentId,
      board: currentBoard,
      move: moveLeadingHere,
      depth,
      nodeType,
      alpha: -Infinity,
      beta: Infinity,
      description: `Enter node #${nodeIdCounter - 1} (${nodeType}) at depth ${depth}${
        moveLeadingHere !== null ? ` via move ${moveToString(moveLeadingHere)}` : ' (Root)'
      }.`,
    });

    // Check terminal
    const term = isTerminal(currentBoard);
    if (term.terminal) {
      counters.leavesEvaluated++;
      let leafVal = 0;
      let reason: 'X_WINS' | 'O_WINS' | 'DRAW' = 'DRAW';

      if (term.winner === aiPlayer) {
        leafVal = 10 - depth;
        reason = aiPlayer === 'X' ? 'X_WINS' : 'O_WINS';
      } else if (term.winner === opponent) {
        leafVal = depth - 10;
        reason = opponent === 'X' ? 'X_WINS' : 'O_WINS';
      } else {
        leafVal = 0;
        reason = 'DRAW';
      }

      steps.push({
        type: 'EVALUATE_LEAF',
        nodeId,
        value: leafVal,
        reason,
        description: `Leaf evaluated: ${
          term.winner ? `${term.winner} wins!` : 'Draw.'
        } Terminal value = ${formatScore(leafVal)} (depth ${depth}).`,
      });

      steps.push({
        type: 'EXIT_NODE',
        nodeId,
        returnValue: leafVal,
        description: `Exit node #${nodeIdCounter - 1} (${nodeType}) with leaf value ${formatScore(
          leafVal
        )}.`,
      });

      return { value: leafVal, bestMove: null };
    }

    // Check depth cap for visualization
    if (depth >= maxDepthLimit) {
      counters.leavesEvaluated++;
      const summarizedVal = fastEvaluate(currentBoard, depth, isMax);
      steps.push({
        type: 'EVALUATE_LEAF',
        nodeId,
        value: summarizedVal,
        reason: 'DRAW',
        description: `Depth limit ${maxDepthLimit} reached. Subtree evaluated to exact value ${formatScore(
          summarizedVal
        )}.`,
      });
      steps.push({
        type: 'EXIT_NODE',
        nodeId,
        returnValue: summarizedVal,
        description: `Exit depth-capped node #${nodeIdCounter - 1} (${nodeType}) with value ${formatScore(
          summarizedVal
        )}.`,
      });
      return { value: summarizedVal, bestMove: null };
    }

    const legalMoves = getLegalMoves(currentBoard, moveOrdering);
    let bestVal = isMax ? -Infinity : Infinity;
    let bestMove: number | null = legalMoves[0] ?? null;

    for (const move of legalMoves) {
      const nextBoard = applyMove(currentBoard, move, isMax ? aiPlayer : opponent);
      const childResult = dfs(nextBoard, depth + 1, !isMax, nodeId, move);

      if (truncated) break;

      if (isMax) {
        if (childResult.value > bestVal) {
          bestVal = childResult.value;
          bestMove = move;
          steps.push({
            type: 'UPDATE_VALUE',
            nodeId,
            value: bestVal,
            description: `Node #${nodeIdCounter - 1} (MAX): child move ${moveToString(
              move
            )} returned ${formatScore(childResult.value)}. Best value updated to ${formatScore(
              bestVal
            )}.`,
          });
        }
      } else {
        if (childResult.value < bestVal) {
          bestVal = childResult.value;
          bestMove = move;
          steps.push({
            type: 'UPDATE_VALUE',
            nodeId,
            value: bestVal,
            description: `Node #${nodeIdCounter - 1} (MIN): child move ${moveToString(
              move
            )} returned ${formatScore(childResult.value)}. Best value updated to ${formatScore(
              bestVal
            )}.`,
          });
        }
      }
    }

    steps.push({
      type: 'EXIT_NODE',
      nodeId,
      returnValue: bestVal,
      description: `Exit node #${nodeIdCounter - 1} (${nodeType}) returning best value ${formatScore(
        bestVal
      )}${bestMove !== null ? ` (move ${moveToString(bestMove)})` : ''}.`,
    });

    return { value: bestVal, bestMove };
  }

  const rootResult = dfs(board, 0, true, null, null);

  if (rootResult.bestMove !== null && !truncated) {
    steps.push({
      type: 'CHOOSE_MOVE',
      nodeId: 'node_0',
      move: rootResult.bestMove,
      value: rootResult.value,
      description: `Minimax completes at root: chooses optimal move ${moveToString(
        rootResult.bestMove
      )} with evaluated value ${formatScore(rootResult.value)}.`,
    });
    principalVariation.push(rootResult.bestMove);
  }

  counters.timeMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    bestMove: rootResult.bestMove,
    bestValue: rootResult.value,
    steps,
    counters,
    truncated,
    warning,
    principalVariation,
  };
}
