Centered modal over a blurred scrim — win/lose results, pause menu, room settings.

```jsx
{result && (
  <Dialog
    eyebrow="Partida terminada"
    title="¡Campo despejado!"
    tone="lime"
    onClose={close}
    footer={<><Button variant="win" block>Jugar otra vez</Button><Button variant="ghost">Menú</Button></>}
  >
    Tiempo: 1:42 · Sin errores.
  </Dialog>
)}
```

Render conditionally. `tone` colors the border glow and title — use `lime` for win, `red` for lose. Clicking the scrim calls `onClose`.
