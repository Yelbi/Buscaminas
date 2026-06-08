import { useEffect, useState } from 'react';
import { audio } from './engine';

export interface SoundControls {
  music: boolean;
  sfx: boolean;
  toggleMusic: () => void;
  toggleSfx: () => void;
}

/** Reactive view of the audio engine's on/off state for UI toggles. */
export function useSound(): SoundControls {
  const [state, setState] = useState({ music: audio.musicEnabled, sfx: audio.sfxEnabled });
  useEffect(() => audio.subscribe(() => setState({ music: audio.musicEnabled, sfx: audio.sfxEnabled })), []);
  return {
    music: state.music,
    sfx: state.sfx,
    toggleMusic: () => audio.setMusicEnabled(!audio.musicEnabled),
    toggleSfx: () => audio.setSfxEnabled(!audio.sfxEnabled),
  };
}

/** Starts audio on the first user gesture (browser autoplay policy). */
export function useAudioUnlock(): void {
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
}
