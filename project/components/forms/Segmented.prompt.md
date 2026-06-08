Pill segmented control for exclusive choices — difficulty, board size, mode sub-options.

```jsx
<Segmented
  options={['Fácil', 'Medio', 'Difícil']}
  value={difficulty}
  onChange={setDifficulty}
/>
```

Options can be plain strings or `{ value, label }`. The selected segment fills with the `tone` color and glows.
