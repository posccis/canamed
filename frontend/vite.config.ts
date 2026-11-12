import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Um único .env na raiz do monorepo alimenta backend e frontend (ADR-0004).
  envDir: '..',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Os cenários de comportamento (Playwright) vivem em `e2e/` e têm executor próprio.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
