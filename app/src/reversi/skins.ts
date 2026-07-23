import type { CSSProperties } from 'react';
import type { SkinId } from '../../shared/reversi';

/* ============================================================
   Reversi — disc skins (visuals)
   Each skin is a decorative pattern layered over a lacquer disc.
   The same skin renders on both colors (black = your side, white =
   opponent) differing only by base + sheen. Ported verbatim from
   the design so the look matches the prototype exactly.
   The SkinId union + id list live in shared/reversi (the server
   relays them); labels + styling stay here (client-only).
   ============================================================ */

export type { SkinId } from '../../shared/reversi';
export { SKIN_IDS } from '../../shared/reversi';

export const SKINS: Record<SkinId, { label: string }> = {
  clasica: { label: 'Clásica' },
  aro: { label: 'Aro dorado' },
  kamon: { label: 'Kamon' },
  kintsugi: { label: 'Kintsugi' },
  ondas: { label: 'Ondas' },
  sello: { label: 'Sello' },
};

function deco(id: SkinId, black: boolean): string[] {
  const g = black ? 'rgba(226,190,88,0.85)' : 'rgba(128,95,26,0.8)';
  const ga = black ? 'rgba(226,190,88,0.30)' : 'rgba(128,95,26,0.26)';
  switch (id) {
    case 'aro':
      return [`radial-gradient(circle, transparent 56%, ${g} 59%, ${g} 65%, transparent 68%)`];
    case 'kamon':
      return [
        `radial-gradient(circle 4px at 50% 50%, ${g} 0 3px, transparent 4px)`,
        `radial-gradient(circle 4px at 50% 27%, ${g} 0 3px, transparent 4px)`,
        `radial-gradient(circle 4px at 72% 43%, ${g} 0 3px, transparent 4px)`,
        `radial-gradient(circle 4px at 64% 70%, ${g} 0 3px, transparent 4px)`,
        `radial-gradient(circle 4px at 36% 70%, ${g} 0 3px, transparent 4px)`,
        `radial-gradient(circle 4px at 28% 43%, ${g} 0 3px, transparent 4px)`,
      ];
    case 'kintsugi':
      return [
        `linear-gradient(112deg, transparent 46.5%, ${g} 48%, transparent 49.5%)`,
        `linear-gradient(38deg, transparent 62.5%, ${g} 64%, transparent 65.5%)`,
        `linear-gradient(78deg, transparent 29.5%, ${g} 31%, transparent 32.5%)`,
      ];
    case 'ondas':
      return [`repeating-radial-gradient(circle at 50% 50%, transparent 0 5px, ${ga} 5px 6.5px)`];
    case 'sello':
      return [`radial-gradient(circle 7px at 50% 50%, ${black ? '#d95540' : '#c7452e'} 0 5.5px, transparent 7px)`];
    default:
      return [];
  }
}

export function faceBg(id: SkinId, black: boolean): string {
  const sheen = `radial-gradient(ellipse 60% 40% at 35% 22%, rgba(255,255,255,${black ? 0.28 : 0.5}), transparent 60%)`;
  const base = black
    ? 'radial-gradient(circle at 34% 28%, #3d3630, #171310 45%, #0b0908 78%)'
    : 'radial-gradient(circle at 34% 28%, #fffdf6, #f0e6cc 55%, #d6c49c 85%)';
  return [sheen, ...deco(id, black), base].join(', ');
}

function discBox(black: boolean): { border: string; boxShadow: string } {
  return black
    ? { border: '1px solid #3a332c', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.16), inset 0 -4px 7px rgba(0,0,0,0.6)' }
    : { border: '1px solid #b8a67e', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.7), inset 0 -4px 7px rgba(0,0,0,0.25)' };
}

/** One face of a flipping disc (absolute, backface-hidden). */
export function discFace(id: SkinId, black: boolean, isBack: boolean): CSSProperties {
  const box = discBox(black);
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
    background: faceBg(id, black),
    border: box.border,
    boxShadow: box.boxShadow,
  };
}

/** A static disc used as an avatar / score chip. `size` in px. */
export function discAvatar(id: SkinId, black: boolean, size: number): CSSProperties {
  const box = discBox(black);
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-block',
    background: faceBg(id, black),
    border: box.border,
    boxShadow: `0 3px 8px rgba(0,0,0,0.5), ${box.boxShadow}`,
  };
}

/** A selectable skin swatch button (always shown black-side). */
export function discSwatch(id: SkinId, selected: boolean): CSSProperties {
  return {
    width: 46,
    height: 46,
    borderRadius: '50%',
    cursor: 'pointer',
    border: 'none',
    padding: 0,
    background: faceBg(id, true),
    boxShadow: selected
      ? '0 0 0 3px #0e0a08, 0 0 0 5px #d4af37, 0 4px 14px rgba(212,175,55,0.35), inset 0 2px 5px rgba(255,255,255,0.16)'
      : '0 0 0 1px rgba(0,0,0,0.6), 0 3px 8px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.16), inset 0 -4px 7px rgba(0,0,0,0.6)',
    transform: selected ? 'scale(1.1)' : 'none',
    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
  };
}

/** Small solid dot for the move-history log. */
export function historyDot(black: boolean): CSSProperties {
  return {
    width: 11,
    height: 11,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-block',
    background: black
      ? 'radial-gradient(circle at 34% 28%, #3d3630, #0b0908 78%)'
      : 'radial-gradient(circle at 34% 28%, #fffdf6, #d6c49c 85%)',
    border: black ? '1px solid #3a332c' : '1px solid #b8a67e',
  };
}
