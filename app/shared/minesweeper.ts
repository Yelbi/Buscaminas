/* ============================================================
   Buscaminas — Core game logic (pure, shared)
   Authoritative minesweeper rules. The server runs this for
   co-op / versus; the client runs the same code for solo play,
   guaranteeing identical behavior everywhere.
   ============================================================ */

import type { BoardView, Cell, GameState, PlayerSlotId } from './types';

/** Deterministic PRNG (mulberry32) so a versus board can be reproduced from a seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

function emptyCell(): Cell {
  return { mine: false, adjacent: 0, revealed: false, flagged: false, exploded: false, revealedBy: null, flaggedBy: null };
}

export function createState(rows: number, cols: number, mines: number, deferMines = true): GameState {
  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, emptyCell),
  );
  return {
    rows,
    cols,
    mines,
    cells,
    started: false,
    deferMines,
    status: 'playing',
    flags: 0,
    revealed: 0,
    safeTotal: rows * cols - mines,
  };
}

function neighbors(rows: number, cols: number, r: number, c: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
    }
  }
  return out;
}

/**
 * Choose mine indices, avoiding a safe cell and its neighbors when
 * safeIndex >= 0 (first-click safe). Returns a Set of flat indices.
 */
export function generateMineSet(
  rows: number,
  cols: number,
  mines: number,
  rand: () => number,
  safeIndex = -1,
): Set<number> {
  const total = rows * cols;
  const blocked = new Set<number>();
  if (safeIndex >= 0) {
    blocked.add(safeIndex);
    const r = Math.floor(safeIndex / cols);
    const c = safeIndex % cols;
    for (const [nr, nc] of neighbors(rows, cols, r, c)) blocked.add(nr * cols + nc);
  }

  const candidates: number[] = [];
  for (let i = 0; i < total; i++) if (!blocked.has(i)) candidates.push(i);

  // If we can't keep the whole 3x3 safe (tiny board, many mines),
  // fall back to only protecting the clicked cell.
  let pool = candidates;
  if (pool.length < mines && safeIndex >= 0) {
    pool = [];
    for (let i = 0; i < total; i++) if (i !== safeIndex) pool.push(i);
  }

  // Fisher-Yates partial shuffle to pick `mines` indices.
  const chosen = new Set<number>();
  const arr = pool.slice();
  const count = Math.min(mines, arr.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rand() * (arr.length - i));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    chosen.add(arr[i]);
  }
  return chosen;
}

/** Apply a mine set to a fresh state and compute adjacency. */
export function applyMines(state: GameState, mineSet: Set<number>): void {
  const { rows, cols, cells } = state;
  for (const idx of mineSet) {
    cells[Math.floor(idx / cols)][idx % cols].mine = true;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cells[r][c].mine) continue;
      let n = 0;
      for (const [nr, nc] of neighbors(rows, cols, r, c)) if (cells[nr][nc].mine) n++;
      cells[r][c].adjacent = n;
    }
  }
  state.started = true;
}

/** Populate immediately from a seed (used for versus — identical boards). */
export function populateFromSeed(state: GameState, seed: number, safeIndex = -1): void {
  const rand = mulberry32(seed);
  applyMines(state, generateMineSet(state.rows, state.cols, state.mines, rand, safeIndex));
}

export interface RevealResult {
  changed: boolean;
  hitMine: boolean;
  won: boolean;
}

/**
 * Reveal a cell with flood-fill on zeros. Places mines lazily on the
 * first reveal when deferMines is set (first-click safe). Mutates state.
 */
export function reveal(state: GameState, r: number, c: number, by: PlayerSlotId | null = null): RevealResult {
  const noChange: RevealResult = { changed: false, hitMine: false, won: false };
  if (state.status !== 'playing') return noChange;
  const cell = state.cells[r]?.[c];
  if (!cell || cell.revealed || cell.flagged) return noChange;

  if (!state.started && state.deferMines) {
    populateFromSeed(state, randomSeed(), r * state.cols + c);
  }

  if (cell.mine) {
    cell.revealed = true;
    cell.exploded = true;
    cell.revealedBy = by;
    state.status = 'lost';
    return { changed: true, hitMine: true, won: false };
  }

  // Flood fill (iterative)
  const stack: Array<[number, number]> = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const cur = state.cells[cr][cc];
    if (cur.revealed || cur.flagged || cur.mine) continue;
    cur.revealed = true;
    cur.revealedBy = by;
    state.revealed++;
    if (cur.adjacent === 0) {
      for (const [nr, nc] of neighbors(state.rows, state.cols, cr, cc)) {
        const n = state.cells[nr][nc];
        if (!n.revealed && !n.flagged && !n.mine) stack.push([nr, nc]);
      }
    }
  }

  const won = state.revealed >= state.safeTotal;
  if (won) state.status = 'won';
  return { changed: true, hitMine: false, won };
}

/** Toggle a flag. Returns the new flagged value (or null if no-op). */
export function toggleFlag(state: GameState, r: number, c: number, by: PlayerSlotId | null = null): boolean | null {
  if (state.status !== 'playing') return null;
  const cell = state.cells[r]?.[c];
  if (!cell || cell.revealed) return null;
  cell.flagged = !cell.flagged;
  cell.flaggedBy = cell.flagged ? by : null;
  state.flags += cell.flagged ? 1 : -1;
  return cell.flagged;
}

/**
 * Chord — when a revealed number has exactly that many flags around it,
 * reveal all its non-flagged neighbors. Returns whether a mine exploded.
 */
export function chord(state: GameState, r: number, c: number, by: PlayerSlotId | null = null): RevealResult {
  const acc: RevealResult = { changed: false, hitMine: false, won: false };
  if (state.status !== 'playing') return acc;
  const cell = state.cells[r]?.[c];
  if (!cell || !cell.revealed || cell.adjacent === 0) return acc;

  const around = neighbors(state.rows, state.cols, r, c);
  const flags = around.filter(([nr, nc]) => state.cells[nr][nc].flagged).length;
  if (flags !== cell.adjacent) return acc;

  for (const [nr, nc] of around) {
    const n = state.cells[nr][nc];
    if (n.flagged || n.revealed) continue;
    const res = reveal(state, nr, nc, by);
    acc.changed = acc.changed || res.changed;
    acc.hitMine = acc.hitMine || res.hitMine;
    acc.won = res.won;
    if (res.hitMine) break;
  }
  return acc;
}

/** Reveal every mine — called when a game is lost so the player sees the field. */
export function revealAllMines(state: GameState): void {
  for (const row of state.cells) {
    for (const cell of row) {
      if (cell.mine && !cell.exploded) cell.revealed = true;
    }
  }
}

export function flagsRemaining(state: GameState): number {
  return state.mines - state.flags;
}

/**
 * Project authoritative state into a render-safe view.
 * `revealAll` shows mines (used at game end). During play, hidden mines
 * stay hidden so the view can be safely sent to clients.
 */
export function projectBoard(state: GameState, revealAll = false): BoardView {
  return state.cells.map((row) =>
    row.map((cell): import('./types').CellView => {
      if (cell.exploded) return { s: 'exploded' };
      if (cell.revealed) return { s: 'revealed', v: cell.adjacent, by: cell.revealedBy };
      if (cell.flagged) return { s: 'flagged', by: cell.flaggedBy };
      if (revealAll && cell.mine) return { s: 'mine' };
      return { s: 'hidden' };
    }),
  );
}

/** Count of revealed safe cells — used as a co-op / versus score. */
export function progress(state: GameState): number {
  return state.revealed;
}
