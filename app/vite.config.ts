import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Client dev server on 5173; the WebSocket game server runs on 8787.
// In dev we proxy ws://localhost:5173/ws -> ws://localhost:8787 so the
// client can use a single same-origin URL everywhere.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8787',
        ws: true,
        rewriteWsOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
