/* ============================================================
   Reversi — online subsystem (parallel to the buscaminas rooms)
   Runs inside the same WebSocket server. All messages are
   `rv:`-namespaced; index.ts routes them here and forwards socket
   closes to reversiDrop(). Own rooms map + reconnect grace, so the
   buscaminas code stays untouched.
   ============================================================ */

import type { WebSocket } from 'ws';
import { encode, makeRoomCode } from '../shared/protocol';
import type { RvClientMsg, RvServerMsg } from '../shared/protocol';
import { isSkinId } from '../shared/reversi';
import type { Player } from '../shared/reversi';
import { ReversiRoom, RV_TURN_SECONDS } from './reversiRoom';

const MAX_NAME = 20;
const GRACE_MS = 45_000;

const rooms = new Map<string, ReversiRoom>();
const ctxOf = new Map<WebSocket, { code: string; slot: Player }>();

function send(ws: WebSocket, msg: RvServerMsg): void {
  if (ws.readyState === ws.OPEN) ws.send(encode(msg));
}
function err(ws: WebSocket, message: string, code?: string): void {
  send(ws, { t: 'rv:error', message, code });
}
function cleanName(raw: unknown): string {
  return String(raw ?? '').trim().slice(0, MAX_NAME);
}

function broadcastRoom(room: ReversiRoom): void {
  const snap = room.snapshot();
  for (const p of room.players.values()) if (p.connected) send(p.ws, { t: 'rv:room', room: snap });
}
function broadcastGame(room: ReversiRoom): void {
  const game = room.gameSnapshot();
  for (const p of room.players.values()) if (p.connected) send(p.ws, { t: 'rv:game', game });
}
function broadcastTick(room: ReversiRoom): void {
  for (const p of room.players.values()) if (p.connected) send(p.ws, { t: 'rv:tick', timer: room.timer });
}

/** Remove a player (forfeit if mid-game), promote host, delete empty room. */
function removeNow(room: ReversiRoom, slot: Player): void {
  const wasPlaying = room.phase === 'playing';
  if (wasPlaying) room.finishByForfeit(slot, 'Tu rival abandonó la sala.');
  room.removePlayer(slot);
  if (room.isEmpty()) {
    rooms.delete(room.code);
  } else {
    for (const p of room.players.values()) if (p.connected) send(p.ws, { t: 'rv:peerLeft', slot });
    broadcastRoom(room);
    if (wasPlaying) broadcastGame(room);
  }
}

function detachFromRoom(ws: WebSocket): void {
  const ctx = ctxOf.get(ws);
  if (!ctx) return;
  ctxOf.delete(ws);
  const room = rooms.get(ctx.code);
  const player = room?.players.get(ctx.slot);
  if (!room || !player || player.ws !== ws) return;
  removeNow(room, ctx.slot);
}

