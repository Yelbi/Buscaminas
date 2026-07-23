import type { Player } from '../../shared/cuatro';

/* ============================================================
   4 en línea — board themes + disc visuals
   Ported verbatim from the design (clásico / neón / marfil).
   ============================================================ */

export type ThemeId = 'clasico' | 'neon' | 'marfil';

export interface C4Theme {
  id: ThemeId;
  label: string;
  panel: string;
  back: string;
  rim: string;
  rimA: number;
  stand: string;
  pageAlt: string | null;
  neon: boolean;
}

export const THEMES: Record<ThemeId, C4Theme> = {
  clasico: { id: 'clasico', label: 'Clásico', panel: '#1657c2', back: '#0b1c3f', rim: 'rgba(64,120,255,0.35)', rimA: 0.35, stand: '#0f4096', pageAlt: null, neon: false },
  neon: { id: 'neon', label: 'Neón', panel: '#101f45', back: '#04060f', rim: 'rgba(64,120,255,0.7)', rimA: 0.6, stand: '#0c1a3d', pageAlt: 'radial-gradient(900px 500px at 50% -120px, rgba(64,120,255,0.24), transparent 65%), #05070f', neon: true },
  marfil: { id: 'marfil', label: 'Marfil', panel: '#e9dfc8', back: '#a99b76', rim: 'rgba(233,223,200,0.4)', rimA: 0.22, stand: '#c9ba97', pageAlt: 'radial-gradient(900px 500px at 50% -120px, rgba(255,210,63,0.1), transparent 65%), #121d36', neon: false },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const DISC_RED = 'radial-gradient(circle at 35% 30%, #ff8a80, #ff4d4d 55%, #d92f2f 95%)';
export const DISC_YELLOW = 'radial-gradient(circle at 35% 30%, #ffe98c, #ffd23f 55%, #e5ac16 95%)';

export const discBg = (p: Player): string => (p === 1 ? DISC_RED : DISC_YELLOW);
