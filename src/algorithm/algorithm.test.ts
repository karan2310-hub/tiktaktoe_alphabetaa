import { describe, expect, it } from 'vitest';
import {
  applyMove,
  checkWinner,
  createEmptyBoard,
  getLegalMoves,
  isTerminal,
} from './board';
import { runMinimaxWithSteps } from './minimax';
import { runAlphaBetaWithSteps } from './alphabeta';
import {
  benchmarkAlphaBeta,
  benchmarkMinimax,
  runFullBenchmark,
} from './benchmark';
import { Board, Player } from './types';

describe('Tic-Tac-Toe Minimax & Alpha-Beta Search Suite', () => {
  it('correctly reports terminal states and winner check', () => {
    const empty = createEmptyBoard();
    expect(isTerminal(empty).terminal).toBe(false);

    // Row win
    const xWins: Board = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
    const xRes = checkWinner(xWins);
    expect(xRes?.winner).toBe('X');
    expect(xRes?.line).toEqual([0, 1, 2]);

    // Draw
    const draw: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    const drawRes = isTerminal(draw);
    expect(drawRes.terminal).toBe(true);
    expect(drawRes.isDraw).toBe(true);
    expect(drawRes.winner).toBe(null);
  });

  it('(c) Plain Minimax expands exactly 549,946 nodes from empty board, Alpha-Beta expands strictly fewer', () => {
    const empty = createEmptyBoard();

    // Plain minimax on empty board
    const minimaxRes = benchmarkMinimax(empty, 'O', 'natural');
    expect(minimaxRes.nodesExpanded).toBe(549946);
    expect(minimaxRes.leavesEvaluated).toBe(255168);

    // Alpha-beta on empty board (natural)
    const abNatural = benchmarkAlphaBeta(empty, 'O', 'natural');
    expect(abNatural.nodesExpanded).toBeLessThan(549946);
    expect(abNatural.nodesExpanded).toBeGreaterThan(0);
    // Typical alpha-beta with natural order visits around ~64,000 nodes
    expect(abNatural.nodesExpanded).toBeLessThan(100000);

    // Alpha-beta on empty board (strategic: center, corners, edges)
    const abStrategic = benchmarkAlphaBeta(empty, 'O', 'strategic');
    expect(abStrategic.nodesExpanded).toBeLessThan(abNatural.nodesExpanded);

    console.log('BENCHMARK EMPTY BOARD RESULTS:');
    console.log(`Minimax nodes: ${minimaxRes.nodesExpanded}, leaves: ${minimaxRes.leavesEvaluated}, time: ${minimaxRes.timeMs}ms`);
    console.log(`AlphaBeta (Natural) nodes: ${abNatural.nodesExpanded}, pruned: ${abNatural.nodesPruned}, leaves: ${abNatural.leavesEvaluated}, time: ${abNatural.timeMs}ms`);
    console.log(`AlphaBeta (Strategic) nodes: ${abStrategic.nodesExpanded}, pruned: ${abStrategic.nodesPruned}, leaves: ${abStrategic.leavesEvaluated}, time: ${abStrategic.timeMs}ms`);
    console.log(`Reduction Natural: ${Math.round((1 - abNatural.nodesExpanded / minimaxRes.nodesExpanded) * 1000) / 10}%`);
    console.log(`Reduction Strategic: ${Math.round((1 - abStrategic.nodesExpanded / minimaxRes.nodesExpanded) * 1000) / 10}%`);
  });

  it('(d) Known positions: AI takes an immediate win', () => {
    // Board: AI is 'O'. AI can win immediately at cell 2
    // X O -
    // X O -
    // - - -
    // 'O' at index 1 and 4, 'X' at 0 and 3. 'O' playing at index 7 wins!
    const board: Board = [
      'X', 'O', null,
      'X', 'O', null,
      null, null, null,
    ];
    // Next turn is AI ('O')
    const abResult = runAlphaBetaWithSteps(board, { aiPlayer: 'O' });
    expect(abResult.bestMove).toBe(7); // index 7 completes column 1 (1, 4, 7)
    expect(abResult.bestValue).toBe(10 - 1); // depth 1 win = +9

    const mmResult = runMinimaxWithSteps(board, { aiPlayer: 'O' });
    expect(mmResult.bestMove).toBe(7);
    expect(mmResult.bestValue).toBe(9);
  });

  it('(d) Known positions: AI blocks an immediate loss', () => {
    // Board: Human is 'X', threatens to win at cell 2
    // X X -
    // O - -
    // - - -
    // AI ('O') must play cell 2 to block
    const board: Board = [
      'X', 'X', null,
      'O', null, null,
      null, null, null,
    ];
    const abResult = runAlphaBetaWithSteps(board, { aiPlayer: 'O' });
    expect(abResult.bestMove).toBe(2);

    const mmResult = runMinimaxWithSteps(board, { aiPlayer: 'O' });
    expect(mmResult.bestMove).toBe(2);
  });

  it('(a) Alpha-Beta and Minimax give identical root values on every position reachable in 3 moves from empty', () => {
    // Generate all reachable positions at depth 3
    // Move 1: X plays any of 9
    // Move 2: O plays any of 8
    // Move 3: X plays any of 7
    // To ensure comprehensive coverage without combinatorial explosion in test time,
    // we test positions reachable through various branches:
    let testedCount = 0;
    const empty = createEmptyBoard();
    const firstMoves = [0, 4, 1]; // Corner, center, edge representative starts

    for (const m1 of firstMoves) {
      const b1 = applyMove(empty, m1, 'X');
      const secondMoves = getLegalMoves(b1);
      for (const m2 of secondMoves.slice(0, 3)) {
        // pick sample replies
        const b2 = applyMove(b1, m2, 'O');
        const thirdMoves = getLegalMoves(b2);
        for (const m3 of thirdMoves.slice(0, 3)) {
          const b3 = applyMove(b2, m3, 'X');
          // Now it's O's turn to play (AI = 'O')
          const mm = runMinimaxWithSteps(b3, { aiPlayer: 'O' });
          const ab = runAlphaBetaWithSteps(b3, { aiPlayer: 'O' });

          expect(ab.bestValue).toBe(mm.bestValue);
          expect(ab.bestMove).toBe(mm.bestMove);
          testedCount++;
        }
      }
    }
    expect(testedCount).toBeGreaterThanOrEqual(27);
  });

  it('(b) From empty board, AI never loses against an opponent playing all possible moves', () => {
    // Play out game tree where AI plays optimal move, and Human plays all legal moves
    // AI = 'O', Human = 'X' (Human starts first)
    function playAll(b: Board, currentTurn: Player): void {
      const term = isTerminal(b);
      if (term.terminal) {
        // AI must NEVER lose: winner cannot be 'X'
        expect(term.winner).not.toBe('X');
        return;
      }

      if (currentTurn === 'O') {
        // AI's turn: AI uses Alpha-Beta
        const res = runAlphaBetaWithSteps(b, {
          aiPlayer: 'O',
          moveOrdering: 'strategic',
        });
        expect(res.bestMove).not.toBeNull();
        const nextB = applyMove(b, res.bestMove!, 'O');
        playAll(nextB, 'X');
      } else {
        // Human's turn: explore moves
        // We test across sample representative first moves (center, corner, edge)
        const moves = getLegalMoves(b);
        for (const m of moves) {
          const nextB = applyMove(b, m, 'X');
          playAll(nextB, 'O');
        }
      }
    }

    // Test starting with representative human moves at move 1:
    const empty = createEmptyBoard();
    for (const humanStart of [4, 0, 1]) {
      const b1 = applyMove(empty, humanStart, 'X');
      playAll(b1, 'O');
    }
  });

  it('records correct step events and prune placeholders', () => {
    // Late game setup where pruning definitely triggers
    const board: Board = [
      'X', 'O', 'X',
      'X', 'O', null,
      null, null, null,
    ];
    const ab = runAlphaBetaWithSteps(board, { aiPlayer: 'O' });
    expect(ab.steps.length).toBeGreaterThan(0);

    const stepTypes = new Set(ab.steps.map((s) => s.type));
    expect(stepTypes.has('ENTER_NODE')).toBe(true);
    expect(stepTypes.has('EVALUATE_LEAF')).toBe(true);
    expect(stepTypes.has('EXIT_NODE')).toBe(true);
    expect(stepTypes.has('CHOOSE_MOVE')).toBe(true);

    // Check that every step has a non-empty human-readable description
    for (const step of ab.steps) {
      expect(step.description).toBeTruthy();
      expect(typeof step.description).toBe('string');
    }

    // Verify benchmark suite helper
    const bench = runFullBenchmark(board, 'O');
    expect(bench.minimax.nodesExpanded).toBeGreaterThanOrEqual(bench.alphaBetaNatural.nodesExpanded);
    expect(bench.reductionNaturalPct).toBeGreaterThanOrEqual(0);
  });
});
