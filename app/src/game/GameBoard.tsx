import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Tile } from '../components/Tile';
import type { Owner, TileSize, TileState } from '../components/Tile';
import type { BoardView, CellView } from '../../shared/types';
import { audio } from '../audio/engine';
import { useFitTile } from './useFitTile';

type AnimType = 'reveal' | 'flagOn' | 'flagOff' | 'explode' | 'explodeBig';
interface AnimEntry { type: AnimType; id: number; delay: number; }

const ANIM_CLASS: Record<AnimType, string> = {
  reveal: 'tile-reveal',
  flagOn: 'tile-flag-on',
  flagOff: 'tile-flag-off',
  explode: 'tile-explode',
  explodeBig: 'tile-explode-big',
};

const TILE_PX: Record<TileSize, number> = { sm: 28, md: 38, lg: 46 };

function vibrate(ms: number): void {
  const nav = navigator as Navigator & { vibrate?: (n: number) => boolean };
  try { nav.vibrate?.(ms); } catch { /* ignore */ }
}

export interface GameBoardProps {
  view: BoardView;
  size: TileSize;
  interactive: boolean;
  onCell: (r: number, c: number) => void;
  onCellContext: (r: number, c: number) => void;
  /** Changes on every new game/match so the diff baseline resets without animating. */
  gameKey: string | number;
  finished: boolean;
  outcome?: 'win' | 'lose' | null;
  onSequenceDone?: () => void;
}

function toTile(cell: CellView): { state: TileState; value?: number; owner?: Owner } {
  switch (cell.s) {
    case 'hidden': return { state: 'hidden', owner: cell.by ?? null };
    case 'flagged': return { state: 'flagged', owner: cell.by ?? null };
    case 'revealed': return { state: 'revealed', value: cell.v, owner: cell.by ?? null };
    case 'mine': return { state: 'mine' };
    case 'exploded': return { state: 'exploded' };
  }
}

