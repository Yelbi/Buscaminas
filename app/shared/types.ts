/* ============================================================
   Buscaminas — Shared domain types
   Pure types & constants used by BOTH the React client and the
   Node WebSocket server. No DOM or Node APIs here.
   ============================================================ */

export type GameMode = 'solo' | 'coop' | 'versus';
export type DifficultyId = 'facil' | 'medio' | 'dificil';
export type PlayerSlotId = 'p1' | 'p2';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  rows: number;
  cols: number;
  mines: number;
  tile: 'sm' | 'md' | 'lg';
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  facil: { id: 'facil', label: 'Fácil', rows: 9, cols: 9, mines: 10, tile: 'lg' },
  medio: { id: 'medio', label: 'Medio', rows: 16, cols: 16, mines: 40, tile: 'md' },
  dificil: { id: 'dificil', label: 'Difícil', rows: 16, cols: 30, mines: 99, tile: 'sm' },
};

export const DIFFICULTY_ORDER: DifficultyId[] = ['facil', 'medio', 'dificil'];

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
