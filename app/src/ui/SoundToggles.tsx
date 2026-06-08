import type { ReactNode } from 'react';
import { useSound } from '../audio/useSound';
import { audio } from '../audio/engine';

function IconBtn({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: ReactNode }) {
  const color = on ? 'var(--neon-cyan)' : 'var(--text-dim)';
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={on}
      style={{
        width: 36, height: 36, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--r-sm)', cursor: 'pointer',
        background: on ? 'color-mix(in srgb, var(--neon-cyan) 12%, transparent)' : 'transparent',
        border: `1px solid ${on ? 'color-mix(in srgb, var(--neon-cyan) 40%, transparent)' : 'var(--line)'}`,
        color, filter: on ? 'drop-shadow(0 0 5px var(--neon-cyan))' : 'none',
        transition: 'all var(--dur-base) var(--ease-out)',
      }}
    >
      {children}
    </button>
  );
}

export function SoundToggles() {
  const { music, sfx, toggleMusic, toggleSfx } = useSound();

  return (
    <div className="row" style={{ gap: 'var(--sp-2)' }}>
      <IconBtn on={music} label={music ? 'Música: activada' : 'Música: silenciada'} onClick={toggleMusic}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" fill="currentColor" stroke="none" />
          <circle cx="17" cy="16" r="3" fill="currentColor" stroke="none" />
        </svg>
      </IconBtn>
      <IconBtn
        on={sfx}
        label={sfx ? 'Efectos: activados' : 'Efectos: silenciados'}
        onClick={() => { toggleSfx(); if (!sfx) audio.play('click'); }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="currentColor" />
          {sfx
            ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>
            : <path d="m17 9 5 6m0-6-5 6" />}
        </svg>
      </IconBtn>
    </div>
  );
}
