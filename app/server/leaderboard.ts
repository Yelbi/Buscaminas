/* ============================================================
   Buscaminas — Global leaderboard (Upstash Redis, REST)
   Persistent best-time ranking per preset difficulty. Backed by
   an Upstash Redis database via its REST API (no client lib —
   plain fetch). Configure with env vars:
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN
   When unset, the leaderboard is simply disabled (enabled:false).
   ============================================================ */

import type { PresetId } from '../shared/types';

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const PRESETS: PresetId[] = ['facil', 'medio', 'dificil'];
const MIN_TIME_MS = 500;            // anything faster than this is rejected as bogus
const MAX_TIME_MS = 24 * 60 * 60_000;
const MAX_NAME = 20;

export interface LeaderboardEntry { rank: number; name: string; timeMs: number; date: string | null; }

export function leaderboardEnabled(): boolean {
  return !!(REST_URL && REST_TOKEN);
}

export function isPreset(d: unknown): d is PresetId {
  return typeof d === 'string' && (PRESETS as string[]).includes(d);
}

const key = (d: PresetId) => `lb:${d}`;
const dateKey = (d: PresetId) => `lb:${d}:date`;

/** Run a single Redis command through the Upstash REST endpoint. */
async function redis(cmd: Array<string | number>): Promise<unknown> {
  if (!REST_URL || !REST_TOKEN) throw new Error('leaderboard not configured');
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd.map(String)),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result;
}

/** Strip control chars, collapse whitespace, trim, cap length (names may contain spaces). */
export function sanitizeName(raw: unknown): string {
  const cleaned = String(raw ?? '')
    .split('')
    .filter((ch) => ch.charCodeAt(0) >= 0x20 && ch.charCodeAt(0) !== 0x7f)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME);
  return cleaned || 'Jugador';
}

export interface SubmitResult { ok: boolean; improved: boolean; rank: number | null; }

/** Record a win. Keeps only each name's best (lowest) time. */
export async function submitScore(difficulty: PresetId, nameRaw: unknown, timeMsRaw: unknown): Promise<SubmitResult> {
  const name = sanitizeName(nameRaw);
  const timeMs = Math.round(Number(timeMsRaw));
  if (!Number.isFinite(timeMs) || timeMs < MIN_TIME_MS || timeMs > MAX_TIME_MS) {
    return { ok: false, improved: false, rank: null };
  }
  // ZADD ... LT CH: add new members, update existing only if the new time is lower.
  const changed = Number(await redis(['ZADD', key(difficulty), 'LT', 'CH', timeMs, name]));
  if (changed === 1) {
    await redis(['HSET', dateKey(difficulty), name, new Date().toISOString()]);
  }
  const rankRaw = await redis(['ZRANK', key(difficulty), name]);
  const rank = rankRaw == null ? null : Number(rankRaw) + 1;
  return { ok: true, improved: changed === 1, rank };
}

/** Top N entries (fastest first). */
export async function getTop(difficulty: PresetId, limit = 20): Promise<LeaderboardEntry[]> {
  const lim = Math.min(100, Math.max(1, Math.round(limit)));
  const flat = (await redis(['ZRANGE', key(difficulty), 0, lim - 1, 'WITHSCORES'])) as string[];
  if (!Array.isArray(flat) || flat.length === 0) return [];

  const names: string[] = [];
  const times: number[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    names.push(flat[i]);
    times.push(Number(flat[i + 1]));
  }
  let dates: Array<string | null> = [];
  try {
    dates = (await redis(['HMGET', dateKey(difficulty), ...names])) as Array<string | null>;
  } catch {
    dates = names.map(() => null);
  }
  return names.map((name, i) => ({ rank: i + 1, name, timeMs: times[i], date: dates[i] ?? null }));
}
