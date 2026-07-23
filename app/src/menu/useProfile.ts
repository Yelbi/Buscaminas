import { useCallback, useEffect, useState } from 'react';

/**
 * Player identity shared across GrandGames and the games it launches.
 *
 * The name is the single source of truth for the whole suite: it is mirrored
 * to `buscaminas.name` so the existing Buscaminas screens (leaderboard, online
 * rooms) keep working unchanged. An optional Google profile adds an avatar and
 * a stable account id, but is never required — guests play with just a name.
 */

const NAME_KEY = 'grandgames.name';
const PROFILE_KEY = 'grandgames.profile';
const BUSCAMINAS_NAME_KEY = 'buscaminas.name';

export interface GoogleProfile {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

export interface Profile {
  /** Raw editable name — bind this to the text input (may be blank mid-edit). */
  name: string;
  /** Name guaranteed non-empty (falls back to "Jugador") — use for display. */
  displayName: string;
  /** Google account, or null when playing as a guest. */
  google: GoogleProfile | null;
  signedIn: boolean;
  setName: (value: string) => void;
  setGoogle: (profile: GoogleProfile) => void;
  signOut: () => void;
}

function readGoogle(): GoogleProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as GoogleProfile) : null;
  } catch {
    return null;
  }
}

function readName(google: GoogleProfile | null): string {
  try {
    const stored = localStorage.getItem(NAME_KEY) || localStorage.getItem(BUSCAMINAS_NAME_KEY);
    return (stored || (google && google.name) || 'Jugador').trim() || 'Jugador';
  } catch {
    return (google && google.name) || 'Jugador';
  }
}

function persistName(value: string): void {
  try {
    localStorage.setItem(NAME_KEY, value);
    localStorage.setItem(BUSCAMINAS_NAME_KEY, value);
  } catch {
    /* ignore */
  }
}

export function useProfile(): Profile {
  const [google, setGoogleState] = useState<GoogleProfile | null>(readGoogle);
  const [name, setNameState] = useState<string>(() => readName(readGoogle()));

  // Keep the display name mirrored to both keys whenever it changes.
  useEffect(() => {
    persistName(name.trim() || 'Jugador');
  }, [name]);

  const setName = useCallback((value: string) => {
    setNameState(value);
  }, []);

  const setGoogle = useCallback((profile: GoogleProfile) => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
    setGoogleState(profile);
    setNameState(profile.name || 'Jugador');
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* ignore */
    }
    setGoogleState(null);
  }, []);

  return {
    name,
    displayName: name.trim() || 'Jugador',
    google,
    signedIn: !!google,
    setName,
    setGoogle,
    signOut,
  };
}
