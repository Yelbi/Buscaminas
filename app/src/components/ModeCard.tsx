import type { CSSProperties, ReactNode } from 'react';

export type ModeTone = 'cyan' | 'magenta' | 'lime' | 'purple';

export interface ModeCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: ModeTone;
  players?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

const TONES: Record<ModeTone, string> = {
  cyan: 'var(--neon-cyan)',
  magenta: 'var(--neon-magenta)',
  lime: 'var(--neon-lime)',
  purple: 'var(--neon-purple)',
};

/**
 * ModeCard — a large selectable card for the three game modes
 * (solo / co-op / versus). Glows in its accent on hover/active.
 */
export function ModeCard({
  title,
  subtitle,
  icon = null,
  tone = 'cyan',
  players = '1',
  active = false,
  disabled = false,
  badge,
  onClick,
  style = {},
}: ModeCardProps) {
  const c = TONES[tone] || TONES.cyan;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        width: '100%',
        padding: 'var(--sp-5)',
        borderRadius: 'var(--r-lg)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        background: active
          ? `linear-gradient(180deg, color-mix(in srgb, ${c} 14%, var(--surface-2)), var(--surface-1))`
          : 'var(--surface-1)',
        border: `2px solid ${active ? c : 'var(--line)'}`,
        boxShadow: active ? `0 0 28px color-mix(in srgb, ${c} 35%, transparent)` : 'var(--shadow-md)',
        transition: 'all var(--dur-base) var(--ease-out)',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = c;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.5), 0 0 24px color-mix(in srgb, ${c} 30%, transparent)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = active ? c : 'var(--line)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = active ? `0 0 28px color-mix(in srgb, ${c} 35%, transparent)` : 'var(--shadow-md)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          width: 52, height: 52, borderRadius: 'var(--r-md)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: `color-mix(in srgb, ${c} 16%, transparent)`,
          border: `1px solid color-mix(in srgb, ${c} 40%, transparent)`,
          color: c, filter: `drop-shadow(0 0 8px ${c})`,
        }}>
          {icon}
        </span>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xs)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: c, padding: '4px 10px', borderRadius: 'var(--r-pill)',
          border: `1px solid color-mix(in srgb, ${c} 40%, transparent)`,
        }}>
          {badge ?? `${players} ${players === '1' ? 'jugador' : 'jugadores'}`}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--text-hi)', lineHeight: 1.1 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mid)', lineHeight: 1.4 }}>
          {subtitle}
        </div>
      )}
    </button>
  );
}
