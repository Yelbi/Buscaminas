import * as React from 'react';

export interface TileProps {
  /** Cell state. @default "hidden" */
  state?: 'hidden' | 'revealed' | 'flagged' | 'mine' | 'exploded';
  /** Adjacent-mine count, shown when revealed (1–8). */
  value?: number;
  /** Tile size. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Ownership edge for co-op/versus. */
  owner?: null | 'p1' | 'p2';
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/** A single Minesweeper cell — the signature primitive. */
export function Tile(props: TileProps): JSX.Element;
