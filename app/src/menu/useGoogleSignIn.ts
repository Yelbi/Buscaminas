import { useCallback, useEffect, useRef, useState } from 'react';
import type { GoogleProfile } from './useProfile';

/**
 * Renders the official Google Identity Services (GIS) button and decodes the
 * returned credential entirely on the client — there is no backend. The GIS
 * script is loaded from index.html and may take a moment to appear, so we poll
 * for it. If it never shows up (e.g. an unauthorized origin like `file://`),
 * `failed` flips true and the caller shows a hint instead.
 */

const DEFAULT_CLIENT_ID = '347026454543-vriql1tegud96512auibr4pnmqg37je4.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID: string =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || DEFAULT_CLIENT_ID;

interface GsiId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
}

function gsi(): GsiId | null {
  const g = (window as unknown as { google?: { accounts?: { id?: GsiId } } }).google;
  return g?.accounts?.id ?? null;
}

/** Stops Google from auto-selecting the last account after a manual sign-out. */
export function disableGoogleAutoSelect(): void {
  try {
    gsi()?.disableAutoSelect();
  } catch {
    /* ignore */
  }
}

/** Decode the `id_token` JWT payload (base64url) without any dependency. */
function decodeCredential(credential: string): GoogleProfile | null {
  try {
    const payload = credential.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const json = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, string>;
    return {
      name: json.name || 'Jugador',
      email: json.email || '',
      picture: json.picture || '',
      sub: json.sub || '',
    };
  } catch {
    return null;
  }
}

export function useGoogleSignIn(options: {
  /** Render the button only while signed out. */
  active: boolean;
  onProfile: (profile: GoogleProfile) => void;
}): { buttonRef: (el: HTMLElement | null) => void; failed: boolean } {
  const { active, onProfile } = options;
  const [failed, setFailed] = useState(false);
  const elRef = useRef<HTMLElement | null>(null);
  const renderedRef = useRef(false);
  const onProfileRef = useRef(onProfile);
  onProfileRef.current = onProfile;

  const tryRender = useCallback(() => {
    const el = elRef.current;
    if (renderedRef.current || !el || !active) return;
    const id = gsi();
    if (!id) return;
    try {
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => {
          const profile = decodeCredential(res.credential);
          if (profile) onProfileRef.current(profile);
        },
        auto_select: false,
      });
      id.renderButton(el, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        locale: 'es',
        width: 240,
      });
      renderedRef.current = true;
    } catch {
      setFailed(true);
    }
  }, [active]);

  useEffect(() => {
    if (!active) {
      renderedRef.current = false;
      return;
    }
    // Re-arm rendering each time we return to the signed-out state.
    renderedRef.current = false;
    setFailed(false);
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      tryRender();
      if (renderedRef.current || tries > 25) {
        clearInterval(timer);
        if (!renderedRef.current) setFailed(true);
      }
    }, 300);
    return () => clearInterval(timer);
  }, [active, tryRender]);

  const buttonRef = useCallback(
    (el: HTMLElement | null) => {
      elRef.current = el;
      tryRender();
    },
    [tryRender],
  );

  return { buttonRef, failed };
}
