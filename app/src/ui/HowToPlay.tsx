import { useState } from 'react';
import { Button, Dialog } from '../components';

export function HowToPlay() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} iconLeft={<span aria-hidden>?</span>}>
        ¿Cómo se juega?
      </Button>
      {open && (
        <Dialog
          eyebrow="Guía rápida"
          title="¿Cómo se juega?"
          tone="cyan"
          onClose={() => setOpen(false)}
          width={520}
          footer={<Button variant="primary" block onClick={() => setOpen(false)}>Entendido</Button>}
        >
          <ul style={{ margin: 0, paddingLeft: '1.1em', display: 'grid', gap: 'var(--sp-2)', lineHeight: 1.5 }}>
            <li><b style={{ color: 'var(--neon-cyan)' }}>Objetivo:</b> despeja todas las casillas sin pisar una mina.</li>
            <li><b style={{ color: 'var(--neon-cyan)' }}>Revelar:</b> clic izquierdo (o toca en móvil).</li>
            <li><b style={{ color: 'var(--neon-cyan)' }}>Bandera:</b> clic derecho · en móvil mantén pulsado · o activa <b>Modo bandera</b>.</li>
            <li><b style={{ color: 'var(--neon-cyan)' }}>Números:</b> dicen cuántas minas hay en las 8 casillas vecinas.</li>
            <li><b style={{ color: 'var(--neon-cyan)' }}>Despeje rápido:</b> clic en un número que ya tiene todas sus banderas para revelar el resto.</li>
            <li><b style={{ color: 'var(--neon-cyan)' }}>Modos:</b> Solitario · Cooperativo (un tablero en equipo) · Competitivo (mismo tablero, a despejar primero).</li>
          </ul>
        </Dialog>
      )}
    </>
  );
}
