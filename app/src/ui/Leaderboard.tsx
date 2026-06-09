import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Segmented } from '../components';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../../shared/types';
import type { PresetId } from '../../shared/types';
import { LEADERBOARD_REACHABLE, fetchTop } from '../net/leaderboard';
import type { LbEntry } from '../net/leaderboard';

type Status = 'loading' | 'ok' | 'error' | 'disabled' | 'unreachable';

function fmt(ms: number): string {
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

const RANK_COLOR: Record<number, string> = {
  1: 'var(--neon-yellow)',
  2: 'var(--text-hi)',
  3: 'var(--neon-orange)',
};

export function Leaderboard({ playerName }: { playerName?: string }) {
  const [difficulty, setDifficulty] = useState<PresetId>('facil');
  const [status, setStatus] = useState<Status>(LEADERBOARD_REACHABLE ? 'loading' : 'unreachable');
  const [entries, setEntries] = useState<LbEntry[]>([]);
  const [nonce, setNonce] = useState(0);

  const diffOptions = DIFFICULTY_ORDER.map((id) => ({ value: id, label: DIFFICULTIES[id].label }));
  const me = (playerName || '').trim().toLowerCase();

  const load = useCallback(async (d: PresetId, signal: AbortSignal) => {
    setStatus('loading');
    try {
      const res = await fetchTop(d, 15);
      if (signal.aborted) return;
      if (!res.enabled) { setStatus('disabled'); setEntries([]); return; }
      setEntries(res.entries);
      setStatus('ok');
    } catch {
      if (!signal.aborted) { setStatus('error'); setEntries([]); }
    }
  }, []);

  useEffect(() => {
    if (!LEADERBOARD_REACHABLE) { setStatus('unreachable'); return; }
    const ctrl = new AbortController();
    void load(difficulty, ctrl.signal);
    return () => ctrl.abort();
  }, [difficulty, nonce, load]);

  return (
    <div className="panel stack" style={{ gap: 'var(--sp-4)' }}>
      <div className="row wrap" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <div>
          <p className="section-label" style={{ margin: 0 }}>Clasificación global</p>
          <span style={{ color: 'var(--text-dim)', fontSize: 'var(--fs-sm)' }}>Mejores tiempos de todos los jugadores.</span>
        </div>
        <div className="row" style={{ gap: 'var(--sp-2)' }}>
          <Segmented options={diffOptions} value={difficulty} onChange={(v) => setDifficulty(v as PresetId)} style={{ flexWrap: 'wrap', maxWidth: '100%' }} />
          <Button variant="ghost" size="sm" onClick={() => setNonce((n) => n + 1)} aria-label="Actualizar">↻</Button>
        </div>
      </div>

      {status === 'unreachable' && (
        <Note>La clasificación global requiere el servidor en línea (no configurado en esta versión).</Note>
      )}
      {status === 'disabled' && (
        <Note>La clasificación global aún no está configurada en el servidor.</Note>
      )}
      {status === 'loading' && (
        <Note>Cargando clasificación… <span style={{ color: 'var(--text-dim)' }}>(si el servidor estaba dormido, puede tardar unos segundos)</span></Note>
      )}
      {status === 'error' && (
        <Note>No se pudo cargar la clasificación. <button type="button" onClick={() => setNonce((n) => n + 1)} style={linkBtn}>Reintentar</button></Note>
      )}
      {status === 'ok' && entries.length === 0 && (
        <Note>Aún no hay tiempos en <b>{DIFFICULTIES[difficulty].label}</b>. ¡Sé el primero en aparecer!</Note>
      )}

      {status === 'ok' && entries.length > 0 && (
        <div className="stack" style={{ gap: 0 }}>
          <div className="lb-row lb-head">
            <span>#</span><span>Jugador</span><span style={{ textAlign: 'right' }}>Tiempo</span>
          </div>
          {entries.map((e) => {
            const mine = me && e.name.trim().toLowerCase() === me;
            return (
              <div key={`${e.rank}-${e.name}`} className={`lb-row${mine ? ' lb-row--me' : ''}`}>
                <span style={{ fontFamily: 'var(--font-mono)', color: RANK_COLOR[e.rank] ?? 'var(--text-dim)', fontSize: 'var(--fs-lg)' }}>
                  {e.rank}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.name}{mine ? <Badge tone="cyan" style={{ marginLeft: 8 }}>tú</Badge> : null}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', textAlign: 'right', fontSize: 'var(--fs-lg)' }}>
                  {fmt(e.timeMs)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, color: 'var(--text-mid)', fontSize: 'var(--fs-sm)' }}>{children}</p>;
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline',
};
