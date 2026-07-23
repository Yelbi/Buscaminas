/* ============================================================
   Reversi — Core game logic (pure, shared)
   Authoritative Othello/Reversi rules. The client runs this for
   solo (vs bot) play; the server runs the SAME code for online
   rooms, guaranteeing identical behavior everywhere.

   Board: a flat array of 64 cells, row-major. Index i → x = i%8,
   y = (i/8)|0. p1 = black (moves first), p2 = white.
   ============================================================ */

export type Player = 'p1' | 'p2';
export type Cell = Player | null;
export type Board = Cell[];

/** Disc skin ids — shared so the server can relay/validate each player's choice. */
export type SkinId = 'clasica' | 'aro' | 'kamon' | 'kintsugi' | 'ondas' | 'sello';
export const SKIN_IDS: SkinId[] = ['clasica', 'aro', 'kamon', 'kintsugi', 'ondas', 'sello'];
export function isSkinId(x: unknown): x is SkinId {
  return typeof x === 'string' && (SKIN_IDS as string[]).includes(x);
}

export const SIZE = 8;
export const CELLS = SIZE * SIZE;

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export const other = (p: Player): Player => (p === 'p1' ? 'p2' : 'p1');

/** Standard opening: the four central discs. */
export function initialBoard(): Board {
  const b: Board = Array(CELLS).fill(null);
  b[27] = 'p2'; b[28] = 'p1'; b[35] = 'p1'; b[36] = 'p2';
  return b;
}

/**
 * Discs that would flip if player `p` played at index `i`.
 * Empty when `i` is occupied or the move is illegal (flips nothing).
 */
export function flips(board: Board, i: number, p: Player): number[] {
  if (board[i]) return [];
  const o = other(p);
  const x = i % SIZE, y = (i / SIZE) | 0;
  const out: number[] = [];
  for (const [dx, dy] of DIRS) {
    let nx = x + dx, ny = y + dy;
    const line: number[] = [];
    while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny * SIZE + nx] === o) {
      line.push(ny * SIZE + nx);
      nx += dx; ny += dy;
    }
    // A run of opponent discs is only captured if it ends on one of ours.
    if (line.length && nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny * SIZE + nx] === p) {
      out.push(...line);
    }
  }
  return out;
}

/** Every legal move for `p` (indices that flip at least one disc). */
export function validMoves(board: Board, p: Player): number[] {
  const v: number[] = [];
  for (let i = 0; i < CELLS; i++) if (flips(board, i, p).length) v.push(i);
  return v;
}

export function hasMove(board: Board, p: Player): boolean {
  for (let i = 0; i < CELLS; i++) if (flips(board, i, p).length) return true;
  return false;
}

export interface MoveResult {
  board: Board;
  /** Discs flipped by this move (not counting the placed disc). */
  flipped: number[];
  /** Whose turn it is after this move. */
  nextTurn: Player;
  /** True when the opponent had no move and had to pass (turn returns to `p`). */
  passed: boolean;
  /** True when neither side can move — the game is over. */
  over: boolean;
}

/**
 * Apply `p`'s move at `i`. Returns the new immutable board and turn info, or
 * null if the move is illegal (so callers can reject it — used server-side).
 */
export function applyMove(board: Board, i: number, p: Player): MoveResult | null {
  const flipped = flips(board, i, p);
  if (!flipped.length) return null;
  const b = board.slice();
  b[i] = p;
  for (const j of flipped) b[j] = p;

  const o = other(p);
  let nextTurn: Player = p;
  let passed = false;
  let over = false;
  if (hasMove(b, o)) nextTurn = o;
  else if (hasMove(b, p)) { nextTurn = p; passed = true; }
  else over = true;

  return { board: b, flipped, nextTurn, passed, over };
}

export function score(board: Board, p: Player): number {
  let n = 0;
  for (const c of board) if (c === p) n++;
  return n;
}

export interface Scores { p1: number; p2: number; empty: number; }
export function scores(board: Board): Scores {
  let p1 = 0, p2 = 0, empty = 0;
  for (const c of board) c === 'p1' ? p1++ : c === 'p2' ? p2++ : empty++;
  return { p1, p2, empty };
}

/** Winner by disc count, or null on a draw. */
export function winner(board: Board): Player | null {
  const { p1, p2 } = scores(board);
  return p1 > p2 ? 'p1' : p2 > p1 ? 'p2' : null;
}

/** Algebraic coordinate for an index, e.g. 0 → "A1", 63 → "H8". */
export function coord(i: number): string {
  return 'ABCDEFGH'[i % SIZE] + (((i / SIZE) | 0) + 1);
}
