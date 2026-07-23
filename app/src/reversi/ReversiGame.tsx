import type { CSSProperties } from 'react';
import type { Board, Player } from '../../shared/reversi';
import { ReversiBoard } from './ReversiBoard';
import { discAvatar, historyDot } from './skins';
import type { SkinId } from './skins';
import type { HistEntry, Result } from './useReversiGame';

/** Presentational game screen — driven by the solo hook or (Phase 2) the online room. */
export interface ReversiGameView {
  board: Board | null;
  validSet: ReadonlySet<number>;
  blackSkin: SkinId;
  whiteSkin: SkinId;
  flipInfo: Record<number, number>;
  newInfo: Record<number, number>;
  introGen: number;
  showCoords: boolean;
  interactive: boolean;
  onPlay: (i: number) => void;

  modeLabel: string;
  moveNum: number;

  turn: Player;
  p1Name: string;
  p2Name: string;
  p1Sub?: string;
  p2Sub?: string;
  p1Score: number;
  p2Score: number;

  timer: number;
  turnSeconds: number;

  history: HistEntry[];

  comboShow: boolean;
  comboText: string;

  showPause: boolean;
  onPauseOpen: () => void;
  onResume: () => void;
  onRestart: () => void;
  onResign: () => void;
  /** Online: no unilateral restart of a live duel. */
  hideRestart?: boolean;

  result: Result | null;
  resigned: boolean;
  winPetals: boolean;
  endMsg?: string;
  onRematch: () => void;
  onMenu: () => void;
}

const panelCard = (active: boolean): CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14,
  background: 'linear-gradient(180deg,#211913,#191310)',
  border: `1px solid ${active ? 'rgba(212,175,55,0.55)' : 'rgba(228,208,168,0.12)'}`,
  animation: active ? 'rv-cardPulse 2s ease-in-out infinite' : 'none',
  transition: 'border-color 0.3s',
});

