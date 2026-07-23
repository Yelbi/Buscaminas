import { useState } from 'react';
import { GrandGamesMenu } from './menu/GrandGamesMenu';
import { BuscaminasApp } from './BuscaminasApp';
import { Reversi } from './reversi/Reversi';
import { Cuatro } from './cuatro/Cuatro';
import { useProfile } from './menu/useProfile';

type Screen = 'menu' | 'buscaminas' | 'reversi' | 'cuatro';

/**
 * Top-level router for the GrandGames suite. The menu is the landing screen;
 * launching a game swaps in its own app. Player identity (name + optional
 * Google profile) is owned here and shared with every game.
 */
export default function App() {
  const profile = useProfile();
  const [screen, setScreen] = useState<Screen>('menu');

  if (screen === 'buscaminas') {
    return (
      <BuscaminasApp
        name={profile.name}
        onName={profile.setName}
        onExitToMenu={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'reversi') {
    return <Reversi onExit={() => setScreen('menu')} playerName={profile.displayName} />;
  }

  if (screen === 'cuatro') {
    return <Cuatro onExit={() => setScreen('menu')} playerName={profile.displayName} />;
  }

  return (
    <GrandGamesMenu
      profile={profile}
      onPlayBuscaminas={() => setScreen('buscaminas')}
      onPlayReversi={() => setScreen('reversi')}
      onPlayCuatro={() => setScreen('cuatro')}
    />
  );
}
