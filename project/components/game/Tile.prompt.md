The core Minesweeper cell. Compose many into a board grid.

```jsx
<Tile state="hidden" onClick={reveal} onContextMenu={flag} />
<Tile state="revealed" value={3} />
<Tile state="flagged" />
<Tile state="exploded" />
<Tile state="revealed" value={2} owner="p1" />  {/* co-op ownership edge */}
```

`state` drives appearance; `value` (1–8) shows the neon-colored adjacency number when `revealed`. `owner` adds a player-colored edge for co-op/versus. Left-click = reveal, right-click = flag (wire up via handlers).
