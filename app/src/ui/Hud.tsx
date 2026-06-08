import type { ReactNode } from 'react';
import { Counter } from '../components';
import { seconds } from '../lib/format';

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
      <Counter label="Tiempo" value={seconds(elapsedMs)} digits={3} tone="cyan" />
      {right}
    </div>
  );
}
