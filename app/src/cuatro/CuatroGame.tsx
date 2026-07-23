import type { CSSProperties } from 'react';
import type { Board, Player } from '../../shared/cuatro';
import { CuatroBoard, useC4Cell, boardWidth } from './CuatroBoard';
import type { C4Theme } from './themes';
import type { Confetti, Disc, Result } from './useCuatroGame';

export interface CuatroDialog {
  title: string;
  color: string;
  sub: string;
  primary: string;
  onPrimary: () => void;
  ghost: string;
  onGhost: () => void;
  score: boolean;
}

export interface CuatroGameView {
  theme: C4Theme;
  board: Board;
  discs: Disc[];
  result: Result | null;
  hover: number | null;
  interactive: boolean;
  myPlayer: Player;
  turn: Player;
  onDrop: (c: number) => void;
  onHover: (c: number | null) => void;

  online: boolean;
  p1Name: string;
  p2Name: string;
  turnText: string;

  round?: number;
  bestOfLbl?: string;
  scoreMe?: number;
  scoreRival?: number;
  timerPct?: number;
  timerColor?: string;

  hintText: string;
  onUndo?: () => void;
  undoEnabled?: boolean;
  onRestart?: () => void;
  onAbandon?: () => void;

  dlg: CuatroDialog | null;
  confetti: Confetti[];
}

const barBorder = (active: boolean, color: string) => (active ? color : 'rgba(125,144,196,0.25)');

export function CuatroGame(v: CuatroGameView) {
  const cell = useC4Cell();
  const bw = boardWidth(cell);
  const turnColor = v.result ? '#7d90c4' : v.turn === 1 ? '#ff4d4d' : '#ffd23f';
  const oppThinking = !v.result && v.turn !== v.myPlayer;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', animation: 'c4-screen-in 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
      {v.online && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7d90c4' }}>Ronda {v.round} · Mejor de {v.bestOfLbl}</span>
          <span style={{ fontFamily: "'Passion One', sans-serif", fontSize: 40, lineHeight: 1 }}>
            <span style={{ color: '#ff4d4d' }}>{v.scoreMe}</span><span style={{ color: '#7d90c4' }}> — </span><span style={{ color: '#ffd23f' }}>{v.scoreRival}</span>
          </span>
        </div>
      )}

      {/* Player bars + turn indicator */}
      <div style={{ width: '100%', maxWidth: bw, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 14, background: '#0d1730', border: `1px solid ${barBorder(v.turn === 1 && !v.result, 'rgba(255,77,77,0.8)')}`, boxShadow: v.turn === 1 && !v.result ? '0 0 18px rgba(255,77,77,0.25)' : 'none', transition: 'border-color 0.25s, box-shadow 0.25s' }}>
          <span style={{ width: 26, height: 26, borderRadius: 999, background: 'radial-gradient(circle at 35% 30%, #ff8a80, #ff4d4d 55%, #d92f2f 95%)', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.22)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{v.p1Name}</span>
            <span style={{ fontSize: 11, color: '#7d90c4' }}>Rojas</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 130 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, color: turnColor }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: turnColor, boxShadow: `0 0 8px ${turnColor}`, animation: oppThinking ? 'c4-blink 1s ease-in-out infinite' : 'none' }} />
            {v.turnText}
          </span>
          {v.online && (
            <div style={{ width: 150, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, width: `${v.timerPct ?? 0}%`, background: v.timerColor ?? '#ffd23f', transition: 'width 0.9s linear, background 0.3s' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 14, background: '#0d1730', border: `1px solid ${barBorder(v.turn === 2 && !v.result, 'rgba(255,210,63,0.8)')}`, boxShadow: v.turn === 2 && !v.result ? '0 0 18px rgba(255,210,63,0.25)' : 'none', transition: 'border-color 0.25s, box-shadow 0.25s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'right' }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{v.p2Name}</span>
            <span style={{ fontSize: 11, color: '#7d90c4' }}>Amarillas</span>
          </div>
          <span style={{ width: 26, height: 26, borderRadius: 999, background: 'radial-gradient(circle at 35% 30%, #ffe98c, #ffd23f 55%, #e5ac16 95%)', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.22)' }} />
        </div>
      </div>

      <CuatroBoard
        cell={cell}
        board={v.board}
        discs={v.discs}
        result={v.result}
        theme={v.theme}
        interactive={v.interactive}
        myPlayer={v.myPlayer}
        hover={v.hover}
        onDrop={v.onDrop}
        onHover={v.onHover}
      />

      {/* Controls */}
      <div style={{ width: '100%', maxWidth: bw, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: '#52618f', fontSize: 13 }}>{v.hintText}</span>
        {!v.online ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="c4-ghost c4-ghost--blue" onClick={v.onUndo} style={{ height: 40, padding: '0 16px', borderRadius: 11, fontSize: 13, opacity: v.undoEnabled ? 1 : 0.35 }}>↶ Deshacer</button>
            <button type="button" className="c4-ghost" onClick={v.onRestart} style={{ height: 40, padding: '0 16px', borderRadius: 11, fontSize: 13 }}>↺ Reiniciar</button>
          </div>
        ) : (
          <button type="button" className="c4-ghost c4-ghost--red" onClick={v.onAbandon} style={{ height: 40, padding: '0 16px', borderRadius: 11, fontSize: 13 }}>Abandonar duelo</button>
        )}
      </div>

      {/* Result dialog */}
      {v.dlg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,9,20,0.74)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', overflow: 'hidden' }}>
          {v.confetti.map((p, i) => {
            const cs: Record<string, string | number> = {
              position: 'absolute', top: '-6vh', left: `${p.left}%`, width: p.s, height: p.h,
              background: p.color, borderRadius: p.br, '--cx': p.cx, '--cr': p.cr,
              animation: `c4-conf ${p.dur}s linear ${p.delay}s both`,
            };
            return <div key={i} style={cs as CSSProperties} />;
          })}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '40px 48px', borderRadius: 22, background: '#0d1730', border: '1px solid rgba(64,120,255,0.45)', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(64,120,255,0.12)', maxWidth: 420, margin: 20, textAlign: 'center', animation: 'c4-pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <span style={{ fontFamily: "'Passion One', sans-serif", fontSize: 62, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '0.02em', color: v.dlg.color }}>{v.dlg.title}</span>
            {v.dlg.score && (
              <span style={{ fontFamily: "'Passion One', sans-serif", fontSize: 34, lineHeight: 1 }}>
                <span style={{ color: '#ff4d4d' }}>{v.scoreMe}</span><span style={{ color: '#7d90c4' }}> — </span><span style={{ color: '#ffd23f' }}>{v.scoreRival}</span>
              </span>
            )}
            <span style={{ color: '#7d90c4', fontSize: 15, lineHeight: 1.5 }}>{v.dlg.sub}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <button type="button" className="c4-cta" onClick={v.dlg.onPrimary} style={{ height: 50, padding: '0 28px', borderRadius: 12, fontSize: 21 }}>{v.dlg.primary}</button>
              <button type="button" className="c4-ghost" onClick={v.dlg.onGhost} style={{ height: 50, padding: '0 22px', borderRadius: 12, fontSize: 15, color: '#b9c6ea' }}>{v.dlg.ghost}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
