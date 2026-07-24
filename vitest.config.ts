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
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // forks: process isolation avoids happy-dom async-task leaks (Menu/FocusScope
    // teardown) poisoning subsequent files when using the threads pool.
    pool: 'forks',
    // Happy DOM follows <a href> / location navigations with real fetches by
    // default (default URL is http://localhost:3000). Disable navigation and
    // asset loading so action/link tests don't hang on ECONNREFUSED.
    environmentOptions: {
      happyDOM: {
        url: 'http://localhost/',
        settings: {
          disableJavaScriptFileLoading: true,
          disableCSSFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
          navigation: {
            disableMainFrameNavigation: true,
            disableChildFrameNavigation: true,
            disableChildPageNavigation: true,
          },
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
