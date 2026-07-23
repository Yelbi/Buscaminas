import { useCallback, useEffect, useState } from 'react';
import { AppBar } from './ui/AppBar';
import { Toast } from './ui/Toast';
import { Badge, Button } from './components';
import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { SoloGame } from './screens/SoloGame';
import { InfiniteGame } from './screens/InfiniteGame';
import { OnlineGame } from './screens/OnlineGame';
import { useRoom } from './net/useRoom';
import { MULTIPLAYER_ENABLED } from './net/config';
import { useAudioUnlock } from './audio/useSound';
import { audio } from './audio/engine';
import { submitScore } from './net/leaderboard';
import { DEFAULT_CUSTOM, clampCustom } from '../shared/types';
import type { BoardSpec, DifficultyId, GameMode, PresetId } from '../shared/types';

const DIFF_KEY = 'buscaminas.difficulty';
const CUSTOM_KEY = 'buscaminas.custom';

function loadDifficulty(): DifficultyId {
  try {
    const v = localStorage.getItem(DIFF_KEY);
    if (v === 'facil' || v === 'medio' || v === 'dificil' || v === 'custom') return v;
  } catch { /* ignore */ }
  return 'facil';
}
function loadCustom(): BoardSpec {
  try {
    const v = localStorage.getItem(CUSTOM_KEY);
    if (v) return clampCustom(JSON.parse(v) as BoardSpec);
  } catch { /* ignore */ }
  return DEFAULT_CUSTOM;
}

/**
 * Buscaminas — the full game, launched from the GrandGames menu. The player
 * name is owned by GrandGames (useProfile) and passed in; `onExitToMenu`
 * returns to the hub. Background music belongs to this game only.
 */
export function BuscaminasApp({
  name,
  onName,
  onExitToMenu,
}: {
  name: string;
  onName: (value: string) => void;
  onExitToMenu: () => void;
}) {
  useAudioUnlock();
  const room = useRoom();
  const [difficulty, setDifficulty] = useState<DifficultyId>(loadDifficulty);
  const [custom, setCustom] = useState<BoardSpec>(loadCustom);
  const [view, setView] = useState<'home' | 'solo' | 'infinite'>('home');
  const [pendingOnline, setPendingOnline] = useState(false);

  // Music plays inside Buscaminas only — start on entry, stop when leaving to
  // the GrandGames menu (this component unmounts).
  useEffect(() => {
    audio.unlock();
    return () => audio.stopMusic();
  }, []);

  useEffect(() => { try { localStorage.setItem(DIFF_KEY, difficulty); } catch { /* ignore */ } }, [difficulty]);
  useEffect(() => { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); } catch { /* ignore */ } }, [custom]);

  // Disable the browser's right-click context menu (right-click = place flag).
  // Still allowed inside text fields so paste/spellcheck keep working.
  useEffect(() => {
    const onCtx = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest('input, textarea, [contenteditable="true"]')) return;
      e.preventDefault();
    };
    document.addEventListener('contextmenu', onCtx);
    return () => document.removeEventListener('contextmenu', onCtx);
  }, []);

  const goMenu = useCallback(() => {
    room.leave();
    setPendingOnline(false);
    setView('home');
  }, [room]);

  const create = useCallback((mode: Exclude<GameMode, 'solo'>) => {
    room.clearError();
    setPendingOnline(true);
    room.createRoom(mode, difficulty, name || 'Jugador', difficulty === 'custom' ? clampCustom(custom) : undefined);
  }, [room, difficulty, name, custom]);

  const join = useCallback((code: string) => {
    room.clearError();
    setPendingOnline(true);
    room.joinRoom(code, name || 'Jugador');
  }, [room, name]);

  // Stable callback so SoloGame's submit effect doesn't churn (custom boards
  // aren't ranked, so they submit nothing).
  const handleSoloWin = useCallback((timeMs: number) => {
    if (difficulty === 'custom') return;
    void submitScore(difficulty as PresetId, name || 'Jugador', timeMs);
  }, [difficulty, name]);

  // Connection badge for the app bar
  const online = pendingOnline || !!room.room;
  const connBadge = online ? (
    room.reconnecting ? <Badge tone="yellow" dot>Reconectando…</Badge>
      : room.status === 'open' ? <Badge tone="lime" dot>En línea</Badge>
      : room.status === 'connecting' ? <Badge tone="yellow" dot>Conectando…</Badge>
      : <Badge tone="red" dot>Sin conexión</Badge>
  ) : null;

  let screen;
  if (room.room) {
    if (room.room.phase !== 'lobby' && room.game) {
      screen = (
        <OnlineGame
          room={room.room}
          you={room.you}
          game={room.game}
          api={{ reveal: room.reveal, flag: room.flag, chord: room.chord, rematch: room.rematch, leave: goMenu }}
        />
      );
    } else if (room.room.phase !== 'lobby') {
      screen = <ConnectingPanel title="Cargando partida…" onBack={goMenu} />;
    } else {
      screen = (
        <Lobby
          room={room.room}
          you={room.you}
          onReady={room.setReady}
          onStart={room.start}
          onLeave={goMenu}
        />
      );
    }
  } else if (pendingOnline) {
    screen = (
      <ConnectingPanel
        title={room.status === 'closed' ? 'Sin conexión' : 'Conectando con el servidor…'}
        error={room.error}
        onBack={goMenu}
      />
    );
  } else if (view === 'solo') {
    screen = (
      <SoloGame
        difficulty={difficulty}
        custom={custom}
        onMenu={goMenu}
        onWin={handleSoloWin}
      />
    );
  } else if (view === 'infinite') {
    screen = <InfiniteGame onMenu={goMenu} />;
  } else {
    screen = (
      <Home
        name={name}
        onName={onName}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        custom={custom}
        onCustom={setCustom}
        onSolo={() => setView('solo')}
        onInfinite={() => setView('infinite')}
        onCreate={create}
        onJoin={join}
        busy={pendingOnline}
        multiplayerEnabled={MULTIPLAYER_ENABLED}
      />
    );
  }

  return (
    <div className="app-shell">
      <AppBar onBack={onExitToMenu} onBrandClick={goMenu} right={connBadge} />
      <main className="app-main">{screen}</main>
      {room.reconnecting && (
        <div className="reconnect-banner" role="status">
          <span className="blink" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--neon-yellow)', boxShadow: '0 0 8px var(--neon-yellow)' }} />
          Reconectando con la sala…
        </div>
      )}
      {room.notice && <Toast message={room.notice} onDismiss={room.clearError} />}
      {!pendingOnline && room.error && <Toast message={room.error} onDismiss={room.clearError} />}
    </div>
  );
}

function ConnectingPanel({ title, error, onBack }: { title: string; error?: string | null; onBack: () => void }) {
  return (
    <div className="panel stack center pop-in" style={{ maxWidth: 460, margin: '10vh auto 0', textAlign: 'center', gap: 'var(--sp-4)' }}>
      <div className="display" style={{ fontSize: 'var(--fs-h3)' }}>{title}</div>
      {error
        ? <p style={{ color: 'var(--neon-red)', margin: 0 }}>{error}</p>
        : <p style={{ color: 'var(--text-mid)', margin: 0 }}>Esto solo toma un momento…</p>}
      <Button variant="ghost" onClick={onBack}>Volver al menú</Button>
    </div>
  );
}
