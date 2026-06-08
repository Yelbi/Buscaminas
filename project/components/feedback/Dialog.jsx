import React from 'react';

/**
 * Dialog — centered modal panel over a blurred scrim. Used for
 * win/lose results, pause menu, room settings. Presentational:
 * render conditionally (open && <Dialog .../>).
 */
export function Dialog({ title, eyebrow = null, tone = 'cyan', children, footer = null, onClose, width = 460, style = {} }) {
  const c = tone === 'magenta' ? 'var(--neon-magenta)'
    : tone === 'lime' ? 'var(--neon-lime)'
    : tone === 'red' ? 'var(--neon-red)'
    : 'var(--neon-cyan)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-5)',
        background: 'rgba(5,5,12,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: width,
          background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
          border: `2px solid color-mix(in srgb, ${c} 50%, transparent)`,
          borderRadius: 'var(--r-xl)',
          boxShadow: `var(--shadow-lg), 0 0 50px color-mix(in srgb, ${c} 28%, transparent)`,
          padding: 'var(--sp-6)',
          ...style,
        }}
      >
        {eyebrow && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xs)', letterSpacing: '0.14em', textTransform: 'uppercase', color: c, marginBottom: 'var(--sp-2)' }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text-hi)', lineHeight: 1.1, textShadow: `0 0 18px color-mix(in srgb, ${c} 40%, transparent)`, marginBottom: 'var(--sp-4)' }}>
            {title}
          </div>
        )}
        <div style={{ color: 'var(--text)', fontSize: 'var(--fs-body)' }}>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)' }}>{footer}</div>}
      </div>
    </div>
  );
}
