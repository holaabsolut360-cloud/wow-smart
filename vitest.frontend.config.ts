import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/frontend/**/*.test.ts', 'tests/frontend/**/*.test.tsx'],
    setupFiles: ['tests/frontend/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage/frontend',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/vite-env.d.ts'],
      thresholds: {
        statements: 1,
        branches: 0,
        functions: 0,
        lines: 1,
      },
    },
  },
});
