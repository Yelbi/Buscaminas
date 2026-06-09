/* ============================================================
   Buscaminas — Realtime game server
   A small authoritative WebSocket server hosting co-op and versus
   rooms. Solo play runs entirely on the client and never reaches
   here. Run with: npm run dev:server  (or npm run server)
   ============================================================ */

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { Room } from './room';
import { decode, encode, makeRoomCode } from '../shared/protocol';
import type { ClientMsg, ServerMsg } from '../shared/protocol';
import type { PlayerSlotId } from '../shared/types';
import { DIFFICULTIES } from '../shared/types';
import { getTop, isPreset, leaderboardEnabled, submitScore } from './leaderboard';

const PORT = Number(process.env.PORT) || 8787;
const MAX_NAME = 20;

const rooms = new Map<string, Room>();

interface ConnCtx { code: string; slot: PlayerSlotId; }
const ctxOf = new Map<WebSocket, ConnCtx>();

function send(ws: WebSocket, msg: ServerMsg): void {
  if (ws.readyState === ws.OPEN) ws.send(encode(msg));
}

function err(ws: WebSocket, message: string, code?: string): void {
  send(ws, { t: 'error', message, code });
}

function cleanName(raw: unknown): string {
  return String(raw ?? '').trim().slice(0, MAX_NAME);
}

function broadcastRoom(room: Room): void {
  const snap = room.snapshot();
  for (const p of room.players.values()) {
    if (p.connected) send(p.ws, { t: 'room', room: snap });
  }
}

function broadcastGame(room: Room): void {
  for (const p of room.players.values()) {
    if (p.connected) send(p.ws, { t: 'game', game: room.gameSnapshot(p.slot) });
  }
}

function startTick(room: Room): void {
  room.stopTick();
  room.tick = setInterval(() => {
    if (room.phase !== 'playing') { room.stopTick(); return; }
    broadcastGame(room);
  }, 1000);
}

function tryStart(room: Room): void {
  if (room.phase !== 'lobby') return;
  if (!room.everyoneReady()) return;
  room.startGame();
  broadcastRoom(room);
  broadcastGame(room);
  startTick(room);
}

function handle(ws: WebSocket, msg: ClientMsg): void {
  const ctx = ctxOf.get(ws);
  const room = ctx ? rooms.get(ctx.code) : undefined;

  switch (msg.t) {
    case 'create': {
      if (msg.mode !== 'coop' && msg.mode !== 'versus') return err(ws, 'Modo no válido para multijugador.');
      if (msg.difficulty !== 'custom' && !DIFFICULTIES[msg.difficulty]) return err(ws, 'Dificultad no válida.');
      let code = makeRoomCode();
      while (rooms.has(code)) code = makeRoomCode();
      const newRoom = new Room(code, msg.mode, msg.difficulty, msg.custom);
      const player = newRoom.addPlayer(ws, cleanName(msg.name));
      if (!player) return err(ws, 'No se pudo crear la sala.');
      rooms.set(code, newRoom);
      ctxOf.set(ws, { code, slot: player.slot });
      send(ws, { t: 'joined', code, you: player.slot, mode: newRoom.mode, difficulty: newRoom.difficulty });
      broadcastRoom(newRoom);
      return;
    }

    case 'join': {
      const code = String(msg.code ?? '').trim().toUpperCase();
      const target = rooms.get(code);
      if (!target) return err(ws, 'No existe una sala con ese código.', 'NO_ROOM');
      if (target.phase !== 'lobby') return err(ws, 'La partida ya está en curso.', 'IN_PROGRESS');
      if (!target.freeSlot()) return err(ws, 'La sala está llena.', 'FULL');
      const player = target.addPlayer(ws, cleanName(msg.name));
      if (!player) return err(ws, 'La sala está llena.', 'FULL');
      ctxOf.set(ws, { code, slot: player.slot });
      send(ws, { t: 'joined', code, you: player.slot, mode: target.mode, difficulty: target.difficulty });
      broadcastRoom(target);
      return;
    }

    case 'ready': {
      if (!room || !ctx) return;
      const p = room.players.get(ctx.slot);
      if (!p) return;
      p.ready = !!msg.ready;
      broadcastRoom(room);
      return;
    }

    case 'start': {
      if (!room || !ctx) return;
      const p = room.players.get(ctx.slot);
      if (!p?.isHost) return err(ws, 'Solo el anfitrión puede empezar.');
      if (!room.everyoneReady()) return err(ws, 'Ambos jugadores deben estar listos.');
      tryStart(room);
      return;
    }

    case 'reveal':
    case 'chord': {
      if (!room || !ctx) return;
      if (room.applyReveal(ctx.slot, msg.r, msg.c, msg.t)) {
        broadcastGame(room);
        if (room.phase === 'finished') broadcastRoom(room);
      }
      return;
    }

    case 'flag': {
      if (!room || !ctx) return;
      if (room.applyFlag(ctx.slot, msg.r, msg.c)) broadcastGame(room);
      return;
    }

    case 'rematch': {
      if (!room || !ctx) return;
      room.resetToLobby();
      broadcastRoom(room);
      return;
    }

    case 'leave': {
      dropConnection(ws, false);
      return;
    }

    case 'ping': {
      send(ws, { t: 'pong' });
      return;
    }
  }
}

