import * as React from 'react';

export interface CounterProps {
  /** Numeric value shown (clamped at 0, zero-padded). */
  value?: number;
  /** Number of digits to pad/show. @default 3 */
  digits?: number;
  /** Glow tone. @default "cyan" */
  tone?: 'cyan' | 'magenta' | 'lime' | 'yellow' | 'red';
  /** Optional eyebrow label above the readout. */
  label?: React.ReactNode;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Digital scoreboard readout (mines left, timer, score).
 * @startingPoint section="Game" subtitle="Digital scoreboard counter" viewport="700x180"
 */
export function Counter(props: CounterProps): JSX.Element;
