import { useEffect, useMemo, useRef, useState } from 'react';
import { coord, validMoves } from '../../shared/reversi';
import { ReversiLobby } from './ReversiLobby';
import { ReversiGame } from './ReversiGame';
import type { HistEntry } from './useReversiGame';
import type { RvRoomApi } from './useReversiRoom';

const EMPTY_SET: ReadonlySet<number> = new Set();

function ConnectingPanel({ title, error, onBack }: { title: string; error?: string | null; onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(440px,100%)', textAlign: 'center', background: 'linear-gradient(180deg,#211913,#191310)', border: '1px solid rgba(212,175,55,0.28)', borderRadius: 20, padding: 40 }}>
        <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 26, fontWeight: 600, color: '#f1e8d6' }}>{title}</div>
        {error
          ? <p style={{ color: '#d0705a', fontSize: 14, marginTop: 12 }}>{error}</p>
          : <p style={{ color: '#9a8c72', fontSize: 14, marginTop: 12 }}>Un momento…</p>}
        <button type="button" className="rv-ghost" onClick={onBack} style={{ marginTop: 20, height: 48, padding: '0 24px', borderRadius: 999, fontSize: 14 }}>‹ Menú</button>
      </div>
    </div>
  );
}

export function ReversiOnline({ online, onLeaveToMenu }: { online: RvRoomApi; onLeaveToMenu: () => void }) {
  const { room, game, you } = online;

  const [history, setHistory] = useState<HistEntry[]>([]);
  const [introGen, setIntroGen] = useState(0);
  const [combo, setCombo] = useState<{ show: boolean; text: string }>({ show: false, text: '' });
  const [showPause, setShowPause] = useState(false);
  const lastMoveRef = useRef(0);
  const prevPhaseRef = useRef<string | undefined>(undefined);
  const comboT = useRef<ReturnType<typeof setTimeout>>();

  const oppName = useMemo(() => room && you ? (room.players.find((p) => p.slot !== you)?.name ?? 'Rival') : 'Rival', [room, you]);

  // New game → reset local log + intro animation.
  useEffect(() => {
    const phase = room?.phase;
    if (phase === 'playing' && prevPhaseRef.current !== 'playing') {
      setHistory([]);
      setIntroGen((g) => g + 1);
      setShowPause(false);
      lastMoveRef.current = 0;
    }
    prevPhaseRef.current = phase;
  }, [room?.phase]);

  // Accumulate move log + combo from each new snapshot (ticks don't bump moveNum).
  useEffect(() => {
    if (!game || !you || !game.last || game.moveNum <= lastMoveRef.current) return;
    lastMoveRef.current = game.moveNum;
    const by = game.last.by;
    const entry: HistEntry = { num: game.moveNum, p: by, text: (by === you ? 'Tú' : oppName) + ' · ' + coord(game.last.i), flips: game.last.flipped.length };
    const extra: HistEntry[] = [];
    if (game.passedBy) {
      const passer = game.passedBy;
      extra.push({ num: game.moveNum, p: passer, text: passer === you ? 'Tú pasas turno' : oppName + ' pasa turno', flips: 0, pass: true });
    }
    setHistory((h) => [...extra, entry, ...h]);
    if (game.last.flipped.length >= 4) {
      setCombo({ show: true, text: '¡Cascada ×' + game.last.flipped.length + '!' });
      clearTimeout(comboT.current);
      comboT.current = setTimeout(() => setCombo((c) => ({ ...c, show: false })), 1700);
    }
  }, [game, you, oppName]);

  useEffect(() => () => clearTimeout(comboT.current), []);

  const anim = useMemo(() => {
    if (!game?.last) return { flipInfo: {} as Record<number, number>, newInfo: {} as Record<number, number> };
    const { i, flipped } = game.last;
    const x = i % 8, y = (i / 8) | 0;
    const flipInfo: Record<number, number> = {};
    for (const j of flipped) {
      const d = Math.max(Math.abs((j % 8) - x), Math.abs(((j / 8) | 0) - y));
      flipInfo[j] = 130 + d * 95;
    }
    return { flipInfo, newInfo: { [i]: 0 } };
  }, [game?.moveNum]);

  const leaveToMenu = () => { online.leave(); onLeaveToMenu(); };

  if (!room || !you) {
    const title = online.status === 'closed' ? 'Sin conexión' : online.reconnecting ? 'Reconectando…' : 'Conectando con la sala…';
    return <ConnectingPanel title={title} error={online.error} onBack={leaveToMenu} />;
  }

  if (room.phase === 'lobby') {
    return (
      <ReversiLobby
        room={room}
        you={you}
        onSetSkin={online.setSkin}
        onReady={online.setReady}
        onStart={online.start}
        onLeave={leaveToMenu}
      />
    );
  }

  if (!game) return <ConnectingPanel title="Cargando duelo…" onBack={leaveToMenu} />;

  const canMove = game.phase === 'playing' && game.turn === you && !game.result && !showPause;
  const validSet = canMove ? new Set(validMoves(game.board, you)) : EMPTY_SET;
  const p1p = room.players.find((p) => p.slot === 'p1');
  const p2p = room.players.find((p) => p.slot === 'p2');
  const result = game.result ? (game.result.winner == null ? 'draw' : game.result.winner === you ? 'win' : 'lose') : null;

  return (
    <ReversiGame
      board={game.board}
      validSet={validSet}
      blackSkin={game.skins.p1}
      whiteSkin={game.skins.p2}
      flipInfo={anim.flipInfo}
      newInfo={anim.newInfo}
      introGen={introGen}
      showCoords
      interactive={canMove}
      onPlay={online.move}
      modeLabel="COMPETITIVO"
      moveNum={game.moveNum}
      turn={game.turn}
      p1Name={`${you === 'p1' ? 'Tú' : (p1p?.name ?? 'Negras')} · negras`}
      p2Name={`${you === 'p2' ? 'Tú' : (p2p?.name ?? 'Blancas')} · blancas`}
      p1Sub={you === 'p1' ? 'Tu turno' : 'Turno del rival'}
      p2Sub={you === 'p2' ? 'Tu turno' : 'Turno del rival'}
      p1Score={game.scores.p1}
      p2Score={game.scores.p2}
      timer={game.timer}
      turnSeconds={game.turnSeconds}
      history={history}
      comboShow={combo.show}
      comboText={combo.text}
      showPause={showPause}
      onPauseOpen={() => setShowPause(true)}
      onResume={() => setShowPause(false)}
      onRestart={() => {}}
      onResign={() => { setShowPause(false); online.resign(); }}
      hideRestart
      result={result}
      resigned={false}
      winPetals
      endMsg={game.result?.reason}
      onRematch={online.rematch}
      onMenu={leaveToMenu}
    />
  );
}
