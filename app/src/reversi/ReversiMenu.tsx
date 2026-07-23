import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SKINS, SKIN_IDS, discAvatar, discSwatch } from './skins';
import type { SkinId } from './skins';
import type { AiLevel } from '../../shared/reversiAI';

export type MenuChoice = AiLevel | 'online';

const CHOICES: { id: MenuChoice; kanji: string; eyebrow: string; label: string; online?: boolean }[] = [
  { id: 'facil', kanji: '易', eyebrow: 'BOT · NIVEL 1', label: 'Fácil' },
  { id: 'normal', kanji: '中', eyebrow: 'BOT · NIVEL 2', label: 'Normal' },
  { id: 'dificil', kanji: '難', eyebrow: 'BOT · NIVEL 3', label: 'Difícil' },
  { id: 'online', kanji: '戦', eyebrow: 'ONLINE · SALAS', label: 'Competitivo', online: true },
];

const SECTION_LABEL: CSSProperties = {
  fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.32em',
  color: '#9a8c72', textTransform: 'uppercase', marginBottom: 14,
};

function ring(on: boolean): CSSProperties {
  return {
    position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
    border: '1px solid #d4af37', boxShadow: '0 0 26px rgba(212,175,55,0.22), inset 0 0 18px rgba(212,175,55,0.08)',
    opacity: on ? 1 : 0, transition: 'opacity 0.25s',
  };
}

export interface ReversiMenuProps {
  onStartBot: (mode: AiLevel, skin: SkinId) => void;
  onCreateOnline: (skin: SkinId) => void;
  onJoinOnline: (code: string, skin: SkinId) => void;
  onBack: () => void;
}

export function ReversiMenu({ onStartBot, onCreateOnline, onJoinOnline, onBack }: ReversiMenuProps) {
  const [mode, setMode] = useState<MenuChoice>('facil');
  const [skin, setSkin] = useState<SkinId>('clasica');
  const [code, setCode] = useState('');
  const online = mode === 'online';

  const onCta = () => {
    if (online) onCreateOnline(skin);
    else onStartBot(mode as AiLevel, skin);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(28px,4vw,52px) 24px 44px', animation: 'rv-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both', position: 'relative' }}>
      <button type="button" className="rv-ghost" onClick={onBack} style={{ position: 'absolute', left: 24, top: 24, height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13 }}>‹ GrandGames</button>
      <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.5em', textIndent: '0.5em', color: '#9a8c72', textTransform: 'uppercase' }}>Grand Games</div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '36px 0 22px' }}>
        <div style={{ ...discAvatar('clasica', true, 64), zIndex: 1 }} />
        <div style={{ ...discAvatar('clasica', false, 64), marginLeft: -16 }} />
      </div>

      <h1 style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 'clamp(52px,7vw,84px)', fontWeight: 700, color: '#f1e8d6', margin: 0, lineHeight: 1, letterSpacing: '0.1em', textIndent: '0.1em', textShadow: '0 2px 30px rgba(212,175,55,0.15)' }}>REVERSI</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '30px 0 40px' }}>
        <div style={{ width: 90, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6))' }} />
        <div style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: '#d4af37', boxShadow: '0 0 10px rgba(212,175,55,0.5)' }} />
        <div style={{ width: 90, height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.6), transparent)' }} />
      </div>

      <div style={{ width: 'min(940px,100%)' }}>
        <div style={SECTION_LABEL}>Elige tu desafío</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setMode(c.id)}
              className={`rv-choice${c.online ? ' rv-choice--online' : ''}`}
              style={{
                background: c.online
                  ? 'linear-gradient(180deg, rgba(212,175,55,0.10), rgba(212,175,55,0.02)), linear-gradient(180deg,#211913,#191310)'
                  : 'linear-gradient(180deg,#211913,#191310)',
                border: `1px solid ${c.online ? 'rgba(212,175,55,0.28)' : 'rgba(228,208,168,0.12)'}`,
              }}
            >
              <span style={{ position: 'absolute', right: 0, top: -12, fontFamily: "'Shippori Mincho',serif", fontSize: 88, lineHeight: 1, color: `rgba(212,175,55,${c.online ? 0.11 : 0.08})`, pointerEvents: 'none' }}>{c.kanji}</span>
              <span style={{ fontSize: 11, letterSpacing: '0.18em', color: c.online ? '#d4af37' : '#9a8c72' }}>{c.eyebrow}</span>
              <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 24, fontWeight: 600, color: '#f1e8d6', marginTop: 10 }}>{c.label}</div>
              <span style={ring(mode === c.id)} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: 'min(940px,100%)', marginTop: 34 }}>
        <div style={SECTION_LABEL}>Diseño de fichas</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {SKIN_IDS.map((id) => (
              <button key={id} type="button" title={SKINS[id].label} onClick={() => setSkin(id)} style={discSwatch(id, skin === id)} />
            ))}
          </div>
          <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 14, letterSpacing: '0.1em', color: '#d4af37' }}>{SKINS[skin].label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, border: '1px solid rgba(228,208,168,0.12)', background: 'rgba(0,0,0,0.25)' }}>
            <span style={discAvatar(skin, true, 28)} />
            <span style={{ fontSize: 12, letterSpacing: '0.14em', color: '#9a8c72' }}>CONTRA</span>
            <span style={discAvatar(skin, false, 28)} />
          </div>
        </div>
      </div>

      {online && (
        <div style={{ width: 'min(940px,100%)', marginTop: 26, padding: '18px 20px', borderRadius: 12, border: '1px dashed rgba(212,175,55,0.3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, animation: 'rv-fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
          <span style={{ fontSize: 13, color: '#9a8c72', flex: '1 1 260px' }}>Crea una sala y comparte el código, o únete a la de un amigo.</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
            placeholder="CÓDIGO"
            style={{ width: 130, height: 46, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(228,208,168,0.25)', background: '#0d0906', color: '#e8c65a', fontFamily: "'Shippori Mincho',serif", fontSize: 18, letterSpacing: '0.2em', textAlign: 'center', outline: 'none' }}
          />
          <button type="button" className="rv-ghost" disabled={code.trim().length !== 5} onClick={() => onJoinOnline(code, skin)} style={{ height: 46, padding: '0 22px', borderRadius: 999, fontSize: 15, opacity: code.trim().length === 5 ? 1 : 0.4 }}>Unirse</button>
        </div>
      )}

      <button type="button" className="rv-cta" onClick={onCta} style={{ marginTop: online ? 20 : 44, height: 58, padding: '0 52px', borderRadius: 999, fontSize: 19, letterSpacing: '0.08em' }}>
        {online ? 'Crear sala' : 'Comenzar partida'}
      </button>

      <div style={{ marginTop: 'auto', paddingTop: 40, fontSize: 11, letterSpacing: '0.24em', color: '#6e6250' }}>GRAND GAMES · REVERSI 一.〇</div>
    </div>
  );
}
