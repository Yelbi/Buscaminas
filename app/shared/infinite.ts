/* ============================================================
   Buscaminas — Modo infinito (lógica pura)
   Un tablero sin bordes: las minas no se almacenan, se DERIVAN
   de un hash determinista (seed, fila, columna), así cualquier
   celda del universo es consultable sin generar nada. Solo se
   guarda lo que el jugador tocó (reveladas / banderas) en un
   mapa disperso. Sin condición de victoria: se puntúa por
   casillas despejadas y se pierde al agotar las vidas.
   ============================================================ */

import type { BoardView, CellView } from './types';

/* ---- Tuning ---- */
export const INFINITE_LIVES = 3;
/** Radio Chebyshev sin minas alrededor del primer clic (1 → zona 3×3). */
export const SAFE_RADIUS = 1;
/** Densidad de minas: base cerca del inicio, sube con la distancia. */
const DENSITY_BASE = 0.13;
const DENSITY_MAX = 0.24;
/** Distancia (Chebyshev) a la que se alcanza la densidad máxima. */
const DENSITY_RAMP = 120;
/** Tope de celdas reveladas por un solo flood (válvula de seguridad). */
export const FLOOD_CAP = 2048;

/* ---- Estado por celda (bit flags en un Map disperso) ---- */
const REVEALED = 1;
const FLAGGED = 2;
const EXPLODED = 4;

export type InfiniteStatus = 'playing' | 'over';

export interface InfiniteState {
  seed: number;
  /** Solo las celdas tocadas, clave "r,c" → bits REVEALED/FLAGGED/EXPLODED. */
  cells: Map<string, number>;
  started: boolean;
  /** Centro de la zona segura (primer clic); también ancla la densidad. */
  safeR: number;
  safeC: number;
  status: InfiniteStatus;
  lives: number;
  revealed: number;   // puntuación: casillas seguras despejadas
  flags: number;
  minesHit: number;
}

export function createInfinite(seed: number): InfiniteState {
  return {
    seed,
    cells: new Map(),
    started: false,
    safeR: 0,
    safeC: 0,
    status: 'playing',
    lives: INFINITE_LIVES,
    revealed: 0,
    flags: 0,
    minesHit: 0,
  };
}

const key = (r: number, c: number): string => `${r},${c}`;

function bits(state: InfiniteState, r: number, c: number): number {
  return state.cells.get(key(r, c)) ?? 0;
}
function setBits(state: InfiniteState, r: number, c: number, b: number): void {
  state.cells.set(key(r, c), b);
}

export const isRevealed = (s: InfiniteState, r: number, c: number): boolean => (bits(s, r, c) & REVEALED) !== 0;
export const isFlagged = (s: InfiniteState, r: number, c: number): boolean => (bits(s, r, c) & FLAGGED) !== 0;
export const isExploded = (s: InfiniteState, r: number, c: number): boolean => (bits(s, r, c) & EXPLODED) !== 0;

/* ---- Minas deterministas ---- */

/** Hash 32-bit → [0,1) bien distribuido para (seed, r, c), negativos incluidos. */
function cellHash01(seed: number, r: number, c: number): number {
  let h = (seed | 0) ^ Math.imul(r | 0, 0x9e3779b1) ^ Math.imul(c | 0, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Distancia Chebyshev al centro seguro (ancla de la dificultad progresiva). */
function distFromStart(state: InfiniteState, r: number, c: number): number {
  return Math.max(Math.abs(r - state.safeR), Math.abs(c - state.safeC));
}

export function densityAt(state: InfiniteState, r: number, c: number): number {
  const d = distFromStart(state, r, c);
  return DENSITY_BASE + (DENSITY_MAX - DENSITY_BASE) * Math.min(1, d / DENSITY_RAMP);
}

/** ¿Hay mina en (r,c)? Determinista; la zona segura inicial nunca tiene. */
export function isMine(state: InfiniteState, r: number, c: number): boolean {
  if (!state.started) return false; // antes del primer clic no hay tablero "fijado"
  if (distFromStart(state, r, c) <= SAFE_RADIUS) return false;
  return cellHash01(state.seed, r, c) < densityAt(state, r, c);
}

/** Minas adyacentes (0–8), calculadas al vuelo. */
export function adjacentAt(state: InfiniteState, r: number, c: number): number {
  let n = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      if (isMine(state, r + dr, c + dc)) n++;
    }
  }
  return n;
}

/* ---- Acciones ---- */

