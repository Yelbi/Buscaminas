import { useState } from 'react';
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'prefix'> {
  label?: ReactNode;
  hint?: ReactNode;
  prefix?: ReactNode;
  tone?: 'cyan' | 'magenta';
  mono?: boolean;
  style?: CSSProperties;
}

/**
 * Input — text field with neon focus ring. Use for room codes,
 * player names, etc. Forwards rest props to the <input>.
 */
export function Input({ label = null, hint = null, prefix = null, tone = 'cyan', mono = false, style = {}, ...rest }: InputProps) {
  const c = tone === 'magenta' ? 'var(--neon-magenta)' : 'var(--neon-cyan)';
  const [focused, setFocused] = useState(false);

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', ...style }}>
      {label && (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>
          {label}
        </span>
      )}
      <span style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        height: 'var(--ctl-md)', padding: '0 14px',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-input)',
        border: `2px solid ${focused ? c : 'var(--line)'}`,
        boxShadow: focused ? `0 0 0 3px color-mix(in srgb, ${c} 30%, transparent)` : 'none',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
      }}>
        {prefix && <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{prefix}</span>}
        <input
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus && rest.onFocus(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur && rest.onBlur(e); }}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            color: 'var(--text-hi)',
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
            fontSize: mono ? '22px' : 'var(--fs-body)',
            letterSpacing: mono ? '0.15em' : 'normal',
          }}
        />
      </span>
      {hint && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-dim)' }}>{hint}</span>}
    </label>
  );
}
