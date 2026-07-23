import { useCallback, useEffect, useRef, useState } from 'react';
import { decode, encode } from '../../shared/protocol';
import type { C4ClientMsg, C4GameSnapshot, C4RoomSnapshot, C4ServerMsg } from '../../shared/protocol';
import type { Player } from '../../shared/cuatro';
import { wsUrl } from '../net/config';

/* 4 en línea online client — same WebSocket server, `c4:` messages.
   Mirrors useReversiRoom's connection lifecycle. */

export type ConnStatus = 'idle' | 'connecting' | 'open' | 'closed';

export interface C4RoomState {
  status: ConnStatus;
  reconnecting: boolean;
  you: Player | null;
  room: C4RoomSnapshot | null;
  game: C4GameSnapshot | null;
  error: string | null;
  notice: string | null;
}

export interface C4RoomApi extends C4RoomState {
  createRoom: (name: string, bestOf: number) => void;
  joinRoom: (code: string, name: string) => void;
  setReady: (ready: boolean) => void;
  start: () => void;
  drop: (col: number) => void;
  next: () => void;
  rematch: () => void;
  leave: () => void;
  clearError: () => void;
}

const IDLE: C4RoomState = { status: 'idle', reconnecting: false, you: null, room: null, game: null, error: null, notice: null };
const MAX_RECONNECTS = 8;

export function useCuatroRoom(): C4RoomApi {
  const [state, setState] = useState<C4RoomState>(IDLE);

  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<C4ClientMsg[]>([]);
  const tokenRef = useRef<string | null>(null);
  const codeRef = useRef<string | null>(null);
  const leavingRef = useRef(false);
  const attemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(rejoin: boolean) => void>(() => {});

  const patch = useCallback((p: Partial<C4RoomState>) => setState((s) => ({ ...s, ...p })), []);

  const flush = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    for (const m of queueRef.current) ws.send(encode(m));
    queueRef.current = [];
  }, []);

  const onMessage = useCallback((raw: string) => {
    const msg = decode<C4ServerMsg>(raw);
    if (!msg) return;
    switch (msg.t) {
      case 'c4:joined':
        tokenRef.current = msg.token;
        codeRef.current = msg.code;
        attemptsRef.current = 0;
        patch({ you: msg.you, error: null, reconnecting: false });
        break;
      case 'c4:room':
        if (!msg.room.code) {
          tokenRef.current = null; codeRef.current = null;
          patch({ room: null, game: null, you: null, reconnecting: false });
        } else {
          patch({ room: msg.room });
        }
        break;
      case 'c4:game':
        patch({ game: msg.game });
        break;
      case 'c4:tick':
        setState((s) => (s.game && s.game.phase === 'playing' ? { ...s, game: { ...s.game, timer: msg.timer } } : s));
        break;
      case 'c4:error':
        if (msg.code === 'NO_REJOIN' || msg.code === 'NO_ROOM') {
          tokenRef.current = null; codeRef.current = null;
          patch({ room: null, game: null, you: null, reconnecting: false, error: msg.message });
        } else {
          patch({ error: msg.message });
        }
        break;
      case 'c4:peerLeft':
        patch({ notice: 'El otro jugador salió de la sala.' });
        break;
    }
  }, [patch]);

  const onClose = useCallback((ws: WebSocket) => {
    if (wsRef.current !== ws) return;
    patch({ status: 'closed' });
    if (leavingRef.current || !tokenRef.current || !codeRef.current) return;
    attemptsRef.current += 1;
    if (attemptsRef.current > MAX_RECONNECTS) {
      patch({ reconnecting: false, error: 'Se perdió la conexión con la sala.' });
      return;
    }
    patch({ reconnecting: true });
    const delay = Math.min(8000, 500 * 2 ** (attemptsRef.current - 1));
    reconnectTimerRef.current = setTimeout(() => connectRef.current(true), delay);
  }, [patch]);

  const connect = useCallback((rejoin: boolean) => {
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    const prev = wsRef.current;
    if (prev) { prev.onclose = null; prev.onmessage = null; try { prev.close(); } catch { /* ignore */ } }
    patch({ status: 'connecting', error: null });
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;
    ws.onopen = () => {
      patch({ status: 'open' });
      if (rejoin && tokenRef.current && codeRef.current) {
        ws.send(encode({ t: 'c4:rejoin', code: codeRef.current, token: tokenRef.current }));
      } else {
        attemptsRef.current = 0;
        patch({ reconnecting: false });
      }
      flush();
    };
    ws.onmessage = (e) => onMessage(typeof e.data === 'string' ? e.data : '');
    ws.onclose = () => onClose(ws);
    ws.onerror = () => { /* surfaced via onclose */ };
  }, [patch, flush, onMessage, onClose]);

  useEffect(() => { connectRef.current = connect; }, [connect]);

  const ensureSocket = useCallback(() => {
    const ws = wsRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    connect(false);
  }, [connect]);

  const send = useCallback((m: C4ClientMsg) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(encode(m));
    else { queueRef.current.push(m); ensureSocket(); }
  }, [ensureSocket]);

  const createRoom = useCallback((name: string, bestOf: number) => {
    leavingRef.current = false; ensureSocket(); send({ t: 'c4:create', name, bestOf });
  }, [ensureSocket, send]);
  const joinRoom = useCallback((code: string, name: string) => {
    leavingRef.current = false; ensureSocket(); send({ t: 'c4:join', code: code.trim().toUpperCase(), name });
  }, [ensureSocket, send]);
  const setReady = useCallback((ready: boolean) => send({ t: 'c4:ready', ready }), [send]);
  const start = useCallback(() => send({ t: 'c4:start' }), [send]);
  const drop = useCallback((col: number) => send({ t: 'c4:drop', col }), [send]);
  const next = useCallback(() => send({ t: 'c4:next' }), [send]);
  const rematch = useCallback(() => send({ t: 'c4:rematch' }), [send]);

  const leave = useCallback(() => {
    leavingRef.current = true;
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    tokenRef.current = null; codeRef.current = null; attemptsRef.current = 0;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(encode({ t: 'c4:leave' }));
    queueRef.current = [];
    if (ws) { ws.onclose = null; ws.close(); }
    wsRef.current = null;
    setState(IDLE);
    setTimeout(() => { leavingRef.current = false; }, 0);
  }, []);

  const clearError = useCallback(() => patch({ error: null, notice: null }), [patch]);

  useEffect(() => () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const ws = wsRef.current;
    if (ws) { ws.onclose = null; ws.close(); }
  }, []);

  return { ...state, createRoom, joinRoom, setReady, start, drop, next, rematch, leave, clearError };
}