export interface InfiniteRevealResult {
  changed: boolean;
  hitMine: boolean;
  /** Celdas seguras reveladas en esta acción (para sonido/animación). */
  cellsOpened: number;
  /** La partida terminó con esta acción (vidas agotadas). */
  gameOver: boolean;
}

const NO_CHANGE: InfiniteRevealResult = { changed: false, hitMine: false, cellsOpened: 0, gameOver: false };

export function reveal(state: InfiniteState, r: number, c: number): InfiniteRevealResult {
  if (state.status !== 'playing') return NO_CHANGE;
  const b = bits(state, r, c);
  if (b & (REVEALED | FLAGGED)) return NO_CHANGE;

  if (!state.started) {
    state.safeR = r;
    state.safeC = c;
    state.started = true;
  }

  if (isMine(state, r, c)) {
    setBits(state, r, c, REVEALED | EXPLODED);
    state.lives--;
    state.minesHit++;
    const over = state.lives <= 0;
    if (over) state.status = 'over';
    return { changed: true, hitMine: true, cellsOpened: 0, gameOver: over };
  }

  // Flood fill iterativo con tope de expansión.
  let opened = 0;
  const stack: Array<[number, number]> = [[r, c]];
  while (stack.length && opened < FLOOD_CAP) {
    const [cr, cc] = stack.pop()!;
    const cur = bits(state, cr, cc);
    if (cur & (REVEALED | FLAGGED)) continue;
    if (isMine(state, cr, cc)) continue;
    setBits(state, cr, cc, cur | REVEALED);
    opened++;
    if (adjacentAt(state, cr, cc) === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([cr + dr, cc + dc]);
        }
      }
    }
  }
  state.revealed += opened;
  return { changed: opened > 0, hitMine: false, cellsOpened: opened, gameOver: false };
}

/** Alterna bandera. Devuelve el nuevo estado (o null si no aplica). */
export function toggleFlag(state: InfiniteState, r: number, c: number): boolean | null {
  if (state.status !== 'playing') return null;
  const b = bits(state, r, c);
  if (b & REVEALED) return null;
  const flagged = (b & FLAGGED) !== 0;
  setBits(state, r, c, flagged ? b & ~FLAGGED : b | FLAGGED);
  state.flags += flagged ? -1 : 1;
  return !flagged;
}

/** Chord: número revelado con sus banderas completas → revela el resto. */
export function chord(state: InfiniteState, r: number, c: number): InfiniteRevealResult {
  const acc: InfiniteRevealResult = { changed: false, hitMine: false, cellsOpened: 0, gameOver: false };
  if (state.status !== 'playing') return acc;
  if (!isRevealed(state, r, c) || isMine(state, r, c)) return acc;
  const adj = adjacentAt(state, r, c);
  if (adj === 0) return acc;

  let flagsAround = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      if (isFlagged(state, r + dr, c + dc)) flagsAround++;
    }
  }
  if (flagsAround !== adj) return acc;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (isRevealed(state, nr, nc) || isFlagged(state, nr, nc)) continue;
      const res = reveal(state, nr, nc);
      acc.changed = acc.changed || res.changed;
      acc.hitMine = acc.hitMine || res.hitMine;
      acc.cellsOpened += res.cellsOpened;
      acc.gameOver = acc.gameOver || res.gameOver;
      if (acc.gameOver) return acc;
    }
  }
  return acc;
}

/* ---- Proyección para el viewport ---- */

/**
 * Ventana rectangular del tablero como BoardView (filas r0..r0+rows-1,
 * columnas c0..c0+cols-1). Con `revealMines` (fin de partida) las minas
 * ocultas del viewport se muestran.
 */
export function viewRect(
  state: InfiniteState,
  r0: number,
  c0: number,
  rows: number,
  cols: number,
  revealMines = false,
): BoardView {
  const out: BoardView = [];
  for (let i = 0; i < rows; i++) {
    const row: CellView[] = [];
    const r = r0 + i;
    for (let j = 0; j < cols; j++) {
      const c = c0 + j;
      const b = bits(state, r, c);
      if (b & EXPLODED) { row.push({ s: 'exploded' }); continue; }
      if (b & REVEALED) { row.push({ s: 'revealed', v: adjacentAt(state, r, c) }); continue; }
      if (b & FLAGGED) { row.push({ s: 'flagged' }); continue; }
      if (revealMines && isMine(state, r, c)) { row.push({ s: 'mine' }); continue; }
      row.push({ s: 'hidden' });
    }
    out.push(row);
  }
  return out;
}
