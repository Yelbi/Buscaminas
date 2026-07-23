/* ============================================================
   4 en línea (Connect Four) — core logic (pure, shared)
   Authoritative rules. The client runs this for solo (vs bot);
   the server runs the SAME code for online rooms.

   Board: flat array of 42 cells, row-major (idx = r*COLS + c),
   row 0 = top. 0 = empty, 1 = red (host / you), 2 = yellow.
   ============================================================ */

export const COLS = 7;
export const ROWS = 6;
export const CELLS = COLS * ROWS;

export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = Cell[];

export const idx = (r: number, c: number): number => r * COLS + c;
export const other = (p: Player): Player => (p === 1 ? 2 : 1);

export function emptyBoard(): Board {
  return Array(CELLS).fill(0) as Board;
}

/** Lowest empty row in column `c`, or -1 if the column is full. */
export function findRow(b: Board, c: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (!b[idx(r, c)]) return r;
  return -1;
}

/** Columns that still have room (top cell empty). */
export function validCols(b: Board): number[] {
  const v: number[] = [];
  for (let c = 0; c < COLS; c++) if (!b[idx(0, c)]) v.push(c);
  return v;
}

export function isFull(b: Board): boolean {
  for (let c = 0; c < COLS; c++) if (!b[idx(0, c)]) return false;
  return true;
}

const DIRS: ReadonlyArray<readonly [number, number]> = [[0, 1], [1, 0], [1, 1], [1, -1]];

/** The four indices of a winning line for `p`, or null if none. */
export function winLine(b: Board, p: Player): number[] | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[idx(r, c)] !== p) continue;
      for (const [dr, dc] of DIRS) {
        const line = [idx(r, c)];
        for (let k = 1; k < 4; k++) {
          const rr = r + dr * k, cc = c + dc * k;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || b[idx(rr, cc)] !== p) break;
          line.push(idx(rr, cc));
        }
        if (line.length === 4) return line;
      }
    }
  }
  return null;
}

/** Would dropping `p` into column `c` complete a line? */
export function wouldWin(b: Board, c: number, p: Player): boolean {
  const r = findRow(b, c);
  if (r < 0) return false;
  const b2 = b.slice();
  b2[idx(r, c)] = p;
  return !!winLine(b2, p);
}

export interface DropResult {
  board: Board;
  /** Row the disc landed in. */
  row: number;
  col: number;
  /** Winning line if this move won, else null. */
  line: number[] | null;
  /** True when the board filled with no winner (draw). */
  full: boolean;
}

/** Drop `p` into column `c`. Returns the new board + outcome, or null if the
    column is full (illegal — used server-side to reject). */
export function drop(b: Board, c: number, p: Player): DropResult | null {
  const row = findRow(b, c);
  if (row < 0) return null;
  const board = b.slice();
  board[idx(row, c)] = p;
  const line = winLine(board, p);
  const full = !line && isFull(board);
  return { board, row, col: c, line, full };
}
