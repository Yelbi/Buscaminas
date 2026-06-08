import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color tone. @default "cyan" */
  tone?: 'cyan' | 'magenta' | 'lime' | 'yellow' | 'red' | 'purple' | 'neutral';
  /** Filled background instead of tinted outline. */
  solid?: boolean;
  /** Show a leading status dot. */
  dot?: boolean;
  children?: React.ReactNode;
}

/** Status / label pill. */
export function Badge(props: BadgeProps): JSX.Element;
