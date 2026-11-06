import {
  applyMove,
  formatAlphaBeta,
  formatScore,
  getLegalMoves,
  getOpponent,
  isTerminal,
  moveToString,
} from './board';
import {
  Board,
  MoveOrdering,
  NodeType,
  Player,
  PrunedChild,
  SearchCounters,
  SearchResult,
  Step,
} from './types';

export interface AlphaBetaOptions {
  aiPlayer?: Player; // Default 'O'
  moveOrdering?: MoveOrdering; // Default 'natural'
  maxDepthLimit?: number; // Optional depth cap for visualization
  maxStepsCap?: number; // e.g. 40,000 steps cap
}

/**
 * Minimax with Alpha-Beta Pruning and Step Recording.
 */
export function runAlphaBetaWithSteps(
  board: Board,
  options: AlphaBetaOptions = {}
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

  function fastEvaluate(
    b: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMax: boolean
  ): number {
    const term = isTerminal(b);
    if (term.terminal) {
      if (term.winner === aiPlayer) return 10 - depth;
      if (term.winner === opponent) return depth - 10;
      return 0;
    }
    const moves = getLegalMoves(b, moveOrdering);
    if (isMax) {
      let v = -Infinity;
      let a = alpha;
      for (const m of moves) {
        const nextB = applyMove(b, m, aiPlayer);
        v = Math.max(v, fastEvaluate(nextB, depth + 1, a, beta, false));
        a = Math.max(a, v);
        if (beta <= a) break;
      }
      return v;
    } else {
      let v = Infinity;
      let bVal = beta;
      for (const m of moves) {
        const nextB = applyMove(b, m, opponent);
        v = Math.min(v, fastEvaluate(nextB, depth + 1, alpha, bVal, true));
        bVal = Math.min(bVal, v);
        if (bVal <= alpha) break;
      }
      return v;
    }
  }

  function dfs(
    currentBoard: Board,
    depth: number,
    isMax: boolean,
    currentAlpha: number,
    currentBeta: number,
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

    let alpha = currentAlpha;
    let beta = currentBeta;

    // Step: ENTER_NODE
    steps.push({
      type: 'ENTER_NODE',
      nodeId,
      parentId,
      board: currentBoard,
      move: moveLeadingHere,
      depth,
      nodeType,
      alpha,
      beta,
      description: `Enter node #${nodeId} (${nodeType}) at depth ${depth}${
        moveLeadingHere !== null ? ` via move ${moveToString(moveLeadingHere)}` : ' (Root)'
      } with [α=${formatAlphaBeta(alpha)}, β=${formatAlphaBeta(beta)}].`,
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
        description: `Exit node #${nodeId} (${nodeType}) with leaf value ${formatScore(leafVal)}.`,
      });

      return { value: leafVal, bestMove: null };
    }

    // Visualization depth cap
    if (depth >= maxDepthLimit) {
      counters.leavesEvaluated++;
      const summarizedVal = fastEvaluate(currentBoard, depth, alpha, beta, isMax);
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
        description: `Exit depth-capped node #${nodeId} (${nodeType}) with value ${formatScore(
          summarizedVal
        )}.`,
      });
      return { value: summarizedVal, bestMove: null };
    }

    const legalMoves = getLegalMoves(currentBoard, moveOrdering);
    let bestVal = isMax ? -Infinity : Infinity;
    let bestMove: number | null = legalMoves[0] ?? null;

    for (let i = 0; i < legalMoves.length; i++) {
      const move = legalMoves[i];
      const nextBoard = applyMove(currentBoard, move, isMax ? aiPlayer : opponent);
      const childResult = dfs(nextBoard, depth + 1, !isMax, alpha, beta, nodeId, move);

      if (truncated) break;

      if (isMax) {
        if (childResult.value > bestVal) {
          bestVal = childResult.value;
          bestMove = move;
          steps.push({
            type: 'UPDATE_VALUE',
            nodeId,
            value: bestVal,
            description: `Node #${nodeId} (MAX): child move ${moveToString(
              move
            )} returned ${formatScore(childResult.value)}. Best-so-far updated to ${formatScore(
              bestVal
            )}.`,
          });
        }

        if (bestVal > alpha) {
          const oldAlpha = alpha;
          alpha = bestVal;
          steps.push({
            type: 'UPDATE_ALPHA',
            nodeId,
            oldAlpha,
            newAlpha: alpha,
            description: `Node #${nodeId} (MAX): α updated from ${formatAlphaBeta(
              oldAlpha
            )} to ${formatAlphaBeta(alpha)}. Window is now [α=${formatAlphaBeta(
              alpha
            )}, β=${formatAlphaBeta(beta)}].`,
          });
        }

        if (beta <= alpha) {
          const remainingMoves = legalMoves.slice(i + 1);
          if (remainingMoves.length > 0) {
            counters.nodesPruned += remainingMoves.length;
            // Estimate skipped subtree size: at least 1 node per skipped child plus branching factor
            counters.prunedSubtreeEstimate += remainingMoves.length * Math.max(1, 8 - depth);

            const prunedNodes: PrunedChild[] = remainingMoves.map((rm) => ({
              nodeId: `pruned_${nodeId}_${rm}`,
              parentId: nodeId,
              move: rm,
              board: applyMove(currentBoard, rm, aiPlayer),
              depth: depth + 1,
              nodeType: 'MIN',
            }));

            steps.push({
              type: 'PRUNE',
              nodeId,
              prunedChildMoves: remainingMoves,
              prunedNodes,
              alpha,
              beta,
              description: `At node #${nodeId} (MAX): β (${formatAlphaBeta(
                beta
              )}) <= α (${formatAlphaBeta(
                alpha
              )}). Cutoff triggered! Pruning remaining ${remainingMoves.length} child branch(es): ${remainingMoves
                .map((m) => moveToString(m))
                .join(', ')}.`,
            });
          }
          break;
        }
      } else {
        if (childResult.value < bestVal) {
          bestVal = childResult.value;
          bestMove = move;
          steps.push({
            type: 'UPDATE_VALUE',
            nodeId,
            value: bestVal,
            description: `Node #${nodeId} (MIN): child move ${moveToString(
              move
            )} returned ${formatScore(childResult.value)}. Best-so-far updated to ${formatScore(
              bestVal
            )}.`,
          });
        }

        if (bestVal < beta) {
          const oldBeta = beta;
          beta = bestVal;
          steps.push({
            type: 'UPDATE_BETA',
            nodeId,
            oldBeta,
            newBeta: beta,
            description: `Node #${nodeId} (MIN): β updated from ${formatAlphaBeta(
              oldBeta
            )} to ${formatAlphaBeta(beta)}. Window is now [α=${formatAlphaBeta(
              alpha
            )}, β=${formatAlphaBeta(beta)}].`,
          });
        }

        if (beta <= alpha) {
          const remainingMoves = legalMoves.slice(i + 1);
          if (remainingMoves.length > 0) {
            counters.nodesPruned += remainingMoves.length;
            counters.prunedSubtreeEstimate += remainingMoves.length * Math.max(1, 8 - depth);

            const prunedNodes: PrunedChild[] = remainingMoves.map((rm) => ({
              nodeId: `pruned_${nodeId}_${rm}`,
              parentId: nodeId,
              move: rm,
              board: applyMove(currentBoard, rm, opponent),
              depth: depth + 1,
              nodeType: 'MAX',
            }));

            steps.push({
              type: 'PRUNE',
              nodeId,
              prunedChildMoves: remainingMoves,
              prunedNodes,
              alpha,
              beta,
              description: `At node #${nodeId} (MIN): β (${formatAlphaBeta(
                beta
              )}) <= α (${formatAlphaBeta(
                alpha
              )}). Cutoff triggered! Pruning remaining ${remainingMoves.length} child branch(es): ${remainingMoves
                .map((m) => moveToString(m))
                .join(', ')}.`,
            });
          }
          break;
        }
      }
    }

    steps.push({
      type: 'EXIT_NODE',
      nodeId,
      returnValue: bestVal,
      description: `Exit node #${nodeId} (${nodeType}) returning value ${formatScore(bestVal)}${
        bestMove !== null ? ` (move ${moveToString(bestMove)})` : ''
      }.`,
    });

    return { value: bestVal, bestMove };
  }

  const rootResult = dfs(board, 0, true, -Infinity, Infinity, null, null);

  if (rootResult.bestMove !== null && !truncated) {
    steps.push({
      type: 'CHOOSE_MOVE',
      nodeId: 'node_0',
      move: rootResult.bestMove,
      value: rootResult.value,
      description: `Alpha-Beta completes at root: chooses optimal move ${moveToString(
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

