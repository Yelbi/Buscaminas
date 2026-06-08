Digital readout for mines-remaining, the timer, or a score — terminal-style glowing digits on a dark inset.

```jsx
<Counter label="Minas" value={minesLeft} tone="red" digits={3} />
<Counter label="Tiempo" value={seconds} tone="cyan" />
```

`value` is zero-padded to `digits`. `tone` controls the glow color. Pass `label` for an eyebrow and `icon` for a leading glyph.
