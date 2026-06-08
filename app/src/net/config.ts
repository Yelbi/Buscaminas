/**
 * Network configuration.
 *
 * - In development, the Vite dev server proxies `/ws` to the local game
 *   server on :8787, so we use a same-origin URL.
 * - In production, the game server lives elsewhere (e.g. Render). Point the
 *   client at it by setting `VITE_WS_URL` at build time, e.g.
 *   `VITE_WS_URL=wss://buscaminas-ws.onrender.com`.
 *
 * If no server is configured in a production build, online multiplayer is
 * disabled in the UI (solo play still works fully offline).
 */
export function wsUrl(): string {
  const env = import.meta.env.VITE_WS_URL;
  if (env) return env.replace(/\/+$/, '');
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  if (import.meta.env.DEV) return `${proto}://${location.host}/ws`;
  return `${proto}://${location.hostname}:8787`;
}

/** Whether co-op / versus are available: always in dev, or when a WS URL is set. */
export const MULTIPLAYER_ENABLED: boolean = import.meta.env.DEV || !!import.meta.env.VITE_WS_URL;
