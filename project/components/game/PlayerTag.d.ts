import * as React from 'react';

export interface PlayerTagProps {
  name: string;
  /** Player slot → color. @default "p1" */
  slot?: 'p1' | 'p2' | 'host';
  /** Free-text status (overridden by `ready`). */
  status?: React.ReactNode;
  /** Numeric score shown on the right (mono font). */
  score?: number | string | null;
  /** Active/turn highlight. */
  active?: boolean;
  /** Show "Listo" ready state. */
  ready?: boolean;
  style?: React.CSSProperties;
}

/** Player identity chip for lobbies, co-op HUD and versus scoreboards. */
export function PlayerTag(props: PlayerTagProps): JSX.Element;
