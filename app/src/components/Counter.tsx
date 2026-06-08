import type { CSSProperties, ReactNode } from 'react';

export type CounterTone = 'cyan' | 'magenta' | 'lime' | 'yellow' | 'red';

export interface CounterProps {
  value?: number;
  digits?: number;
  tone?: CounterTone;
  label?: ReactNode;
  icon?: ReactNode;
  style?: CSSProperties;
}

const TONES: Record<CounterTone, string> = {
  cyan: 'var(--neon-cyan)',
  magenta: 'var(--neon-magenta)',
  lime: 'var(--neon-lime)',
  yellow: 'var(--neon-yellow)',
  red: 'var(--neon-red)',
};

/**
 * Counter — digital scoreboard readout (mines remaining, timer, score).
 * Renders zero-padded digits in the terminal font with a glowing tone.
 */
export function Counter({ value = 0, digits = 3, tone = 'cyan', label = null, icon = null, style = {} }: CounterProps) {
  const c = TONES[tone] || TONES.cyan;
  const text = String(Math.max(0, value)).padStart(digits, '0').slice(-digits);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', ...style }}>
      {label && (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>
          {label}
        </span>
      )}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: 'var(--r-sm)',
          background: 'var(--bg-void)',
          border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`,
          boxShadow: `inset 0 0 14px color-mix(in srgb, ${c} 12%, transparent)`,
        }}
      >
        {icon && <span style={{ color: c, display: 'inline-flex', filter: `drop-shadow(0 0 6px ${c})` }}>{icon}</span>}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-counter)',
            lineHeight: 1,
            letterSpacing: '0.08em',
            color: c,
            textShadow: `0 0 10px color-mix(in srgb, ${c} 60%, transparent)`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
