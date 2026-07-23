import { useState } from 'react';
import type { Player } from '../../shared/cuatro';
import type { C4RoomSnapshot } from '../../shared/protocol';
import { DISC_RED, DISC_YELLOW } from './themes';

const disc = (p: Player) => (p === 1 ? DISC_RED : DISC_YELLOW);

export interface CuatroLobbyProps {
  room: C4RoomSnapshot;
  you: Player;
  onReady: (ready: boolean) => void;
  onStart: () => void;
  onJoinByCode: (code: string) => void;
  onLeave: () => void;
}

export function CuatroLobby({ room, you, onReady, onStart, onJoinByCode, onLeave }: CuatroLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const me = room.players.find((p) => p.slot === you) ?? null;
  const rival = room.players.find((p) => p.slot !== you) ?? null;
  const startEnabled = room.players.length === 2 && room.players.every((p) => p.connected && p.ready);

  const copy = async () => {
    try { await navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* visible anyway */ }
  };

  const readyBadge = (on: boolean) =>
    on
      ? <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3ddc7a', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(61,220,122,0.5)', background: 'rgba(61,220,122,0.1)' }}>Listo</span>
      : <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d90c4', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(125,144,196,0.4)' }}>En espera</span>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, animation: 'c4-screen-in 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center', padding: '8px 0' }}>
        <span style={{ fontFamily: "'Passion One', sans-serif", fontSize: 44, lineHeight: 1, textTransform: 'uppercase' }}>Sala <span style={{ color: '#ffd23f' }}>competitiva</span></span>
        <span style={{ color: '#7d90c4', fontSize: 15 }}>Mejor de {room.bestOf} · comparte el código con tu rival.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 24, borderRadius: 18, background: '#0d1730', border: '1px solid rgba(64,120,255,0.4)' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7d90c4' }}>Código de la sala</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: '1 1 auto', fontFamily: "'Passion One', sans-serif", fontSize: 42, lineHeight: 1, letterSpacing: '0.14em', color: '#ffd23f', padding: '10px 18px', borderRadius: 12, border: '2px dashed rgba(255,210,63,0.5)', textAlign: 'center' }}>{room.code}</span>
          <button type="button" className="c4-ghost" onClick={copy} style={{ height: 44, padding: '0 18px', borderRadius: 11, fontSize: 14 }}>{copied ? '¡Copiado!' : 'Copiar'}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 13, background: '#0a1226', border: `1px solid ${you === 1 ? 'rgba(255,77,77,0.4)' : 'rgba(255,210,63,0.4)'}` }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, background: disc(you), boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.22)' }} />
            <span style={{ flex: 1, fontWeight: 700 }}>Tú</span>
            {readyBadge(!!me?.ready)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 13, background: '#0a1226', border: `1px solid ${you === 1 ? 'rgba(255,210,63,0.35)' : 'rgba(255,77,77,0.35)'}` }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, background: disc(you === 1 ? 2 : 1), boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.22)' }} />
            {rival ? (
              <>
                <span style={{ flex: 1, fontWeight: 700 }}>{rival.name}</span>
                {readyBadge(rival.ready)}
              </>
            ) : (
              <span style={{ flex: 1, color: '#7d90c4', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: '#ffd23f', boxShadow: '0 0 6px #ffd23f', animation: 'c4-blink 1.2s ease-in-out infinite' }} />
                Esperando rival…
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
          <button type="button" className="c4-ready-btn" onClick={() => onReady(!me?.ready)} style={{ flex: '1 1 160px', height: 48, borderRadius: 12, fontSize: 15 }}>{me?.ready ? 'Cancelar listo' : 'Marcar listo'}</button>
          <button type="button" className="c4-cta" disabled={!startEnabled} onClick={onStart} style={{ flex: '1 1 200px', height: 48, borderRadius: 12, fontSize: 21 }}>Empezar partida</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 24px', borderRadius: 18, background: '#0d1730', border: '1px solid rgba(125,144,196,0.25)' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7d90c4' }}>O únete con un código</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input className="c4-input" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} placeholder="CÓDIGO" style={{ flex: '1 1 180px', height: 46, padding: '0 14px', borderRadius: 11, fontFamily: "'Passion One', sans-serif", fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', boxSizing: 'border-box' }} />
          <button type="button" className="c4-join-btn" disabled={joinCode.trim().length !== 5} onClick={() => onJoinByCode(joinCode)} style={{ height: 46, padding: '0 22px', borderRadius: 11, fontSize: 15, opacity: joinCode.trim().length === 5 ? 1 : 0.4 }}>Unirse</button>
        </div>
      </div>

      <button type="button" className="c4-ghost" onClick={onLeave} style={{ alignSelf: 'center', height: 42, padding: '0 20px', borderRadius: 11, fontSize: 13 }}>← Volver al menú</button>
    </div>
  );
}