export function GameBoard({
  view, size, interactive, onCell, onCellContext, gameKey, finished, outcome, onSequenceDone,
}: GameBoardProps) {
  const cols = view[0]?.length || 0;
  const [fitRef, tilePx] = useFitTile(cols, TILE_PX[size] ?? 38, { minPx: 18 });

  const [anims, setAnims] = useState<Record<string, AnimEntry>>({});
  const [seqStep, setSeqStep] = useState(-1);
  const [shake, setShake] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [cursor, setCursor] = useState({ r: 0, c: 0 }); // keyboard cursor

  const prevRef = useRef<BoardView | null>(null);
  const prevKeyRef = useRef(gameKey);
  const idRef = useRef(0);
  const mineIndexRef = useRef<Map<string, number>>(new Map());
  const seqRanForRef = useRef<string | number | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Touch state for tap vs. long-press (flag) handling.
  const pressRef = useRef<{ r: number; c: number; x: number; y: number; moved: boolean; handled: boolean } | null>(null);
  const longTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchRef = useRef(0);

  const addTimer = (fn: () => void, ms: number) => { timersRef.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  /** Queue a batch of cell animations with ONE state update and ONE cleanup
      timer — a big flood fill animates hundreds of cells at once, and doing
      this per cell would mean O(n²) object copies plus n timers. */
  const pushAnims = (entries: Array<[key: string, type: AnimType, delay?: number]>, cleanup = true) => {
    if (!entries.length) return;
    const add: Record<string, AnimEntry> = {};
    let maxDelay = 0;
    for (const [key, type, delay = 0] of entries) {
      add[key] = { type, id: ++idRef.current, delay };
      if (delay > maxDelay) maxDelay = delay;
    }
    setAnims((p) => ({ ...p, ...add }));
    // Cascade explosions skip cleanup (board is frozen until reset).
    if (cleanup) {
      addTimer(() => setAnims((p) => {
        const n = { ...p };
        for (const k of Object.keys(add)) delete n[k];
        return n;
      }), 600 + maxDelay * 1000);
    }
  };

  // Reset everything when a new game/match starts.
  useEffect(() => {
    clearTimers();
    setAnims({});
    setSeqStep(-1);
    setShake(false);
    setCelebrate(false);
    setCursor({ r: 0, c: 0 });
    mineIndexRef.current = new Map();
    seqRanForRef.current = null;
    prevRef.current = null;
    prevKeyRef.current = gameKey;
  }, [gameKey]);

  // Diff the board on every change → micro-animations + SFX (skipped during the end sequence).
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = view;
    if (!prev || prevKeyRef.current !== gameKey) { prevKeyRef.current = gameKey; return; }
    if (finished) return;

    const revealed: Array<[number, number]> = [];
    const entries: Array<[string, AnimType, number?]> = [];
    let flagOn = 0, flagOff = 0;
    for (let r = 0; r < view.length; r++) {
      for (let c = 0; c < view[r].length; c++) {
        const a = prev[r]?.[c]; const b = view[r][c];
        if (!a) continue;
        if (a.s !== 'revealed' && b.s === 'revealed') revealed.push([r, c]);
        else if (a.s !== 'flagged' && b.s === 'flagged') { entries.push([`${r}-${c}`, 'flagOn']); flagOn++; }
        else if (a.s === 'flagged' && b.s === 'hidden') { entries.push([`${r}-${c}`, 'flagOff']); flagOff++; }
      }
    }
    if (revealed.length) {
      const oy = revealed.reduce((s, [r]) => s + r, 0) / revealed.length;
      const ox = revealed.reduce((s, [, c]) => s + c, 0) / revealed.length;
      for (const [r, c] of revealed) {
        const d = Math.hypot(r - oy, c - ox);
        entries.push([`${r}-${c}`, 'reveal', Math.min(0.32, d * 0.018)]);
      }
    }
    pushAnims(entries);
    if (flagOn) audio.play('flagOn');
    if (flagOff) audio.play('flagOff');
    if (revealed.length === 1) audio.play('reveal');
    else if (revealed.length > 1) audio.play('open', revealed.length);
  }, [view, gameKey, finished]);

  // End-of-game sequence: cascading explosions (lose) or celebration (win).
  useEffect(() => {
    if (!finished || !outcome) return;
    if (seqRanForRef.current === gameKey) return;
    seqRanForRef.current = gameKey;

    if (outcome === 'win') {
      audio.play('win');
      setCelebrate(true);
      addTimer(() => onSequenceDone?.(), 1300);
      return;
    }

    // Lose: order mines by distance from the detonated one, then cascade.
    let exploded: [number, number] | null = null;
    const mines: Array<[number, number]> = [];
    for (let r = 0; r < view.length; r++) {
      for (let c = 0; c < view[r].length; c++) {
        const s = view[r][c].s;
        if (s === 'exploded') exploded = [r, c];
        else if (s === 'mine') mines.push([r, c]);
      }
    }
    const origin = exploded ?? mines[0] ?? [0, 0];
    mines.sort((a, b) => Math.hypot(a[0] - origin[0], a[1] - origin[1]) - Math.hypot(b[0] - origin[0], b[1] - origin[1]));
    const idx = new Map<string, number>();
    mines.forEach(([r, c], i) => idx.set(`${r}-${c}`, i));
    mineIndexRef.current = idx;

    audio.play('bigExplode');
    setShake(true);
    addTimer(() => setShake(false), 520);
    if (exploded) pushAnims([[`${exploded[0]}-${exploded[1]}`, 'explodeBig']]);
    setSeqStep(0);

    // Detonate in capped batches: total time stays ~≤2.2s and the number of
    // timers stays bounded regardless of how many mines the board has.
    const total = mines.length;
    const SPAN = Math.min(2200, Math.max(700, total * 16));
    const TICK = 33;
    const ticks = Math.max(1, Math.ceil(SPAN / TICK));
    const perTick = Math.max(1, Math.ceil(total / ticks));
    let i = 0;
    const interval = setInterval(() => {
      const start = i;
      const end = Math.min(total, i + perTick);
      const batch: Array<[string, AnimType, number?]> = [];
      for (; i < end; i++) batch.push([`${mines[i][0]}-${mines[i][1]}`, 'explode']);
      pushAnims(batch, false);
      if (end > start) audio.play('explode');
      setSeqStep(i);
      if (i >= total) {
        clearInterval(interval);
        addTimer(() => onSequenceDone?.(), 700);
      }
    }, TICK);
    timersRef.current.push(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, outcome, gameKey]);

  useEffect(() => () => clearTimers(), []);

  // During a loss, hide mines that haven't detonated yet so they cascade in.
  const display = useMemo<BoardView>(() => {
    if (!finished || outcome !== 'lose') return view;
    const idx = mineIndexRef.current;
    return view.map((row, r) => row.map((cell, c): CellView => {
      if (cell.s === 'exploded') return cell;
      if (cell.s === 'mine') {
        const i = idx.get(`${r}-${c}`);
        return i != null && i < seqStep ? cell : { s: 'hidden' };
      }
      return cell;
    }));
  }, [view, finished, outcome, seqStep]);

  /* ---- Input: events are delegated to the grid container (one handler for
     the whole board instead of a closure per tile, so memoized tiles only
     re-render when their cell actually changes). ---- */
  const cellFromTarget = (target: EventTarget | null): { r: number; c: number } | null => {
    const btn = (target as HTMLElement | null)?.closest?.('button[data-cell]') as HTMLElement | null;
    const cell = btn?.dataset.cell;
    if (!cell) return null;
    const [r, c] = cell.split('-').map(Number);
    return { r, c };
  };

  const onGridClick = (e: ReactMouseEvent) => {
    if (!interactive) return;
    if (Date.now() - lastTouchRef.current < 600) return; // touch already handled it
    const cell = cellFromTarget(e.target);
    if (cell) { setCursor(cell); onCell(cell.r, cell.c); }
  };

  const onGridContext = (e: ReactMouseEvent) => {
    e.preventDefault();
    if (!interactive) return;
    const cell = cellFromTarget(e.target);
    if (cell) { setCursor(cell); onCellContext(cell.r, cell.c); }
  };

  /* ---- Keyboard: arrows move a cursor, Enter/Space reveal (or chord), F flags.
     Tiles are tabIndex=-1, so a big board is a single tab stop, not hundreds. ---- */
  const onGridKeyDown = (e: ReactKeyboardEvent) => {
    if (!interactive) return;
    const rows = view.length;
    const ncols = view[0]?.length || 0;
    if (!rows || !ncols) return;
    let { r, c } = cursor;
    switch (e.key) {
      case 'ArrowUp': r = Math.max(0, r - 1); break;
      case 'ArrowDown': r = Math.min(rows - 1, r + 1); break;
      case 'ArrowLeft': c = Math.max(0, c - 1); break;
      case 'ArrowRight': c = Math.min(ncols - 1, c + 1); break;
      case 'Home': c = 0; break;
      case 'End': c = ncols - 1; break;
      case 'Enter':
      case ' ': e.preventDefault(); onCell(cursor.r, cursor.c); return;
      case 'f': case 'F': e.preventDefault(); onCellContext(cursor.r, cursor.c); return;
      default: return;
    }
    e.preventDefault();
    setCursor({ r, c });
  };

  /* ---- Touch: tap to reveal, long-press to flag ---- */
  const cellFromTouch = (e: ReactTouchEvent): { r: number; c: number } | null => cellFromTarget(e.target);
  const onTouchStart = (e: ReactTouchEvent) => {
    if (!interactive) return;
    const cell = cellFromTouch(e);
    if (!cell) return;
    const t = e.touches[0];
    pressRef.current = { r: cell.r, c: cell.c, x: t.clientX, y: t.clientY, moved: false, handled: false };
    if (longTimerRef.current) clearTimeout(longTimerRef.current);
    longTimerRef.current = setTimeout(() => {
      const p = pressRef.current;
      if (p && !p.moved) { p.handled = true; vibrate(18); onCellContext(p.r, p.c); }
    }, 420);
  };
  const onTouchMove = (e: ReactTouchEvent) => {
    const p = pressRef.current;
    if (!p) return;
    const t = e.touches[0];
    if (Math.hypot(t.clientX - p.x, t.clientY - p.y) > 12) {
      p.moved = true;
      if (longTimerRef.current) { clearTimeout(longTimerRef.current); longTimerRef.current = null; }
    }
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
    if (longTimerRef.current) { clearTimeout(longTimerRef.current); longTimerRef.current = null; }
    const p = pressRef.current;
    pressRef.current = null;
    lastTouchRef.current = Date.now();
    if (!interactive || !p || p.moved || p.handled) return;
    e.preventDefault(); // suppress the synthetic click
    onCell(p.r, p.c);
  };

  return (
    <div ref={fitRef} className="board-fit">
      <div
        className={`game-board${shake ? ' board-shake' : ''}${celebrate ? ' board-win' : ''}`}
        style={{
          display: 'inline-block', padding: 'var(--sp-4)', borderRadius: 'var(--r-lg)',
          background: 'var(--surface-1)', border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-lg), inset 0 0 0 1px rgba(25,227,255,0.04)',
        }}
      >
        <div
          className="game-board__grid"
          aria-label="Tablero de buscaminas. Usa las flechas para moverte, Enter para revelar y F para poner bandera."
          aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter F"
          tabIndex={interactive ? 0 : -1}
          onClick={onGridClick}
          onContextMenu={onGridContext}
          onKeyDown={onGridKeyDown}
          // Keep focus on the grid (the single Tab stop), never on an individual
          // tile — otherwise a clicked-then-focused tile's native Enter would
          // fire alongside onKeyDown and double the action.
          onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button[data-cell]')) e.preventDefault(); }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${tilePx}px)`, gap: 'var(--tile-gap)', touchAction: 'manipulation' }}
        >
          {display.flatMap((row, r) =>
            row.map((cell, c) => {
              const t = toTile(cell);
              const anim = anims[`${r}-${c}`];
              return (
                <Tile
                  key={anim ? `${r}-${c}-a${anim.id}` : `${r}-${c}`}
                  state={t.state}
                  value={t.value}
                  owner={t.owner}
                  size={size}
                  sizePx={tilePx}
                  dataCell={`${r}-${c}`}
                  tabIndex={-1}
                  cursor={interactive && cursor.r === r && cursor.c === c}
                  className={anim ? ANIM_CLASS[anim.type] : undefined}
                  style={anim?.delay ? { animationDelay: `${anim.delay}s` } : undefined}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
