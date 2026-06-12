import { useCallback, useEffect, useRef, useState } from 'react';
import {
  INFINITE_LIVES,
  chord as chordFn,
  createInfinite,
  reveal as revealFn,
  toggleFlag,
  viewRect,
} from '../../shared/infinite';
import type { InfiniteState, InfiniteStatus } from '../../shared/infinite';
import { randomSeed } from '../../shared/minesweeper';
import type { BoardView } from '../../shared/types';
import { audio } from '../audio/engine';

const BEST_KEY = 'buscaminas.best.infinito';

function readBest(): number | null {
  try {
    const v = localStorage.getItem(BEST_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}
function writeBest(score: number): void {
  try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* ignore */ }
}

export interface Boom { r: number; c: number; id: number; }

export interface InfiniteApi {
  round: number;
  /** Cambia con cada mutación del tablero → re-render del viewport. */
  version: number;
  status: InfiniteStatus;
  score: number;
  lives: number;
  maxLives: number;
  /** Hubo al menos un clic (la partida está en marcha). */
  started: boolean;
  /** Primer clic de la partida (centro de la zona segura), o null. */
  origin: { r: number; c: number } | null;
  elapsedMs: number;
  bestScore: number | null;
  /** Última mina pisada (para la animación de explosión). */
  boom: Boom | null;
  reveal: (r: number, c: number) => void;
  flag: (r: number, c: number) => void;
  chord: (r: number, c: number) => void;
  reset: () => void;
  /** Proyección de la ventana visible (las minas se muestran al terminar). */
  view: (r0: number, c0: number, rows: number, cols: number) => BoardView;
}

/**
 * Máquina de estado del modo infinito (todo client-side, como el solitario).
 * Puntuación = casillas despejadas; INFINITE_LIVES vidas; sin victoria.
 */
export function useInfiniteGame(): InfiniteApi {
  const stateRef = useRef<InfiniteState>(createInfinite(randomSeed()));
  const [version, setVersion] = useState(0);
  const [round, setRound] = useState(0);
  const [snap, setSnap] = useState({
    status: 'playing' as InfiniteStatus,
    score: 0,
    lives: INFINITE_LIVES,
    started: false,
    origin: null as { r: number; c: number } | null,
  });
  const [boom, setBoom] = useState<Boom | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(readBest);
  const [started, setStarted] = useState(false);
  const startRef = useRef<number | null>(null);
  const boomIdRef = useRef(0);

  const commit = useCallback(() => {
    const st = stateRef.current;
    setSnap({
      status: st.status,
      score: st.revealed,
      lives: st.lives,
      started: st.started,
      origin: st.started ? { r: st.safeR, c: st.safeC } : null,
    });
    setVersion((v) => v + 1);
  }, []);

  const beginIfNeeded = useCallback(() => {
    if (startRef.current == null) {
      startRef.current = Date.now();
      setStarted(true);
    }
  }, []);

  const finalizeIfOver = useCallback(() => {
    const st = stateRef.current;
    if (st.status !== 'over') return;
    if (startRef.current != null) setElapsedMs(Date.now() - startRef.current);
    const prev = readBest();
    if (prev == null || st.revealed > prev) {
      writeBest(st.revealed);
      setBestScore(st.revealed);
    }
    audio.play('lose');
  }, []);

  const onMineHit = useCallback((r: number, c: number, gameOver: boolean) => {
    setBoom({ r, c, id: ++boomIdRef.current });
    audio.play(gameOver ? 'bigExplode' : 'explode');
  }, []);

  const reveal = useCallback((r: number, c: number) => {
    const st = stateRef.current;
    if (st.status !== 'playing') return;
    beginIfNeeded();
    const res = revealFn(st, r, c);
    if (!res.changed) return;
    if (res.hitMine) onMineHit(r, c, res.gameOver);
    else if (res.cellsOpened === 1) audio.play('reveal');
    else if (res.cellsOpened > 1) audio.play('open', res.cellsOpened);
    finalizeIfOver();
    commit();
  }, [beginIfNeeded, onMineHit, finalizeIfOver, commit]);

  const flag = useCallback((r: number, c: number) => {
    const st = stateRef.current;
    if (st.status !== 'playing') return;
    beginIfNeeded();
    const flagged = toggleFlag(st, r, c);
    if (flagged === null) return;
    audio.play(flagged ? 'flagOn' : 'flagOff');
    commit();
  }, [beginIfNeeded, commit]);

  const chord = useCallback((r: number, c: number) => {
    const st = stateRef.current;
    if (st.status !== 'playing') return;
    const res = chordFn(st, r, c);
    if (!res.changed) return;
    if (res.hitMine) onMineHit(r, c, res.gameOver); // la onda sale del número pulsado
    if (res.cellsOpened === 1) audio.play('reveal');
    else if (res.cellsOpened > 1) audio.play('open', res.cellsOpened);
    finalizeIfOver();
    commit();
  }, [onMineHit, finalizeIfOver, commit]);

  const reset = useCallback(() => {
    stateRef.current = createInfinite(randomSeed());
    startRef.current = null;
    setStarted(false);
    setElapsedMs(0);
    setBoom(null);
    setBestScore(readBest());
    setSnap({ status: 'playing', score: 0, lives: INFINITE_LIVES, started: false, origin: null });
    setVersion((v) => v + 1);
    setRound((n) => n + 1);
  }, []);

  const view = useCallback((r0: number, c0: number, rows: number, cols: number): BoardView => {
    const st = stateRef.current;
    return viewRect(st, r0, c0, rows, cols, st.status === 'over');
  }, []);

  // Reloj en vivo mientras se juega.
  useEffect(() => {
    if (snap.status !== 'playing' || !started) return;
    const id = setInterval(() => {
      if (startRef.current != null) setElapsedMs(Date.now() - startRef.current);
    }, 200);
    return () => clearInterval(id);
  }, [snap.status, started]);

  return {
    round,
    version,
    status: snap.status,
    score: snap.score,
    lives: snap.lives,
    maxLives: INFINITE_LIVES,
    started: snap.started,
    origin: snap.origin,
    elapsedMs,
    bestScore,
    boom,
    reveal, flag, chord, reset, view,
  };
}
