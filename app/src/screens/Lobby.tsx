import { useState } from 'react';
import { Badge, Button, PlayerTag } from '../components';
import { MODE_LABELS, resolveSpec } from '../../shared/types';
import type { PlayerSlotId } from '../../shared/types';
import type { RoomSnapshot } from '../../shared/protocol';

const SLOTS: PlayerSlotId[] = ['p1', 'p2'];

export function Lobby({
  room,
  you,
  onReady,
  onStart,
  onLeave,
}: {
  room: RoomSnapshot;
  you: PlayerSlotId | null;
  onReady: (ready: boolean) => void;
  onStart: () => void;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const cfg = resolveSpec(room.difficulty, room.custom);
  const me = room.players.find((p) => p.slot === you) ?? null;
  const everyoneReady = room.players.length === 2 && room.players.every((p) => p.connected && p.ready);
  const tone = room.mode === 'versus' ? 'magenta' : 'lime';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — code is visible anyway */ }
  };

  return (
    <div className="stack pop-in" style={{ gap: 'var(--sp-6)', maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <div className="hero" style={{ paddingBottom: 0 }}>
        <span className="eyebrow">Sala · {MODE_LABELS[room.mode]}</span>
        <h1 className="hero__title" style={{ fontSize: 'var(--fs-h1)' }}>Sala de espera</h1>
        <p className="hero__sub" style={{ fontSize: 'var(--fs-body)' }}>
          Comparte el código para que tu {room.mode === 'versus' ? 'rival' : 'compañero'} se una.
        </p>
      </div>

      {/* Room code */}
      <div className="panel center" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', textAlign: 'center' }}>
        <span className="section-label" style={{ margin: 0 }}>Código de sala</span>
        <button
          type="button"
          onClick={copy}
          title="Copiar código"
          style={{
            background: 'var(--bg-void)', border: '1px solid color-mix(in srgb, var(--neon-cyan) 30%, transparent)',
            borderRadius: 'var(--r-md)', padding: '8px 22px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-counter-lg)', lineHeight: 1,
            letterSpacing: '0.18em', color: 'var(--neon-cyan)', textShadow: 'var(--text-glow-cyan)',
          }}
        >
          {room.code}
        </button>
        <div className="row center" style={{ gap: 'var(--sp-2)' }}>
          <Badge tone={tone}>{MODE_LABELS[room.mode]}</Badge>
          <Badge tone="cyan">{cfg.label}</Badge>
          <Badge tone="neutral">{cfg.rows}×{cfg.cols} · {cfg.mines} minas</Badge>
          <span style={{ fontSize: 'var(--fs-sm)', color: copied ? 'var(--neon-lime)' : 'var(--text-dim)' }}>
            {copied ? '¡Copiado!' : 'Toca el código para copiar'}
          </span>
        </div>
      </div>

      {/* Players */}
      <div className="panel stack" style={{ gap: 'var(--sp-3)' }}>
        <span className="section-label" style={{ margin: 0 }}>Jugadores</span>
        {SLOTS.map((slot) => {
          const p = room.players.find((pp) => pp.slot === slot);
          if (!p) {
            return (
              <div key={slot} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                padding: 'var(--sp-3)', borderRadius: 'var(--r-md)',
                border: '1px dashed var(--line-strong)', color: 'var(--text-dim)',
              }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 'var(--r-sm)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px dashed var(--line-strong)',
                }} aria-hidden>?</span>
                Esperando jugador…
              </div>
            );
          }
          return (
            <div key={slot} className="row" style={{ gap: 'var(--sp-2)' }}>
              <PlayerTag
                name={p.name + (p.slot === you ? ' (tú)' : '')}
                slot={slot}
                ready={p.ready}
                status={p.connected ? 'En la sala' : 'Desconectado'}
                active={p.slot === you}
                style={{ flex: 1 }}
              />
              {p.isHost && <Badge tone="lime">Anfitrión</Badge>}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="row wrap center" style={{ gap: 'var(--sp-3)' }}>
        <Button
          variant={me?.ready ? 'win' : 'primary'}
          onClick={() => onReady(!me?.ready)}
          iconLeft={<span aria-hidden>{me?.ready ? '✓' : '⚑'}</span>}
        >
          {me?.ready ? 'Listo' : 'Marcar listo'}
        </Button>
        {me?.isHost && (
          <Button variant="secondary" disabled={!everyoneReady} onClick={onStart}>
            Empezar partida
          </Button>
        )}
        <Button variant="ghost" onClick={onLeave}>Salir</Button>
      </div>
      {me?.isHost && !everyoneReady && (
        <p className="center" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 'var(--fs-sm)', margin: 0 }}>
          Ambos jugadores deben estar listos para empezar.
        </p>
      )}
      {!me?.isHost && (
        <p className="center" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 'var(--fs-sm)', margin: 0 }}>
          El anfitrión iniciará la partida cuando todos estén listos.
        </p>
      )}
    </div>
  );
}
