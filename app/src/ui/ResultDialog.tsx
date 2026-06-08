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
}: {
  won: boolean;
  eyebrow: string;
  title: string;
  children: ReactNode;
  onAgain: () => void;
  againLabel?: string;
  onMenu: () => void;
}) {
  const tone: DialogTone = won ? 'lime' : 'red';
  return (
    <Dialog
      eyebrow={eyebrow}
      title={title}
      tone={tone}
      footer={<>
        <Button variant={won ? 'win' : 'primary'} block onClick={onAgain}>{againLabel}</Button>
        <Button variant="ghost" onClick={onMenu}>Menú</Button>
      </>}
    >
      {children}
    </Dialog>
  );
}
