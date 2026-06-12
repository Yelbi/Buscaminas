import { memo } from 'react';
import type { CSSProperties, MouseEvent } from 'react';

export type TileState = 'hidden' | 'revealed' | 'flagged' | 'mine' | 'exploded';
export type TileSize = 'sm' | 'md' | 'lg';
export type Owner = 'p1' | 'p2' | null;

const NUM_COLORS: Record<number, string> = {
  1: 'var(--num-1)', 2: 'var(--num-2)', 3: 'var(--num-3)', 4: 'var(--num-4)',
  5: 'var(--num-5)', 6: 'var(--num-6)', 7: 'var(--num-7)', 8: 'var(--num-8)',
};

export interface TileProps {
  state?: TileState;
  value?: number;
  size?: TileSize;
  /** null | "p1" | "p2" — neon edge for co-op/versus ownership */
  owner?: Owner;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  onContextMenu?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  className?: string;
  /** Explicit tile size in px (overrides the size token) — used for responsive fit. */
  sizePx?: number;
  /** Value for the data-cell attribute (used for touch gesture delegation). */
  dataCell?: string;
}

/**
 * Tile — a single Minesweeper cell. The signature component.
 * Memoized: large boards re-render often (every snapshot/clock tick), and most
 * tiles don't change between renders.
 */
export const Tile = memo(function Tile({
  state = 'hidden',
  value = 0,
  size = 'md',
  owner = null,
  onClick,
  onContextMenu,
  style = {},
  className,
  sizePx,
  dataCell,
}: TileProps) {
  const px = sizePx != null ? `${sizePx}px` : { sm: 'var(--tile-sm)', md: 'var(--tile-md)', lg: 'var(--tile-lg)' }[size];
  const ownerColor = owner === 'p1' ? 'var(--player-1)' : owner === 'p2' ? 'var(--player-2)' : null;

  const isHidden = state === 'hidden' || state === 'flagged';
  const numColor = NUM_COLORS[value];

  let face: CSSProperties = {};
  if (isHidden) {
    face = {
      background: 'linear-gradient(180deg, var(--cell-up-2), var(--cell-up))',
      border: '1px solid var(--line-strong)',
      boxShadow: 'var(--shadow-inset-tile)',
    };
  } else if (state === 'exploded') {
    face = {
      background: 'radial-gradient(circle at 50% 45%, var(--neon-red), #2a0410 80%)',
      border: '1px solid color-mix(in srgb, var(--neon-red) 60%, transparent)',
      boxShadow: '0 0 22px rgba(255,59,92,0.7), inset 0 0 12px rgba(255,59,92,0.5)',
    };
  } else if (state === 'mine') {
    face = {
      background: 'var(--cell-down)',
      border: '1px solid color-mix(in srgb, var(--neon-red) 35%, transparent)',
    };
  } else {
    // revealed empty / numbered
    face = {
      background: 'var(--cell-down)',
      border: '1px solid var(--line-soft)',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
    };
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={className}
      data-cell={dataCell}
      aria-label={
        state === 'flagged' ? 'Casilla con bandera'
          : state === 'hidden' ? 'Casilla oculta'
          : state === 'mine' || state === 'exploded' ? 'Mina'
          : value > 0 ? `Casilla con ${value}` : 'Casilla vacía'
      }
      style={{
        width: px,
        height: px,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        borderRadius: 'var(--r-tile)',
        cursor: isHidden ? 'pointer' : 'default',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: `calc(${px} * 0.5)`,
        lineHeight: 1,
        position: 'relative',
        transition: 'transform var(--dur-fast) var(--ease-snap), filter var(--dur-fast)',
        outline: ownerColor ? `2px solid color-mix(in srgb, ${ownerColor} 70%, transparent)` : 'none',
        outlineOffset: ownerColor ? '-1px' : 0,
        ...face,
        ...style,
      }}
      onMouseEnter={(e) => { if (isHidden) e.currentTarget.style.filter = 'brightness(1.25)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
    >
      {state === 'flagged' && (
        <span style={{ color: 'var(--flag)', filter: 'drop-shadow(0 0 6px var(--flag))', fontSize: `calc(${px} * 0.5)` }}>⚑</span>
      )}
      {(state === 'mine' || state === 'exploded') && (
        <span style={{ color: state === 'exploded' ? '#fff' : 'var(--mine)', filter: 'drop-shadow(0 0 8px var(--mine))', fontSize: `calc(${px} * 0.5)` }}>✸</span>
      )}
      {state === 'revealed' && value > 0 && (
        <span style={{ color: numColor, textShadow: `0 0 10px color-mix(in srgb, ${numColor} 55%, transparent)` }}>{value}</span>
      )}
    </button>
  );
});
