import type { CSSProperties } from 'react';

/** Coming-soon card — Snake (terminal / VT323 identity). */
export function SnakeCard({ onSoon }: { onSoon: () => void }) {
  const seg = (col: number, row: number, extra: CSSProperties = {}): CSSProperties => ({
    gridColumn: col, gridRow: row, borderRadius: 5,
    background: '#3aff6e', boxShadow: '0 0 8px rgba(58,255,110,0.6)', ...extra,
  });

  return (
    <section
      aria-label="Snake"
      className="gg-card"
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: 28,
        background: 'radial-gradient(500px 240px at 20% 0%, rgba(58,255,110,0.1), transparent 65%), #04140a',
        border: '1px solid rgba(58,255,110,0.3)',
      }}
    >
      <div className="gg-scanlines" style={{ background: 'repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.22) 2px 3px)' }} />
      <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'VT323', monospace", fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3aff6e', padding: '3px 12px', borderRadius: 999, border: '1px solid rgba(58,255,110,0.45)' }}>
            <span className="blink" style={{ width: 6, height: 6, borderRadius: 999, background: '#3aff6e', boxShadow: '0 0 6px #3aff6e' }} />
            Próximamente
          </span>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6fae83', padding: '3px 12px', borderRadius: 999, border: '1px solid rgba(111,174,131,0.4)' }}>1 jugador</span>
        </div>
        <h2 style={{ fontFamily: "'VT323', monospace", fontSize: 'clamp(40px, 4vw, 52px)', lineHeight: 0.9, color: '#d8ffe3', margin: 0, textShadow: '0 0 14px rgba(58,255,110,0.55)' }}>SNAKE_</h2>
        <p style={{ color: '#6fae83', margin: 0, maxWidth: '40ch', fontFamily: "'VT323', monospace", fontSize: 19, lineHeight: 1.15 }}>&gt; come, crece y no te muerdas la cola.</p>
        <button type="button" className="gg-soon" onClick={onSoon} style={{ fontFamily: "'VT323', monospace", fontSize: 20, borderRadius: 10, border: '2px dashed rgba(58,255,110,0.5)', color: '#3aff6e' }}>En construcción</button>
      </div>
      <div style={{ flex: '0 1 auto', margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(6, 26px)', gridTemplateRows: 'repeat(4, 26px)', gap: 3, padding: 12, borderRadius: 12, background: '#031008', border: '1px solid rgba(58,255,110,0.25)' }}>
        <div style={seg(1, 3)} />
        <div style={seg(2, 3)} />
        <div style={seg(3, 3)} />
        <div style={seg(3, 2)} />
        <div style={seg(4, 2, { background: '#7dffa0', boxShadow: '0 0 10px rgba(58,255,110,0.8)' })} />
        <div style={{ gridColumn: 6, gridRow: 1, borderRadius: 999, background: '#ff5e5e', boxShadow: '0 0 8px rgba(255,94,94,0.7)', transform: 'scale(0.7)' }} />
      </div>
    </section>
  );
}
