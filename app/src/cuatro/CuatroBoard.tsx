import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { COLS, ROWS, findRow, idx } from '../../shared/cuatro';
import type { Board, Player } from '../../shared/cuatro';
import { discBg } from './themes';
import type { C4Theme } from './themes';
import type { Disc, Result } from './useCuatroGame';

const PAD = 14;
const BASE_SH = 'inset 0 -4px 0 rgba(0,0,0,0.22), inset 0 3px 4px rgba(255,255,255,0.25)';

/** Responsive cell size (same formula as the design). */
export function useC4Cell(): number {
  const calc = () => {
    const w = Math.min(window.innerWidth, 920) - 44 - 28;
    const h = window.innerHeight - 340;
    return Math.max(38, Math.min(86, Math.floor(Math.min(w / COLS, h / ROWS))));
  };
  const [cell, setCell] = useState(calc);
  useEffect(() => {
    const on = () => setCell(calc());
    window.addEventListener('resize', on);
    on();
    return () => window.removeEventListener('resize', on);
  }, []);
  return cell;
}

export const boardWidth = (cell: number): number => cell * COLS + PAD * 2;

export interface CuatroBoardProps {
  cell: number;
  board: Board;
  discs: Disc[];
  result: Result | null;
  theme: C4Theme;
  interactive: boolean;
  /** Local player's colour (for the drop-preview ghost). */
  myPlayer: Player;
  hover: number | null;
  onDrop: (c: number) => void;
  onHover: (c: number | null) => void;
}

export function CuatroBoard({ cell, board, discs, result, theme, interactive, myPlayer, hover, onDrop, onHover }: CuatroBoardProps) {
  const R = Math.round(cell * 0.41);
  const ds = Math.round(cell * 0.78);
  const inset = Math.round((cell - ds) / 2);
  const bw = cell * COLS + PAD * 2;
  const bh = cell * ROWS + PAD * 2;
  const line = result?.line ?? [];
  const lastId = discs.length ? discs[discs.length - 1].id : null;

  const showGhost = interactive && hover != null && findRow(board, hover) >= 0;
  const ghostRow = showGhost ? findRow(board, hover!) : -1;

  const panelBg =
    `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) ${R - 3}px, rgba(0,0,0,${theme.rimA}) ${R - 1}px ${R}px, rgba(0,0,0,0) ${R + 1}px), ` +
    `radial-gradient(circle at 50% 50%, transparent 0 ${R}px, ${theme.panel} ${R + 1}px)`;

  const stand = (side: 'left' | 'right'): CSSProperties => ({
    position: 'absolute', bottom: -12, [side]: -17, width: 36, height: 74, borderRadius: 10,
    background: theme.stand, transform: `rotate(${side === 'left' ? -10 : 10}deg)`, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.3)',
  });

  return (
    <div onMouseLeave={() => onHover(null)} style={{ position: 'relative', width: bw, height: bh, borderRadius: 20, boxShadow: '0 24px 52px rgba(0,0,0,0.5)', marginTop: 14 }}>
      <div style={stand('left')} />
      <div style={stand('right')} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: theme.back }} />

      {showGhost && (
        <div style={{ position: 'absolute', left: PAD + hover! * cell, top: 14, bottom: 14, width: cell, background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))' }} />
      )}

      {discs.map((d) => {
        const isWin = line.includes(idx(d.r, d.c));
        const isLast = d.id === lastId && !result;
        const dur = (0.32 + d.r * 0.055).toFixed(2);
        const style: Record<string, string | number> = {
          position: 'absolute', left: PAD + d.c * cell + inset, top: PAD + d.r * cell + inset, width: ds, height: ds, borderRadius: 999,
          background: discBg(d.p),
          boxShadow: BASE_SH
            + (theme.neon ? `, 0 0 16px ${d.p === 1 ? 'rgba(255,77,77,0.7)' : 'rgba(255,210,63,0.7)'}` : '')
            + (isLast ? ', 0 0 0 3px rgba(255,255,255,0.4)' : ''),
          animation: isWin ? 'c4-winpulse 0.9s ease-in-out infinite' : `c4-drop ${dur}s both`,
          '--dy': `-${PAD + (d.r + 1) * cell + 40}px`,
          opacity: result && line.length && !isWin ? 0.4 : 1,
          transition: 'opacity 0.4s',
        };
        return <div key={d.id} style={style as CSSProperties} />;
      })}

      {showGhost && (
        <div style={{ position: 'absolute', left: PAD + hover! * cell + inset, top: PAD + ghostRow * cell + inset, width: ds, height: ds, borderRadius: 999, background: discBg(myPlayer), animation: 'c4-ghostPulse 0.8s ease-in-out infinite alternate' }} />
      )}

      <div style={{ position: 'absolute', inset: 0, border: `14px solid ${theme.panel}`, borderRadius: 20, backgroundImage: panelBg, backgroundSize: `${cell}px ${cell}px`, boxSizing: 'border-box', pointerEvents: 'none', boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.22)' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(255,255,255,0.14), transparent 15%), linear-gradient(0deg, rgba(0,0,0,0.12), transparent 12%)', boxShadow: `0 0 0 1px ${theme.rim}` }} />

      {showGhost && (
        <div style={{ position: 'absolute', left: PAD + hover! * cell + Math.round(cell / 2) - 9, top: -22, width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `13px solid ${myPlayer === 1 ? '#ff4d4d' : '#ffd23f'}`, filter: 'drop-shadow(0 0 6px rgba(255,77,77,0.6))', animation: 'c4-arrowBob 0.5s ease-in-out infinite alternate' }} />
      )}

      {Array.from({ length: COLS }, (_, c) => {
        const droppable = interactive && findRow(board, c) >= 0;
        return (
          <div
            key={c}
            onClick={droppable ? () => onDrop(c) : undefined}
            onMouseEnter={() => onHover(c)}
            style={{ position: 'absolute', left: PAD + c * cell, top: 0, width: cell, height: '100%', cursor: droppable ? 'pointer' : 'default', zIndex: 5 }}
          />
        );
      })}
    </div>
  );
}