/** Handle a `rv:` message. Returns nothing; errors are sent to the socket. */
export function handleReversi(ws: WebSocket, msg: RvClientMsg): void {
  const ctx = ctxOf.get(ws);
  const room = ctx ? rooms.get(ctx.code) : undefined;

  switch (msg.t) {
    case 'rv:create': {
      if (!isSkinId(msg.skin)) return err(ws, 'Diseño de ficha no válido.');
      detachFromRoom(ws);
      let code = makeRoomCode();
      while (rooms.has(code)) code = makeRoomCode();
      const newRoom = new ReversiRoom(code);
      const player = newRoom.addPlayer(ws, cleanName(msg.name), msg.skin);
      if (!player) return err(ws, 'No se pudo crear la sala.');
      rooms.set(code, newRoom);
      ctxOf.set(ws, { code, slot: player.slot });
      send(ws, { t: 'rv:joined', code, you: player.slot, token: player.token });
      broadcastRoom(newRoom);
      return;
    }

    case 'rv:join': {
      const code = String(msg.code ?? '').trim().toUpperCase();
      if (!isSkinId(msg.skin)) return err(ws, 'Diseño de ficha no válido.');
      const target = rooms.get(code);
      if (!target) return err(ws, 'No existe una sala con ese código.', 'NO_ROOM');
      if (target.phase !== 'lobby') return err(ws, 'El duelo ya está en curso.', 'IN_PROGRESS');
      if (!target.freeSlot()) return err(ws, 'La sala está llena.', 'FULL');
      detachFromRoom(ws);
      const player = target.addPlayer(ws, cleanName(msg.name), msg.skin);
      if (!player) return err(ws, 'La sala está llena.', 'FULL');
      ctxOf.set(ws, { code, slot: player.slot });
      send(ws, { t: 'rv:joined', code, you: player.slot, token: player.token });
      broadcastRoom(target);
      return;
    }

    case 'rv:rejoin': {
      const code = String(msg.code ?? '').trim().toUpperCase();
      const target = rooms.get(code);
      if (!target) return err(ws, 'La sala ya no existe.', 'NO_ROOM');
      const player = target.playerByToken(String(msg.token ?? ''));
      if (!player) return err(ws, 'No se pudo reconectar a la sala.', 'NO_REJOIN');
      if (ctx && ctx.code !== code) detachFromRoom(ws);
      const oldWs = player.ws;
      if (oldWs && oldWs !== ws) { ctxOf.delete(oldWs); try { oldWs.close(); } catch { /* ignore */ } }
      if (player.graceTimer) { clearTimeout(player.graceTimer); player.graceTimer = null; }
      player.ws = ws;
      player.connected = true;
      ctxOf.set(ws, { code, slot: player.slot });
      send(ws, { t: 'rv:joined', code, you: player.slot, token: player.token });
      broadcastRoom(target);
      if (target.phase !== 'lobby') send(ws, { t: 'rv:game', game: target.gameSnapshot() });
      return;
    }

    case 'rv:skin': {
      if (!room || !ctx || !isSkinId(msg.skin)) return;
      if (room.setSkin(ctx.slot, msg.skin)) broadcastRoom(room);
      return;
    }

    case 'rv:ready': {
      if (!room || !ctx) return;
      if (room.setReady(ctx.slot, !!msg.ready)) broadcastRoom(room);
      return;
    }

    case 'rv:start': {
      if (!room || !ctx) return;
      const p = room.players.get(ctx.slot);
      if (!p?.isHost) return err(ws, 'Solo el anfitrión puede empezar.');
      if (!room.everyoneReady()) return err(ws, 'Ambos deben elegir ficha y estar listos.');
      room.start();
      broadcastRoom(room);
      broadcastGame(room);
      return;
    }

    case 'rv:move': {
      if (!room || !ctx) return;
      if (room.applyMove(ctx.slot, msg.i)) {
        broadcastGame(room);
        if (room.phase === 'finished') broadcastRoom(room);
      }
      return;
    }

    case 'rv:resign': {
      if (!room || !ctx || room.phase !== 'playing') return;
      room.finishByForfeit(ctx.slot, 'Abandonó el duelo.');
      broadcastGame(room);
      broadcastRoom(room);
      return;
    }

    case 'rv:rematch': {
      if (!room || !ctx || room.phase !== 'finished') return;
      room.resetToLobby();
      broadcastRoom(room);
      return;
    }

    case 'rv:leave': {
      reversiDrop(ws, false);
      return;
    }
  }
}

/** Socket closed (or explicit leave). Mirrors buscaminas dropConnection. */
export function reversiDrop(ws: WebSocket, closing: boolean): void {
  const ctx = ctxOf.get(ws);
  ctxOf.delete(ws);
  if (!ctx) return;
  const room = rooms.get(ctx.code);
  if (!room) return;
  const player = room.players.get(ctx.slot);
  if (!player || player.ws !== ws) return;

  if (!closing) {
    removeNow(room, ctx.slot);
    if (ws.readyState === ws.OPEN) send(ws, { t: 'rv:room', room: { code: '', phase: 'lobby', hostSlot: 'p1', players: [] } });
    return;
  }

  player.connected = false;
  if (player.graceTimer) clearTimeout(player.graceTimer);
  player.graceTimer = setTimeout(() => {
    player.graceTimer = null;
    const r = rooms.get(ctx.code);
    const p = r?.players.get(ctx.slot);
    if (r && p && !p.connected) removeNow(r, ctx.slot);
  }, GRACE_MS);
  broadcastRoom(room);
}

// Per-turn countdown across all live rooms. On timeout, auto-play a random
// legal move so a game never stalls; otherwise just push the clock.
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.phase !== 'playing') continue;
    if (room.timer <= 1) {
      const changed = room.timeoutMove();
      room.timer = RV_TURN_SECONDS;
      if (changed) {
        broadcastGame(room);
        // timeoutMove() may end the game — re-check phase (cast defeats the
        // narrowing from the `!== 'playing'` guard above).
        if ((room.phase as string) === 'finished') broadcastRoom(room);
      } else {
        broadcastTick(room);
      }
    } else {
      room.timer -= 1;
      broadcastTick(room);
    }
  }
}, 1000).unref?.();
