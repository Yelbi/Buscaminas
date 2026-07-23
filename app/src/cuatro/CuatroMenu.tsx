import type { CSSProperties } from 'react';
import { THEMES, THEME_IDS, DISC_RED, DISC_YELLOW } from './themes';
import type { ThemeId } from './themes';
import type { AiLevel } from '../../shared/cuatroAI';

export type BestOf = 1 | 3 | 5;

const DIFFS: { id: AiLevel; label: string; color: string; rgb: string; pips: number }[] = [
  { id: 'facil', label: 'Fácil', color: '#ffd23f', rgb: '255,210,63', pips: 1 },
  { id: 'medio', label: 'Medio', color: '#ff8c42', rgb: '255,140,66', pips: 2 },
  { id: 'dificil', label: 'Difícil', color: '#ff4d4d', rgb: '255,77,77', pips: 3 },
];

const PIP_BG: Record<AiLevel, string> = {
  facil: DISC_YELLOW,
  medio: 'radial-gradient(circle at 35% 30%, #ffb37e, #ff8c42 55%, #e06a1e 95%)',
  dificil: DISC_RED,
};

const SECTION: CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7d90c4' };

/** Static decorative board with a red diagonal (menu hero). */
function DemoBoard() {
  const reds = [[0, 3], [1, 2], [2, 1], [3, 0]];
  const yellows = [[1, 3], [2, 3], [2, 2], [3, 3], [3, 2], [3, 1]];
  const disc = (c: number, r: number, bg: string) => (
    <div key={`${c}-${r}`} style={{ position: 'absolute', left: 12 + c * 56 + 6, top: 12 + r * 56 + 6, width: 44, height: 44, borderRadius: 999, background: bg, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.22), inset 0 3px 4px rgba(255,255,255,0.25)' }} />
  );
  return (
    <div style={{ flex: '0 1 auto', margin: '0 auto', position: 'relative', width: 248, height: 248, borderRadius: 18, boxShadow: '0 16px 36px rgba(0,0,0,0.45)' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: '#0b1c3f' }} />
      {yellows.map(([c, r]) => disc(c, r, DISC_YELLOW))}
      {reds.map(([c, r]) => disc(c, r, DISC_RED))}
      <div style={{ position: 'absolute', inset: 0, border: '12px solid #1657c2', borderRadius: 18, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 20px, rgba(0,0,0,0.35) 22px 23px, rgba(0,0,0,0) 24px), radial-gradient(circle at 50% 50%, transparent 0 23px, #1657c2 24px)', backgroundSize: '56px 56px', boxSizing: 'border-box', pointerEvents: 'none', boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.22)' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent 16%)', boxShadow: '0 0 0 1px rgba(64,120,255,0.35)' }} />
    </div>
  );
}

export interface CuatroMenuProps {
  theme: ThemeId;
  onTheme: (t: ThemeId) => void;
  bestOf: BestOf;
  onBestOf: (n: BestOf) => void;
  onPlayBot: (dif: AiLevel) => void;
  onFindDuel: () => void;
}

export function CuatroMenu({ theme, onTheme, bestOf, onBestOf, onPlayBot, onFindDuel }: CuatroMenuProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34, animation: 'c4-screen-in 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 32 }}>
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h1 style={{ fontFamily: "'Passion One', sans-serif", fontWeight: 700, fontSize: 'clamp(64px, 10vw, 118px)', lineHeight: 0.84, margin: 0, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
            <span style={{ color: '#ff4d4d' }}>4</span> en<br /><span style={{ color: '#ffd23f' }}>línea</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={SECTION}>Tema</span>
            {THEME_IDS.map((id) => (
              <button key={id} type="button" onClick={() => onTheme(id)} className={`c4-seg${theme === id ? ' c4-seg--on' : ''}`} style={{ height: 34, padding: '0 14px', borderRadius: 999, fontSize: 13 }}>{THEMES[id].label}</button>
            ))}
          </div>
        </div>
        <DemoBoard />
      </div>

      {/* AI difficulties */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={SECTION}>Juega contra la IA</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {DIFFS.map((d) => (
            <button key={d.id} type="button" onClick={() => onPlayBot(d.id)} className="c4-choice" style={{ ['--c4a' as string]: d.rgb } as CSSProperties}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {Array.from({ length: d.pips }, (_, i) => (
                  <span key={i} style={{ width: 18, height: 18, borderRadius: 999, background: PIP_BG[d.id] }} />
                ))}
              </div>
              <span style={{ fontFamily: "'Passion One', sans-serif", fontSize: 32, lineHeight: 1, textTransform: 'uppercase', color: d.color }}>{d.label}</span>
              <span style={{ marginTop: 4, fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: d.color }}>Jugar →</span>
            </button>
          ))}
        </div>
      </div>

      {/* Online */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={SECTION}>Contra otras personas</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 22, padding: 26, borderRadius: 18, background: 'radial-gradient(560px 240px at 85% 0%, rgba(64,120,255,0.22), transparent 65%), #0d1730', border: '1px solid rgba(64,120,255,0.45)', boxShadow: '0 0 34px rgba(64,120,255,0.1)' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6f9bff', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(111,155,255,0.5)', background: 'rgba(64,120,255,0.12)' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#6f9bff', boxShadow: '0 0 6px #6f9bff', animation: 'c4-blink 1.4s ease-in-out infinite' }} />
              Online
            </span>
            <span style={{ fontFamily: "'Passion One', sans-serif", fontSize: 36, lineHeight: 1, textTransform: 'uppercase', color: '#eef2ff' }}>Competitivo</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 2 }}>
              <span style={{ ...SECTION, fontSize: 11, letterSpacing: '0.08em' }}>Serie:</span>
              {([1, 3, 5] as BestOf[]).map((n) => (
                <button key={n} type="button" onClick={() => onBestOf(n)} className={`c4-seg${bestOf === n ? ' c4-seg--on' : ''}`} style={{ height: 30, padding: '0 14px', borderRadius: 999, fontSize: 12 }}>Mejor de {n}</button>
              ))}
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d90c4', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(125,144,196,0.4)' }}>30 s por turno</span>
            </div>
          </div>
          <button type="button" onClick={onFindDuel} className="c4-cta" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 52, padding: '0 32px', fontSize: 22, borderRadius: 12 }}>Buscar duelo</button>
        </div>
      </div>
    </div>
  );
}
