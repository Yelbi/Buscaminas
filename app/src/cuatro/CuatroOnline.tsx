import { useEffect, useRef, useState } from 'react';
import { COLS } from '../../shared/cuatro';
import type { Player } from '../../shared/cuatro';
import { CuatroLobby } from './CuatroLobby';
import { CuatroGame } from './CuatroGame';
import type { CuatroDialog } from './CuatroGame';
import { makeConfetti } from './useCuatroGame';
import type { Confetti, Disc, Result } from './useCuatroGame';
import type { C4RoomApi } from './useCuatroRoom';
import type { C4Theme } from './themes';

function ConnectingPanel({ title, error, onBack }: { title: string; error?: string | null; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
      <div style={{ width: 'min(440px,100%)', textAlign: 'center', background: '#0d1730', border: '1px solid rgba(64,120,255,0.4)', borderRadius: 18, padding: 40 }}>
        <div style={{ fontFamily: "'Passion One', sans-serif", fontSize: 34, textTransform: 'uppercase', color: '#eef2ff' }}>{title}</div>
        {error
          ? <p style={{ color: '#ff8080', fontSize: 14 }}>{error}</p>
          : <p style={{ color: '#7d90c4', fontSize: 14 }}>Un momento…</p>}
        <button type="button" className="c4-ghost" onClick={onBack} style={{ height: 46, padding: '0 22px', borderRadius: 11, fontSize: 14 }}>← Menú</button>
      </div>
    </div>
  );
}

export function CuatroOnline({ online, theme, playerName, onLeaveToMenu }: { online: C4RoomApi; theme: C4Theme; playerName: string; onLeaveToMenu: () => void }) {
  const { room, game, you } = online;
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const nid = useRef(0);
  const prevCountRef = useRef(0);

  // Rebuild the animated disc list from board snapshots (append only the new drop).
  useEffect(() => {
    if (!game) { prevCountRef.current = 0; return; }
    const count = game.board.filter((c) => c !== 0).length;
    if (count === prevCountRef.current) return;
    if (count < prevCountRef.current || count === 0) {
      const rebuilt: Disc[] = [];
      game.board.forEach((c, i) => { if (c) rebuilt.push({ id: ++nid.current, c: i % COLS, r: (i / COLS) | 0, p: c as Player }); });
      setDiscs(rebuilt);
    } else if (game.last) {
      const { col, row, by } = game.last;
      setDiscs((d) => [...d, { id: ++nid.current, c: col, r: row, p: by }]);
    }
    prevCountRef.current = count;
  }, [game]);

  // Confetti when you take the match.
  useEffect(() => {
    if (game?.phase === 'matchover' && game.matchWinner === you) setConfetti((c) => (c.length ? c : makeConfetti()));
    else if (game?.phase === 'playing') setConfetti([]);
  }, [game, you]);

  const leaveToMenu = () => { online.leave(); onLeaveToMenu(); };
  const interactive = !!game && game.phase === 'playing' && !!you && game.turn === you;

  // Keyboard 1–7 during your turn.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 7 && interactive) online.drop(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interactive, online]);

  if (!room || !you) {
    const title = online.status === 'closed' ? 'Sin conexión' : online.reconnecting ? 'Reconectando…' : 'Conectando con la sala…';
    return <ConnectingPanel title={title} error={online.error} onBack={leaveToMenu} />;
  }

  if (room.phase === 'lobby') {
    return (
      <CuatroLobby
        room={room}
        you={you}
        onReady={online.setReady}
        onStart={online.start}
        onJoinByCode={(code) => online.joinRoom(code, playerName)}
        onLeave={leaveToMenu}
      />
    );
  }

  if (!game) return <ConnectingPanel title="Cargando duelo…" onBack={leaveToMenu} />;

  const rivalName = room.players.find((p) => p.slot !== you)?.name ?? 'Rival';
  const result: Result | null = game.roundResult ? { winner: game.roundResult.winner, line: game.roundResult.line } : null;

  let dlg: CuatroDialog | null = null;
  if (game.phase === 'matchover') {
    const w = game.matchWinner;
    const won = w === you;
    dlg = {
      title: won ? '¡Victoria!' : w == null ? 'Empate' : 'Derrota',
      color: won ? '#ffd23f' : w == null ? '#7d90c4' : '#ff4d4d',
      sub: won ? `Ganaste el duelo contra ${rivalName}. ¡Qué exhibición!` : w == null ? 'El duelo queda en tablas.' : `${rivalName} se lleva el duelo. La revancha es tuya cuando quieras.`,
      primary: 'Revancha', onPrimary: online.rematch,
      ghost: 'Salir al menú', onGhost: leaveToMenu, score: true,
    };
  } else if (game.phase === 'roundover' && game.roundResult) {
    const w = game.roundResult.winner;
    const won = w === you;
    dlg = {
      title: won ? 'Ronda ganada' : w === 0 ? 'Ronda en tablas' : 'Ronda perdida',
      color: won ? '#ffd23f' : w === 0 ? '#7d90c4' : '#ff4d4d',
      sub: `Mejor de ${game.bestOf} · el primero en ganar ${Math.ceil(game.bestOf / 2)} rondas se lleva el duelo.`,
      primary: 'Siguiente ronda', onPrimary: online.next,
      ghost: 'Salir al menú', onGhost: leaveToMenu, score: true,
    };
  }

  const turnText = result ? 'Fin de la ronda' : game.turn === you ? '¡Tu turno!' : `${rivalName} piensa…`;

  return (
    <CuatroGame
      theme={theme}
      board={game.board}
      discs={discs}
      result={result}
      hover={hover}
      interactive={interactive}
      myPlayer={you}
      turn={game.turn}
      onDrop={online.drop}
      onHover={setHover}
      online
      p1Name={you === 1 ? 'Tú' : rivalName}
      p2Name={you === 2 ? 'Tú' : rivalName}
      turnText={turnText}
      round={game.round}
      bestOfLbl={String(game.bestOf)}
      scoreMe={game.scores.p1}
      scoreRival={game.scores.p2}
      timerPct={Math.round((game.timer / game.turnSeconds) * 100)}
      timerColor={game.timer <= game.turnSeconds / 3 ? '#ff4d4d' : '#ffd23f'}
      hintText={game.turn === you && game.phase === 'playing' ? 'Haz clic en una columna o pulsa las teclas 1–7.' : ' '}
      onAbandon={leaveToMenu}
      dlg={dlg}
      confetti={confetti}
    />
  );
}
