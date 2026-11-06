import { Board, MoveOrdering, Player } from './types';

export const WINNING_LINES: readonly [number, number, number][] = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Col 1
  [1, 4, 7], // Col 2
  [2, 5, 8], // Col 3
  [0, 4, 8], // Diagonal
  [2, 4, 6], // Anti-diagonal
];

// Strategic ordering: Center (4), Corners (0, 2, 6, 8), Edges (1, 3, 5, 7)
export const STRATEGIC_MOVE_ORDER: readonly number[] = [4, 0, 2, 6, 8, 1, 3, 5, 7];

export function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

export function checkWinner(board: Board): { winner: Player; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const cellA = board[a];
    if (cellA !== null && cellA === board[b] && cellA === board[c]) {
      return { winner: cellA, line: [a, b, c] };
    }
  }
  return null;
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function isTerminal(board: Board): {
  terminal: boolean;
  winner: Player | null;
  isDraw: boolean;
  line?: number[];
} {
  const win = checkWinner(board);
  if (win) {
    return { terminal: true, winner: win.winner, isDraw: false, line: win.line };
  }
  if (isBoardFull(board)) {
    return { terminal: true, winner: null, isDraw: true };
  }
  return { terminal: false, winner: null, isDraw: false };
}

export function getLegalMoves(board: Board, ordering: MoveOrdering = 'natural'): number[] {
  if (ordering === 'strategic') {
    return STRATEGIC_MOVE_ORDER.filter((idx) => board[idx] === null);
  }
  const moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

export function applyMove(board: Board, index: number, player: Player): Board {
  if (index < 0 || index >= 9 || board[index] !== null) {
    throw new Error(`Invalid move index ${index} on board`);
  }
  const newBoard = [...board];
  newBoard[index] = player;
  return newBoard;
}

export function getOpponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

export function getPieceCount(board: Board): { X: number; O: number; empty: number } {
  let x = 0;
  let o = 0;
  let empty = 0;
  for (const cell of board) {
    if (cell === 'X') x++;
    else if (cell === 'O') o++;
    else empty++;
  }
  return { X: x, O: o, empty };
}

export function validateBoard(
  board: Board,
  firstPlayer: Player = 'X'
): { valid: boolean; reason?: string } {
  if (board.length !== 9) {
    return { valid: false, reason: 'Board must contain exactly 9 cells.' };
  }
  const { X, O } = getPieceCount(board);

  // Check valid turn order counts
  if (firstPlayer === 'X') {
    if (X !== O && X !== O + 1) {
      return {
        valid: false,
        reason: `Invalid piece counts for X starting first: X=${X}, O=${O}.`,
      };
    }
  } else {
    if (O !== X && O !== X + 1) {
      return {
        valid: false,
        reason: `Invalid piece counts for O starting first: O=${O}, X=${X}.`,
      };
    }
  }

  // Check if both players have winning lines
  let xWins = false;
  let oWins = false;
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      if (board[a] === 'X') xWins = true;
      if (board[a] === 'O') oWins = true;
    }
  }

  if (xWins && oWins) {
    return { valid: false, reason: 'Invalid board: both X and O have winning lines.' };
  }

  return { valid: true };
}

export function formatAlphaBeta(val: number): string {
  if (val <= -1000 || val === -Infinity) return '-∞';
  if (val >= 1000 || val === Infinity) return '+∞';
  return val > 0 ? `+${val}` : `${val}`;
}

export function formatScore(val: number): string {
  if (val === 0) return '0';
  return val > 0 ? `+${val}` : `${val}`;
}

export function moveToString(move: number | null): string {
  if (move === null) return 'Root';
  const row = Math.floor(move / 3) + 1;
  const col = (move % 3) + 1;
  return `(${row},${col}) [#${move}]`;
}
