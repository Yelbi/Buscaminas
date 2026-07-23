/* ============================================================
   4 en línea — online subsystem (parallel to buscaminas/reversi)
   Runs inside the same WebSocket server. All messages are
   `c4:`-namespaced; index.ts routes them here and forwards socket
   closes to cuatroDrop(). Own rooms map + reconnect grace.
   ============================================================ */

import type { WebSocket } from 'ws';
import { encode, makeRoomCode } from '../shared/protocol';
import type { C4ClientMsg, C4ServerMsg } from '../shared/protocol';
import type { Player } from '../shared/cuatro';
import { CuatroRoom, C4_TURN_SECONDS } from './cuatroRoom';

const MAX_NAME = 20;
const GRACE_MS = 45_000;

const rooms = new Map<string, CuatroRoom>();
const ctxOf = new Map<WebSocket, { code: string; slot: Player }>();

function send(ws: WebSocket, msg: C4ServerMsg): void {
  if (ws.readyState === ws.OPEN) ws.send(encode(msg));
}
function err(ws: WebSocket, message: string, code?: string): void {
  send(ws, { t: 'c4:error', message, code });
}
function cleanName(raw: unknown): string {
  return String(raw ?? '').trim().slice(0, MAX_NAME);
}

function broadcastRoom(room: CuatroRoom): void {
  const snap = room.snapshot();
  for (const p of room.players.values()) if (p.connected) send(p.ws, { t: 'c4:room', room: snap });
}
function broadcastGame(room: CuatroRoom): void {
  const game = room.gameSnapshot();
  for (const p of room.players.values()) if (p.connected) send(p.ws, { t: 'c4:game', game });
}
function broadcastTick(room: CuatroRoom): void {
  for (const p of room.players.values()) if (p.connected) send(p.ws, { t: 'c4:tick', timer: room.timer });
}

function removeNow(room: CuatroRoom, slot: Player): void {
  const wasPlaying = room.phase === 'playing';
  if (wasPlaying) room.finishByForfeit(slot);
  room.removePlayer(slot);
  if (room.isEmpty()) {
    rooms.delete(room.code);
  } else {
    for (const p of room.players.values()) if (p.connected) send(p.ws, { t: 'c4:peerLeft', slot });
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

export function handleCuatro(ws: WebSocket, msg: C4ClientMsg): void {
  const ctx = ctxOf.get(ws);
  const room = ctx ? rooms.get(ctx.code) : undefined;

  switch (msg.t) {
    case 'c4:create': {
      detachFromRoom(ws);
      let code = makeRoomCode();
      while (rooms.has(code)) code = makeRoomCode();
      const newRoom = new CuatroRoom(code, Number(msg.bestOf));
      const player = newRoom.addPlayer(ws, cleanName(msg.name));
      if (!player) return err(ws, 'No se pudo crear la sala.');
      rooms.set(code, newRoom);
      ctxOf.set(ws, { code, slot: player.slot });
      send(ws, { t: 'c4:joined', code, you: player.slot, token: player.token });
      broadcastRoom(newRoom);
      return;
    }

    case 'c4:join': {
      const code = String(msg.code ?? '').trim().toUpperCase();
      const target = rooms.get(code);
      if (!target) return err(ws, 'No existe una sala con ese código.', 'NO_ROOM');
      if (target.phase !== 'lobby') return err(ws, 'El duelo ya está en curso.', 'IN_PROGRESS');
      if (!target.freeSlot()) return err(ws, 'La sala está llena.', 'FULL');
      detachFromRoom(ws);
      const player = target.addPlayer(ws, cleanName(msg.name));
      if (!player) return err(ws, 'La sala está llena.', 'FULL');
      ctxOf.set(ws, { code, slot: player.slot });
      send(ws, { t: 'c4:joined', code, you: player.slot, token: player.token });
      broadcastRoom(target);
      return;
    }

    case 'c4:rejoin': {
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
      send(ws, { t: 'c4:joined', code, you: player.slot, token: player.token });
      broadcastRoom(target);
      if (target.phase !== 'lobby') send(ws, { t: 'c4:game', game: target.gameSnapshot() });
      return;
    }

    case 'c4:ready': {
      if (!room || !ctx) return;
      if (room.setReady(ctx.slot, !!msg.ready)) broadcastRoom(room);
      return;
    }

    case 'c4:start': {
      if (!room || !ctx || room.phase !== 'lobby') return;
      if (!room.everyoneReady()) return err(ws, 'Ambos deben estar listos.');
      room.start();
      broadcastRoom(room);
      broadcastGame(room);
      return;
    }

    case 'c4:drop': {
      if (!room || !ctx) return;
      if (room.applyDrop(ctx.slot, msg.col)) {
        broadcastGame(room);
        if (room.phase === 'finished') broadcastRoom(room);
      }
      return;
    }

    case 'c4:next': {
      if (!room || !ctx) return;
      if (room.nextRound()) broadcastGame(room);
      return;
    }

    case 'c4:rematch': {
      if (!room || !ctx) return;
      if (room.rematch()) { broadcastRoom(room); broadcastGame(room); }
      return;
    }

    case 'c4:leave': {
      cuatroDrop(ws, false);
      return;
    }
  }
}

export function cuatroDrop(ws: WebSocket, closing: boolean): void {
  const ctx = ctxOf.get(ws);
  ctxOf.delete(ws);
  if (!ctx) return;
  const room = rooms.get(ctx.code);
  if (!room) return;
  const player = room.players.get(ctx.slot);
  if (!player || player.ws !== ws) return;

  if (!closing) {
    removeNow(room, ctx.slot);
    if (ws.readyState === ws.OPEN) send(ws, { t: 'c4:room', room: { code: '', phase: 'lobby', hostSlot: 1, bestOf: 3, players: [] } });
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

// Per-turn countdown across all live rooms (only while a round is being played).
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.phase !== 'playing' || room.gamePhase !== 'playing') continue;
    if (room.timer <= 1) {
      const changed = room.timeoutMove();
      room.timer = C4_TURN_SECONDS;
      if (changed) {
        broadcastGame(room);
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
