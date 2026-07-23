/* ============================================================
   4 en línea — bot opponents (pure)
   Three levels ported from the design's aiPick: instant win, block
   the opponent's win, center bias, and (on hard) double-threat
   creation with a shallow opponent-reply check. Pure so both the
   solo hook and server-side bots can reuse it.
   ============================================================ */

import { findRow, idx, other, validCols, wouldWin } from './cuatro';
import type { Board, Player } from './cuatro';

export type AiLevel = 'facil' | 'medio' | 'dificil';

const rand = (n: number) => Math.floor(Math.random() * n);

/** Pick a column for `me`. Assumes the board has at least one legal move. */
export function pickMove(b: Board, me: Player, level: AiLevel): number {
  const opp = other(me);
  const v = validCols(b);
  const wins = v.filter((c) => wouldWin(b, c, me));
  const blocks = v.filter((c) => wouldWin(b, c, opp));

  if (level === 'facil') {
    if (wins.length && Math.random() < 0.5) return wins[0];
    if (blocks.length && Math.random() < 0.35) return blocks[0];
    return v[rand(v.length)];
  }

  // medio + dificil: always take a win, always block.
  if (wins.length) return wins[0];
  if (blocks.length) return blocks[0];

  if (level === 'medio') {
    // Prefer moves that don't hand the opponent an immediate win; bias center.
    const safe = v.filter((c) => {
      const r = findRow(b, c);
      const b2 = b.slice();
      b2[idx(r, c)] = me;
      return !validCols(b2).some((c2) => wouldWin(b2, c2, opp));
    });
    const pool = safe.length ? safe : v;
    let best = pool[0], bs = -1e9;
    for (const c of pool) {
      const s = 4 - Math.abs(3 - c) + Math.random() * 2.5;
      if (s > bs) { bs = s; best = c; }
    }
    return best;
  }

  // dificil: center weight, avoid giving a win, reward own threats (double =
  // strong), and penalise letting the opponent build threats in reply.
  let best: number | null = null, bs = -1e9;
  for (const c of v) {
    const r = findRow(b, c);
    const b2 = b.slice();
    b2[idx(r, c)] = me;
    let s = (4 - Math.abs(3 - c)) * 2 + Math.random();
    const oppWins = validCols(b2).filter((c2) => wouldWin(b2, c2, opp)).length;
    if (oppWins) s -= 1000;
    const myThreats = validCols(b2).filter((c2) => wouldWin(b2, c2, me)).length;
    s += myThreats * 40;
    if (myThreats >= 2) s += 200;
    if (!oppWins) {
      let worst = 0;
      for (const c2 of validCols(b2)) {
        const r2 = findRow(b2, c2);
        const b3 = b2.slice();
        b3[idx(r2, c2)] = opp;
        const t = validCols(b3).filter((c3) => wouldWin(b3, c3, opp)).length;
        if (t > worst) worst = t;
      }
      s -= worst * 30;
    }
    if (s > bs) { bs = s; best = c; }
  }
  return best ?? v[0];
}
