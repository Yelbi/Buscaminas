import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Player } from '../../shared/reversi';
import type { RvRoomSnapshot } from '../../shared/protocol';
import { SKINS, SKIN_IDS, discAvatar, discSwatch } from './skins';
import type { SkinId } from './skins';

export interface ReversiLobbyProps {
  room: RvRoomSnapshot;
  you: Player;
  onSetSkin: (skin: SkinId) => void;
  onReady: (ready: boolean) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function ReversiLobby({ room, you, onSetSkin, onReady, onStart, onLeave }: ReversiLobbyProps) {
  const [copied, setCopied] = useState(false);
  const me = room.players.find((p) => p.slot === you) ?? null;
  const opp = room.players.find((p) => p.slot !== you) ?? null;
  const youBlack = you === 'p1';

  const startEnabled = !!me?.isHost && room.players.length === 2 && room.players.every((p) => p.connected && p.ready && p.skin);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — code is visible */ }
  };

  const startBtn: CSSProperties = {
    flex: '0 0 auto', height: 52, padding: '0 34px', borderRadius: 999, fontSize: 16,
    opacity: startEnabled ? 1 : 0.35,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', animation: 'rv-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
      <div style={{ width: 'min(560px,100%)', background: 'linear-gradient(180deg,#211913,#191310)', border: '1px solid rgba(212,175,55,0.28)', borderRadius: 20, padding: 'clamp(24px,4vw,40px)', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.08)', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: -6, top: -30, fontFamily: "'Shippori Mincho',serif", fontSize: 160, lineHeight: 1, color: 'rgba(212,175,55,0.05)', pointerEvents: 'none' }}>戦</span>
        <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.32em', color: '#d4af37', textTransform: 'uppercase' }}>Sala privada · 対戦</div>
        <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 30, fontWeight: 600, color: '#f1e8d6', marginTop: 8 }}>Esperando el duelo</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, background: '#0d0906', border: '1px solid rgba(212,175,55,0.3)', boxShadow: 'inset 0 0 20px rgba(212,175,55,0.06)' }}>
            <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 28, letterSpacing: '0.3em', textIndent: '0.3em', color: '#e8c65a' }}>{room.code}</span>
          </div>
          <button type="button" className="rv-ghost" onClick={copy} style={{ height: 52, padding: '0 20px', borderRadius: 12, fontSize: 14 }}>{copied ? 'Copiado' : 'Copiar'}</button>
        </div>

        {/* Skin picker */}
        <div style={{ marginTop: 24, padding: 16, borderRadius: 14, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(212,175,55,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.26em', color: '#d4af37', textTransform: 'uppercase' }}>Elige tu diseño de ficha</span>
            <span style={{ fontSize: 11, color: '#9a8c72' }}>obligatorio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
            {SKIN_IDS.map((id) => (
              <button key={id} type="button" title={SKINS[id].label} onClick={() => onSetSkin(id)} style={discSwatch(id, me?.skin === id)} />
            ))}
            <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 13, letterSpacing: '0.08em', color: me?.skin ? '#d4af37' : '#6e6250' }}>{me?.skin ? SKINS[me.skin].label : 'Sin elegir'}</span>
          </div>
        </div>

        {/* Players */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(228,208,168,0.12)' }}>
            <span style={discAvatar(me?.skin ?? 'clasica', youBlack, 40)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 16, color: '#f1e8d6' }}>Tú · {youBlack ? 'negras' : 'blancas'}</span>
              <span style={{ fontSize: 12, color: me?.ready ? '#e8c65a' : '#9a8c72' }}>{!me?.skin ? 'Elige tu diseño de ficha' : me?.ready ? 'Listo' : 'Diseño elegido'}</span>
            </div>
            <button
              type="button"
              onClick={() => { if (me?.skin) onReady(!me.ready); }}
              style={{
                marginLeft: 'auto', height: 40, padding: '0 18px', borderRadius: 999, fontSize: 13,
                fontFamily: "'Zen Kaku Gothic New',sans-serif", cursor: me?.skin ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', opacity: me?.skin ? 1 : 0.4,
                background: me?.ready ? 'linear-gradient(180deg,#e8c65a,#c49a2c)' : 'transparent',
                color: me?.ready ? '#241a08' : '#cfc2ab',
                border: me?.ready ? '1px solid #8f6f1d' : '1px solid rgba(228,208,168,0.25)',
                boxShadow: me?.ready ? '0 4px 16px rgba(212,175,55,0.25)' : 'none',
              }}
            >
              {me?.ready ? 'Listo · 準備' : 'Estoy listo'}
            </button>
          </div>

          {opp ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(228,208,168,0.12)', animation: 'rv-fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
              <span style={discAvatar(opp.skin ?? 'aro', !youBlack, 40)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 16, color: '#f1e8d6' }}>{opp.name}</span>
                <span style={{ fontSize: 12, color: opp.ready ? '#e8c65a' : '#9a8c72' }}>
                  {!opp.connected ? 'Desconectado…' : opp.ready ? 'Listo · diseño: ' + (opp.skin ? SKINS[opp.skin].label : '—') : 'Eligiendo diseño…'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, border: '1px dashed rgba(228,208,168,0.2)' }}>
              <span style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#d4af37', animation: 'rv-spin 1s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#9a8c72' }}>Esperando rival… comparte el código</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28 }}>
          {me?.isHost && (
            <button type="button" className="rv-cta" disabled={!startEnabled} onClick={onStart} style={startBtn}>Comenzar duelo</button>
          )}
          {!me?.isHost && (
            <span style={{ flex: 1, fontSize: 13, color: '#9a8c72' }}>El anfitrión iniciará el duelo cuando ambos estén listos.</span>
          )}
          <button type="button" className="rv-ghost" onClick={onLeave} style={{ height: 50, padding: '0 20px', borderRadius: 999, fontSize: 14 }}>‹ Menú</button>
        </div>
      </div>
    </div>
  );
}
