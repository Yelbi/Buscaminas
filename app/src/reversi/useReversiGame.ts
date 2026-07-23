import { useCallback, useEffect, useRef, useState } from 'react';
import { applyMove, coord, initialBoard, other, scores, validMoves } from '../../shared/reversi';
import type { Board, Player } from '../../shared/reversi';
import { pickMove } from '../../shared/reversiAI';
import type { AiLevel } from '../../shared/reversiAI';

/* ============================================================
   Reversi — solo game (vs bot), client-side.
   Ports the prototype's flow to React: human is p1 (black), the
   bot is p2 (white). Authoritative game state lives in a ref so
   the interval/timeout callbacks always read the latest, mirroring
   the buscaminas useSoloGame pattern. Online play uses a separate
   hook (useReversiRoom) with the same board UI.
   ============================================================ */

export type Result = 'win' | 'lose' | 'draw';

export interface HistEntry {
  num: number;
  p: Player;
  text: string;
  flips: number;
  pass?: boolean;
}

const OPP_NAME: Record<AiLevel, string> = { facil: 'Novato', normal: 'Adepto', dificil: 'Maestro' };
const EMPTY_SET: ReadonlySet<number> = new Set();

interface State {
  board: Board | null;
  turn: Player;
  history: HistEntry[];
  moveNum: number;
  timer: number;
  over: boolean;
  dialog: 'pause' | null;
  result: Result | null;
  resigned: boolean;
  comboShow: boolean;
  comboText: string;
  introGen: number;
  mode: AiLevel;
  /** Per-index flip-transition delays (ms) for the current move. */
  flipInfo: Record<number, number>;
  /** Per-index "drop in" delays (ms) for freshly placed discs. */
  newInfo: Record<number, number>;
}

function menuState(): State {
  return {
    board: null, turn: 'p1', history: [], moveNum: 0, timer: 30,
    over: false, dialog: null, result: null, resigned: false,
    comboShow: false, comboText: '', introGen: 0, mode: 'normal',
    flipInfo: {}, newInfo: {},
  };
}

export interface ReversiSoloApi {
  board: Board | null;
  turn: Player;
  history: HistEntry[];
  moveNum: number;
  timer: number;
  over: boolean;
  dialog: 'pause' | null;
  result: Result | null;
  resigned: boolean;
  comboShow: boolean;
  comboText: string;
  introGen: number;
  mode: AiLevel;
  oppName: string;
  p1Score: number;
  p2Score: number;
  validSet: ReadonlySet<number>;
  flipInfo: Record<number, number>;
  newInfo: Record<number, number>;
  start: (mode: AiLevel) => void;
  play: (i: number) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  resign: () => void;
  rematch: () => void;
  /** Tear the session down (back to menu): stops timers and the bot. */
  stop: () => void;
}

