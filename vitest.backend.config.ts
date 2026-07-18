import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/backend/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage/backend',
      include: ['server/**/*.ts'],
      exclude: ['server/**/*.d.ts'],
      thresholds: {
        statements: 40,
        branches: 35,
        functions: 50,
        lines: 45,
      },
    },
  },
});
