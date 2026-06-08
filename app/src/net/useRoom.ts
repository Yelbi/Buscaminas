import { useCallback, useEffect, useRef, useState } from 'react';
import { decode, encode } from '../../shared/protocol';
import type { ClientMsg, GameSnapshot, RoomSnapshot, ServerMsg } from '../../shared/protocol';
import type { DifficultyId, GameMode, PlayerSlotId } from '../../shared/types';
import { wsUrl } from './config';

export type ConnStatus = 'idle' | 'connecting' | 'open' | 'closed';

export interface RoomState {
  status: ConnStatus;
  you: PlayerSlotId | null;
  room: RoomSnapshot | null;
  game: GameSnapshot | null;
  error: string | null;
  notice: string | null;
}

export interface RoomApi extends RoomState {
  createRoom: (mode: GameMode, difficulty: DifficultyId, name: string) => void;
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

export function useRoom(): RoomApi {
  const [state, setState] = useState<RoomState>({
    status: 'idle', you: null, room: null, game: null, error: null, notice: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<ClientMsg[]>([]);

  const patch = useCallback((p: Partial<RoomState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

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
        patch({ you: msg.you, error: null });
        break;
      case 'room':
        // An empty code is the server confirming we left the room.
        if (!msg.room.code) {
          patch({ room: null, game: null, you: null });
        } else {
          patch({ room: msg.room });
        }
        break;
      case 'game':
        patch({ game: msg.game });
        break;
      case 'error':
        patch({ error: msg.message });
        break;
      case 'peerLeft':
        patch({ notice: 'El otro jugador salió de la sala.' });
        break;
      case 'pong':
        break;
    }
  }, [patch]);

  const ensureSocket = useCallback(() => {
    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) return;

    patch({ status: 'connecting', error: null });
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;
    ws.onopen = () => { patch({ status: 'open' }); flush(); };
    ws.onmessage = (e) => onMessage(typeof e.data === 'string' ? e.data : '');
    ws.onclose = () => { patch({ status: 'closed' }); };
    ws.onerror = () => { patch({ error: 'No se pudo conectar con el servidor de juego.' }); };
  }, [patch, flush, onMessage]);

  const send = useCallback((m: ClientMsg) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(encode(m));
    } else {
      queueRef.current.push(m);
      ensureSocket();
    }
  }, [ensureSocket]);

  const createRoom = useCallback((mode: GameMode, difficulty: DifficultyId, name: string) => {
    ensureSocket();
    send({ t: 'create', mode, difficulty, name });
  }, [ensureSocket, send]);

  const joinRoom = useCallback((code: string, name: string) => {
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
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(encode({ t: 'leave' }));
    queueRef.current = [];
    if (ws) { ws.onclose = null; ws.close(); }
    wsRef.current = null;
    setState({ status: 'idle', you: null, room: null, game: null, error: null, notice: null });
  }, []);

  const clearError = useCallback(() => patch({ error: null, notice: null }), [patch]);

  // Tear down on unmount.
  useEffect(() => () => {
    const ws = wsRef.current;
    if (ws) { ws.onclose = null; ws.close(); }
  }, []);

  return {
    ...state,
    createRoom, joinRoom, setReady, start, reveal, flag, chord, rematch, leave, clearError,
  };
}
