import { readFileSync } from 'node:fs';

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const tastyPkg = JSON.parse(
  readFileSync('./node_modules/@tenphi/tasty/package.json', 'utf-8'),
);

export default defineConfig({
  cacheDir: 'node_modules/.vite-precompiled',
  define: {
    __UIKIT_VERSION__: JSON.stringify(pkg.version),
    __TASTY_VERSION__: JSON.stringify(tastyPkg.version),
  },
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  optimizeDeps: {
    // This test imports the complete UI Kit graph from a fresh checkout. Pin
    // every dependency Vite otherwise discovers in two waves; a mid-run
    // optimizer reload drops the only browser test before it can register.
    include: [
      '@internationalized/date',
      '@react-aria/focus',
      '@react-aria/i18n',
      '@react-aria/interactions',
      '@react-aria/ssr',
      '@react-aria/utils',
      '@react-spectrum/utils',
      '@react-stately/selection',
      '@react-stately/utils',
      '@tabler/icons-react',
      '@tanstack/react-virtual',
      '@tenphi/glaze',
      '@tenphi/tasty/precompile/register',
      '@testing-library/user-event',
      'clipboard-copy',
      'clsx',
      'diff',
      'email-validator',
      'prism-react-renderer',
      'prismjs/components/prism-bash.js',
      'prismjs/components/prism-javascript.js',
      'prismjs/components/prism-markup.js',
      'prismjs/components/prism-sql.js',
      'prismjs/components/prism-yaml.js',
      'react-dom',
      'react-hotkeys-hook',
      'react-is',
      'react-stately',
      'tiny-invariant',
      'valid-url',
    ],
  },
  test: {
    globals: true,
    include: ['scripts/precompile-parity.browser.jsx'],
    setupFiles: ['./src/test/setup.browser.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
