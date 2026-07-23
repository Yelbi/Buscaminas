/* ============================================================
   4 en línea — authoritative online room (server-side)
   Owns the board and validates every drop. p1 = red = host (moves
   first each round), p2 = yellow = joiner. Best-of-N series with a
   per-turn timer. Same shared engine as solo play.
   ============================================================ */

import type { WebSocket } from 'ws';
import { drop as dropFn, emptyBoard, other, validCols } from '../shared/cuatro';
import type { Board, Player } from '../shared/cuatro';
import { makeReconnectToken } from '../shared/protocol';
import type { C4GameSnapshot, C4PlayerInfo, C4RoomSnapshot } from '../shared/protocol';

const SLOTS: Player[] = [1, 2];
export const C4_TURN_SECONDS = 30;

export interface C4Player {
  ws: WebSocket;
  slot: Player;
  name: string;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
  token: string;
  graceTimer: ReturnType<typeof setTimeout> | null;
}

type GamePhase = 'playing' | 'roundover' | 'matchover';

export class CuatroRoom {
  code: string;
  phase: 'lobby' | 'playing' | 'finished' = 'lobby';
  players = new Map<Player, C4Player>();
  bestOf: number;

  board: Board = emptyBoard();
  turn: Player = 1;
  round = 1;
  starter: Player = 1;
  scores = { p1: 0, p2: 0 };
  timer = C4_TURN_SECONDS;
  last: { col: number; row: number; by: Player } | null = null;
  roundResult: { winner: 0 | Player; line: number[] } | null = null;
  matchWinner: Player | null = null;
  gamePhase: GamePhase = 'playing';

  constructor(code: string, bestOf: number) {
    this.code = code;
    this.bestOf = bestOf === 1 || bestOf === 3 || bestOf === 5 ? bestOf : 3;
  }

  get hostSlot(): Player {
    for (const p of this.players.values()) if (p.isHost) return p.slot;
    return 1;
  }
  freeSlot(): Player | null { return SLOTS.find((s) => !this.players.has(s)) ?? null; }
  isEmpty(): boolean { return this.players.size === 0; }
  private need(): number { return Math.ceil(this.bestOf / 2); }

  addPlayer(ws: WebSocket, name: string): C4Player | null {
    const slot = this.freeSlot();
    if (!slot) return null;
    const isHost = this.players.size === 0;
    const player: C4Player = {
      ws, slot, name: name || (slot === 1 ? 'Rojas' : 'Amarillas'),
      connected: true, ready: false, isHost, token: makeReconnectToken(), graceTimer: null,
    };
    this.players.set(slot, player);
    return player;
  }
  removePlayer(slot: Player): void {
    const p = this.players.get(slot);
    if (p?.graceTimer) clearTimeout(p.graceTimer);
    this.players.delete(slot);
    if (![...this.players.values()].some((pp) => pp.isHost)) {
      const next = this.players.values().next().value as C4Player | undefined;
      if (next) next.isHost = true;
    }
  }
  playerByToken(token: string): C4Player | null {
    if (!token) return null;
    for (const p of this.players.values()) if (p.token === token) return p;
    return null;
  }
  bothPresent(): boolean { return this.players.size === 2 && [...this.players.values()].every((p) => p.connected); }
  everyoneReady(): boolean { return this.bothPresent() && [...this.players.values()].every((p) => p.ready); }
  setReady(slot: Player, ready: boolean): boolean {
    const p = this.players.get(slot);
    if (p) { p.ready = ready; return true; }
    return false;
  }

  private resetBoard(starter: Player): void {
    this.board = emptyBoard();
    this.turn = starter;
    this.timer = C4_TURN_SECONDS;
    this.last = null;
    this.roundResult = null;
    this.gamePhase = 'playing';
  }

  start(): void {
    this.scores = { p1: 0, p2: 0 };
    this.round = 1;
    this.starter = 1;
    this.matchWinner = null;
    this.phase = 'playing';
    for (const p of this.players.values()) p.ready = false;
    this.resetBoard(1);
  }

  resetToLobby(): void {
    this.phase = 'lobby';
    this.matchWinner = null;
    this.scores = { p1: 0, p2: 0 };
    this.round = 1;
    for (const p of this.players.values()) p.ready = false;
    this.resetBoard(1);
  }

  /** Apply a drop. Returns true if state changed (→ broadcast). */
  applyDrop(slot: Player, col: number): boolean {
    if (this.phase !== 'playing' || this.gamePhase !== 'playing' || slot !== this.turn) return false;
    const res = dropFn(this.board, col, slot);
    if (!res) return false;
    this.board = res.board;
    this.last = { col: res.col, row: res.row, by: slot };
    this.timer = C4_TURN_SECONDS;

    if (res.line || res.full) {
      const winner: 0 | Player = res.line ? slot : 0;
      if (winner === 1) this.scores.p1++;
      else if (winner === 2) this.scores.p2++;
      this.roundResult = { winner, line: res.line ?? [] };
      if (this.scores.p1 >= this.need() || this.scores.p2 >= this.need()) {
        this.gamePhase = 'matchover';
        this.phase = 'finished';
        this.matchWinner = this.scores.p1 > this.scores.p2 ? 1 : this.scores.p2 > this.scores.p1 ? 2 : null;
      } else {
        this.gamePhase = 'roundover';
      }
    } else {
      this.turn = other(slot);
    }
    return true;
  }

  /** Advance to the next round (alternating starter). */
  nextRound(): boolean {
    if (this.gamePhase !== 'roundover') return false;
    this.round++;
    this.starter = other(this.starter);
    this.resetBoard(this.starter);
    return true;
  }

  /** New match after a decided series. */
  rematch(): boolean {
    if (this.gamePhase !== 'matchover') return false;
    this.scores = { p1: 0, p2: 0 };
    this.round = 1;
    this.starter = 1;
    this.matchWinner = null;
    this.phase = 'playing';
    this.resetBoard(1);
    return true;
  }

  /** On a turn timeout, auto-drop a random legal column. */
  timeoutMove(): boolean {
    if (this.phase !== 'playing' || this.gamePhase !== 'playing') return false;
    const v = validCols(this.board);
    if (!v.length) return false;
    return this.applyDrop(this.turn, v[(Math.random() * v.length) | 0]);
  }

  /** A player leaves/resigns mid-match → the other wins the series. */
  finishByForfeit(loser: Player): void {
    if (this.phase === 'lobby') return;
    this.gamePhase = 'matchover';
    this.phase = 'finished';
    this.matchWinner = other(loser);
    this.roundResult = null;
  }

  snapshot(): C4RoomSnapshot {
    const players: C4PlayerInfo[] = SLOTS.filter((s) => this.players.has(s)).map((s) => {
      const p = this.players.get(s)!;
      return { slot: p.slot, name: p.name, connected: p.connected, ready: p.ready, isHost: p.isHost };
    });
    return { code: this.code, phase: this.phase, hostSlot: this.hostSlot, bestOf: this.bestOf, players };
  }

  gameSnapshot(): C4GameSnapshot {
    return {
      phase: this.gamePhase,
      board: this.board,
      turn: this.turn,
      round: this.round,
      scores: this.scores,
      bestOf: this.bestOf,
      timer: this.timer,
      turnSeconds: C4_TURN_SECONDS,
      last: this.last,
      roundResult: this.roundResult ?? undefined,
      matchWinner: this.gamePhase === 'matchover' ? this.matchWinner : undefined,
    };
  }
}
