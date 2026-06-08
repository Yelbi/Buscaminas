A framed grid of Tiles driven by a 2D cell array. Presentational — you own the game state.

```jsx
<Board
  cells={grid}                 // BoardCell[][]
  size="md"
  onCell={(r, c) => reveal(r, c)}
  onCellContext={(r, c) => flag(r, c)}
/>
```

Each cell is `{ state, value, owner }`. Set `framed={false}` to drop the panel chrome (e.g. versus side-by-side layouts where you supply your own frame).
