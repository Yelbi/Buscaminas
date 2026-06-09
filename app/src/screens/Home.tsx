import { useState } from 'react';
import { Badge, Button, Input, ModeCard, Segmented } from '../components';
import { CUSTOM_LIMITS, DIFFICULTY_ORDER, DIFFICULTIES, resolveSpec } from '../../shared/types';
import type { BoardSpec, DifficultyId, GameMode } from '../../shared/types';

const toInt = (s: string, fallback: number) => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? fallback : n;
};

export function Home({
  name,
  onName,
  difficulty,
  onDifficulty,
  custom,
  onCustom,
  onSolo,
  onCreate,
  onJoin,
  busy,
  multiplayerEnabled,
}: {
  name: string;
  onName: (v: string) => void;
  difficulty: DifficultyId;
  onDifficulty: (d: DifficultyId) => void;
  custom: BoardSpec;
  onCustom: (s: BoardSpec) => void;
  onSolo: () => void;
  onCreate: (mode: Exclude<GameMode, 'solo'>) => void;
  onJoin: (code: string) => void;
  busy: boolean;
  multiplayerEnabled: boolean;
}) {
  const [code, setCode] = useState('');
  const cfg = resolveSpec(difficulty, custom);
  const diffOptions = [
    ...DIFFICULTY_ORDER.map((id) => ({ value: id, label: DIFFICULTIES[id].label })),
    { value: 'custom', label: 'Personalizada' },
  ];
  const maxMines = Math.max(1, cfg.rows * cfg.cols - 1);

  return (
    <div className="stack pop-in" style={{ gap: 'var(--sp-6)' }}>
      <div className="hero">
        <h1 className="hero__title">Busca<span className="accent">minas</span></h1>
        <p className="hero__sub">Despeja el campo sin pisar una mina. Juega en solitario, en equipo o reta a un rival en tiempo real.</p>
      </div>

      {/* Shared settings */}
      <div className="panel stack" style={{ gap: 'var(--sp-5)' }}>
        <div className="row wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--sp-5)' }}>
          <Input
            label="Tu nombre"
            value={name}
            maxLength={20}
            onChange={(e) => onName(e.target.value)}
            style={{ minWidth: 220, flex: '1 1 240px' }}
          />
          <div className="stack" style={{ gap: 'var(--sp-2)' }}>
            <span className="section-label" style={{ margin: 0 }}>Dificultad</span>
            <Segmented
              options={diffOptions}
              value={difficulty}
              onChange={(v) => onDifficulty(v as DifficultyId)}
              style={{ flexWrap: 'wrap', maxWidth: '100%' }}
            />
          </div>
        </div>

        {difficulty === 'custom' && (
          <div className="row wrap" style={{ gap: 'var(--sp-3)', alignItems: 'flex-end' }}>
            <Input
              label="Filas" type="number" inputMode="numeric"
              min={CUSTOM_LIMITS.minRows} max={CUSTOM_LIMITS.maxRows}
              value={String(custom.rows)}
              onChange={(e) => onCustom({ ...custom, rows: toInt(e.target.value, custom.rows) })}
              style={{ width: 110 }}
            />
            <Input
              label="Columnas" type="number" inputMode="numeric"
              min={CUSTOM_LIMITS.minCols} max={CUSTOM_LIMITS.maxCols}
              value={String(custom.cols)}
              onChange={(e) => onCustom({ ...custom, cols: toInt(e.target.value, custom.cols) })}
              style={{ width: 110 }}
            />
            <Input
              label="Minas" type="number" inputMode="numeric"
              min={CUSTOM_LIMITS.minMines} max={maxMines}
              value={String(custom.mines)}
              onChange={(e) => onCustom({ ...custom, mines: toInt(e.target.value, custom.mines) })}
              style={{ width: 110 }}
            />
            <span style={{ color: 'var(--text-dim)', fontSize: 'var(--fs-sm)' }}>
              {CUSTOM_LIMITS.minRows}–{CUSTOM_LIMITS.maxRows} filas · {CUSTOM_LIMITS.minCols}–{CUSTOM_LIMITS.maxCols} columnas · máx {maxMines} minas
            </span>
          </div>
        )}

        <div className="row wrap" style={{ gap: 'var(--sp-2)' }}>
          <Badge tone={difficulty === 'custom' ? 'purple' : 'cyan'}>{cfg.rows}×{cfg.cols}</Badge>
          <Badge tone="red" dot>{cfg.mines} minas</Badge>
          <span style={{ color: 'var(--text-dim)', fontSize: 'var(--fs-sm)' }}>
            Se aplica al modo solitario y a las salas que crees.
          </span>
        </div>
      </div>

      {/* Modes */}
      <div className="grid-modes">
        <ModeCard
          tone="cyan" title="Solitario" players="1" icon={<span style={{ fontSize: 24 }} aria-hidden>✸</span>}
          subtitle="Despeja el campo a tu ritmo. Bate tu mejor tiempo."
          onClick={onSolo}
        />
        <ModeCard
          tone="lime" title="Cooperativo" players="2" icon={<span style={{ fontSize: 24 }} aria-hidden>⚑</span>}
          subtitle={multiplayerEnabled ? 'Un tablero, dos mentes. Ganan o pierden juntos.' : 'Requiere el servidor de juego en línea.'}
          disabled={busy || !multiplayerEnabled}
          badge={multiplayerEnabled ? undefined : 'Requiere servidor'}
          onClick={() => onCreate('coop')}
        />
        <ModeCard
          tone="magenta" title="Competitivo" players="2" icon={<span style={{ fontSize: 24 }} aria-hidden>⚔</span>}
          subtitle={multiplayerEnabled ? 'Mismo tablero, primero en despejar gana.' : 'Requiere el servidor de juego en línea.'}
          disabled={busy || !multiplayerEnabled}
          badge={multiplayerEnabled ? undefined : 'Requiere servidor'}
          onClick={() => onCreate('versus')}
        />
      </div>

      {/* Join by code */}
      <div className="panel">
        <p className="section-label">¿Te invitaron? Únete con un código</p>
        <form
          className="row wrap"
          style={{ gap: 'var(--sp-3)', alignItems: 'flex-end' }}
          onSubmit={(e) => { e.preventDefault(); if (multiplayerEnabled && code.trim().length >= 4) onJoin(code); }}
        >
          <Input
            label="Código de sala"
            prefix="#"
            mono
            value={code}
            placeholder="XXXXX"
            disabled={!multiplayerEnabled}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            style={{ minWidth: 200 }}
          />
          <Button type="submit" variant="secondary" disabled={!multiplayerEnabled || busy || code.trim().length < 4}>Unirse</Button>
        </form>
        {!multiplayerEnabled && (
          <p style={{ color: 'var(--text-dim)', fontSize: 'var(--fs-sm)', margin: '12px 0 0' }}>
            El multijugador en línea no está configurado en esta versión. El modo Solitario funciona sin conexión.
          </p>
        )}
      </div>
    </div>
  );
}
