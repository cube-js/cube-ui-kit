import { readFileSync } from 'node:fs';

import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const tastyPkg = JSON.parse(
  readFileSync('./node_modules/@tenphi/tasty/package.json', 'utf-8'),
);

export default defineConfig({
  define: {
    __UIKIT_VERSION__: JSON.stringify(pkg.version),
    __TASTY_VERSION__: JSON.stringify(tastyPkg.version),
  },
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // threads + isolate:false: worker_threads are lighter than child_process
    // forks, and reusing the jsdom env + module graph across files in the same
    // worker eliminates per-file setup/import overhead (~10s saved on 63 files).
    // vi.mock() registry is still reset between files by Vitest; RTL cleanup()
    // runs after each test, so test isolation is preserved.
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
