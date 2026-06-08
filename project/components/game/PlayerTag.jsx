import React from 'react';

/**
 * PlayerTag — avatar + name + optional status, color-coded by player slot.
 * Used in lobbies, co-op HUDs and versus scoreboards.
 */
export function PlayerTag({ name, slot = 'p1', status = null, score = null, active = false, ready = false, style = {} }) {
  const c = slot === 'p2' ? 'var(--player-2)' : slot === 'host' ? 'var(--neon-lime)' : 'var(--player-1)';
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        padding: 'var(--sp-2) var(--sp-3)',
        borderRadius: 'var(--r-md)',
        background: active ? `color-mix(in srgb, ${c} 12%, var(--surface-1))` : 'var(--surface-1)',
        border: `1px solid ${active ? c : 'var(--line)'}`,
        boxShadow: active ? `0 0 18px color-mix(in srgb, ${c} 30%, transparent)` : 'none',
        transition: 'all var(--dur-base) var(--ease-out)',
        ...style,
      }}
    >
      <span style={{
        width: 40, height: 40, flexShrink: 0,
        borderRadius: 'var(--r-sm)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: `color-mix(in srgb, ${c} 18%, var(--bg-void))`,
        border: `2px solid ${c}`,
        color: c, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
        boxShadow: `0 0 12px color-mix(in srgb, ${c} 45%, transparent)`,
      }}>
        {initial}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-hi)', fontSize: 'var(--fs-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </span>
        {(status || ready) && (
          <span style={{ fontSize: 'var(--fs-xs)', color: ready ? 'var(--neon-lime)' : 'var(--text-mid)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {ready && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--neon-lime)', boxShadow: '0 0 6px var(--neon-lime)' }} />}
            {ready ? 'Listo' : status}
          </span>
        )}
      </div>
      {score != null && (
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-h3)', color: c, textShadow: `0 0 8px color-mix(in srgb, ${c} 50%, transparent)` }}>
          {score}
        </span>
      )}
    </div>
  );
}
