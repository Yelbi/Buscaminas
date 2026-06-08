import { useCallback, useEffect, useRef, useState } from 'react';
import {
  chord as chordFn,
  createState,
  flagsRemaining,
  projectBoard,
  reveal as revealFn,
  revealAllMines,
  toggleFlag,
} from '../../shared/minesweeper';
import { DIFFICULTIES } from '../../shared/types';
import type { BoardView, DifficultyId, GameState, GameStatus } from '../../shared/types';

interface Snap {
  board: BoardView;
  status: GameStatus;
  flagsRemaining: number;
  revealed: number;
}

export interface SoloApi {
  difficulty: DifficultyId;
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
  reset: (difficulty?: DifficultyId) => void;
}

function build(st: GameState): Snap {
  return {
    board: projectBoard(st, st.status !== 'playing'),
    status: st.status,
    flagsRemaining: flagsRemaining(st),
    revealed: st.revealed,
  };
}

function bestKey(d: DifficultyId): string {
  return `buscaminas.best.${d}`;
}
function readBest(d: DifficultyId): number | null {
  try {
    const v = localStorage.getItem(bestKey(d));
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}
function writeBest(d: DifficultyId, ms: number): void {
  try { localStorage.setItem(bestKey(d), String(ms)); } catch { /* ignore */ }
}

function freshState(d: DifficultyId): GameState {
  const cfg = DIFFICULTIES[d];
  return createState(cfg.rows, cfg.cols, cfg.mines, true);
}

export function useSoloGame(initial: DifficultyId): SoloApi {
  const [difficulty, setDifficulty] = useState<DifficultyId>(initial);
  const stateRef = useRef<GameState>(freshState(initial));
  const [snap, setSnap] = useState<Snap>(() => build(stateRef.current));
  const [started, setStarted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestMs, setBestMs] = useState<number | null>(() => readBest(initial));
  const [round, setRound] = useState(0);
  const startRef = useRef<number | null>(null);

  const commit = useCallback(() => setSnap(build(stateRef.current)), []);

  const reset = useCallback((d?: DifficultyId) => {
    const diff = d ?? difficulty;
    if (d && d !== difficulty) setDifficulty(d);
    stateRef.current = freshState(diff);
    startRef.current = null;
    setStarted(false);
    setElapsedMs(0);
    setBestMs(readBest(diff));
    setSnap(build(stateRef.current));
    setRound((n) => n + 1);
  }, [difficulty]);

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
      const prev = readBest(difficulty);
      if (prev == null || total < prev) { writeBest(difficulty, total); setBestMs(total); }
    }
  }, [difficulty]);

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
    difficulty,
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
