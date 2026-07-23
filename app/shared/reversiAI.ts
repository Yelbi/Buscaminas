/* ============================================================
   Reversi — Bot opponents (pure)
   Three levels, matching the design's "Novato / Adepto / Maestro".
   Kept pure so both the solo hook and (potential) server-side bots
   can reuse it. No lookahead — heuristics only, which is plenty for
   a casual bot and stays instant.
   ============================================================ */

import type { Board, Player } from './reversi';
import { flips, validMoves } from './reversi';

export type AiLevel = 'facil' | 'normal' | 'dificil';

const CORNERS = new Set([0, 7, 56, 63]);

/**
 * Classic positional weights: corners are gold, the squares next to them (C/X
 * squares) are traps that hand the corner to the opponent. Used by the hard bot.
 */
const WEIGHTS: readonly number[] = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
];

const randOf = <T>(arr: T[]): T => arr[(Math.random() * arr.length) | 0];

/**
 * Pick a move for the bot, or null if it has none (caller then passes).
 *  - facil:   near-random (any legal move).
 *  - normal:  random among the better half (by corners, then flips).
 *  - dificil: greedy on positional weight, then corners, then flips.
 */
export function pickMove(board: Board, p: Player, level: AiLevel): number | null {
  const moves = validMoves(board, p);
  if (!moves.length) return null;

  const scored = moves.map((i) => ({
    i,
    flips: flips(board, i, p).length,
    corner: CORNERS.has(i) ? 1 : 0,
    weight: WEIGHTS[i],
  }));

  if (level === 'facil') {
    return randOf(scored).i;
  }

  if (level === 'dificil') {
    scored.sort((a, b) => (b.corner - a.corner) || (b.weight - a.weight) || (b.flips - a.flips));
    return scored[0].i;
  }

  // normal
  scored.sort((a, b) => (b.corner - a.corner) || (b.flips - a.flips));
  const topHalf = scored.slice(0, Math.max(1, Math.ceil(scored.length / 2)));
  return randOf(topHalf).i;
}
