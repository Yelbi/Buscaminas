Player identity chip — avatar initial, name, status/score — color-coded by slot.

```jsx
<PlayerTag name="Ana"  slot="p1" ready />
<PlayerTag name="Beto" slot="p2" status="Conectando…" />
<PlayerTag name="Ana"  slot="p1" score={12} active />   {/* versus scoreboard */}
```

`slot` picks the color (p1 cyan, p2 magenta, host lime). `active` highlights the current turn; `ready` shows a green ready dot; `score` renders a mono numeral on the right.
