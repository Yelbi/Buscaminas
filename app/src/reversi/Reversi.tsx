import { useState } from 'react';
import './reversi.css';
import { ReversiMenu } from './ReversiMenu';
import { ReversiGame } from './ReversiGame';
import { ReversiOnline } from './ReversiOnline';
import { useReversiGame } from './useReversiGame';
import { useReversiRoom } from './useReversiRoom';
import type { SkinId } from './skins';
import type { AiLevel } from '../../shared/reversiAI';

const TURN_SECONDS = 30;
const SHOW_COORDS = true;
const WIN_PETALS = true;

const MODE_LABEL: Record<AiLevel, string> = { facil: 'BOT · FÁCIL', normal: 'BOT · NORMAL', dificil: 'BOT · DIFÍCIL' };

type Screen = 'menu' | 'game' | 'online';

/**
 * Reversi — top-level shell launched from the GrandGames hub. Owns the screen
 * flow: menu → solo game (vs bot), or menu → online (create/join a real room).
 * Solo and online feed the same presentational board (ReversiGame).
 */
export function Reversi({ onExit, playerName }: { onExit: () => void; playerName: string }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [skin, setSkin] = useState<SkinId>('clasica');
  const game = useReversiGame(TURN_SECONDS);
  const online = useReversiRoom();

  const startBot = (mode: AiLevel, chosenSkin: SkinId) => {
    setSkin(chosenSkin);
    game.start(mode);
    setScreen('game');
  };
  const createOnline = (chosenSkin: SkinId) => { online.createRoom(playerName, chosenSkin); setScreen('online'); };
  const joinOnline = (code: string, chosenSkin: SkinId) => { online.joinRoom(code, playerName, chosenSkin); setScreen('online'); };

  const soloToMenu = () => { game.stop(); setScreen('menu'); };
  const onlineToMenu = () => setScreen('menu');

  if (screen === 'game') {
    const endMsg = game.result === 'win'
      ? 'Dominaste el tablero con serenidad. Las esquinas fueron tuyas.'
      : game.result === 'lose'
        ? (game.resigned ? 'Abandonaste el duelo. El tablero quedó en silencio.' : 'El rival controló los bordes. La próxima vez, paciencia.')
        : 'Equilibrio perfecto. Ninguna laca prevaleció.';

    return (
      <div className="reversi">
        <ReversiGame
          board={game.board}
          validSet={game.validSet}
          blackSkin={skin}
          whiteSkin={skin}
          flipInfo={game.flipInfo}
          newInfo={game.newInfo}
          introGen={game.introGen}
          showCoords={SHOW_COORDS}
          interactive={game.turn === 'p1' && !game.over && game.result == null && game.dialog == null}
          onPlay={game.play}
          modeLabel={MODE_LABEL[game.mode]}
          moveNum={game.moveNum}
          turn={game.turn}
          p1Name="Tú · negras"
          p2Name={`${game.oppName} · blancas`}
          p1Sub="Tu turno"
          p2Sub="Meditando la jugada…"
          p1Score={game.p1Score}
          p2Score={game.p2Score}
          timer={game.timer}
          turnSeconds={TURN_SECONDS}
          history={game.history}
          comboShow={game.comboShow}
          comboText={game.comboText}
          showPause={game.dialog === 'pause'}
          onPauseOpen={game.pause}
          onResume={game.resume}
          onRestart={game.restart}
          onResign={game.resign}
          result={game.result}
          resigned={game.resigned}
          winPetals={WIN_PETALS}
          endMsg={endMsg}
          onRematch={game.rematch}
          onMenu={soloToMenu}
        />
      </div>
    );
  }

  if (screen === 'online') {
    return (
      <div className="reversi">
        <ReversiOnline online={online} onLeaveToMenu={onlineToMenu} />
      </div>
    );
  }

  return (
    <div className="reversi">
      <ReversiMenu onStartBot={startBot} onCreateOnline={createOnline} onJoinOnline={joinOnline} onBack={onExit} />
    </div>
  );
}
