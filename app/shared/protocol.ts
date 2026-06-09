/* ============================================================
   Buscaminas — Realtime protocol
   JSON message envelopes exchanged over the WebSocket. Shared by
   the React client and the Node server so both stay in sync.
   ============================================================ */

import type { BoardSpec, BoardView, DifficultyId, GameMode, GameStatus, PlayerSlotId } from './types';

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
  | { t: 'ping' };

/* ---- Server → Client ---- */
export type ServerMsg =
  | { t: 'error'; message: string; code?: string }
  | { t: 'joined'; code: string; you: PlayerSlotId; mode: GameMode; difficulty: DifficultyId; token: string }
  | { t: 'room'; room: RoomSnapshot }
  | { t: 'game'; game: GameSnapshot }
  | { t: 'peerLeft'; slot: PlayerSlotId }
  | { t: 'pong' };

/** Opaque per-player reconnect token. */
export function makeReconnectToken(): string {
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
