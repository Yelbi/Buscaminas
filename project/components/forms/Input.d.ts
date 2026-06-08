import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Leading static prefix (e.g. "#" for a room code). */
  prefix?: React.ReactNode;
  /** Focus-ring tone. @default "cyan" */
  tone?: 'cyan' | 'magenta';
  /** Use the mono font, large + tracked (room codes). */
  mono?: boolean;
}

/** Text input with neon focus ring. */
export function Input(props: InputProps): JSX.Element;
