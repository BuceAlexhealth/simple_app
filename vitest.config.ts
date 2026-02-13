import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/*.stories.tsx',
        'src/**/*.styles.ts',
        '.next/',
        'vitest.config.ts',
        'vitest.setup.ts',
      ],
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
