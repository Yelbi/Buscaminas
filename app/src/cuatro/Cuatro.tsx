import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import './cuatro.css';
import { CuatroMenu } from './CuatroMenu';
import type { BestOf } from './CuatroMenu';
import { CuatroGame } from './CuatroGame';
import type { CuatroDialog } from './CuatroGame';
import { CuatroOnline } from './CuatroOnline';
import { useCuatroGame } from './useCuatroGame';
import { useCuatroRoom } from './useCuatroRoom';
import { THEMES } from './themes';
import type { ThemeId } from './themes';
import type { AiLevel } from '../../shared/cuatroAI';

const DIF_LABEL: Record<AiLevel, string> = { facil: 'Fácil', medio: 'Media', dificil: 'Difícil' };

type Screen = 'menu' | 'game' | 'online';

/**
 * 4 en línea — top-level shell launched from the GrandGames hub. Owns the
 * screen flow (menu → solo game, or menu → online). Solo and online feed the
 * same presentational CuatroGame. Online (Phase 2) plugs a WebSocket room in.
 */
export function Cuatro({ onExit, playerName }: { onExit: () => void; playerName: string }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [theme, setTheme] = useState<ThemeId>('clasico');
  const [bestOf, setBestOf] = useState<BestOf>(3);
  const game = useCuatroGame();
  const online = useCuatroRoom();

  const playBot = (dif: AiLevel) => { game.start(dif); setScreen('game'); };
  const backToMenu = () => { game.stop(); setScreen('menu'); };
  const findDuel = () => { online.createRoom(playerName, bestOf); setScreen('online'); };
  const leaveOnline = () => { online.leave(); setScreen('menu'); };

  const header = (onBack: () => void, backLabel: string) => (
    <header style={{ height: 62, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', borderBottom: '1px solid rgba(64,120,255,0.22)', background: 'rgba(10,18,38,0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 40 }}>
      <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#7d90c4', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>{backLabel}</button>
      <span style={{ flex: 1 }} />
      <span style={{ fontFamily: "'Passion One', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        <span style={{ color: '#ff4d4d' }}>4</span> en <span style={{ color: '#ffd23f' }}>línea</span>
      </span>
    </header>
  );

  let body: ReactNode;
  if (screen === 'game') {
    const r = game.result;
    let dlg: CuatroDialog | null = null;
    if (r) {
      const w = r.winner;
      dlg = {
        title: w === 1 ? '¡Victoria!' : w === 2 ? 'Derrota' : 'Empate',
        color: w === 1 ? '#ffd23f' : w === 2 ? '#ff4d4d' : '#7d90c4',
        sub: w === 1 ? `Le ganaste a la IA en nivel ${DIF_LABEL[game.dif].toLowerCase()}.`
          : w === 2 ? 'La IA alineó cuatro. ¡Pide la revancha!'
          : 'Tablero lleno y nadie alineó cuatro.',
        primary: 'Jugar de nuevo', onPrimary: game.restart,
        ghost: 'Cambiar dificultad', onGhost: backToMenu,
        score: false,
      };
    }
    body = (
      <CuatroGame
        theme={THEMES[theme]}
        board={game.board}
        discs={game.discs}
        result={game.result}
        hover={game.hover}
        interactive={game.turn === 1 && !game.lock && !game.result}
        myPlayer={1}
        turn={game.turn}
        onDrop={game.drop}
        onHover={game.setHover}
        online={false}
        p1Name="Tú"
        p2Name={`IA · ${DIF_LABEL[game.dif]}`}
        turnText={game.result ? 'Fin de la ronda' : game.turn === 1 ? '¡Tu turno!' : 'La IA piensa…'}
        hintText={game.turn === 1 && !game.result ? 'Haz clic en una columna o pulsa las teclas 1–7.' : ' '}
        onUndo={game.undo}
        undoEnabled={game.discs.length > 0 && (!game.lock || !!game.result)}
        onRestart={game.restart}
        dlg={dlg}
        confetti={game.confetti}
      />
    );
    return <div className="cuatro">{themeOverlay(theme)}{header(backToMenu, '← Menú')}<main style={mainStyle}>{body}</main></div>;
  }

  if (screen === 'online') {
    return (
      <div className="cuatro">
        {themeOverlay(theme)}
        {header(leaveOnline, '← Menú')}
        <main style={mainStyle}>
          <CuatroOnline online={online} theme={THEMES[theme]} playerName={playerName} onLeaveToMenu={() => setScreen('menu')} />
        </main>
      </div>
    );
  }

  return (
    <div className="cuatro">
      {themeOverlay(theme)}
      {header(onExit, '← GrandGames')}
      <main style={mainStyle}>
        <CuatroMenu theme={theme} onTheme={setTheme} bestOf={bestOf} onBestOf={setBestOf} onPlayBot={playBot} onFindDuel={findDuel} />
      </main>
    </div>
  );
}

const mainStyle: CSSProperties = { flex: 1, width: '100%', maxWidth: 1020, margin: '0 auto', padding: '34px 22px 64px', boxSizing: 'border-box', position: 'relative', zIndex: 1 };

function themeOverlay(theme: ThemeId) {
  const alt = THEMES[theme].pageAlt;
  if (!alt) return null;
  return <div style={{ position: 'absolute', inset: 0, background: alt, pointerEvents: 'none', zIndex: 0 }} />;
}
