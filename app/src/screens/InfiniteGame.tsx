import { useEffect, useState } from 'react';
import { Badge, Counter } from '../components';
import { GameControls } from '../ui/GameControls';
import { ResultDialog, ResultReopen } from '../ui/ResultDialog';
import { InfiniteBoard } from '../game/InfiniteBoard';
import { useInfiniteGame } from '../game/useInfiniteGame';
import { formatClock, seconds } from '../lib/format';

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

/** Marcador de vidas con el mismo lenguaje visual (y clases responsive) que Counter. */
function Lives({ lives, max }: { lives: number; max: number }) {
  return (
    <div className="ds-counter" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <span className="ds-counter__label" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>
        Vidas
      </span>
      <div
        className="ds-counter__box"
        aria-label={`${lives} de ${max} vidas`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          borderRadius: 'var(--r-sm)', background: 'var(--bg-void)',
          border: '1px solid color-mix(in srgb, var(--neon-red) 30%, transparent)',
          boxShadow: 'inset 0 0 14px color-mix(in srgb, var(--neon-red) 12%, transparent)',
        }}
      >
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              fontSize: 'var(--fs-lg)', lineHeight: 1,
              color: i < lives ? 'var(--neon-red)' : 'var(--text-dim)',
              filter: i < lives ? 'drop-shadow(0 0 6px var(--neon-red))' : 'none',
              opacity: i < lives ? 1 : 0.35,
            }}
          >
            ♥
          </span>
        ))}
      </div>
    </div>
  );
}

export function InfiniteGame({ onMenu }: { onMenu: () => void }) {
  const game = useInfiniteGame();
  const [flagMode, setFlagMode] = useState(false);
  const [seqDone, setSeqDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Partida nueva → limpiar el gating del diálogo.
  useEffect(() => { setSeqDone(false); setDismissed(false); }, [game.round]);

  // Pausa breve para que la explosión final se vea antes del diálogo.
  useEffect(() => {
    if (game.status !== 'over') return;
    const id = setTimeout(() => setSeqDone(true), 900);
    return () => clearTimeout(id);
  }, [game.status]);

  /** Estado actual de una celda (proyección de ventana 1×1). */
  const cellState = (r: number, c: number) => game.view(r, c, 1, 1)[0][0];

  const onCell = (r: number, c: number) => {
    const cell = cellState(r, c);
    if (flagMode) {
      if (cell.s === 'hidden' || cell.s === 'flagged') game.flag(r, c);
      return;
    }
    if (cell.s === 'revealed' && cell.v > 0) game.chord(r, c);
    else if (cell.s === 'hidden') game.reveal(r, c);
  };

  const onCellContext = (r: number, c: number) => {
    const cell = cellState(r, c);
    if (cell.s === 'hidden' || cell.s === 'flagged') game.flag(r, c);
  };

  const playing = game.status === 'playing';
  const isRecord = game.status === 'over' && game.bestScore != null && game.score >= game.bestScore && game.score > 0;

  return (
    <div className="board-stage pop-in">
      <div className="hud">
        <Badge tone="purple">Infinito</Badge>
        <Counter label="Puntos" value={game.score} digits={4} tone="lime" icon={<span aria-hidden>◆</span>} />
        <Lives lives={game.lives} max={game.maxLives} />
        <Counter label="Tiempo" value={seconds(game.elapsedMs)} digits={3} tone="cyan" icon={<ClockIcon />} />
        {game.bestScore != null
          ? <Badge tone="cyan">Récord {game.bestScore}</Badge>
          : <Badge tone="neutral">Sin récord</Badge>}
      </div>

      <InfiniteBoard
        view={game.view}
        version={game.version}
        interactive={playing}
        onCell={onCell}
        onCellContext={onCellContext}
        boom={game.boom}
        round={game.round}
        origin={game.origin}
        hint={!game.started
          ? 'Toca cualquier casilla para empezar · arrastra para explorar'
          : playing ? null : 'Arrastra para ver dónde estaban las minas'}
      />

      <GameControls
        flagMode={flagMode}
        onToggleFlag={() => setFlagMode((v) => !v)}
        onNew={() => game.reset()}
        onLeave={onMenu}
      />

      {game.status === 'over' && seqDone && !dismissed && (
        <ResultDialog
          won={isRecord}
          eyebrow={isRecord ? '¡Nuevo récord!' : 'Fin de la partida'}
          title={isRecord ? `${game.score} casillas despejadas` : 'Te quedaste sin vidas'}
          onAgain={() => game.reset()}
          onMenu={onMenu}
          onInspect={() => setDismissed(true)}
        >
          Despejaste <b style={{ color: 'var(--neon-lime)' }}>{game.score}</b> casillas en{' '}
          <b style={{ color: 'var(--neon-cyan)' }}>{formatClock(game.elapsedMs)}</b>.
          {isRecord
            ? ' Tu mejor marca hasta ahora.'
            : game.bestScore != null ? <> Récord actual: {game.bestScore}.</> : null}
          {' '}Pulsa <b>Analizar tablero</b> para explorar el campo.
        </ResultDialog>
      )}
      {game.status === 'over' && seqDone && dismissed && (
        <ResultReopen won={isRecord} onClick={() => setDismissed(false)} />
      )}
    </div>
  );
}
