import * as React from 'react';

export interface BoardCell {
  state: 'hidden' | 'revealed' | 'flagged' | 'mine' | 'exploded';
  value?: number;
  owner?: null | 'p1' | 'p2';
}

export interface BoardProps {
  /** 2D array of cells (rows of columns). */
  cells: BoardCell[][];
  /** Tile size. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Wrap the grid in a framed panel. @default true */
  framed?: boolean;
  onCell?: (row: number, col: number, e: React.MouseEvent) => void;
  onCellContext?: (row: number, col: number, e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/**
 * Minesweeper board — a framed grid of Tiles.
 * @startingPoint section="Game" subtitle="Playable board grid" viewport="700x460"
 */
export function Board(props: BoardProps): JSX.Element;
