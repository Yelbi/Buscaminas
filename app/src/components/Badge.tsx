import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type BadgeTone = 'cyan' | 'magenta' | 'lime' | 'yellow' | 'red' | 'purple' | 'neutral';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
  children?: ReactNode;
  tone?: BadgeTone;
  solid?: boolean;
  dot?: boolean;
  style?: CSSProperties;
}

const TONES: Record<BadgeTone, string> = {
  cyan: 'var(--neon-cyan)',
  magenta: 'var(--neon-magenta)',
  lime: 'var(--neon-lime)',
  yellow: 'var(--neon-yellow)',
  red: 'var(--neon-red)',
  purple: 'var(--neon-purple)',
  neutral: 'var(--text-mid)',
};

/**
 * Badge — compact status / label pill with optional neon glow.
 */
export function Badge({ children, tone = 'cyan', solid = false, dot = false, style = {}, ...rest }: BadgeProps) {
  const c = TONES[tone] || TONES.cyan;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '24px',
        padding: '0 10px',
        borderRadius: 'var(--r-pill)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--fs-xs)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: solid ? '#07070f' : c,
        background: solid ? c : `color-mix(in srgb, ${c} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} ${solid ? '0%' : '45%'}, transparent)`,
        boxShadow: solid ? `0 0 14px color-mix(in srgb, ${c} 50%, transparent)` : 'none',
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: 999, background: solid ? '#07070f' : c, boxShadow: solid ? 'none' : `0 0 6px ${c}` }} />
      )}
      {children}
    </span>
  );
}
