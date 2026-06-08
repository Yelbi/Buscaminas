import type { BoardView } from '../../shared/types';

export interface BoardActions {
  reveal: (r: number, c: number) => void;
  flag: (r: number, c: number) => void;
  chord: (r: number, c: number) => void;
}

export interface BoardHandlers {
  onCell: (r: number, c: number) => void;
  onCellContext: (r: number, c: number) => void;
}

/**
 * Unifies input across mouse and touch:
 *  - left click on a hidden cell → reveal
 *  - left click on a satisfied number → chord (reveal neighbors)
 *  - right click → toggle flag
 *  - flag mode on → every left click toggles a flag (mobile-friendly)
 */
export function boardHandlers(view: BoardView, flagMode: boolean, api: BoardActions): BoardHandlers {
  return {
    onCell: (r, c) => {
      const cell = view[r]?.[c];
      if (!cell) return;
      if (flagMode) {
        if (cell.s === 'hidden' || cell.s === 'flagged') api.flag(r, c);
        return;
      }
      if (cell.s === 'revealed' && cell.v > 0) api.chord(r, c);
      else if (cell.s === 'hidden') api.reveal(r, c);
    },
    onCellContext: (r, c) => {
      const cell = view[r]?.[c];
      if (!cell) return;
      if (cell.s === 'hidden' || cell.s === 'flagged') api.flag(r, c);
    },
  };
}
