/* ============================================================
   Buscaminas — Room model (authoritative game host)
   One Room per multiplayer match. Owns the board(s), validates
   every action, and produces render-safe snapshots per player.
   ============================================================ */

import type { WebSocket } from 'ws';
import {
  createState,
  flagAllMines,
  flagsRemaining,
  maskBoard,
  projectBoard,
  populateFromSeed,
  randomSeed,
  reveal,
  revealAllMines,
  toggleFlag,
  chord,
  progress,
} from '../shared/minesweeper';
import { resolveSpec } from '../shared/types';
import type { BoardSpec, DifficultyId, GameMode, GameState, PlayerSlotId, ResolvedSpec } from '../shared/types';
import { makeReconnectToken } from '../shared/protocol';
import type { GameResult, GameSnapshot, PlayerInfo, RoomSnapshot } from '../shared/protocol';

export interface Player {
  ws: WebSocket;
  slot: PlayerSlotId;
  name: string;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
  score: number;
  token: string;                                    // secret for reconnecting
  graceTimer: ReturnType<typeof setTimeout> | null; // pending removal after disconnect
}

const SLOTS: PlayerSlotId[] = ['p1', 'p2'];

export class Room {
  code: string;
  mode: GameMode;
  difficulty: DifficultyId;
  custom?: BoardSpec;
  spec: ResolvedSpec;
  phase: 'lobby' | 'playing' | 'finished' = 'lobby';
  players = new Map<PlayerSlotId, Player>();

  // Game state
  shared: GameState | null = null;            // co-op: one shared board
  boards = new Map<PlayerSlotId, GameState>(); // versus: one board per player
  startedAt = 0;
  result: GameResult | null = null;
  tick: ReturnType<typeof setInterval> | null = null;

  constructor(code: string, mode: GameMode, difficulty: DifficultyId, custom?: BoardSpec) {
    this.code = code;
    this.mode = mode;
    this.difficulty = difficulty;
    this.spec = resolveSpec(difficulty, custom);
    // Store the clamped custom dims so clients see exactly what's in play.
    if (difficulty === 'custom') this.custom = { rows: this.spec.rows, cols: this.spec.cols, mines: this.spec.mines };
  }

  get hostSlot(): PlayerSlotId {
    for (const p of this.players.values()) if (p.isHost) return p.slot;
    return 'p1';
  }

