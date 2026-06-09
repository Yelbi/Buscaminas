import { useEffect, useRef, useState } from 'react';
import { Badge, Board, PlayerTag } from '../components';
import { Hud } from '../ui/Hud';
import { GameControls } from '../ui/GameControls';
import { ResultDialog, ResultReopen } from '../ui/ResultDialog';
import { GameBoard } from '../game/GameBoard';
import { useFitTile } from '../game/useFitTile';
import { boardHandlers } from '../game/boardHandlers';
import type { BoardActions } from '../game/boardHandlers';
import { toBoardCells, formatClock } from '../lib/format';
import { MODE_LABELS, resolveSpec } from '../../shared/types';
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
  const [seqDone, setSeqDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [matchKey, setMatchKey] = useState(0);
  const prevPhase = useRef<string | null>(null);

  // A new game began → bump the board key and clear result gating.
  useEffect(() => {
    if (game.phase === 'playing' && prevPhase.current !== 'playing') {
      setMatchKey((n) => n + 1);
      setSeqDone(false);
      setDismissed(false);
    }
    prevPhase.current = game.phase;
  }, [game.phase]);

  const cfg = resolveSpec(room.difficulty, room.custom);
  const isVersus = room.mode === 'versus';
  const oppCols = game.opponentBoard?.[0]?.length ?? 0;
  const [oppRef, oppTilePx] = useFitTile(oppCols, 22, { minPx: 10 });
  const playing = game.phase === 'playing' && game.status === 'playing';
  const outcome = game.status === 'won' ? 'win' : game.status === 'lost' ? 'lose' : null;
  const handlers = boardHandlers(game.board, flagMode, api);

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

      <GameBoard
        view={game.board}
        size={cfg.tile}
        interactive={playing}
        gameKey={matchKey}
        finished={game.phase === 'finished'}
        outcome={outcome}
        onSequenceDone={() => setSeqDone(true)}
        onCell={handlers.onCell}
        onCellContext={handlers.onCellContext}
      />

      {/* Versus: opponent progress mini-map */}
      {isVersus && game.opponentBoard && (
        <div className="stack center" style={{ gap: 'var(--sp-2)', width: '100%' }}>
          <span className="section-label" style={{ margin: 0 }}>Progreso del rival</span>
          <div ref={oppRef} className="board-fit" style={{ opacity: 0.85, pointerEvents: 'none' }}>
            <Board cells={toBoardCells(game.opponentBoard)} size="sm" tilePx={oppTilePx} />
          </div>
        </div>
      )}

      <GameControls
        flagMode={flagMode}
        onToggleFlag={() => setFlagMode((v) => !v)}
        onLeave={api.leave}
        leaveLabel="Salir de la sala"
      />

      {finished && game.result && seqDone && !dismissed && (
        <ResultDialog
          won={youWon}
          eyebrow={isVersus ? (youWon ? '¡Victoria!' : 'Derrota') : (youWon ? 'En equipo' : 'Boom')}
          title={youWon ? (isVersus ? '¡Ganaste la partida!' : '¡Campo despejado!') : (isVersus ? 'Tu rival ganó' : 'Mina detonada')}
          againLabel="Revancha"
          onAgain={api.rematch}
          onMenu={api.leave}
          onInspect={() => setDismissed(true)}
        >
          {game.result.reason} Tiempo <b style={{ color: youWon ? 'var(--neon-lime)' : 'var(--neon-cyan)' }}>{formatClock(game.result.timeMs)}</b>.
          {' '}La revancha te devuelve a la sala de espera.
        </ResultDialog>
      )}
      {finished && game.result && seqDone && dismissed && (
        <ResultReopen won={youWon} onClick={() => setDismissed(false)} />
      )}
    </div>
  );
}
