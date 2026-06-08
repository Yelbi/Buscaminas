import type { BoardView } from '../../shared/types';
import type { BoardCell } from '../components';

/** ms → "M:SS" (e.g. 102000 → "1:42"). */
export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
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
