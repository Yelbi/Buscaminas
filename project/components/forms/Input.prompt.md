Text field with neon focus ring — names, room codes, search.

```jsx
<Input label="Tu nombre" placeholder="Jugador 1" />
<Input label="Código de sala" prefix="#" mono maxLength={6} placeholder="X7K2Q9" />
```

`mono` makes it a big tracked terminal-font field (ideal for room codes). `prefix` shows a static leading glyph. `tone` switches the focus color.
