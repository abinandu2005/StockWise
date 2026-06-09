import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // ─────────────────────────────────────────────────────────────────
    // NO proxy block here.
    //
    // Previously, Vite proxied /api/* to individual microservice ports,
    // which meant every request was seen by the browser as hitting
    // localhost:5173 — completely bypassing the API Gateway.
    //
    // Now, api.js uses VITE_API_URL=http://localhost:9090/api (absolute).
    // Requests go directly:
    //   Browser → API Gateway (:9090) → Microservice
    //
    // The API Gateway's CORS config (allowed-origins=*) handles the
    // cross-origin request from the Vite dev server at :5173.
    // ─────────────────────────────────────────────────────────────────
  },
});
