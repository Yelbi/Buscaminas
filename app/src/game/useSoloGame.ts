import { useCallback, useEffect, useRef, useState } from 'react';
import {
  chord as chordFn,
  createState,
  flagAllMines,
  flagsRemaining,
  projectBoard,
  reveal as revealFn,
  revealAllMines,
  toggleFlag,
} from '../../shared/minesweeper';
import type { BoardView, GameState, GameStatus, ResolvedSpec } from '../../shared/types';

interface Snap {
  board: BoardView;
  status: GameStatus;
  flagsRemaining: number;
  revealed: number;
}

export interface SoloApi {
  round: number;
  board: BoardView;
  status: GameStatus;
  flagsRemaining: number;
  revealed: number;
  elapsedMs: number;
  bestMs: number | null;
  reveal: (r: number, c: number) => void;
  flag: (r: number, c: number) => void;
  chord: (r: number, c: number) => void;
  reset: () => void;
}

function build(st: GameState): Snap {
  return {
    // Reveal mines only on a loss; on a win, leave them (correct flags stay flags).
    board: projectBoard(st, st.status === 'lost'),
    status: st.status,
    flagsRemaining: flagsRemaining(st),
    revealed: st.revealed,
  };
}

function readBest(key: string | null): number | null {
  if (!key) return null;
  try {
    const v = localStorage.getItem(`buscaminas.best.${key}`);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}
function writeBest(key: string, ms: number): void {
  try { localStorage.setItem(`buscaminas.best.${key}`, String(ms)); } catch { /* ignore */ }
}

function freshState(spec: ResolvedSpec): GameState {
  return createState(spec.rows, spec.cols, spec.mines, true);
}

/**
 * Solo game state machine. `spec` resolves the board dimensions (supports the
 * custom difficulty); `bestKey` is the localStorage suffix for best time, or
 * null to disable persistence (e.g. for custom boards).
 */
export function useSoloGame(spec: ResolvedSpec, bestKey: string | null): SoloApi {
  const specRef = useRef(spec);
  specRef.current = spec;

  const stateRef = useRef<GameState>(freshState(spec));
  const [snap, setSnap] = useState<Snap>(() => build(stateRef.current));
  const [started, setStarted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestMs, setBestMs] = useState<number | null>(() => readBest(bestKey));
  const [round, setRound] = useState(0);
  const startRef = useRef<number | null>(null);

  const commit = useCallback(() => setSnap(build(stateRef.current)), []);

  const reset = useCallback(() => {
    stateRef.current = freshState(specRef.current);
    startRef.current = null;
    setStarted(false);
    setElapsedMs(0);
    setBestMs(readBest(bestKey));
    setSnap(build(stateRef.current));
    setRound((n) => n + 1);
  }, [bestKey]);

  const beginIfNeeded = useCallback(() => {
    if (startRef.current == null) {
      startRef.current = Date.now();
      setStarted(true);
    }
  }, []);

  const finalizeIfOver = useCallback(() => {
    const st = stateRef.current;
    if (st.status === 'playing') return;
    const end = Date.now();
    const total = startRef.current != null ? end - startRef.current : 0;
    setElapsedMs(total);
    if (st.status === 'lost') revealAllMines(st);
    if (st.status === 'won') {
      flagAllMines(st);
      if (bestKey) {
        const prev = readBest(bestKey);
        if (prev == null || total < prev) { writeBest(bestKey, total); setBestMs(total); }
      }
    }
  }, [bestKey]);

  const reveal = useCallback((r: number, c: number) => {
    const st = stateRef.current;
    if (st.status !== 'playing') return;
    beginIfNeeded();
    const res = revealFn(st, r, c, null);
    if (!res.changed) return;
    finalizeIfOver();
    commit();
  }, [beginIfNeeded, finalizeIfOver, commit]);

  const chord = useCallback((r: number, c: number) => {
    const st = stateRef.current;
    if (st.status !== 'playing') return;
    const res = chordFn(st, r, c, null);
    if (!res.changed) return;
    finalizeIfOver();
    commit();
  }, [finalizeIfOver, commit]);

  const flag = useCallback((r: number, c: number) => {
    const st = stateRef.current;
    if (st.status !== 'playing') return;
    beginIfNeeded();
    if (toggleFlag(st, r, c, null) !== null) commit();
  }, [beginIfNeeded, commit]);

  // Live timer while playing.
  useEffect(() => {
    if (snap.status !== 'playing' || !started) return;
    const id = setInterval(() => {
      if (startRef.current != null) setElapsedMs(Date.now() - startRef.current);
    }, 200);
    return () => clearInterval(id);
  }, [snap.status, started]);

  return {
    round,
    board: snap.board,
    status: snap.status,
    flagsRemaining: snap.flagsRemaining,
    revealed: snap.revealed,
    elapsedMs,
    bestMs,
    reveal, flag, chord, reset,
  };
}
