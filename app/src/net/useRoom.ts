import { useCallback, useEffect, useRef, useState } from 'react';
import { decode, encode } from '../../shared/protocol';
import type { ClientMsg, GameSnapshot, RoomSnapshot, ServerMsg } from '../../shared/protocol';
import type { BoardSpec, DifficultyId, GameMode, PlayerSlotId } from '../../shared/types';
import { wsUrl } from './config';

export type ConnStatus = 'idle' | 'connecting' | 'open' | 'closed';

export interface RoomState {
  status: ConnStatus;
  reconnecting: boolean;
  you: PlayerSlotId | null;
  room: RoomSnapshot | null;
  game: GameSnapshot | null;
  error: string | null;
  notice: string | null;
}

export interface RoomApi extends RoomState {
  createRoom: (mode: GameMode, difficulty: DifficultyId, name: string, custom?: BoardSpec) => void;
  joinRoom: (code: string, name: string) => void;
  setReady: (ready: boolean) => void;
  start: () => void;
  reveal: (r: number, c: number) => void;
  flag: (r: number, c: number) => void;
  chord: (r: number, c: number) => void;
  rematch: () => void;
  leave: () => void;
  clearError: () => void;
}

const IDLE: RoomState = { status: 'idle', reconnecting: false, you: null, room: null, game: null, error: null, notice: null };
const MAX_RECONNECTS = 8;

export function useRoom(): RoomApi {
  const [state, setState] = useState<RoomState>(IDLE);

  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<ClientMsg[]>([]);
  const tokenRef = useRef<string | null>(null);
  const codeRef = useRef<string | null>(null);
  const leavingRef = useRef(false);
  const attemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(rejoin: boolean) => void>(() => {});

  const patch = useCallback((p: Partial<RoomState>) => setState((s) => ({ ...s, ...p })), []);

  const flush = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    for (const m of queueRef.current) ws.send(encode(m));
    queueRef.current = [];
  }, []);

  const onMessage = useCallback((raw: string) => {
    const msg = decode<ServerMsg>(raw);
    if (!msg) return;
    switch (msg.t) {
      case 'joined':
        tokenRef.current = msg.token;
        codeRef.current = msg.code;
        attemptsRef.current = 0;
        patch({ you: msg.you, error: null, reconnecting: false });
        break;
      case 'room':
        if (!msg.room.code) {
          tokenRef.current = null; codeRef.current = null;
          patch({ room: null, game: null, you: null, reconnecting: false });
        } else {
          patch({ room: msg.room });
        }
        break;
      case 'game':
        patch({ game: msg.game });
        break;
      case 'error':
        if (msg.code === 'NO_REJOIN' || msg.code === 'NO_ROOM') {
          tokenRef.current = null; codeRef.current = null;
          patch({ room: null, game: null, you: null, reconnecting: false, error: msg.message });
        } else {
          patch({ error: msg.message });
        }
        break;
      case 'peerLeft':
        patch({ notice: 'El otro jugador salió de la sala.' });
        break;
      case 'pong':
        break;
    }
  }, [patch]);

  const onClose = useCallback(() => {
    patch({ status: 'closed' });
    if (leavingRef.current || !tokenRef.current || !codeRef.current) return; // not in a room / intentional
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
    patch({ status: 'connecting', error: null });
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;
    ws.onopen = () => {
      patch({ status: 'open' });
      if (rejoin && tokenRef.current && codeRef.current) {
        ws.send(encode({ t: 'rejoin', code: codeRef.current, token: tokenRef.current }));
      } else {
        attemptsRef.current = 0;
        patch({ reconnecting: false });
      }
      flush();
    };
    ws.onmessage = (e) => onMessage(typeof e.data === 'string' ? e.data : '');
    ws.onclose = () => onClose();
    ws.onerror = () => { /* surfaced via onclose */ };
  }, [patch, flush, onMessage, onClose]);

  useEffect(() => { connectRef.current = connect; }, [connect]);

  const ensureSocket = useCallback(() => {
    const ws = wsRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    connect(false);
  }, [connect]);

  const send = useCallback((m: ClientMsg) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(encode(m));
    else { queueRef.current.push(m); ensureSocket(); }
  }, [ensureSocket]);

  const createRoom = useCallback((mode: GameMode, difficulty: DifficultyId, name: string, custom?: BoardSpec) => {
    leavingRef.current = false;
    ensureSocket();
    send({ t: 'create', mode, difficulty, name, custom });
  }, [ensureSocket, send]);

  const joinRoom = useCallback((code: string, name: string) => {
    leavingRef.current = false;
    ensureSocket();
    send({ t: 'join', code: code.trim().toUpperCase(), name });
  }, [ensureSocket, send]);

  const setReady = useCallback((ready: boolean) => send({ t: 'ready', ready }), [send]);
  const start = useCallback(() => send({ t: 'start' }), [send]);
  const reveal = useCallback((r: number, c: number) => send({ t: 'reveal', r, c }), [send]);
  const flag = useCallback((r: number, c: number) => send({ t: 'flag', r, c }), [send]);
  const chord = useCallback((r: number, c: number) => send({ t: 'chord', r, c }), [send]);
  const rematch = useCallback(() => send({ t: 'rematch' }), [send]);

  const leave = useCallback(() => {
    leavingRef.current = true;
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    tokenRef.current = null; codeRef.current = null; attemptsRef.current = 0;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(encode({ t: 'leave' }));
    queueRef.current = [];
    if (ws) { ws.onclose = null; ws.close(); }
    wsRef.current = null;
    setState(IDLE);
    setTimeout(() => { leavingRef.current = false; }, 0);
  }, []);

  const clearError = useCallback(() => patch({ error: null, notice: null }), [patch]);

  // Tear down on unmount.
  useEffect(() => () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const ws = wsRef.current;
    if (ws) { ws.onclose = null; ws.close(); }
  }, []);

  return {
    ...state,
    createRoom, joinRoom, setReady, start, reveal, flag, chord, rematch, leave, clearError,
  };
}
