import type { CSSProperties } from 'react';

const TILES: { v: string; bg: string; color: string; fs: number; glow?: boolean }[] = [
  { v: '2', bg: '#eee4da', color: '#776e65', fs: 26 },
  { v: '4', bg: '#ede0c8', color: '#776e65', fs: 26 },
  { v: '8', bg: '#f2b179', color: '#fff', fs: 26 },
  { v: '16', bg: '#f59563', color: '#fff', fs: 24, glow: true },
];

/** Coming-soon card — 2048 (cream / Rubik identity). */
export function Game2048Card({ onSoon }: { onSoon: () => void }) {
  const tile = (t: (typeof TILES)[number]): CSSProperties => ({
    height: 62, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Rubik', sans-serif", fontWeight: 800, fontSize: t.fs, background: t.bg, color: t.color,
    boxShadow: t.glow ? '0 0 14px rgba(245,149,99,0.55)' : undefined,
  });

  return (
    <section
      aria-label="2048"
      className="gg-card"
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: 28,
        background: '#faf8ef', border: '1px solid #e6ddc8', color: '#776e65',
      }}
    >
      <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b8956a', padding: '4px 12px', borderRadius: 999, border: '1px solid #d8c9a8', background: '#f2ead8' }}>
            <span className="blink" style={{ width: 6, height: 6, borderRadius: 999, background: '#e8a33d' }} />
            Próximamente
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9c9284', padding: '4px 12px', borderRadius: 999, border: '1px solid #d9d2c2' }}>1 jugador</span>
        </div>
        <h2 style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 4vw, 48px)', lineHeight: 1, color: '#776e65', margin: 0 }}>
          20<span style={{ color: '#e8a33d' }}>48</span>
        </h2>
        <p style={{ color: '#9c9284', fontSize: 15, margin: 0, maxWidth: '40ch', fontWeight: 500 }}>Desliza y suma fichas hasta llegar a 2048.</p>
        <button type="button" className="gg-soon" onClick={onSoon} style={{ fontFamily: "'Rubik', sans-serif", fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10, border: '2px dashed #cbbf9f', color: '#b8956a' }}>En construcción</button>
      </div>
      <div style={{ flex: '0 1 auto', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 62px)', gap: 8, padding: 12, borderRadius: 12, background: '#bbada0' }}>
        {TILES.map((t, i) => <div key={i} style={tile(t)}>{t.v}</div>)}
      </div>
    </section>
  );
}
