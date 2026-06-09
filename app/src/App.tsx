import { useCallback, useEffect, useState } from 'react';
import { AppBar } from './ui/AppBar';
import { Toast } from './ui/Toast';
import { Badge, Button } from './components';
import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { SoloGame } from './screens/SoloGame';
import { OnlineGame } from './screens/OnlineGame';
import { useRoom } from './net/useRoom';
import { MULTIPLAYER_ENABLED } from './net/config';
import { useAudioUnlock } from './audio/useSound';
import { submitScore } from './net/leaderboard';
import { DEFAULT_CUSTOM, clampCustom } from '../shared/types';
import type { BoardSpec, DifficultyId, GameMode, PresetId } from '../shared/types';

const NAME_KEY = 'buscaminas.name';
const DIFF_KEY = 'buscaminas.difficulty';
const CUSTOM_KEY = 'buscaminas.custom';

function loadName(): string {
  try { return localStorage.getItem(NAME_KEY) || 'Jugador'; } catch { return 'Jugador'; }
}
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

export default function App() {
  useAudioUnlock();
  const room = useRoom();
  const [name, setName] = useState<string>(loadName);
  const [difficulty, setDifficulty] = useState<DifficultyId>(loadDifficulty);
  const [custom, setCustom] = useState<BoardSpec>(loadCustom);
  const [view, setView] = useState<'home' | 'solo'>('home');
  const [pendingOnline, setPendingOnline] = useState(false);

  useEffect(() => { try { localStorage.setItem(NAME_KEY, name); } catch { /* ignore */ } }, [name]);
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

  // Connection badge for the app bar
  const online = pendingOnline || !!room.room;
  const connBadge = online ? (
    room.status === 'open' ? <Badge tone="lime" dot>En línea</Badge>
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
        onWin={difficulty === 'custom' ? undefined : (timeMs) => { void submitScore(difficulty as PresetId, name || 'Jugador', timeMs); }}
      />
    );
  } else {
    screen = (
      <Home
        name={name}
        onName={setName}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        custom={custom}
        onCustom={setCustom}
        onSolo={() => setView('solo')}
        onCreate={create}
        onJoin={join}
        busy={pendingOnline}
        multiplayerEnabled={MULTIPLAYER_ENABLED}
      />
    );
  }

  return (
    <div className="app-shell">
      <AppBar onBrandClick={goMenu} right={connBadge} />
      <main className="app-main">{screen}</main>
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