  freeSlot(): PlayerSlotId | null {
    return SLOTS.find((s) => !this.players.has(s)) ?? null;
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  addPlayer(ws: WebSocket, name: string): Player | null {
    const slot = this.freeSlot();
    if (!slot) return null;
    const isHost = this.players.size === 0;
    const player: Player = {
      ws, slot, name: name || (slot === 'p1' ? 'Jugador 1' : 'Jugador 2'),
      connected: true, ready: false, isHost, score: 0,
      token: makeReconnectToken(), graceTimer: null,
    };
    this.players.set(slot, player);
    return player;
  }

  removePlayer(slot: PlayerSlotId): void {
    const p = this.players.get(slot);
    if (p?.graceTimer) clearTimeout(p.graceTimer);
    this.players.delete(slot);
    // Promote a new host if needed.
    if (![...this.players.values()].some((p) => p.isHost)) {
      const next = this.players.values().next().value as Player | undefined;
      if (next) next.isHost = true;
    }
  }

  playerByToken(token: string): Player | null {
    if (!token) return null;
    for (const p of this.players.values()) if (p.token === token) return p;
    return null;
  }

  hasDisconnected(): boolean {
    return [...this.players.values()].some((p) => !p.connected);
  }

  bothPlayersPresent(): boolean {
    return this.players.size === 2 && [...this.players.values()].every((p) => p.connected);
  }

  everyoneReady(): boolean {
    return this.bothPlayersPresent() && [...this.players.values()].every((p) => p.ready);
  }

  /* ---- Game lifecycle ---- */

  startGame(): void {
    const cfg = this.spec;
    this.result = null;
    this.startedAt = Date.now();
    this.phase = 'playing';
    for (const p of this.players.values()) p.score = 0;

    if (this.mode === 'coop') {
      // One shared board, first-click safe (mines placed on first reveal).
      this.shared = createState(cfg.rows, cfg.cols, cfg.mines, true);
      this.boards.clear();
    } else {
      // Versus: identical boards from one seed (fair race).
      const seed = randomSeed();
      this.shared = null;
      this.boards.clear();
      for (const slot of this.players.keys()) {
        const st = createState(cfg.rows, cfg.cols, cfg.mines, false);
        populateFromSeed(st, seed, -1);
        st.relocateFirst = true; // first click can't be an instant mine
        this.boards.set(slot, st);
      }
    }
  }

  resetToLobby(): void {
    this.phase = 'lobby';
    this.shared = null;
    this.boards.clear();
    this.result = null;
    this.startedAt = 0;
    for (const p of this.players.values()) { p.ready = false; p.score = 0; }
    this.stopTick();
  }

  stopTick(): void {
    if (this.tick) { clearInterval(this.tick); this.tick = null; }
  }

  private boardFor(slot: PlayerSlotId): GameState | null {
    return this.mode === 'coop' ? this.shared : this.boards.get(slot) ?? null;
  }

  /* ---- Actions (return true if state changed → caller broadcasts) ---- */

  applyReveal(slot: PlayerSlotId, r: number, c: number, kind: 'reveal' | 'chord'): boolean {
    if (this.phase !== 'playing') return false;
    const st = this.boardFor(slot);
    if (!st || st.status !== 'playing') return false;

    const before = st.revealed;
    const res = kind === 'chord' ? chord(st, r, c, slot) : reveal(st, r, c, slot);
    if (!res.changed) return false;

    const player = this.players.get(slot);
    if (player) player.score += st.revealed - before;

    if (res.hitMine) {
      revealAllMines(st);
      this.onBoardLost(slot, 'mine');
    } else if (res.won) {
      this.onBoardWon(slot);
    }
    this.syncScores();
    return true;
  }

  applyFlag(slot: PlayerSlotId, r: number, c: number): boolean {
    if (this.phase !== 'playing') return false;
    const st = this.boardFor(slot);
    if (!st || st.status !== 'playing') return false;
    return toggleFlag(st, r, c, slot) !== null;
  }

  private syncScores(): void {
    if (this.mode === 'versus') {
      for (const [slot, st] of this.boards) {
        const p = this.players.get(slot);
        if (p) p.score = progress(st);
      }
    }
  }

  private onBoardLost(loser: PlayerSlotId, reason: 'mine' | 'forfeit'): void {
    if (this.mode === 'coop') {
      this.finish({
        outcome: 'lose',
        winner: null,
        reason: reason === 'forfeit' ? 'Tu compañero salió de la partida.' : 'Una mina detonó. Fin de la partida.',
        timeMs: Date.now() - this.startedAt,
      });
      return;
    }
    // Versus: the other player wins.
    const other = SLOTS.find((s) => s !== loser && this.boards.has(s)) ?? null;
    if (other) {
      const otherSt = this.boards.get(other);
      if (otherSt && otherSt.status === 'playing') otherSt.status = 'won';
    }
    this.finish({
      outcome: 'win',
      winner: other,
      reason: reason === 'forfeit' ? 'Tu rival abandonó.' : 'Tu rival pisó una mina.',
      timeMs: Date.now() - this.startedAt,
    });
  }

  private onBoardWon(winner: PlayerSlotId): void {
    if (this.mode === 'coop') {
      if (this.shared) flagAllMines(this.shared);
      this.finish({
        outcome: 'win',
        winner: null,
        reason: '¡Campo despejado en equipo!',
        timeMs: Date.now() - this.startedAt,
        clear: true,
      });
      return;
    }
    // Versus: flag the winner's cleared board; mark + reveal the loser's.
    const winBoard = this.boards.get(winner);
    if (winBoard) flagAllMines(winBoard);
    for (const [slot, st] of this.boards) {
      if (slot !== winner && st.status === 'playing') { st.status = 'lost'; revealAllMines(st); }
    }
    this.finish({
      outcome: 'win',
      winner,
      reason: 'Tablero despejado primero.',
      timeMs: Date.now() - this.startedAt,
      clear: true,
    });
  }

  /** End the match by forfeit when someone leaves mid-game. */
  forfeit(slot: PlayerSlotId): void {
    if (this.phase !== 'playing') return;
    this.onBoardLost(slot, 'forfeit');
  }

  private finish(result: GameResult): void {
    this.result = result;
    this.phase = 'finished';
    this.stopTick();
  }

  /* ---- Snapshots ---- */

  snapshot(): RoomSnapshot {
    const players: PlayerInfo[] = SLOTS.filter((s) => this.players.has(s)).map((s) => {
      const p = this.players.get(s)!;
      return { slot: p.slot, name: p.name, connected: p.connected, ready: p.ready, isHost: p.isHost, score: p.score };
    });
    return {
      code: this.code,
      mode: this.mode,
      difficulty: this.difficulty,
      custom: this.custom,
      phase: this.phase,
      hostSlot: this.hostSlot,
      players,
    };
  }

  gameSnapshot(slot: PlayerSlotId): GameSnapshot {
    const finished = this.phase === 'finished';
    const scores: Partial<Record<PlayerSlotId, number>> = {};
    for (const [s, p] of this.players) scores[s] = p.score;

    if (this.mode === 'coop') {
      const st = this.shared!;
      return {
        phase: finished ? 'finished' : 'playing',
        status: st.status,
        board: projectBoard(st, st.status === 'lost'),
        flagsRemaining: flagsRemaining(st),
        elapsedMs: this.elapsed(),
        scores,
        result: this.result ?? undefined,
      };
    }

    const mine = this.boards.get(slot)!;
    const otherSlot = SLOTS.find((s) => s !== slot && this.boards.has(s));
    const other = otherSlot ? this.boards.get(otherSlot)! : null;
    return {
      phase: finished ? 'finished' : 'playing',
      status: mine.status,
      board: projectBoard(mine, mine.status === 'lost'),
      // While playing, the opponent view is masked (progress only): both versus
      // boards share one layout, so numbers/flags would leak the viewer's mines.
      opponentBoard: other
        ? (finished ? projectBoard(other, other.status === 'lost') : maskBoard(other))
        : undefined,
      flagsRemaining: flagsRemaining(mine),
      elapsedMs: this.elapsed(),
      scores,
      result: this.result ?? undefined,
    };
  }

  elapsed(): number {
    if (!this.startedAt) return 0;
    const end = this.phase === 'finished' && this.result ? this.startedAt + this.result.timeMs : Date.now();
    return Math.max(0, end - this.startedAt);
  }
}
