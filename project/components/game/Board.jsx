import React from 'react';
import { Tile } from './Tile.jsx';

/**
 * Board — a grid of Tiles rendered from a 2D cell array.
 * Each cell: { state, value, owner }. Purely presentational —
 * pass onCell(r, c, e) / onCellContext(r, c, e) to handle input.
 */
export function Board({ cells = [], size = 'md', framed = true, onCell, onCellContext, style = {} }) {
  const cols = cells[0]?.length || 0;
  const tilePx = { sm: 28, md: 38, lg: 46 }[size] || 38;

  const grid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${tilePx}px)`,
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
            onClick={(e) => onCell && onCell(r, c, e)}
            onContextMenu={(e) => { e.preventDefault(); onCellContext && onCellContext(r, c, e); }}
          />
        ))
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
