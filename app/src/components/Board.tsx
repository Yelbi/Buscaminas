import type { CSSProperties, MouseEvent } from 'react';
import { Tile } from './Tile';
import type { Owner, TileSize, TileState } from './Tile';

export interface BoardCell {
  state: TileState;
  value?: number;
  owner?: Owner;
}

export interface BoardProps {
  cells?: BoardCell[][];
  size?: TileSize;
  framed?: boolean;
  /** Explicit tile size in px (overrides the size preset) — used for responsive fit. */
  tilePx?: number;
  onCell?: (r: number, c: number, e: MouseEvent<HTMLButtonElement>) => void;
  onCellContext?: (r: number, c: number, e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
}

/**
 * Board — a grid of Tiles rendered from a 2D cell array.
 * Each cell: { state, value, owner }. Purely presentational.
 */
export function Board({ cells = [], size = 'md', framed = true, tilePx, onCell, onCellContext, style = {} }: BoardProps) {
  const cols = cells[0]?.length || 0;
  const px = tilePx ?? ({ sm: 28, md: 38, lg: 46 }[size] || 38);

  const grid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${px}px)`,
        gap: 'var(--tile-gap)',
      }}
    >
      {cells.flatMap((row, r) =>
        row.map((cell, c) => (
          <Tile
            key={`${r}-${c}`}
            state={cell.state}
            value={cell.value}
            owner={cell.owner}
            size={size}
            sizePx={tilePx}
            onClick={(e) => onCell && onCell(r, c, e)}
            onContextMenu={(e) => { e.preventDefault(); onCellContext && onCellContext(r, c, e); }}
          />
        )),
      )}
    </div>
  );

  if (!framed) return <div style={style}>{grid}</div>;

  return (
    <div
      style={{
        display: 'inline-block',
        padding: 'var(--sp-4)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--surface-1)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-lg), inset 0 0 0 1px rgba(25,227,255,0.04)',
        ...style,
      }}
    >
      {grid}
    </div>
  );
}
