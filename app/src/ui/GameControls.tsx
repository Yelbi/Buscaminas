import { Button } from '../components';

export function GameControls({
  flagMode,
  onToggleFlag,
  onNew,
  newLabel = 'Nueva partida',
  onLeave,
  leaveLabel = 'Salir',
}: {
  flagMode: boolean;
  onToggleFlag: () => void;
  onNew?: () => void;
  newLabel?: string;
  onLeave: () => void;
  leaveLabel?: string;
}) {
  return (
    <div className="row wrap center" style={{ gap: 'var(--sp-3)' }}>
      <Button
        variant={flagMode ? 'win' : 'ghost'}
        onClick={onToggleFlag}
        iconLeft={<span aria-hidden>⚑</span>}
        aria-pressed={flagMode}
      >
        {flagMode ? 'Modo bandera: ON' : 'Modo bandera'}
      </Button>
      {onNew && (
        <Button variant="primary" onClick={onNew}>{newLabel}</Button>
      )}
      <Button variant="ghost" onClick={onLeave}>{leaveLabel}</Button>
    </div>
  );
}
