Big tappable card for the main menu — one per game mode (Solitario / Cooperativo / Competitivo).

```jsx
<ModeCard tone="cyan"    title="Solitario"   players="1" icon={<Bomb/>}  subtitle="Despeja el campo a tu ritmo." onClick={...} />
<ModeCard tone="lime"    title="Cooperativo" players="2" icon={<Users/>} subtitle="Un tablero, dos mentes." active />
<ModeCard tone="magenta" title="Competitivo" players="2" icon={<Swords/>} subtitle="Mismo nivel, primero en ganar." />
```

`tone` sets the accent glow; `active` marks the current selection. Icon sits in a glowing tile; player count shows as a pill.
