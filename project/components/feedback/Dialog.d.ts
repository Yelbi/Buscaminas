import * as React from 'react';

export interface DialogProps {
  title?: React.ReactNode;
  /** Small uppercase label above the title. */
  eyebrow?: React.ReactNode;
  /** Accent tone — cyan (default), magenta, lime (win), red (lose). */
  tone?: 'cyan' | 'magenta' | 'lime' | 'red';
  children?: React.ReactNode;
  /** Footer node — usually action Buttons. */
  footer?: React.ReactNode;
  onClose?: () => void;
  /** Max width in px. @default 460 */
  width?: number;
  style?: React.CSSProperties;
}

/** Centered modal over a blurred scrim — results, pause, settings. */
export function Dialog(props: DialogProps): JSX.Element;
