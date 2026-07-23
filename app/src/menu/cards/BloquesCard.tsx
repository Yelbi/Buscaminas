import type { CSSProperties } from 'react';

const BLOCKS: { col: number; row: number; bg: string; glow?: boolean }[] = [
  { col: 3, row: 1, bg: '#a85cff', glow: true },
  { col: 2, row: 2, bg: '#a85cff', glow: true },
  { col: 3, row: 2, bg: '#a85cff', glow: true },
  { col: 4, row: 2, bg: '#ffb340' },
  { col: 5, row: 2, bg: '#ffb340' },
  { col: 1, row: 3, bg: '#37d6ff' },
  { col: 2, row: 3, bg: '#37d6ff' },
  { col: 3, row: 3, bg: '#37d6ff' },
  { col: 4, row: 3, bg: '#ffb340' },
  { col: 5, row: 3, bg: '#ffb340' },
  { col: 1, row: 4, bg: '#ff5c7a' },
  { col: 2, row: 4, bg: '#ff5c7a' },
  { col: 3, row: 4, bg: '#52e6a8' },
  { col: 4, row: 4, bg: '#52e6a8' },
  { col: 5, row: 4, bg: '#ff5c7a' },
];

/** Coming-soon card — Bloques (Tetris-like, Archivo Black identity). */
export function BloquesCard({ onSoon }: { onSoon: () => void }) {
  const block = (b: (typeof BLOCKS)[number]): CSSProperties => ({
    gridColumn: b.col, gridRow: b.row, background: b.bg, borderRadius: 4,
    boxShadow: b.glow
      ? 'inset 0 -4px 0 rgba(0,0,0,0.3), 0 0 10px rgba(168,92,255,0.4)'
      : 'inset 0 -4px 0 rgba(0,0,0,0.3)',
  });

  return (
    <section
      aria-label="Bloques"
      className="gg-card"
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: 28,
        background: 'radial-gradient(500px 240px at 80% 0%, rgba(168,92,255,0.16), transparent 65%), #16101f',
        border: '1px solid rgba(168,92,255,0.35)',
      }}
    >
      <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c99aff', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(168,92,255,0.5)' }}>
            <span className="blink" style={{ width: 6, height: 6, borderRadius: 999, background: '#c99aff', boxShadow: '0 0 6px #c99aff' }} />
            Próximamente
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8f7fa6', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(143,127,166,0.4)' }}>1 jugador</span>
        </div>
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(32px, 3.6vw, 44px)', lineHeight: 0.95, color: '#f1e8ff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
          Blo<span style={{ color: '#a85cff' }}>ques</span>
        </h2>
        <p style={{ color: '#8f7fa6', fontSize: 15, margin: 0, maxWidth: '40ch' }}>Encaja las piezas que caen antes de llegar arriba.</p>
        <button type="button" className="gg-soon" onClick={onSoon} style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10, border: '2px dashed rgba(168,92,255,0.5)', color: '#c99aff' }}>En construcción</button>
      </div>
      <div style={{ flex: '0 1 auto', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 30px)', gridTemplateRows: 'repeat(4, 30px)', gap: 3, padding: 12, borderRadius: 12, background: '#0e0a15', border: '1px solid rgba(168,92,255,0.25)', alignContent: 'end' }}>
        {BLOCKS.map((b, i) => <div key={i} style={block(b)} />)}
      </div>
    </section>
  );
}
