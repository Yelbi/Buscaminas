import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Tile } from '../components/Tile';
import type { Owner, TileState } from '../components/Tile';
import type { BoardView, CellView } from '../../shared/types';
import type { Boom } from './useInfiniteGame';

const GAP = 4;             // separación entre fichas (px) — debe cuadrar con la cámara
const TAP_SLOP_PX = 6;     // movimiento máximo para que un gesto cuente como tap
const PAN_SLOP_PX = 12;    // movimiento que cancela el long-press
const LONG_PRESS_MS = 420;

function vibrate(ms: number): void {
  const nav = navigator as Navigator & { vibrate?: (n: number) => boolean };
  try { nav.vibrate?.(ms); } catch { /* ignore */ }
}

function toTile(cell: CellView): { state: TileState; value?: number; owner?: Owner } {
  switch (cell.s) {
    case 'hidden': return { state: 'hidden' };
    case 'flagged': return { state: 'flagged' };
    case 'revealed': return { state: 'revealed', value: cell.v };
    case 'mine': return { state: 'mine' };
    case 'exploded': return { state: 'exploded' };
  }
}

/** Celda bajo el puntero vía data-cell="r,c" (coordenadas con signo). */
function cellFromTarget(target: EventTarget | null): { r: number; c: number } | null {
  const btn = (target as HTMLElement | null)?.closest?.('button[data-cell]') as HTMLElement | null;
  const cell = btn?.dataset.cell;
  if (!cell) return null;
  const [r, c] = cell.split(',').map(Number);
  if (!Number.isFinite(r) || !Number.isFinite(c)) return null;
  return { r, c };
}

export interface InfiniteBoardProps {
  /** Proyección de la ventana visible del tablero. */
  view: (r0: number, c0: number, rows: number, cols: number) => BoardView;
  /** Cambia con cada mutación → fuerza re-proyección. */
  version: number;
  interactive: boolean;
  onCell: (r: number, c: number) => void;
  onCellContext: (r: number, c: number) => void;
  /** Última mina pisada (animación de explosión + shake). */
  boom: Boom | null;
  /** Cambia en cada partida nueva → recentra la cámara. */
  round: number;
  /** Centro de la partida (primer clic), destino del botón de recentrar. */
  origin: { r: number; c: number } | null;
  /** Texto-guía superpuesto (antes del primer clic). */
  hint?: string | null;
}

interface Press {
  x: number; y: number;
  camX: number; camY: number;
  moved: boolean; handled: boolean;
  r: number | null; c: number | null;
}

/**
 * Viewport virtualizado sobre el tablero infinito: solo se montan las fichas
 * visibles y la cámara se desplaza arrastrando (ratón o táctil) o con la
 * rueda. Tap = revelar, long-press / clic derecho = bandera.
 */
