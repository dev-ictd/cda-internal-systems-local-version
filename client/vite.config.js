import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Dev server proxies API/upload requests to the Express backend so the
// whole thing behaves as one app (`npm run dev:server` + `npm run dev:client`).
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
  },
});

