# Buscaminas · Arcade Neon

A full implementation of the **Buscaminas — Design System** handoff: a playable
minesweeper with three modes — **Solitario** (offline), **Cooperativo** and
**Competitivo** (real-time multiplayer over WebSocket).

Built with **Vite + React + TypeScript**. Every screen is composed from the
design-system primitives (Button, Badge, Counter, Input, Segmented, Dialog,
Tile, Board, ModeCard, PlayerTag), using the exact design tokens (colors,
typography, spacing, neon-glow effects) copied verbatim into `src/styles/`.

## Run it

```bash
npm install
npm run dev        # client (http://localhost:5173) + game server (:8787) together
```

`npm run dev` launches both processes with `concurrently`. In development the
Vite dev server proxies `ws://localhost:5173/ws` → the game server on `:8787`,
so the client uses one same-origin URL everywhere.

To run them separately:

```bash
npm run dev:client   # Vite only
npm run dev:server   # WebSocket game server only (tsx watch)
```

### Try multiplayer locally

1. Open http://localhost:5173 in two browser tabs/windows.
2. Tab A: set a name, pick a difficulty, click **Cooperativo** or **Competitivo**.
3. Copy the room code shown in the lobby.
4. Tab B: paste the code under *"Únete con un código"* → **Unirse**.
5. Both players mark **Listo**; the host presses **Empezar partida**.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Client + server in watch mode |
| `npm run build` | Type-check (`tsc -b`) + production client build |
| `npm run typecheck` | Type-check only |
| `npm run preview` | Serve the built client |
| `npm run server` | Run the game server once (no watch) |

## Layout

```
app/
├─ index.html
├─ vite.config.ts          # client dev server + /ws proxy to :8787
├─ shared/                 # pure code shared by client AND server
│  ├─ types.ts             #   domain types, DIFFICULTIES
│  ├─ minesweeper.ts       #   authoritative game logic (board gen, flood-fill, win/lose)
│  └─ protocol.ts          #   WebSocket message envelopes
├─ server/                 # Node WebSocket game server
│  ├─ index.ts             #   connection handling, message routing, broadcast
│  └─ room.ts              #   authoritative Room (co-op shared board / versus per-player boards)
└─ src/
   ├─ styles/              # design tokens (verbatim) + app layout & motion
   ├─ components/          # the 10 design-system components, ported to TS
   ├─ game/                # useSoloGame, board input handlers
   ├─ net/useRoom.ts       # client WebSocket hook
   ├─ ui/                  # AppBar, Hud, GameControls, ResultDialog, Toast
   ├─ screens/             # Home, Lobby, SoloGame, OnlineGame
   └─ App.tsx              # top-level routing/state
```

## How each mode works

- **Solitario** — runs entirely client-side (`useSoloGame`). First click is always
  safe (mines are placed lazily, avoiding the first cell and its neighbors). Best
  times are saved per difficulty in `localStorage`.
- **Cooperativo** — one shared board hosted by the server. Both players reveal and
  flag the same field; cells are tinted by who revealed them. You win or lose together.
- **Competitivo** — both players get the **same** board (one seed → identical mine
  layout, so it's a fair race). First to clear all safe cells wins; pisar una mina = pierdes.
  The opponent's masked board is shown live as a progress mini-map.

The server is **authoritative**: it owns the mine layout and never sends hidden
cells to clients (anti-cheat), only render-safe projections.

## Difficulties

| | Tablero | Minas | Ficha |
| --- | --- | --- | --- |
| Fácil | 9×9 | 10 | grande |
| Medio | 16×16 | 40 | media |
| Difícil | 16×30 | 99 | pequeña |

## Controls

- **Clic izquierdo** — revela una casilla. Sobre un número satisfecho por banderas,
  hace *chord* (revela los vecinos).
- **Clic derecho** — pone/quita bandera.
- **Modo bandera** — botón que convierte el toque en bandera (para móvil/táctil).

## Production note

For a single-origin deployment, serve the built `dist/` behind any static host and
run the game server; point the client at it with `VITE_WS_URL` at build time
(e.g. `VITE_WS_URL=wss://tu-host/ws`). Without it, the client defaults to
`ws://<hostname>:8787` in production and the Vite proxy in development.
