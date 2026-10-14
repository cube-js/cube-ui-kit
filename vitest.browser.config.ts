import { readFileSync } from 'node:fs';

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import { reactCompilerPlugin } from './scripts/compiler/transform.mjs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const tastyPkg = JSON.parse(
  readFileSync('./node_modules/@tenphi/tasty/package.json', 'utf-8'),
);
const menuLinkRequests: { url: string; method?: string; referrer?: string }[] =
  [];

/**
 * The browser project, run separately from the jsdom suite.
 *
 * A second project rather than a migration: the ~1400 jsdom tests cover logic,
 * ARIA and wiring, none of which needs a browser, and they run an order of
 * magnitude faster without one. This project takes only what jsdom cannot see —
 * real layout, real pointer and keyboard input, and real observers.
 *
 * Files opt in by name (`*.browser.test.tsx`), so the two suites cannot pick up
 * each other's specs.
 */
export default defineConfig({
  resolve: { dedupe: ['react', 'react-dom'] },
  // Compiler injects this import after Vite's dependency scan. Prebundle it
  // up front so discovering it cannot reload a running browser test.
  optimizeDeps: { include: ['react/compiler-runtime'] },
  plugins: [
    ...(process.env.UIKIT_REACT_COMPILER === 'on'
      ? [reactCompilerPlugin()]
      : []),
    {
      name: 'menu-native-link-destinations',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (!request.url?.startsWith('/__menu-link-test/')) return next();
          if (request.url === '/__menu-link-test/requests') {
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify(menuLinkRequests));
            return;
          }
          menuLinkRequests.push({
            url: request.url,
            method: request.method,
            referrer: request.headers.referer,
          });
          // Native navigation to 204 preserves the test iframe and its client.
          response.writeHead(204).end();
        });
      },
    },
  ],
  define: {
    __UIKIT_VERSION__: JSON.stringify(pkg.version),
    __TASTY_VERSION__: JSON.stringify(tastyPkg.version),
  },
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    globals: true,
    include: ['src/**/*.browser.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.browser.ts'],
    browser: {
      enabled: true,
      // Vitest 4 takes a provider factory rather than a name.
      provider: playwright(),
      // Headless so it behaves identically in CI and locally; pass
      // `--browser.headless=false` to watch a failure happen.
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
