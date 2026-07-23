import type { ReactNode } from 'react';
import { SoundToggles } from './SoundToggles';

export function AppBar({
  onBack,
  onBrandClick,
  right,
}: {
  onBack?: () => void;
  onBrandClick?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="app-bar">
      {onBack && (
        <button type="button" className="app-bar__back" onClick={onBack} aria-label="Volver al menú de GrandGames">
          <span aria-hidden>←</span>
          <span className="app-bar__back-label">Menú</span>
        </button>
      )}
      <button type="button" className="app-bar__brand" onClick={onBrandClick} aria-label="Inicio">
        <span className="app-bar__word">Busca<span style={{ color: 'var(--neon-magenta)' }}>minas</span></span>
      </button>
      <span className="app-bar__spacer" />
      {right}
      <SoundToggles />
    </header>
  );
}
