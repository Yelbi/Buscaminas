/* ============================================================
   Buscaminas — Realtime protocol
   JSON message envelopes exchanged over the WebSocket. Shared by
   the React client and the Node server so both stay in sync.
   ============================================================ */

import type { BoardSpec, BoardView, DifficultyId, GameMode, GameStatus, PlayerSlotId } from './types';
import type { Board, Player, SkinId } from './reversi';
import type { Board as C4Board, Player as C4Player } from './cuatro';

export type RoomPhase = 'lobby' | 'playing' | 'finished';

export interface PlayerInfo {
  slot: PlayerSlotId;
  name: string;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  mode: GameMode;
  difficulty: DifficultyId;
  /** Present when difficulty === 'custom': the chosen board dimensions. */
  custom?: BoardSpec;
  phase: RoomPhase;
  hostSlot: PlayerSlotId;
  players: PlayerInfo[];
}

export interface GameResult {
  outcome: 'win' | 'lose' | 'draw';
  winner: PlayerSlotId | null;
  reason: string;
  timeMs: number;
  /** True only when the board was genuinely cleared (not a forfeit/mine win). */
  clear?: boolean;
}

export interface GameSnapshot {
  phase: 'playing' | 'finished';
  /** Overall status (coop = shared; versus = this recipient's board status). */
  status: GameStatus;
  board: BoardView;
  /** Versus only: a masked view of the opponent board for the mini-map. */
  opponentBoard?: BoardView;
  flagsRemaining: number;
  elapsedMs: number;
  scores: Partial<Record<PlayerSlotId, number>>;
  result?: GameResult;
}

/* ============================================================
   Reversi — online (parallel `rv:`-namespaced subsystem)
   Same WebSocket server, own room type. p1 = black = host, p2 =
   white = joiner. The server is authoritative over the board.
   ============================================================ */

export interface RvPlayerInfo {
  slot: Player;
  name: string;
  skin: SkinId | null;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
}

export interface RvRoomSnapshot {
  code: string;
  phase: RoomPhase;
  hostSlot: Player;
  players: RvPlayerInfo[];
}

export interface RvGameResult {
  /** Winning slot, or null on a draw. */
  winner: Player | null;
  reason: string;
}

export interface RvGameSnapshot {
  phase: 'playing' | 'finished';
  board: Board;
  turn: Player;
  moveNum: number;
  scores: { p1: number; p2: number };
  timer: number;
  turnSeconds: number;
  /** Last move (for the flip animation), or null at the opening. */
  last: { i: number; flipped: number[]; by: Player } | null;
  /** Set when the last transition forced a side to pass. */
  passedBy?: Player | null;
  skins: { p1: SkinId; p2: SkinId };
  result?: RvGameResult;
}

export type RvClientMsg =
  | { t: 'rv:create'; name: string; skin: SkinId }
  | { t: 'rv:join'; code: string; name: string; skin: SkinId }
  | { t: 'rv:rejoin'; code: string; token: string }
  | { t: 'rv:skin'; skin: SkinId }
  | { t: 'rv:ready'; ready: boolean }
  | { t: 'rv:start' }
  | { t: 'rv:move'; i: number }
  | { t: 'rv:resign' }
  | { t: 'rv:rematch' }
  | { t: 'rv:leave' };

export type RvServerMsg =
  | { t: 'rv:joined'; code: string; you: Player; token: string }
  | { t: 'rv:room'; room: RvRoomSnapshot }
  | { t: 'rv:game'; game: RvGameSnapshot }
  | { t: 'rv:tick'; timer: number }
  | { t: 'rv:error'; message: string; code?: string }
  | { t: 'rv:peerLeft'; slot: Player };

/* ============================================================
   4 en línea — online (parallel `c4:`-namespaced subsystem)
   p1 = red = host (moves first each match), p2 = yellow = joiner.
   Best-of-N series with a server-side per-turn timer.
   ============================================================ */

export interface C4PlayerInfo {
  slot: C4Player;
  name: string;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
}

export interface C4RoomSnapshot {
  code: string;
  phase: RoomPhase;
  hostSlot: C4Player;
  bestOf: number;
  players: C4PlayerInfo[];
}

export interface C4GameSnapshot {
  phase: 'playing' | 'roundover' | 'matchover';
  board: C4Board;
  turn: C4Player;
  round: number;
  scores: { p1: number; p2: number };
  bestOf: number;
  timer: number;
  turnSeconds: number;
  /** Last drop (for the fall animation), or null at round start. */
  last: { col: number; row: number; by: C4Player } | null;
  /** Present when a round just ended (winner 0 = draw). */
  roundResult?: { winner: 0 | C4Player; line: number[] };
  /** Present at match end: the series winner (null draw is impossible with odd N). */
  matchWinner?: C4Player | null;
}

export type C4ClientMsg =
  | { t: 'c4:create'; name: string; bestOf: number }
  | { t: 'c4:join'; code: string; name: string }
  | { t: 'c4:rejoin'; code: string; token: string }
  | { t: 'c4:ready'; ready: boolean }
  | { t: 'c4:start' }
  | { t: 'c4:drop'; col: number }
  | { t: 'c4:next' }
  | { t: 'c4:rematch' }
  | { t: 'c4:leave' };

export type C4ServerMsg =
  | { t: 'c4:joined'; code: string; you: C4Player; token: string }
  | { t: 'c4:room'; room: C4RoomSnapshot }
  | { t: 'c4:game'; game: C4GameSnapshot }
  | { t: 'c4:tick'; timer: number }
  | { t: 'c4:error'; message: string; code?: string }
  | { t: 'c4:peerLeft'; slot: C4Player };

/* ---- Client → Server ---- */
export type ClientMsg =
  | { t: 'create'; mode: GameMode; difficulty: DifficultyId; name: string; custom?: BoardSpec }
  | { t: 'join'; code: string; name: string }
  | { t: 'ready'; ready: boolean }
  | { t: 'start' }
  | { t: 'reveal'; r: number; c: number }
  | { t: 'flag'; r: number; c: number }
  | { t: 'chord'; r: number; c: number }
  | { t: 'rematch' }
  | { t: 'leave' }
  | { t: 'rejoin'; code: string; token: string }
  | { t: 'ping' }
  | RvClientMsg
  | C4ClientMsg;

/* ---- Server → Client ---- */
export type ServerMsg =
  | { t: 'error'; message: string; code?: string }
  | { t: 'joined'; code: string; you: PlayerSlotId; mode: GameMode; difficulty: DifficultyId; token: string }
  | { t: 'room'; room: RoomSnapshot }
  | { t: 'game'; game: GameSnapshot }
  /** Lightweight clock update between full game snapshots. */
  | { t: 'tick'; elapsedMs: number }
  | { t: 'peerLeft'; slot: PlayerSlotId }
  | { t: 'pong' }
  | RvServerMsg
  | C4ServerMsg;

/** Opaque per-player reconnect token (unguessable — guards slot hijacking). */
export function makeReconnectToken(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Last-resort fallback for environments without WebCrypto.
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function encode(msg: ClientMsg | ServerMsg): string {
  return JSON.stringify(msg);
}

export function decode<T = ClientMsg | ServerMsg>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Human, unambiguous room codes (no 0/O/1/I). */
export function makeRoomCode(len = 5): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
