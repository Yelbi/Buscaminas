import type { PresetId } from '../../shared/types';

/**
 * HTTP base for the leaderboard API (same host as the WebSocket game server).
 * Dev: same-origin '' (Vite proxies /api → :8787). Prod: derived from VITE_WS_URL.
 */
function apiBase(): string {
  const env = import.meta.env.VITE_WS_URL;
  if (env) return env.replace(/^ws/, 'http').replace(/\/+$/, '');
  if (import.meta.env.DEV) return '';
  // Match the page protocol so an https page never tries mixed content.
  const proto = location.protocol === 'https:' ? 'https' : 'http';
  return `${proto}://${location.hostname}:8787`;
}

/** Leaderboard needs the game server: always in dev, or when a WS URL is set. */
export const LEADERBOARD_REACHABLE: boolean = import.meta.env.DEV || !!import.meta.env.VITE_WS_URL;

export interface LbEntry { rank: number; name: string; timeMs: number; date: string | null; }
export interface LbResponse { enabled: boolean; difficulty: PresetId; entries: LbEntry[]; error?: string }

export async function fetchTop(difficulty: PresetId, limit = 20, signal?: AbortSignal): Promise<LbResponse> {
  const res = await fetch(`${apiBase()}/api/leaderboard?difficulty=${difficulty}&limit=${limit}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as LbResponse;
}

export interface SubmitResult { ok: boolean; enabled?: boolean; improved?: boolean; rank?: number | null }

/** Best-effort score submission (never throws). */
export async function submitScore(difficulty: PresetId, name: string, timeMs: number): Promise<SubmitResult> {
  try {
    const res = await fetch(`${apiBase()}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty, name, timeMs }),
    });
    return (await res.json()) as SubmitResult;
  } catch {
    return { ok: false };
  }
}
