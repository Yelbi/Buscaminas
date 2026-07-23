import type { CSSProperties } from 'react';

const RAISED: CSSProperties = {
  width: 42, height: 42, borderRadius: 6,
  background: 'linear-gradient(180deg, #262640, #1d1d30)',
  border: '1px solid rgba(255,255,255,0.18)',
};
const OPEN: CSSProperties = {
  width: 42, height: 42, borderRadius: 6,
  background: '#0e0e18', border: '1px solid rgba(255,255,255,0.06)',
};
const CENTER: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

type Cell =
  | { k: 'raised' }
  | { k: 'open' }
  | { k: 'raised'; icon: string; iconColor: string; glow: number; fs: number }
  | { k: 'open'; num: string; color: string; glow: string };

// A coherent 4×4 snapshot: mines at (0,0) (1,2) (2,3) (3,1) are all flagged,
// and every revealed number equals its count of adjacent mines.
//   ⚑ 2 1 ▢
//   1 2 ⚑ 2
//   ▢ 2 3 ⚑
//   1 ⚑ 2 1
const FLAG = { k: 'raised', icon: '⚑', iconColor: '#ffe14d', glow: 6, fs: 20 } as const;
const N1 = { k: 'open', num: '1', color: '#19e3ff', glow: 'rgba(25,227,255,0.55)' } as const;
const N2 = { k: 'open', num: '2', color: '#9dff3d', glow: 'rgba(157,255,61,0.55)' } as const;
const N3 = { k: 'open', num: '3', color: '#ff3b5c', glow: 'rgba(255,59,92,0.55)' } as const;
const COVER = { k: 'raised' } as const;

const CELLS: Cell[] = [
  FLAG, N2, N1, COVER,
  N1, N2, FLAG, N2,
  COVER, N2, N3, FLAG,
  N1, FLAG, N2, N1,
];

function MinesweeperMini() {
  return (
    <div style={{
      flex: '0 1 auto', margin: '0 auto', position: 'relative',
      display: 'grid', gridTemplateColumns: 'repeat(4, 42px)', gap: 4, padding: 14,
      borderRadius: 14, background: '#12121f', border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {CELLS.map((c, i) => {
        if (c.k === 'raised' && 'icon' in c) {
          return (
            <div key={i} style={{ ...RAISED, ...CENTER }}>
              <span style={{ color: c.iconColor, filter: `drop-shadow(0 0 ${c.glow}px ${c.iconColor})`, fontSize: c.fs }}>{c.icon}</span>
            </div>
          );
        }
        if (c.k === 'open' && 'num' in c) {
          return (
            <div key={i} style={{ ...OPEN, ...CENTER, fontFamily: "'Pixelify Sans', sans-serif", fontWeight: 700, fontSize: 20 }}>
              <span style={{ color: c.color, textShadow: `0 0 10px ${c.glow}` }}>{c.num}</span>
            </div>
          );
        }
        return <div key={i} style={c.k === 'raised' ? RAISED : OPEN} />;
      })}
    </div>
  );
}

/** Featured card — the one playable game. "Jugar ahora" launches Buscaminas. */
export function BuscaminasCard({ onPlay }: { onPlay: () => void }) {
  return (
    <section
      aria-label="Buscaminas"
      className="gg-card"
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: 28,
        background: 'radial-gradient(700px 300px at 15% 0%, rgba(25,227,255,0.12), transparent 65%), #0b0b16',
        border: '1px solid rgba(25,227,255,0.28)', boxShadow: '0 0 40px rgba(25,227,255,0.08)',
      }}
    >
      <div className="gg-scanlines" style={{ background: 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.14) 3px 4px)' }} />
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: "'Pixelify Sans', sans-serif", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#19e3ff', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(25,227,255,0.45)', background: 'rgba(25,227,255,0.1)' }}>Disponible</span>
          <span style={{ fontFamily: "'Pixelify Sans', sans-serif", fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8d90b3', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)' }}>1–2 jugadores</span>
        </div>
        <h2 style={{ fontFamily: "'Pixelify Sans', sans-serif", fontWeight: 700, fontSize: 'clamp(38px, 5vw, 58px)', lineHeight: 1, color: '#f4f5ff', margin: 0, textShadow: '0 0 18px rgba(25,227,255,0.4)' }}>
          Busca<span style={{ color: '#ff2e97', textShadow: '0 0 18px rgba(255,46,151,0.5)' }}>minas</span>
        </h2>
        <p style={{ color: '#8d90b3', fontSize: 15, margin: 0, maxWidth: '44ch' }}>
          Despeja el campo sin pisar una mina. Solitario, infinito, cooperativo y competitivo — con clasificación global dentro del juego.
        </p>
        <button type="button" className="gg-play" onClick={onPlay}>Jugar ahora</button>
      </div>
      <MinesweeperMini />
    </section>
  );
}