function dropConnection(ws: WebSocket, closing: boolean): void {
  const ctx = ctxOf.get(ws);
  ctxOf.delete(ws);
  if (!ctx) return;
  const room = rooms.get(ctx.code);
  if (!room) return;

  const wasPlaying = room.phase === 'playing';
  if (wasPlaying) room.forfeit(ctx.slot);
  room.removePlayer(ctx.slot);

  if (room.isEmpty()) {
    room.stopTick();
    rooms.delete(room.code);
  } else {
    for (const p of room.players.values()) {
      if (p.connected) send(p.ws, { t: 'peerLeft', slot: ctx.slot });
    }
    broadcastRoom(room);
    if (wasPlaying) broadcastGame(room);
  }

  if (!closing && ws.readyState === ws.OPEN) {
    // Explicit leave: free the client to return to the menu.
    send(ws, { t: 'room', room: { code: '', mode: room.mode, difficulty: room.difficulty, phase: 'lobby', hostSlot: 'p1', players: [] } });
  }
}

/* ---- HTTP: health + leaderboard REST API ---- */

function cors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function json(res: ServerResponse, status: number, body: unknown): void {
  cors(res);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

/** Short, safe error reason for debugging (no token leakage). */
function errReason(e: unknown): string {
  return String((e instanceof Error ? e.message : e) ?? 'error').slice(0, 200);
}

// Simple in-memory rate limiter: max N requests per window per IP.
const rl = new Map<string, number[]>();
function rateLimited(ip: string, max = 40, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (rl.get(ip) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  rl.set(ip, hits);
  return hits.length > max;
}

function readBody(req: IncomingMessage, limit = 4096): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > limit) reject(new Error('payload too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleHttp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', 'http://localhost');
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';

  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  if (url.pathname === '/health' || url.pathname === '/') {
    return json(res, 200, { ok: true, rooms: rooms.size, leaderboard: leaderboardEnabled() });
  }

  if (url.pathname === '/api/leaderboard' && req.method === 'GET') {
    if (rateLimited(ip)) return json(res, 429, { error: 'Demasiadas peticiones.' });
    const difficulty = url.searchParams.get('difficulty') || '';
    if (!isPreset(difficulty)) return json(res, 400, { error: 'Dificultad no válida.' });
    if (!leaderboardEnabled()) return json(res, 200, { enabled: false, difficulty, entries: [] });
    try {
      const limit = Number(url.searchParams.get('limit')) || 20;
      const entries = await getTop(difficulty, limit);
      return json(res, 200, { enabled: true, difficulty, entries });
    } catch (e) {
      console.error('leaderboard get', e);
      return json(res, 502, { enabled: true, error: 'No se pudo leer la clasificación.', reason: errReason(e) });
    }
  }

  if (url.pathname === '/api/score' && req.method === 'POST') {
    if (rateLimited(ip)) return json(res, 429, { error: 'Demasiadas peticiones.' });
    if (!leaderboardEnabled()) return json(res, 200, { ok: false, enabled: false });
    try {
      const body = JSON.parse((await readBody(req)) || '{}') as { difficulty?: unknown; name?: unknown; timeMs?: unknown };
      if (!isPreset(body.difficulty)) return json(res, 400, { error: 'Dificultad no válida.' });
      const result = await submitScore(body.difficulty, body.name, body.timeMs);
      return json(res, 200, { enabled: true, ...result });
    } catch (e) {
      console.error('leaderboard submit', e);
      return json(res, 502, { ok: false, error: 'No se pudo guardar la puntuación.', reason: errReason(e) });
    }
  }

  cors(res);
  res.writeHead(404);
  res.end();
}

const httpServer = createServer((req, res) => {
  handleHttp(req, res).catch((e) => {
    console.error('http error', e);
    if (!res.headersSent) { res.writeHead(500); res.end(); }
  });
});

// Optional origin allow-list. Set ALLOWED_ORIGINS (comma-separated, e.g.
// "https://buscaminas.vercel.app") in production to reject other origins.
// Left unset in dev/demo so the Vite proxy and local testing keep working.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

const wss = new WebSocketServer({
  server: httpServer,
  verifyClient: allowedOrigins.length
    ? (info, done) => {
        const origin = info.origin || info.req.headers.origin || '';
        done(allowedOrigins.includes(origin));
      }
    : undefined,
});

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data) => {
    const msg = decode<ClientMsg>(data.toString());
    if (!msg || typeof msg.t !== 'string') return;
    try {
      handle(ws, msg);
    } catch (e) {
      console.error('handler error', e);
      err(ws, 'Error interno del servidor.');
    }
  });
  ws.on('close', () => dropConnection(ws, true));
  ws.on('error', () => dropConnection(ws, true));
});

httpServer.listen(PORT, () => {
  console.log(`[buscaminas] servidor de juego en ws://localhost:${PORT}`);
});
