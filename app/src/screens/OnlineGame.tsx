import { useState } from 'react';
import { Badge, Board, PlayerTag } from '../components';
import { Hud } from '../ui/Hud';
import { GameControls } from '../ui/GameControls';
import { ResultDialog } from '../ui/ResultDialog';
import { boardHandlers } from '../game/boardHandlers';
import type { BoardActions } from '../game/boardHandlers';
import { toBoardCells, formatClock } from '../lib/format';
import { DIFFICULTIES, MODE_LABELS } from '../../shared/types';
import type { PlayerSlotId } from '../../shared/types';
import type { GameSnapshot, RoomSnapshot } from '../../shared/protocol';

export function OnlineGame({
  room,
  you,
  game,
  api,
}: {
  room: RoomSnapshot;
  you: PlayerSlotId | null;
  game: GameSnapshot;
  api: BoardActions & { rematch: () => void; leave: () => void };
}) {
  const [flagMode, setFlagMode] = useState(false);
  const cfg = DIFFICULTIES[room.difficulty];
  const isVersus = room.mode === 'versus';
  const interactive = game.phase === 'playing' && game.status === 'playing';
  const handlers = interactive
    ? boardHandlers(game.board, flagMode, api)
    : { onCell: () => {}, onCellContext: () => {} };

  const finished = game.phase === 'finished' && !!game.result;
  const youWon = game.result
    ? (game.result.winner ? game.result.winner === you : game.result.outcome === 'win')
    : false;

  return (
    <div className="board-stage pop-in">
      {/* Scoreboard */}
      <div className="row wrap center" style={{ gap: 'var(--sp-3)', width: '100%', maxWidth: 560 }}>
        {room.players.map((p) => (
          <PlayerTag
            key={p.slot}
            name={p.name + (p.slot === you ? ' (tú)' : '')}
            slot={p.slot}
            score={game.scores[p.slot] ?? 0}
            active={p.slot === you || room.mode === 'coop'}
            status={p.slot === you ? 'Tú' : isVersus ? 'Rival' : 'Compañero'}
            style={{ flex: '1 1 200px' }}
          />
        ))}
      </div>

      <Hud
        minesRemaining={game.flagsRemaining}
        elapsedMs={game.elapsedMs}
        left={<Badge tone={isVersus ? 'magenta' : 'lime'}>{MODE_LABELS[room.mode]}</Badge>}
        right={<Badge tone="cyan">{cfg.label}</Badge>}
      />

      <div className="board-scroll">
        <Board
          cells={toBoardCells(game.board)}
          size={cfg.tile}
          onCell={handlers.onCell}
          onCellContext={handlers.onCellContext}
        />
      </div>

      {/* Versus: opponent progress mini-map */}
      {isVersus && game.opponentBoard && (
        <div className="stack center" style={{ gap: 'var(--sp-2)' }}>
          <span className="section-label" style={{ margin: 0 }}>Progreso del rival</span>
          <div className="board-scroll" style={{ opacity: 0.85, pointerEvents: 'none' }}>
            <Board cells={toBoardCells(game.opponentBoard)} size="sm" />
          </div>
        </div>
      )}

      <GameControls
        flagMode={flagMode}
        onToggleFlag={() => setFlagMode((v) => !v)}
        onLeave={api.leave}
        leaveLabel="Salir de la sala"
      />

      {finished && game.result && (
        <ResultDialog
          won={youWon}
          eyebrow={isVersus ? (youWon ? '¡Victoria!' : 'Derrota') : (youWon ? 'En equipo' : 'Boom')}
          title={youWon ? (isVersus ? '¡Ganaste la partida!' : '¡Campo despejado!') : (isVersus ? 'Tu rival ganó' : 'Mina detonada')}
          againLabel="Revancha"
          onAgain={api.rematch}
          onMenu={api.leave}
        >
          {game.result.reason} Tiempo <b style={{ color: youWon ? 'var(--neon-lime)' : 'var(--neon-cyan)' }}>{formatClock(game.result.timeMs)}</b>.
          {' '}La revancha te devuelve a la sala de espera.
        </ResultDialog>
      )}
    </div>
  );
}