export function InfiniteBoard({
  view, version, interactive, onCell, onCellContext, boom, round, origin, hint,
}: InfiniteBoardProps) {
  void version; // solo fuerza el re-render que re-proyecta `view`

  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cam, setCam] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [shake, setShake] = useState(false);

  const pressRef = useRef<Press | null>(null);
  const longRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(-1);

  // Paso de celda: ficha + separación. Fichas algo menores en pantallas chicas.
  const S = size.w > 0 && size.w < 480 ? 26 : 34;
  const P = S + GAP;

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const centerOn = useCallback((r: number, c: number) => {
    const el = boxRef.current;
    if (!el) return;
    setCam({
      x: c * P + S / 2 - el.clientWidth / 2,
      y: r * P + S / 2 - el.clientHeight / 2,
    });
  }, [P, S]);

  // Cámara centrada en (0,0) al montar y en cada partida nueva.
  useEffect(() => {
    if (!size.w || !size.h) return;
    if (initRef.current === round) return;
    initRef.current = round;
    centerOn(0, 0);
  }, [size.w, size.h, round, centerOn]);

  // Rueda del ratón = desplazar el mapa (listener nativo para poder preventDefault).
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCam((p) => ({ x: p.x + e.deltaX, y: p.y + e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Shake al pisar una mina.
  useEffect(() => {
    if (!boom) return;
    setShake(true);
    const id = setTimeout(() => setShake(false), 520);
    return () => clearTimeout(id);
  }, [boom]);

  /* ---- Gestos: arrastrar = pan, tap = revelar, long-press/click derecho = bandera ---- */

  const clearLongPress = () => {
    if (longRef.current) { clearTimeout(longRef.current); longRef.current = null; }
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return; // el botón derecho va por onContextMenu
    const cell = cellFromTarget(e.target);
    pressRef.current = {
      x: e.clientX, y: e.clientY, camX: cam.x, camY: cam.y,
      moved: false, handled: false, r: cell?.r ?? null, c: cell?.c ?? null,
    };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    clearLongPress();
    if (e.pointerType !== 'mouse' && interactive && cell) {
      longRef.current = setTimeout(() => {
        const p = pressRef.current;
        if (p && !p.moved && p.r != null && p.c != null) {
          p.handled = true;
          vibrate(18);
          onCellContext(p.r, p.c);
        }
      }, LONG_PRESS_MS);
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const p = pressRef.current;
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.moved && Math.hypot(dx, dy) > TAP_SLOP_PX) {
      p.moved = true;
      setPanning(true);
    }
    if (p.moved) {
      if (Math.hypot(dx, dy) > PAN_SLOP_PX) clearLongPress();
      setCam({ x: p.camX - dx, y: p.camY - dy });
    }
  };

  const onPointerEnd = () => {
    clearLongPress();
    const p = pressRef.current;
    pressRef.current = null;
    setPanning(false);
    if (!p || p.moved || p.handled || !interactive) return;
    if (p.r != null && p.c != null) onCell(p.r, p.c);
  };

  const onContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    if (!interactive) return;
    const cell = cellFromTarget(e.target);
    if (cell) onCellContext(cell.r, cell.c);
  };

  /* ---- Proyección de la ventana visible ---- */
  const c0 = Math.floor(cam.x / P);
  const r0 = Math.floor(cam.y / P);
  const cols = size.w ? Math.ceil(size.w / P) + 2 : 0;
  const rows = size.h ? Math.ceil(size.h / P) + 2 : 0;
  const cells = rows && cols ? view(r0, c0, rows, cols) : [];
  const ox = c0 * P - cam.x;
  const oy = r0 * P - cam.y;

  return (
    <div
      ref={boxRef}
      className={`inf-viewport${panning ? ' inf-viewport--panning' : ''}${shake ? ' board-shake' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={() => { clearLongPress(); pressRef.current = null; setPanning(false); }}
      onContextMenu={onContextMenu}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, transform: `translate3d(${ox}px, ${oy}px, 0)`, willChange: 'transform' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${S}px)`, gap: GAP }}>
          {cells.flatMap((row, i) =>
            row.map((cell, j) => {
              const r = r0 + i;
              const c = c0 + j;
              const t = toTile(cell);
              const isBoom = boom != null && boom.r === r && boom.c === c;
              return (
                <Tile
                  key={isBoom ? `${r},${c}-b${boom.id}` : `${r},${c}`}
                  state={t.state}
                  value={t.value}
                  sizePx={S}
                  dataCell={`${r},${c}`}
                  className={isBoom ? 'tile-explode-big' : undefined}
                />
              );
            }),
          )}
        </div>
      </div>

      {hint && (
        <div className="inf-hint">
          <span>{hint}</span>
        </div>
      )}

      <button
        type="button"
        className="inf-recenter"
        title="Volver al inicio"
        aria-label="Volver al inicio"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => { const t = origin ?? { r: 0, c: 0 }; centerOn(t.r, t.c); }}
      >
        ⌖
      </button>
    </div>
  );
}
