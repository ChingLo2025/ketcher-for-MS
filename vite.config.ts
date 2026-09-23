import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  // Ketcher's bundles expect Node globals.
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  // Ketcher's Indigo worker is an ES module (type: 'module') that loads its .wasm via import.meta.url.
  worker: {
    format: 'es',
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
