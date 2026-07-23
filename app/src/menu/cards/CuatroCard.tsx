import type { CSSProperties } from 'react';

// 4×4 teaser of a Connect Four board. e=empty, r=red, y=yellow, R=red+pulse.
const DISCS = ['e', 'e', 'y', 'e', 'e', 'r', 'y', 'e', 'r', 'y', 'R', 'y', 'y', 'r', 'r', 'y'];

const EMPTY: CSSProperties = { background: '#0a1226', boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.6)' };
const RED: CSSProperties = { background: '#ff4d4d', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)' };
const YELLOW: CSSProperties = { background: '#ffd23f', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)' };

/** GrandGames hub card for 4 en línea (available). "Jugar ahora" launches the game. */
export function CuatroCard({ onPlay }: { onPlay: () => void }) {
  const cell = (k: string): CSSProperties => {
    if (k === 'r') return RED;
    if (k === 'y') return YELLOW;
    if (k === 'R') return { background: '#ff4d4d', animation: 'c4-pulse 2.2s ease-in-out infinite' };
    return EMPTY;
  };

  return (
    <section
      aria-label="4 en línea"
      className="gg-card"
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: 28,
        background: 'radial-gradient(500px 240px at 80% 0%, rgba(64,120,255,0.18), transparent 65%), #0d1730',
        border: '1px solid rgba(64,120,255,0.4)', boxShadow: '0 0 40px rgba(64,120,255,0.1)',
      }}
    >
      <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffd23f', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,210,63,0.5)', background: 'rgba(255,210,63,0.1)' }}>
            <span className="blink" style={{ width: 6, height: 6, borderRadius: 999, background: '#ffd23f', boxShadow: '0 0 6px #ffd23f' }} />
            Nuevo · Disponible
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7d90c4', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(125,144,196,0.4)' }}>2 jugadores</span>
        </div>
        <h2 style={{ fontFamily: "'Passion One', sans-serif", fontWeight: 700, fontSize: 'clamp(38px, 4.2vw, 52px)', lineHeight: 0.9, color: '#eef2ff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
          <span style={{ color: '#ff4d4d' }}>4</span> en <span style={{ color: '#ffd23f' }}>línea</span>
        </h2>
        <p style={{ color: '#7d90c4', fontSize: 15, margin: 0, maxWidth: '40ch' }}>
          Alinea cuatro fichas antes que tu rival. Tres niveles de IA y duelos competitivos en salas privadas.
        </p>
        <button type="button" className="c4-cta" onClick={onPlay} style={{ height: 48, padding: '0 28px', borderRadius: 12, fontSize: 20 }}>Jugar ahora</button>
      </div>

      <div style={{ flex: '0 1 auto', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 34px)', gap: 7, padding: 13, borderRadius: 14, background: '#1657c2', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.35)' }}>
        {DISCS.map((k, i) => (
          <div key={i} style={{ width: 34, height: 34, borderRadius: 999, ...cell(k) }} />
        ))}
      </div>
    </section>
  );
}
