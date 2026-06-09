/* ============================================================
   Buscaminas — Shared domain types
   Pure types & constants used by BOTH the React client and the
   Node WebSocket server. No DOM or Node APIs here.
   ============================================================ */

export type GameMode = 'solo' | 'coop' | 'versus';
export type PresetId = 'facil' | 'medio' | 'dificil';
export type DifficultyId = PresetId | 'custom';
export type TileSize = 'sm' | 'md' | 'lg';
export type PlayerSlotId = 'p1' | 'p2';

export interface DifficultyConfig {
  id: PresetId;
  label: string;
  rows: number;
  cols: number;
  mines: number;
  tile: TileSize;
}

/** Raw board dimensions chosen for a custom game. */
export interface BoardSpec {
  rows: number;
  cols: number;
  mines: number;
}

/** A fully resolved board spec (dimensions + render hints). */
export interface ResolvedSpec extends BoardSpec {
  tile: TileSize;
  label: string;
}

export const DIFFICULTIES: Record<PresetId, DifficultyConfig> = {
  facil: { id: 'facil', label: 'Fácil', rows: 9, cols: 9, mines: 10, tile: 'lg' },
  medio: { id: 'medio', label: 'Medio', rows: 16, cols: 16, mines: 40, tile: 'md' },
  // Square board (22×22, same ~20.5% mine density as classic expert).
  dificil: { id: 'dificil', label: 'Difícil', rows: 22, cols: 22, mines: 99, tile: 'sm' },
};

export const DIFFICULTY_ORDER: PresetId[] = ['facil', 'medio', 'dificil'];

/** Bounds for the custom difficulty. */
export const CUSTOM_LIMITS = { minRows: 5, maxRows: 40, minCols: 5, maxCols: 40, minMines: 1 } as const;
export const DEFAULT_CUSTOM: BoardSpec = { rows: 16, cols: 16, mines: 40 };

function clampInt(v: number, lo: number, hi: number): number {
  const n = Math.round(Number.isFinite(v) ? v : lo);
  return Math.min(hi, Math.max(lo, n));
}

/** Clamp a custom spec to safe, playable bounds (always ≥1 safe cell). */
export function clampCustom(s: BoardSpec): BoardSpec {
  const rows = clampInt(s.rows, CUSTOM_LIMITS.minRows, CUSTOM_LIMITS.maxRows);
  const cols = clampInt(s.cols, CUSTOM_LIMITS.minCols, CUSTOM_LIMITS.maxCols);
  const mines = clampInt(s.mines, CUSTOM_LIMITS.minMines, Math.max(1, rows * cols - 1));
  return { rows, cols, mines };
}

function tileForCols(cols: number): TileSize {
  return cols <= 10 ? 'lg' : cols <= 16 ? 'md' : 'sm';
}

/** Resolve a difficulty selection (preset id or 'custom' + spec) into concrete dims. */
export function resolveSpec(id: DifficultyId, custom?: BoardSpec | null): ResolvedSpec {
  if (id === 'custom') {
    const c = clampCustom(custom ?? DEFAULT_CUSTOM);
    return { ...c, tile: tileForCols(c.cols), label: 'Personalizada' };
  }
  const p = DIFFICULTIES[id] ?? DIFFICULTIES.facil;
  return { rows: p.rows, cols: p.cols, mines: p.mines, tile: p.tile, label: p.label };
}

export const MODE_LABELS: Record<GameMode, string> = {
  solo: 'Solitario',
  coop: 'Cooperativo',
  versus: 'Competitivo',
};

/** A single authoritative cell (full knowledge — server / solo only). */
export interface Cell {
  mine: boolean;
  adjacent: number; // 0-8
  revealed: boolean;
  flagged: boolean;
  exploded: boolean;
  revealedBy: PlayerSlotId | null;
  flaggedBy: PlayerSlotId | null;
}

export type GameStatus = 'playing' | 'won' | 'lost';

/** Authoritative game state. Never sent verbatim to clients. */
export interface GameState {
  rows: number;
  cols: number;
  mines: number;
  cells: Cell[][];
  started: boolean;        // first cell revealed (mines placed)
  deferMines: boolean;     // place mines on first reveal (area first-click safe)
  relocateFirst: boolean;  // pre-generated board: move a mine if the first click lands on one
  firstRevealDone: boolean;
  status: GameStatus;
  flags: number;
  revealed: number;        // count of revealed non-mine cells
  safeTotal: number;       // total non-mine cells (win when revealed === safeTotal)
}

/** A render-safe projection of one cell. Safe to send over the wire. */
export type CellView =
  | { s: 'hidden'; by?: PlayerSlotId | null }
  | { s: 'flagged'; by?: PlayerSlotId | null }
  | { s: 'revealed'; v: number; by?: PlayerSlotId | null }
  | { s: 'mine' }
  | { s: 'exploded' };

export type BoardView = CellView[][];
