import type { ReactNode } from 'react';
import { Button, Dialog } from '../components';
import type { DialogTone } from '../components';

export function ResultDialog({
  won,
  eyebrow,
  title,
  children,
  onAgain,
  againLabel = 'Jugar otra vez',
  onMenu,
  onInspect,
}: {
  won: boolean;
  eyebrow: string;
  title: string;
  children: ReactNode;
  onAgain: () => void;
  againLabel?: string;
  onMenu: () => void;
  /** Close the dialog to inspect the board (a floating button reopens it). */
  onInspect?: () => void;
}) {
  const tone: DialogTone = won ? 'lime' : 'red';
  return (
    <Dialog
      eyebrow={eyebrow}
      title={title}
      tone={tone}
      onClose={onInspect}
      footer={
        <div className="stack" style={{ gap: 'var(--sp-3)', width: '100%' }}>
          <Button variant={won ? 'win' : 'primary'} block onClick={onAgain}>{againLabel}</Button>
          <div className="row" style={{ gap: 'var(--sp-3)' }}>
            <Button variant="ghost" onClick={onMenu} style={{ flex: 1 }}>Menú</Button>
            {onInspect && (
              <Button variant="ghost" onClick={onInspect} style={{ flex: 1 }}>Analizar tablero</Button>
            )}
          </div>
        </div>
      }
    >
      {children}
    </Dialog>
  );
}

/** Floating button shown while the result dialog is dismissed for inspection. */
export function ResultReopen({ won, onClick }: { won: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'fixed', left: '50%', bottom: 'var(--sp-6)', transform: 'translateX(-50%)',
        zIndex: 1100, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)',
        height: 'var(--ctl-md)', padding: '0 22px', borderRadius: 'var(--r-pill)',
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-sm)',
        color: '#07070f',
        background: won ? 'var(--neon-lime)' : 'var(--neon-cyan)',
        border: 'none',
        boxShadow: won
          ? '0 0 22px rgba(157,255,61,0.55)'
          : '0 0 22px rgba(25,227,255,0.55)',
      }}
    >
      Ver resultado
    </button>
  );
}
