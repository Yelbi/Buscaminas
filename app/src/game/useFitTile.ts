import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface FitOptions {
  gap?: number;       // gap between tiles (px)
  framePad?: number;  // board inner padding per side (px)
  minPx?: number;     // smallest acceptable tile (scroll kicks in below this)
}

/**
 * Measures the width of a full-width container and returns the largest tile
 * size (capped at maxPx) that fits `cols` columns. Falls back to minPx and
 * lets the board scroll horizontally when even that won't fit (e.g. expert on
 * a very narrow phone). Re-measures on resize / orientation change.
 */
export function useFitTile(
  cols: number,
  maxPx: number,
  { gap = 4, framePad = 16, minPx = 16 }: FitOptions = {},
): readonly [RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tilePx = useMemo(() => {
    if (!width || !cols) return maxPx;
    const avail = width - framePad * 2;
    const px = Math.floor((avail - gap * (cols - 1)) / cols);
    return Math.max(minPx, Math.min(maxPx, px));
  }, [width, cols, maxPx, gap, framePad, minPx]);

  return [ref, tilePx] as const;
}
