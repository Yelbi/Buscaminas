import * as React from 'react';

export type SegmentedOption = string | { value: string; label: React.ReactNode };

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange?: (value: string) => void;
  /** Selected-segment tone. @default "cyan" */
  tone?: 'cyan' | 'magenta' | 'lime';
  style?: React.CSSProperties;
}

/** Pill segmented control for small exclusive choices (difficulty, board size). */
export function Segmented(props: SegmentedProps): JSX.Element;
