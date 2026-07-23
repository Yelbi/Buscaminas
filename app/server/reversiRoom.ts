/* ============================================================
   Reversi — authoritative online room (server-side)
   Owns the board and validates every move. p1 = black = host
   (moves first), p2 = white = joiner. The same shared engine runs
   here as in solo play, so behavior is identical.
   ============================================================ */

import type { WebSocket } from 'ws';
import { applyMove, initialBoard, other, scores, validMoves, winner } from '../shared/reversi';
import type { Board, Player, SkinId } from '../shared/reversi';
import { makeReconnectToken } from '../shared/protocol';
import type { RvGameResult, RvGameSnapshot, RvPlayerInfo, RvRoomSnapshot } from '../shared/protocol';

const SLOTS: Player[] = ['p1', 'p2'];
export const RV_TURN_SECONDS = 30;

export interface RvPlayer {
  ws: WebSocket;
  slot: Player;
  name: string;
  skin: SkinId | null;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
  token: string;
  graceTimer: ReturnType<typeof setTimeout> | null;
}

export class ReversiRoom {
  code: string;
  phase: 'lobby' | 'playing' | 'finished' = 'lobby';
  players = new Map<Player, RvPlayer>();

  board: Board = initialBoard();
  turn: Player = 'p1';
  moveNum = 0;
  timer = RV_TURN_SECONDS;
  last: { i: number; flipped: number[]; by: Player } | null = null;
  passedBy: Player | null = null;
  result: RvGameResult | null = null;

  constructor(code: string) { this.code = code; }

  get hostSlot(): Player {
    for (const p of this.players.values()) if (p.isHost) return p.slot;
    return 'p1';
  }
  freeSlot(): Player | null { return SLOTS.find((s) => !this.players.has(s)) ?? null; }
  isEmpty(): boolean { return this.players.size === 0; }

  addPlayer(ws: WebSocket, name: string, skin: SkinId | null): RvPlayer | null {
    const slot = this.freeSlot();
    if (!slot) return null;
    const isHost = this.players.size === 0;
    const player: RvPlayer = {
      ws, slot, name: name || (slot === 'p1' ? 'Negras' : 'Blancas'),
      skin, connected: true, ready: false, isHost,
      token: makeReconnectToken(), graceTimer: null,
    };
    this.players.set(slot, player);
    return player;
  }

  removePlayer(slot: Player): void {
    const p = this.players.get(slot);
    if (p?.graceTimer) clearTimeout(p.graceTimer);
    this.players.delete(slot);
    if (![...this.players.values()].some((pp) => pp.isHost)) {
      const next = this.players.values().next().value as RvPlayer | undefined;
      if (next) next.isHost = true;
    }
  }

  playerByToken(token: string): RvPlayer | null {
    if (!token) return null;
    for (const p of this.players.values()) if (p.token === token) return p;
    return null;
  }

  bothPresent(): boolean {
    return this.players.size === 2 && [...this.players.values()].every((p) => p.connected);
  }
  everyoneReady(): boolean {
    return this.bothPresent() && [...this.players.values()].every((p) => p.ready && !!p.skin);
  }

  setSkin(slot: Player, skin: SkinId): boolean {
    const p = this.players.get(slot);
    if (p && this.phase === 'lobby') { p.skin = skin; return true; }
    return false;
  }
  setReady(slot: Player, ready: boolean): boolean {
    const p = this.players.get(slot);
    if (p && p.skin) { p.ready = ready; return true; }
    return false;
  }

  start(): void {
    this.board = initialBoard();
    this.turn = 'p1';
    this.moveNum = 0;
    this.timer = RV_TURN_SECONDS;
    this.last = null;
    this.passedBy = null;
    this.result = null;
    this.phase = 'playing';
    for (const p of this.players.values()) p.ready = false;
  }

  resetToLobby(): void {
    this.phase = 'lobby';
    this.result = null;
    this.board = initialBoard();
    this.turn = 'p1';
    this.moveNum = 0;
    this.last = null;
    this.passedBy = null;
    for (const p of this.players.values()) p.ready = false;
  }

  /** Apply a player's move. Returns true if the board changed (→ broadcast). */
  applyMove(slot: Player, i: number): boolean {
    if (this.phase !== 'playing' || slot !== this.turn) return false;
    const res = applyMove(this.board, i, slot);
    if (!res) return false;
    this.board = res.board;
    this.moveNum++;
    this.last = { i, flipped: res.flipped, by: slot };
    this.passedBy = res.passed ? other(slot) : null;
    this.turn = res.nextTurn;
    this.timer = RV_TURN_SECONDS;
    if (res.over) this.finishByCount();
    return true;
  }

  /** On a turn timeout, auto-play a random legal move so the game never stalls. */
  timeoutMove(): boolean {
    if (this.phase !== 'playing') return false;
    const vm = validMoves(this.board, this.turn);
    if (!vm.length) return false;
    return this.applyMove(this.turn, vm[(Math.random() * vm.length) | 0]);
  }

  private finishByCount(): void {
    const w = winner(this.board);
    this.phase = 'finished';
    this.result = { winner: w, reason: w ? 'Tablero completo.' : 'Empate perfecto.' };
  }

  /** A player resigns or forfeits (disconnect): the other side wins. */
  finishByForfeit(loser: Player, reason: string): void {
    if (this.phase !== 'playing') return;
    this.phase = 'finished';
    this.result = { winner: other(loser), reason };
  }

  snapshot(): RvRoomSnapshot {
    const players: RvPlayerInfo[] = SLOTS.filter((s) => this.players.has(s)).map((s) => {
      const p = this.players.get(s)!;
      return { slot: p.slot, name: p.name, skin: p.skin, connected: p.connected, ready: p.ready, isHost: p.isHost };
    });
    return { code: this.code, phase: this.phase, hostSlot: this.hostSlot, players };
  }

  gameSnapshot(): RvGameSnapshot {
    const sc = scores(this.board);
    const p1 = this.players.get('p1');
    const p2 = this.players.get('p2');
    return {
      phase: this.phase === 'finished' ? 'finished' : 'playing',
      board: this.board,
      turn: this.turn,
      moveNum: this.moveNum,
      scores: { p1: sc.p1, p2: sc.p2 },
      timer: this.timer,
      turnSeconds: RV_TURN_SECONDS,
      last: this.last,
      passedBy: this.passedBy,
      skins: { p1: p1?.skin ?? 'clasica', p2: p2?.skin ?? 'aro' },
      result: this.result ?? undefined,
    };
  }
}
