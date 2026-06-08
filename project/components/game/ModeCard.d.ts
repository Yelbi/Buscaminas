import * as React from 'react';

export interface ModeCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  /** Accent tone. @default "cyan" */
  tone?: 'cyan' | 'magenta' | 'lime' | 'purple';
  /** Player-count label, e.g. "1" or "2". @default "1" */
  players?: string;
  /** Selected/active state. */
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/**
 * Large selectable card for choosing a game mode.
 * @startingPoint section="Game" subtitle="Game-mode selection card" viewport="700x260"
 */
export function ModeCard(props: ModeCardProps): JSX.Element;
