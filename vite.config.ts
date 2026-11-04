import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Protótipo servido em ambiente de preview proxied (E2B / Arena).
// `allowedHosts: true` permite o host do preview; em produção real,
// restringir ao domínio corporativo (ver docs/04-seguranca.md).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
});
