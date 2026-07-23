import type { CSSProperties } from 'react';

const CARD_BASE: CSSProperties = {
  width: 56, height: 74, borderRadius: 10, boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
};
const FACE: CSSProperties = {
  ...CARD_BASE, background: '#ffd3e0', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 24, color: '#d16a92',
};
const BACK: CSSProperties = {
  ...CARD_BASE,
  background: 'linear-gradient(135deg, #4a3a58 25%, #3c2f4a 25% 50%, #4a3a58 50% 75%, #3c2f4a 75%)',
  backgroundSize: '14px 14px', border: '2px solid #5c4a6e',
};

/** Coming-soon card — Memoria (soft / Fredoka identity). */
export function MemoriaCard({ onSoon }: { onSoon: () => void }) {
  return (
    <section
      aria-label="Memoria"
      className="gg-card"
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: 28,
        background: 'radial-gradient(500px 240px at 20% 0%, rgba(255,159,192,0.14), transparent 65%), #261a2c',
        border: '1px solid rgba(255,159,192,0.35)',
      }}
    >
      <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ff9fc0', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,159,192,0.5)' }}>
            <span className="blink" style={{ width: 6, height: 6, borderRadius: 999, background: '#ff9fc0', boxShadow: '0 0 6px #ff9fc0' }} />
            Próximamente
          </span>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a58bb5', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(165,139,181,0.4)' }}>1–2 jugadores</span>
        </div>
        <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(34px, 3.8vw, 46px)', lineHeight: 1, color: '#ffeef5', margin: 0 }}>
          Memo<span style={{ color: '#ff9fc0' }}>ria</span>
        </h2>
        <p style={{ color: '#a58bb5', fontSize: 15, margin: 0, maxWidth: '40ch' }}>Encuentra todas las parejas en el menor tiempo.</p>
        <button type="button" className="gg-soon" onClick={onSoon} style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 999, border: '2px dashed rgba(255,159,192,0.5)', color: '#ff9fc0' }}>En construcción</button>
      </div>
      <div style={{ flex: '0 1 auto', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 6px' }}>
        <div style={{ ...FACE, transform: 'rotate(-8deg)' }}>✿</div>
        <div style={{ ...BACK, transform: 'rotate(-2deg)' }} />
        <div style={{ ...BACK, transform: 'rotate(3deg)' }} />
        <div style={{ ...FACE, transform: 'rotate(9deg)', boxShadow: '0 0 18px rgba(255,159,192,0.45), 0 6px 16px rgba(0,0,0,0.35)' }}>✿</div>
      </div>
    </section>
  );
}
