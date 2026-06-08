import { useEffect, useState } from 'react';
import { Badge } from '../components';
import type { BadgeTone } from '../components';
import { Hud } from '../ui/Hud';
import { GameControls } from '../ui/GameControls';
import { ResultDialog, ResultReopen } from '../ui/ResultDialog';
import { GameBoard } from '../game/GameBoard';
import { useSoloGame } from '../game/useSoloGame';
import { boardHandlers } from '../game/boardHandlers';
import { formatClock } from '../lib/format';
import { DIFFICULTIES } from '../../shared/types';
import type { DifficultyId } from '../../shared/types';

const DIFF_TONE: Record<DifficultyId, BadgeTone> = { facil: 'lime', medio: 'yellow', dificil: 'red' };

export function SoloGame({ difficulty, onMenu }: { difficulty: DifficultyId; onMenu: () => void }) {
  const game = useSoloGame(difficulty);
  const [flagMode, setFlagMode] = useState(false);
  const [seqDone, setSeqDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const cfg = DIFFICULTIES[game.difficulty];
  const handlers = boardHandlers(game.board, flagMode, game);
  const playing = game.status === 'playing';
  const outcome = game.status === 'won' ? 'win' : game.status === 'lost' ? 'lose' : null;

  // New round → clear result gating.
  useEffect(() => { setSeqDone(false); setDismissed(false); }, [game.round]);

  return (
    <div className="board-stage pop-in">
      <Hud
        minesRemaining={game.flagsRemaining}
        elapsedMs={game.elapsedMs}
        left={<Badge tone={DIFF_TONE[game.difficulty]}>{cfg.label}</Badge>}
        right={game.bestMs != null
          ? <Badge tone="cyan">Récord {formatClock(game.bestMs)}</Badge>
          : <Badge tone="neutral">Sin récord</Badge>}
      />

      <div className="board-scroll">
        <GameBoard
          view={game.board}
          size={cfg.tile}
          interactive={playing}
          gameKey={game.round}
          finished={!playing}
          outcome={outcome}
          onSequenceDone={() => setSeqDone(true)}
          onCell={handlers.onCell}
          onCellContext={handlers.onCellContext}
        />
      </div>

      <GameControls
        flagMode={flagMode}
        onToggleFlag={() => setFlagMode((v) => !v)}
        onNew={() => game.reset()}
        onLeave={onMenu}
      />

      {seqDone && !dismissed && (
        <ResultDialog
          won={game.status === 'won'}
          eyebrow={game.status === 'won' ? 'Partida terminada' : 'Boom'}
          title={game.status === 'won' ? '¡Campo despejado!' : 'Pisaste una mina'}
          onAgain={() => game.reset()}
          onMenu={onMenu}
          onInspect={() => setDismissed(true)}
        >
          {game.status === 'won' ? (
            <>
              Tiempo <b style={{ color: 'var(--neon-lime)' }}>{formatClock(game.elapsedMs)}</b>
              {game.bestMs != null && game.elapsedMs <= game.bestMs && ' · ¡Nuevo récord personal!'}
              {game.bestMs != null && game.elapsedMs > game.bestMs && <> · Récord {formatClock(game.bestMs)}</>}
              {' '}· {cfg.mines} minas despejadas.
            </>
          ) : (
            <>Caíste tras <b style={{ color: 'var(--neon-cyan)' }}>{formatClock(game.elapsedMs)}</b>. La casilla resaltada es donde estaba la mina. Pulsa <b>Analizar tablero</b> para revisarlo.</>
          )}
        </ResultDialog>
      )}
      {seqDone && dismissed && (
        <ResultReopen won={game.status === 'won'} onClick={() => setDismissed(false)} />
      )}
    </div>
  );
}
