import { useCallback, useEffect, useRef, useState } from 'react';
import { drop as dropFn, emptyBoard, idx, other } from '../../shared/cuatro';
import type { Board, Player } from '../../shared/cuatro';
import { pickMove } from '../../shared/cuatroAI';
import type { AiLevel } from '../../shared/cuatroAI';

/* ============================================================
   4 en línea — solo game (vs bot), client-side.
   Human is red (1), bot is yellow (2). Authoritative state lives
   in a ref so the timeout callbacks read the latest, mirroring the
   Reversi/Buscaminas hooks. Online play uses useCuatroRoom with the
   same board UI.
   ============================================================ */

export interface Disc { id: number; c: number; r: number; p: Player; }
export interface Confetti { left: number; s: number; h: number; br: string; color: string; delay: number; dur: number; cx: string; cr: string; }
export interface Result { winner: 0 | Player; line: number[]; }

interface State {
  active: boolean;
  board: Board;
  discs: Disc[];
  turn: Player;
  lock: boolean;
  hover: number | null;
  result: Result | null;
  confetti: Confetti[];
  dif: AiLevel;
}

function fresh(): State {
  return { active: false, board: emptyBoard(), discs: [], turn: 1, lock: false, hover: null, result: null, confetti: [], dif: 'medio' };
}

export function makeConfetti(): Confetti[] {
  const colors = ['#ff4d4d', '#ffd23f', '#4078ff', '#eef2ff', '#ff8c42'];
  return Array.from({ length: 70 }, (_, i) => {
    const sz = 6 + Math.random() * 8;
    const round = Math.random() < 0.4;
    return {
      left: +(Math.random() * 100).toFixed(1), s: Math.round(sz),
      h: Math.round(round ? sz : sz * 0.45), br: round ? '999px' : '2px',
      color: colors[i % 5], delay: +(Math.random() * 0.8).toFixed(2),
      dur: +(2.2 + Math.random() * 1.8).toFixed(2),
      cx: (Math.random() * 160 - 80).toFixed(0) + 'px',
      cr: (360 + Math.random() * 720).toFixed(0) + 'deg',
    };
  });
}

export interface CuatroSoloApi {
  board: Board;
  discs: Disc[];
  turn: Player;
  lock: boolean;
  hover: number | null;
  result: Result | null;
  confetti: Confetti[];
  dif: AiLevel;
  start: (dif: AiLevel) => void;
  drop: (c: number) => void;
  setHover: (c: number | null) => void;
  undo: () => void;
  restart: () => void;
  stop: () => void;
}

export function useCuatroGame(): CuatroSoloApi {
  const [s, setS] = useState<State>(fresh);
  const sRef = useRef(s);
  useEffect(() => { sRef.current = s; }, [s]);

  const nid = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const placeRef = useRef<(c: number, p: Player) => void>(() => {});
  const botRef = useRef<() => void>(() => {});

  const update = useCallback((patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch })), []);
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); }, []);
  const clearAll = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);

  const endGame = useCallback((winner: 0 | Player, line: number[]) => {
    update({ result: { winner, line }, lock: true, confetti: winner === 1 ? makeConfetti() : [] });
  }, [update]);

  const place = useCallback((c: number, p: Player) => {
    const st = sRef.current;
    if (!st.active || st.result) return;
    const res = dropFn(st.board, c, p);
    if (!res) return;
    const disc: Disc = { id: ++nid.current, c, r: res.row, p };
    const dur = 0.32 + res.row * 0.055;
    update({ board: res.board, discs: [...st.discs, disc], turn: other(p), lock: true, hover: null });
    after(dur * 1000 + 80, () => {
      if (res.line || res.full) endGame(res.line ? p : 0, res.line ?? []);
      else { update({ lock: false }); if (p === 1) botRef.current(); }
    });
  }, [update, after, endGame]);
  placeRef.current = place;

  const scheduleBot = useCallback(() => {
    after(520 + Math.random() * 700, () => {
      const st = sRef.current;
      if (!st.active || st.result || st.turn !== 2) return;
      placeRef.current(pickMove(st.board, 2, st.dif), 2);
    });
  }, [after]);
  botRef.current = scheduleBot;

  const resetBoard = useCallback((starter: Player, dif?: AiLevel) => {
    clearAll();
    setS((prev) => ({
      ...prev, active: true, board: emptyBoard(), discs: [], turn: starter,
      lock: false, hover: null, result: null, confetti: [], dif: dif ?? prev.dif,
    }));
    if (starter === 2) after(300, () => botRef.current());
  }, [clearAll, after]);

  const start = useCallback((dif: AiLevel) => resetBoard(1, dif), [resetBoard]);
  const restart = useCallback(() => resetBoard(1), [resetBoard]);

  const drop = useCallback((c: number) => {
    const st = sRef.current;
    if (!st.active || st.lock || st.result || st.turn !== 1) return;
    place(c, 1);
  }, [place]);

  const setHover = useCallback((c: number | null) => {
    const st = sRef.current;
    if (st.hover !== c) update({ hover: c });
  }, [update]);

  const undo = useCallback(() => {
    const st = sRef.current;
    if (!st.active || (st.lock && !st.result) || !st.discs.length) return;
    const discs = st.discs.slice();
    let popped = false;
    while (discs.length && !popped) { const d = discs.pop()!; if (d.p === 1) popped = true; }
    const board = emptyBoard();
    discs.forEach((d) => { board[idx(d.r, d.c)] = d.p; });
    clearAll();
    update({ discs, board, turn: 1, lock: false, result: null, confetti: [], hover: null });
  }, [clearAll, update]);

  const stop = useCallback(() => { clearAll(); update({ active: false, result: null, hover: null }); }, [clearAll, update]);

  // Keyboard: 1–7 drop into that column (human turn only).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 7 && sRef.current.active) drop(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drop]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  return {
    board: s.board, discs: s.discs, turn: s.turn, lock: s.lock, hover: s.hover,
    result: s.result, confetti: s.confetti, dif: s.dif,
    start, drop, setHover, undo, restart, stop,
  };
}
