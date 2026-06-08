import { useEffect, useMemo, useRef, useState } from 'react';
import { Tile } from '../components/Tile';
import type { Owner, TileSize, TileState } from '../components/Tile';
import type { BoardView, CellView } from '../../shared/types';
import { audio } from '../audio/engine';

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
  const tilePx = TILE_PX[size] ?? 38;

  const [anims, setAnims] = useState<Record<string, AnimEntry>>({});
  const [seqStep, setSeqStep] = useState(-1);
  const [shake, setShake] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const prevRef = useRef<BoardView | null>(null);
  const prevKeyRef = useRef(gameKey);
  const idRef = useRef(0);
  const mineIndexRef = useRef<Map<string, number>>(new Map());
  const seqRanForRef = useRef<string | number | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const addTimer = (fn: () => void, ms: number) => { timersRef.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  const pushAnim = (key: string, type: AnimType, delay = 0) => {
    const id = ++idRef.current;
    setAnims((p) => ({ ...p, [key]: { type, id, delay } }));
    addTimer(() => setAnims((p) => { const n = { ...p }; delete n[key]; return n; }), 600 + delay * 1000);
  };

  // Reset everything when a new game/match starts.
  useEffect(() => {
    clearTimers();
    setAnims({});
    setSeqStep(-1);
    setShake(false);
    setCelebrate(false);
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
    let flagOn = 0, flagOff = 0;
    for (let r = 0; r < view.length; r++) {
      for (let c = 0; c < view[r].length; c++) {
        const a = prev[r]?.[c]; const b = view[r][c];
        if (!a) continue;
        if (a.s !== 'revealed' && b.s === 'revealed') revealed.push([r, c]);
        else if (a.s !== 'flagged' && b.s === 'flagged') { pushAnim(`${r}-${c}`, 'flagOn'); flagOn++; }
        else if (a.s === 'flagged' && b.s === 'hidden') { pushAnim(`${r}-${c}`, 'flagOff'); flagOff++; }
      }
    }
    if (revealed.length) {
      const oy = revealed.reduce((s, [r]) => s + r, 0) / revealed.length;
      const ox = revealed.reduce((s, [, c]) => s + c, 0) / revealed.length;
      for (const [r, c] of revealed) {
        const d = Math.hypot(r - oy, c - ox);
        pushAnim(`${r}-${c}`, 'reveal', Math.min(0.32, d * 0.018));
      }
    }
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
    if (exploded) pushAnim(`${exploded[0]}-${exploded[1]}`, 'explodeBig');
    setSeqStep(0);

    const dt = Math.min(80, Math.max(16, Math.round(1700 / Math.max(1, mines.length))));
    const soundEvery = Math.max(1, Math.ceil(mines.length / 14));
    mines.forEach(([r, c], i) => {
      addTimer(() => {
        pushAnim(`${r}-${c}`, 'explode');
        if (i % soundEvery === 0) audio.play('explode');
        setSeqStep(i + 1);
      }, 220 + i * dt);
    });
    addTimer(() => onSequenceDone?.(), 220 + mines.length * dt + 750);
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

  return (
    <div
      className={`game-board${shake ? ' board-shake' : ''}${celebrate ? ' board-win' : ''}`}
      style={{
        display: 'inline-block', padding: 'var(--sp-4)', borderRadius: 'var(--r-lg)',
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-lg), inset 0 0 0 1px rgba(25,227,255,0.04)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${tilePx}px)`, gap: 'var(--tile-gap)' }}>
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
                className={anim ? ANIM_CLASS[anim.type] : undefined}
                style={anim?.delay ? { animationDelay: `${anim.delay}s` } : undefined}
                onClick={interactive ? () => onCell(r, c) : undefined}
                onContextMenu={(e) => { e.preventDefault(); if (interactive) onCellContext(r, c); }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