export function useReversiGame(turnSeconds = 30): ReversiSoloApi {
  const [s, setS] = useState<State>(menuState);
  const sRef = useRef(s);
  useEffect(() => { sRef.current = s; }, [s]);

  const botT = useRef<ReturnType<typeof setTimeout>>();
  const comboT = useRef<ReturnType<typeof setTimeout>>();
  const endT = useRef<ReturnType<typeof setTimeout>>();

  const playRef = useRef<(i: number) => void>(() => {});
  const botMoveRef = useRef<() => void>(() => {});

  const update = useCallback((patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch })), []);

  const finish = useCallback((board: Board) => {
    const { p1, p2 } = scores(board);
    update({ result: p1 > p2 ? 'win' : p2 > p1 ? 'lose' : 'draw' });
  }, [update]);

  const play = useCallback((i: number) => {
    const st = sRef.current;
    if (!st.board || st.over || st.dialog || st.result) return;
    const p = st.turn;
    const res = applyMove(st.board, i, p);
    if (!res) return; // illegal

    const x = i % 8, y = (i / 8) | 0;
    const flipInfo: Record<number, number> = {};
    for (const j of res.flipped) {
      const d = Math.max(Math.abs((j % 8) - x), Math.abs(((j / 8) | 0) - y));
      flipInfo[j] = 130 + d * 95;
    }
    const num = st.moveNum + 1;
    const hist: HistEntry[] = [
      { num, p, text: (p === 'p1' ? 'Tú · ' : OPP_NAME[st.mode] + ' · ') + coord(i), flips: res.flipped.length },
      ...st.history,
    ];
    if (res.passed) {
      const passer = other(p);
      hist.unshift({
        num, p: passer, flips: 0, pass: true,
        text: passer === 'p1' ? 'Tú pasas turno' : OPP_NAME[st.mode] + ' pasa turno',
      });
    }
    const combo = res.flipped.length >= 4;
    update({
      board: res.board, turn: res.nextTurn, history: hist, moveNum: num,
      timer: turnSeconds, over: res.over, comboShow: combo,
      comboText: '¡Cascada ×' + res.flipped.length + '!',
      flipInfo, newInfo: { [i]: 0 },
    });

    if (combo) { clearTimeout(comboT.current); comboT.current = setTimeout(() => update({ comboShow: false }), 1700); }
    if (res.over) { endT.current = setTimeout(() => finish(res.board), 1400); }
    else if (res.nextTurn === 'p2') { botT.current = setTimeout(() => botMoveRef.current(), 1400 + Math.random() * 800); }
  }, [update, finish, turnSeconds]);
  playRef.current = play;

  const botMove = useCallback(() => {
    const st = sRef.current;
    if (!st.board || st.over || st.dialog || st.result || st.turn !== 'p2') return;
    const i = pickMove(st.board, 'p2', st.mode);
    if (i != null) playRef.current(i);
  }, []);
  botMoveRef.current = botMove;

  const start = useCallback((mode: AiLevel) => {
    clearTimeout(botT.current); clearTimeout(endT.current); clearTimeout(comboT.current);
    update({
      board: initialBoard(), turn: 'p1', history: [], moveNum: 0, timer: turnSeconds,
      over: false, dialog: null, result: null, resigned: false, comboShow: false,
      mode, introGen: sRef.current.introGen + 1,
      flipInfo: {}, newInfo: { 27: 750, 28: 840, 35: 930, 36: 1020 },
    });
  }, [update, turnSeconds]);

  const pause = useCallback(() => { if (!sRef.current.result) update({ dialog: 'pause' }); }, [update]);
  const resume = useCallback(() => {
    update({ dialog: null });
    const st = sRef.current;
    if (st.turn === 'p2' && !st.over && !st.result) {
      clearTimeout(botT.current);
      botT.current = setTimeout(() => botMoveRef.current(), 900);
    }
  }, [update]);
  const restart = useCallback(() => start(sRef.current.mode), [start]);
  const resign = useCallback(() => {
    clearTimeout(botT.current);
    update({ result: 'lose', resigned: true, dialog: null });
  }, [update]);
  const rematch = useCallback(() => start(sRef.current.mode), [start]);
  const stop = useCallback(() => {
    clearTimeout(botT.current); clearTimeout(comboT.current); clearTimeout(endT.current);
    update({ board: null, over: false, dialog: null, result: null, comboShow: false });
  }, [update]);

  // Per-turn countdown. Only the human's turn drains it; the bot's turn keeps
  // the bar full while it "meditates". On the human's timeout, auto-play a
  // random legal move so the game never stalls.
  useEffect(() => {
    const id = setInterval(() => {
      const st = sRef.current;
      if (!st.board || st.over || st.dialog || st.result) return;
      if (st.timer <= 1) {
        if (st.turn === 'p1') {
          const vm = validMoves(st.board, 'p1');
          if (vm.length) playRef.current(vm[(Math.random() * vm.length) | 0]);
          else update({ timer: turnSeconds });
        } else {
          update({ timer: turnSeconds });
        }
      } else {
        update({ timer: st.timer - 1 });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [update, turnSeconds]);

  useEffect(() => () => {
    clearTimeout(botT.current); clearTimeout(comboT.current); clearTimeout(endT.current);
  }, []);

  const board = s.board;
  const sc = board ? scores(board) : { p1: 2, p2: 2, empty: 60 };
  const validSet = board && s.turn === 'p1' && !s.over && !s.result && !s.dialog
    ? new Set(validMoves(board, 'p1'))
    : EMPTY_SET;

  return {
    board: s.board, turn: s.turn, history: s.history, moveNum: s.moveNum, timer: s.timer,
    over: s.over, dialog: s.dialog, result: s.result, resigned: s.resigned,
    comboShow: s.comboShow, comboText: s.comboText, introGen: s.introGen, mode: s.mode,
    oppName: OPP_NAME[s.mode],
    p1Score: sc.p1, p2Score: sc.p2, validSet, flipInfo: s.flipInfo, newInfo: s.newInfo,
    start, play, pause, resume, restart, resign, rematch, stop,
  };
}
