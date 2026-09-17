import { defineConfig } from 'vitest/config';

// The phase 4 gate: no DOM, React, Root, or shared UI test setup.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/components/form/Form/modern/**/*.test.ts'],
  },
});
