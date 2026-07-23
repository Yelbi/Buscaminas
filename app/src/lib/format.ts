import type { BoardView } from '../../shared/types';
import type { BoardCell } from '../components';

/**
 * ms → "M:SS" (e.g. 102000 → "1:42"), or "M:SS.s" with one decimal when
 * `tenths` is set (e.g. the leaderboard, where sub-second precision matters).
 */
export function formatClock(ms: number, tenths = false): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  if (tenths) {
    const s = totalSec - m * 60;
    return `${m}:${s.toFixed(1).padStart(4, '0')}`;
  }
  const s = Math.floor(totalSec) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** ms → whole seconds, for the scoreboard Counter. */
export function seconds(ms: number): number {
  return Math.floor(ms / 1000);
}

/** Map a render-safe BoardView into Board component cells. */
export function toBoardCells(view: BoardView): BoardCell[][] {
  return view.map((row) =>
    row.map((cell): BoardCell => {
      switch (cell.s) {
        case 'hidden': return { state: 'hidden', owner: cell.by ?? null };
        case 'flagged': return { state: 'flagged', owner: cell.by ?? null };
        case 'revealed': return { state: 'revealed', value: cell.v, owner: cell.by ?? null };
        case 'mine': return { state: 'mine' };
        case 'exploded': return { state: 'exploded' };
      }
    }),
  );
}
