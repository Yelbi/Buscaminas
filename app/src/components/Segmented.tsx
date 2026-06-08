import type { CSSProperties } from 'react';

export type SegmentedTone = 'cyan' | 'magenta' | 'lime';
export type SegmentedOption = string | { value: string; label: string };

export interface SegmentedProps {
  options?: SegmentedOption[];
  value?: string;
  onChange?: (value: string) => void;
  tone?: SegmentedTone;
  style?: CSSProperties;
}

/**
 * Segmented — pill segmented control. Used for difficulty
 * (Fácil / Medio / Difícil) and other small exclusive choices.
 */
export function Segmented({ options = [], value, onChange, tone = 'cyan', style = {} }: SegmentedProps) {
  const c = tone === 'magenta' ? 'var(--neon-magenta)' : tone === 'lime' ? 'var(--neon-lime)' : 'var(--neon-cyan)';
  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        padding: 4,
        gap: 4,
        borderRadius: 'var(--r-pill)',
        background: 'var(--bg-void)',
        border: '1px solid var(--line)',
        ...style,
      }}
    >
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lbl = typeof opt === 'string' ? opt : opt.label;
        const sel = val === value;
        return (
          <button
            key={val}
            type="button"
            role="tab"
            aria-selected={sel}
            onClick={() => onChange && onChange(val)}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '8px 18px',
              borderRadius: 'var(--r-pill)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: sel ? '#07070f' : 'var(--text-mid)',
              background: sel ? c : 'transparent',
              boxShadow: sel ? `0 0 16px color-mix(in srgb, ${c} 55%, transparent)` : 'none',
              transition: 'all var(--dur-base) var(--ease-out)',
            }}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}