export function ReversiGame(v: ReversiGameView) {
  const showEnd = v.result != null;
  const activeP1 = v.turn === 'p1' && !showEnd && !v.showPause;
  const activeP2 = v.turn === 'p2' && !showEnd && !v.showPause;
  const low = v.timer <= 10;
  const timerPct = Math.max(0, Math.min(100, (v.timer / v.turnSeconds) * 100));

  const isWin = v.result === 'win', isLose = v.result === 'lose';
  const accent = isWin ? '#d4af37' : isLose ? '#c7452e' : '#9a8c72';

  const petals = isWin && v.winPetals
    ? Array.from({ length: 16 }, (_, k) => (
        <span key={k} style={{
          position: 'absolute', left: ((k * 61) % 100) + '%', top: -30, width: 10, height: 16,
          borderRadius: '50% 50% 45% 55%/60% 60% 40% 40%', background: 'linear-gradient(180deg,#e8c65a,#a87d20)',
          opacity: 0, pointerEvents: 'none', animation: `rv-petalFall ${5 + (k % 4)}s linear ${(k * 0.37).toFixed(2)}s infinite`,
        }} />
      ))
    : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(16px,3vw,32px) 20px 40px', animation: 'rv-fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
      {/* Top bar */}
      <div style={{ width: 'min(1080px,100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button type="button" className="rv-ghost" onClick={v.onPauseOpen} style={{ height: 42, padding: '0 18px', borderRadius: 999, fontSize: 14 }}>‖ Pausa</button>
        <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 18, letterSpacing: '0.3em', textIndent: '0.3em', color: '#f1e8d6' }}>REVERSI</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.16em', color: '#d4af37', padding: '6px 12px', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 999 }}>{v.modeLabel}</span>
          <span style={{ fontSize: 12, color: '#9a8c72' }}>Jugada {v.moveNum}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26, justifyContent: 'center', alignItems: 'flex-start', width: 'min(1080px,100%)' }}>
        {/* Board + combo */}
        <div style={{ position: 'relative' }}>
          <ReversiBoard
            board={v.board}
            validSet={v.validSet}
            blackSkin={v.blackSkin}
            whiteSkin={v.whiteSkin}
            flipInfo={v.flipInfo}
            newInfo={v.newInfo}
            introGen={v.introGen}
            showCoords={v.showCoords}
            interactive={v.interactive}
            onPlay={v.onPlay}
          />
          {v.comboShow && (
            <div style={{ position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%,-50%)', fontFamily: "'Shippori Mincho',serif", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: '#e8c65a', textShadow: '0 0 24px rgba(212,175,55,0.6), 0 2px 6px rgba(0,0,0,0.8)', letterSpacing: '0.06em', pointerEvents: 'none', animation: 'rv-comboPop 1.6s cubic-bezier(0.16,1,0.3,1) both', zIndex: 5, whiteSpace: 'nowrap' }}>{v.comboText}</div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '1 1 300px', minWidth: 280, maxWidth: 560 }}>
          <div style={panelCard(activeP1)}>
            <span style={discAvatar(v.blackSkin, true, 40)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 16, color: '#f1e8d6' }}>{v.p1Name}</span>
              {activeP1 && v.p1Sub && <span style={{ fontSize: 12, color: '#e8c65a' }}>{v.p1Sub}</span>}
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: "'Shippori Mincho',serif", fontSize: 36, fontWeight: 700, color: '#f1e8d6', lineHeight: 1 }}>{v.p1Score}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(228,208,168,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, letterSpacing: '0.2em', color: '#9a8c72' }}>TIEMPO DE TURNO</span>
              <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 20, color: low ? '#e0704f' : '#e8c65a' }}>{v.timer}s</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(228,208,168,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: timerPct + '%', borderRadius: 999, background: low ? 'linear-gradient(90deg,#a02f1e,#e0704f)' : 'linear-gradient(90deg,#b8892a,#e8c65a)', transition: 'width 1s linear, background 0.4s' }} />
            </div>
          </div>

          <div style={panelCard(activeP2)}>
            <span style={discAvatar(v.whiteSkin, false, 40)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 16, color: '#f1e8d6' }}>{v.p2Name}</span>
              {activeP2 && v.p2Sub && <span style={{ fontSize: 12, color: '#9a8c72' }}>{v.p2Sub}</span>}
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: "'Shippori Mincho',serif", fontSize: 36, fontWeight: 700, color: '#f1e8d6', lineHeight: 1 }}>{v.p2Score}</span>
          </div>

          {/* History */}
          <div style={{ borderRadius: 14, background: 'linear-gradient(180deg,#1c1510,#171009)', border: '1px solid rgba(228,208,168,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 10px', fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.28em', color: '#9a8c72', textTransform: 'uppercase', borderBottom: '1px solid rgba(228,208,168,0.08)' }}>Registro · 記録</div>
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              {v.history.length === 0 ? (
                <div style={{ padding: '18px 16px', fontSize: 13, color: '#6e6250' }}>Aún no hay jugadas.</div>
              ) : (
                v.history.map((h, k) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid rgba(228,208,168,0.06)', fontSize: 13 }}>
                    <span style={{ color: '#6e6250', fontSize: 12, width: 20 }}>{String(h.num).padStart(2, '0')}</span>
                    <span style={historyDot(h.p === 'p1')} />
                    <span style={{ color: '#cfc2ab', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.text}</span>
                    <span style={{ marginLeft: 'auto', color: '#d4af37', fontSize: 12 }}>{h.pass ? 'paso' : '+' + h.flips}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pause dialog */}
      {v.showPause && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(10,7,4,0.72)', backdropFilter: 'blur(6px)', animation: 'rv-scrimIn 0.3s both' }}>
          <div style={{ width: 'min(420px,92vw)', background: 'linear-gradient(180deg,#241b12,#191310)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 18, padding: 32, boxShadow: '0 30px 80px rgba(0,0,0,0.7)', position: 'relative', overflow: 'hidden', animation: 'rv-dialogIn 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>
            <span style={{ position: 'absolute', right: -8, top: -34, fontFamily: "'Shippori Mincho',serif", fontSize: 150, lineHeight: 1, color: 'rgba(212,175,55,0.06)', pointerEvents: 'none' }}>静</span>
            <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.3em', color: '#d4af37', textTransform: 'uppercase' }}>Pausa · 静</div>
            <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 32, fontWeight: 600, color: '#f1e8d6', marginTop: 8 }}>Un respiro</div>
            <div style={{ fontSize: 14, color: '#9a8c72', marginTop: 8, lineHeight: 1.5 }}>El tablero espera en silencio.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 26 }}>
              <button type="button" className="rv-cta" onClick={v.onResume} style={{ height: 50, borderRadius: 999, fontSize: 16 }}>Reanudar</button>
              {!v.hideRestart && (
                <button type="button" className="rv-ghost" onClick={v.onRestart} style={{ height: 48, borderRadius: 999, fontSize: 14 }}>Reiniciar partida</button>
              )}
              <button type="button" className="rv-danger" onClick={v.onResign} style={{ height: 48, borderRadius: 999, fontSize: 14 }}>Abandonar</button>
            </div>
          </div>
        </div>
      )}

      {/* End dialog */}
      {showEnd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(10,7,4,0.75)', backdropFilter: 'blur(6px)', overflow: 'hidden', animation: 'rv-scrimIn 0.35s both' }}>
          {petals}
          <div style={{ width: 'min(440px,92vw)', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#241b12,#191310)', border: `1px solid ${isWin ? 'rgba(212,175,55,0.5)' : isLose ? 'rgba(199,69,46,0.45)' : 'rgba(228,208,168,0.25)'}`, borderRadius: 20, padding: 34, boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 60px ${isWin ? 'rgba(212,175,55,0.15)' : isLose ? 'rgba(199,69,46,0.12)' : 'rgba(0,0,0,0.3)'}`, animation: 'rv-dialogIn 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
            <span style={{ position: 'absolute', right: -10, top: -36, fontFamily: "'Shippori Mincho',serif", fontSize: 170, lineHeight: 1, color: 'rgba(212,175,55,0.07)', pointerEvents: 'none' }}>{isWin ? '勝' : isLose ? '敗' : '和'}</span>
            <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: accent }}>{isWin ? '勝利 · Victoria' : isLose ? '敗北 · Derrota' : '引分 · Empate'}</div>
            <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 42, fontWeight: 700, color: '#f1e8d6', marginTop: 8, lineHeight: 1.1 }}>{isWin ? 'Victoria' : isLose ? 'Derrota' : 'Empate'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, padding: '14px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(228,208,168,0.1)' }}>
              <span style={discAvatar(v.blackSkin, true, 28)} />
              <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 26, color: '#f1e8d6' }}>{v.p1Score}</span>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 12, letterSpacing: '0.2em', color: '#6e6250' }}>FICHAS</span>
              <span style={{ fontFamily: "'Shippori Mincho',serif", fontSize: 26, color: '#f1e8d6' }}>{v.p2Score}</span>
              <span style={discAvatar(v.whiteSkin, false, 28)} />
            </div>
            <div style={{ fontSize: 14, color: '#9a8c72', marginTop: 14, lineHeight: 1.55 }}>{v.endMsg}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
              <button type="button" className="rv-cta" onClick={v.onRematch} style={{ flex: 1, height: 50, borderRadius: 999, fontSize: 16 }}>Revancha</button>
              <button type="button" className="rv-ghost" onClick={v.onMenu} style={{ flex: 1, height: 50, borderRadius: 999, fontSize: 15 }}>Menú</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
