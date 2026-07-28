import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Configuración de Vitest separada de vite.config.ts a propósito.
//
// Cuando existen ambos archivos (vite.config.ts y vitest.config.ts),
// Vitest usa SIEMPRE este último — así los tests no dependen del plugin
// @tailwindcss/vite (que usa un binario nativo en Rust específico por
// plataforma) ni de nada relacionado al build de producción. Los tests
// solo necesitan transformar JSX/TSX, nada de procesamiento de CSS.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
