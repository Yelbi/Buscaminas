import type { CSSProperties } from 'react';
import type { Board } from '../../shared/reversi';
import { discFace } from './skins';
import type { SkinId } from './skins';

const FRAME: CSSProperties = {
  padding: 'clamp(10px,2vw,18px)', borderRadius: 18,
  background: 'repeating-linear-gradient(104deg, rgba(0,0,0,0.10) 0 2px, transparent 2px 9px), linear-gradient(160deg,#42301c,#2a1b0d 60%,#1c1108)',
  boxShadow: '0 24px 70px rgba(0,0,0,0.65), inset 0 1px 0 rgba(232,198,90,0.22), inset 0 0 0 1px rgba(0,0,0,0.55)',
};
const INNER: CSSProperties = {
  padding: 8, border: '1px solid rgba(212,175,55,0.32)', borderRadius: 10, background: '#0d0906',
};
const RANK: CSSProperties = { position: 'absolute', top: 2, left: 5, fontSize: 9, color: 'rgba(212,175,55,0.4)', pointerEvents: 'none' };
const FILE: CSSProperties = { position: 'absolute', bottom: 1, right: 5, fontSize: 9, color: 'rgba(212,175,55,0.4)', pointerEvents: 'none' };
const RING: CSSProperties = {
  position: 'absolute', inset: '27%', border: '2px solid rgba(212,175,55,0.55)', borderRadius: '50%',
  boxShadow: '0 0 12px rgba(212,175,55,0.25)', animation: 'rv-ringPulse 1.7s ease-in-out infinite', pointerEvents: 'none',
};
const WRAP: CSSProperties = { position: 'absolute', inset: '9%', perspective: '480px', display: 'block', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))' };
const FLIPPER: CSSProperties = { position: 'absolute', inset: 0, display: 'block', transformStyle: 'preserve-3d' };

export interface ReversiBoardProps {
  board: Board | null;
  validSet: ReadonlySet<number>;
  /** Skin for the black (p1) discs. */
  blackSkin: SkinId;
  /** Skin for the white (p2) discs. */
  whiteSkin: SkinId;
  flipInfo: Record<number, number>;
  newInfo: Record<number, number>;
  introGen: number;
  showCoords: boolean;
  interactive: boolean;
  onPlay: (i: number) => void;
}

export function ReversiBoard({
  board, validSet, blackSkin, whiteSkin, flipInfo, newInfo, introGen, showCoords, interactive, onPlay,
}: ReversiBoardProps) {
  // Faces are identical for every disc — only the flipper's rotation differs.
  const faceA = discFace(blackSkin, true, false);
  const faceB = discFace(whiteSkin, false, true);

  const cells = [];
  for (let i = 0; i < 64; i++) {
    const owner = board ? board[i] : null;
    const isValid = validSet.has(i);
    const nd = newInfo[i];
    const fd = flipInfo[i] || 0;
    const clickable = interactive && isValid;
    cells.push(
      <div
        key={i}
        className={`rv-cell${isValid ? ' rv-cell--valid' : ''}`}
        onClick={clickable ? () => onPlay(i) : undefined}
        style={{
          cursor: clickable ? 'pointer' : 'default',
          animation: `rv-cellIn${introGen % 2 ? 'A' : 'B'} 0.55s cubic-bezier(0.16,1,0.3,1) both`,
          animationDelay: ((i % 8) + ((i / 8) | 0)) * 42 + 'ms',
        }}
      >
        {showCoords && i % 8 === 0 && <span style={RANK}>{((i / 8) | 0) + 1}</span>}
        {showCoords && ((i / 8) | 0) === 7 && <span style={FILE}>{'ABCDEFGH'[i % 8]}</span>}
        {isValid && <span style={RING} />}
        {owner && (
          <span style={{ ...WRAP, animation: nd != null ? `rv-discIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${nd}ms both` : 'none' }}>
            <span
              style={{
                ...FLIPPER,
                transform: owner === 'p2' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: `transform 0.55s cubic-bezier(0.65,0,0.35,1) ${fd}ms`,
              }}
            >
              <span style={faceA} />
              <span style={faceB} />
            </span>
          </span>
        )}
      </div>,
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={FRAME}>
        <div style={INNER}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 2, width: 'min(86vw, 60vh, 536px)' }}>
            {cells}
          </div>
        </div>
      </div>
    </div>
  );
}
