import { useState } from 'react';
import { Badge, Board } from '../components';
import type { BadgeTone } from '../components';
import { Hud } from '../ui/Hud';
import { GameControls } from '../ui/GameControls';
import { ResultDialog } from '../ui/ResultDialog';
import { useSoloGame } from '../game/useSoloGame';
import { boardHandlers } from '../game/boardHandlers';
import { toBoardCells, formatClock } from '../lib/format';
import { DIFFICULTIES } from '../../shared/types';
import type { DifficultyId } from '../../shared/types';

const DIFF_TONE: Record<DifficultyId, BadgeTone> = { facil: 'lime', medio: 'yellow', dificil: 'red' };

export function SoloGame({ difficulty, onMenu }: { difficulty: DifficultyId; onMenu: () => void }) {
  const game = useSoloGame(difficulty);
  const [flagMode, setFlagMode] = useState(false);
  const cfg = DIFFICULTIES[game.difficulty];
  const handlers = boardHandlers(game.board, flagMode, game);
  const over = game.status !== 'playing';

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
        <Board
          cells={toBoardCells(game.board)}
          size={cfg.tile}
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

      {over && (
        <ResultDialog
          won={game.status === 'won'}
          eyebrow={game.status === 'won' ? 'Partida terminada' : 'Boom'}
          title={game.status === 'won' ? '¡Campo despejado!' : 'Pisaste una mina'}
          onAgain={() => game.reset()}
          onMenu={onMenu}
        >
          {game.status === 'won' ? (
            <>
              Tiempo <b style={{ color: 'var(--neon-lime)' }}>{formatClock(game.elapsedMs)}</b>
              {game.bestMs != null && game.elapsedMs <= game.bestMs && ' · ¡Nuevo récord personal!'}
              {game.bestMs != null && game.elapsedMs > game.bestMs && <> · Récord {formatClock(game.bestMs)}</>}
              {' '}· {cfg.mines} minas despejadas.
            </>
          ) : (
            <>Caíste tras <b style={{ color: 'var(--neon-cyan)' }}>{formatClock(game.elapsedMs)}</b>. El campo completo está revelado. ¡Inténtalo de nuevo!</>
          )}
        </ResultDialog>
      )}
    </div>
  );
}
