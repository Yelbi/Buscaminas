import type { CSSProperties } from 'react';
import { discFace } from '../../reversi/skins';

// 4×4 teaser layout: b=black, w=white, f=flips in a loop, h=hint ring, .=empty.
const LAYOUT = ['w', 'b', 'b', '.', 'b', 'f', 'b', 'h', 'w', 'w', 'b', 'b', '.', 'w', 'w', 'w'];

const CELL: CSSProperties = {
  position: 'relative', width: 44, height: 44, borderRadius: 4,
  background: 'linear-gradient(180deg,#1b130c,#140d08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 0 1px rgba(0,0,0,0.35)',
};

/** GrandGames hub card for Reversi (available). "Jugar ahora" launches the game. */
export function ReversiCard({ onPlay }: { onPlay: () => void }) {
  const faceA = discFace('clasica', true, false);
  const faceB = discFace('clasica', false, true);

  return (
    <section
      aria-label="Reversi"
      className="gg-card"
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: 28,
        background: 'radial-gradient(700px 300px at 12% 0%, rgba(212,175,55,0.14), transparent 65%), radial-gradient(500px 260px at 95% 110%, rgba(199,69,46,0.07), transparent 60%), #120d09',
        border: '1px solid rgba(212,175,55,0.35)', boxShadow: '0 0 40px rgba(212,175,55,0.08)',
      }}
    >
      <span style={{ position: 'absolute', right: 210, top: -40, fontFamily: "'Shippori Mincho',serif", fontSize: 220, lineHeight: 1, color: 'rgba(212,175,55,0.05)', pointerEvents: 'none' }}>逆</span>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(232,198,90,0.5), transparent)', animation: 'rv-coverSheen 4s ease-in-out infinite', pointerEvents: 'none' }} />

      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e8c65a', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(212,175,55,0.5)', background: 'rgba(212,175,55,0.1)' }}>Disponible</span>
          <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9a8c72', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(228,208,168,0.22)' }}>1–2 jugadores</span>
          <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9a8c72', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(228,208,168,0.22)' }}>3 bots · online</span>
        </div>
        <h2 style={{ fontFamily: "'Shippori Mincho',serif", fontWeight: 700, fontSize: 'clamp(38px,5vw,58px)', lineHeight: 1, color: '#f1e8d6', margin: 0, letterSpacing: '0.08em', textShadow: '0 0 22px rgba(212,175,55,0.3)' }}>
          REVER<span style={{ color: '#e8c65a', textShadow: '0 0 22px rgba(212,175,55,0.5)' }}>SI</span>
        </h2>
        <p style={{ color: '#9a8c72', fontSize: 15, margin: 0, maxWidth: '44ch', lineHeight: 1.55 }}>
          Voltea las fichas y domina el tablero. Tres niveles de bot y duelos competitivos en salas privadas — con diseños de ficha para tu estilo.
        </p>
        <button type="button" className="rv-cta" onClick={onPlay} style={{ height: 48, padding: '0 30px', borderRadius: 999, fontSize: 17, letterSpacing: '0.06em' }}>Jugar ahora</button>
      </div>

      <div style={{ flex: '0 1 auto', margin: '0 auto', position: 'relative', padding: 13, borderRadius: 14, background: 'repeating-linear-gradient(104deg, rgba(0,0,0,0.10) 0 2px, transparent 2px 9px), linear-gradient(160deg,#42301c,#2a1b0d 60%,#1c1108)', boxShadow: '0 10px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(232,198,90,0.22), inset 0 0 0 1px rgba(0,0,0,0.55)' }}>
        <div style={{ padding: 6, border: '1px solid rgba(212,175,55,0.32)', borderRadius: 8, background: '#0d0906' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 44px)', gap: 2 }}>
            {LAYOUT.map((k, i) => {
              const hasDisc = k === 'b' || k === 'w' || k === 'f';
              return (
                <div key={i} style={CELL}>
                  {hasDisc && (
                    <span style={{ position: 'absolute', inset: '9%', display: 'block', perspective: '400px', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))' }}>
                      <span style={{
                        position: 'absolute', inset: 0, display: 'block', transformStyle: 'preserve-3d',
                        transform: k === 'w' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        animation: k === 'f' ? 'rv-flipLoop 6s cubic-bezier(0.65,0,0.35,1) infinite' : 'none',
                      }}>
                        <span style={faceA} />
                        <span style={faceB} />
                      </span>
                    </span>
                  )}
                  {k === 'h' && (
                    <span style={{ position: 'absolute', inset: '28%', border: '2px solid rgba(212,175,55,0.5)', borderRadius: '50%', boxShadow: '0 0 10px rgba(212,175,55,0.25)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
