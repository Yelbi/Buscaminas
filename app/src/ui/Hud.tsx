import type { ReactNode } from 'react';
import { Counter } from '../components';
import { seconds } from '../lib/format';

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function Hud({
  minesRemaining,
  elapsedMs,
  left,
  right,
}: {
  minesRemaining: number;
  elapsedMs: number;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="hud">
      {left}
      <Counter label="Minas" value={minesRemaining} digits={3} tone="red" icon={<span aria-hidden>✸</span>} />
      <Counter label="Tiempo" value={seconds(elapsedMs)} digits={3} tone="cyan" icon={<ClockIcon />} />
      {right}
    </div>
  );
}
