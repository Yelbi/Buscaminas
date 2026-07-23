import { useRef, useState } from 'react';
import './menu.css';
import { Toast } from '../ui/Toast';
import type { Profile } from './useProfile';
import { GrandGamesHeader } from './GrandGamesHeader';
import { ProfileBar } from './ProfileBar';
import { BuscaminasCard } from './cards/BuscaminasCard';
import { ReversiCard } from './cards/ReversiCard';
import { SnakeCard } from './cards/SnakeCard';
import { BloquesCard } from './cards/BloquesCard';
import { Game2048Card } from './cards/Game2048Card';
import { MemoriaCard } from './cards/MemoriaCard';
import { CuatroCard } from './cards/CuatroCard';

/** Show the not-yet-built games as "Próximamente" placeholders. */
const SHOW_SOON = true;

/**
 * GrandGames hub — the app's landing screen. Each game keeps its own visual
 * identity; only Buscaminas is playable today (its card launches the game),
 * the rest are teasers that raise a toast.
 */
export function GrandGamesMenu({
  profile,
  onPlayBuscaminas,
  onPlayReversi,
  onPlayCuatro,
}: {
  profile: Profile;
  onPlayBuscaminas: () => void;
  onPlayReversi: () => void;
  onPlayCuatro: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const notifySoon = (name: string) => setToast(`«${name}» llegará pronto.`);
  const goProfile = () => {
    const el = profileRef.current;
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
    }
  };

  return (
    <div className="gg-menu">
      <GrandGamesHeader profile={profile} onSignIn={goProfile} />

      <main className="gg-main">
        <div className="gg-hero">
          <h1 className="gg-hero__title">Elige tu <span className="accent">juego</span></h1>
          <p className="gg-hero__sub">
            Una sala, muchos mundos: cada juego tiene su propio estilo y su propia clasificación dentro.
          </p>
        </div>

        <ProfileBar ref={profileRef} profile={profile} />

        <div className="gg-grid">
          <BuscaminasCard onPlay={onPlayBuscaminas} />
          <ReversiCard onPlay={onPlayReversi} />
          <CuatroCard onPlay={onPlayCuatro} />
          {SHOW_SOON && (
            <>
              <SnakeCard onSoon={() => notifySoon('Snake')} />
              <BloquesCard onSoon={() => notifySoon('Bloques')} />
              <Game2048Card onSoon={() => notifySoon('2048')} />
              <MemoriaCard onSoon={() => notifySoon('Memoria')} />
            </>
          )}
        </div>

        <p className="gg-footer">GrandGames · una sala, muchos mundos</p>
      </main>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} timeout={2600} />}
    </div>
  );
}
