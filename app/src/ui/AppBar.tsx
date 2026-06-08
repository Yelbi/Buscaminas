import type { ReactNode } from 'react';

export function AppBar({ onBrandClick, right }: { onBrandClick?: () => void; right?: ReactNode }) {
  return (
    <header className="app-bar">
      <button type="button" className="app-bar__brand" onClick={onBrandClick} aria-label="Inicio">
        <span className="mine-mark" aria-hidden>✸</span>
        Busca<span style={{ color: 'var(--neon-magenta)' }}>minas</span>
      </button>
      <span className="app-bar__spacer" />
      {right}
    </header>
  );
}
