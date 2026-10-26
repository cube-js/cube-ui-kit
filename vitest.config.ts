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
    // The browser project owns `*.browser.test.*`. Without the exclusion they
    // run here too, in an environment with no layout — which is the one thing
    // they exist to avoid.
    //
    // `.claude/worktrees/**` holds full checkouts of other branches. Vitest globs
    // with `dot: true`, so every one of them is otherwise collected alongside the
    // real suite: each spec runs twice (once per branch), a CLI path argument is
    // matched as a substring in both trees, and failures get reported from code
    // that is not on this branch. Worse for anything that writes: the registry
    // generator behind `pnpm audit-defaults` resolves its output against
    // `process.cwd()`, so a worktree's copy silently overwrites THIS tree's
    // `defaults.generated.ts` with its own branch's registry.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-uncompiled/**',
      '**/package-tests/**',
      '**/.claude/worktrees/**',
      '**/*.browser.test.{ts,tsx}',
    ],
    setupFiles: ['./src/test/setup.ts'],
    // Each file keeps its own VM context while warm workers reuse the module graph.
    // Recycle retained realms at a fixed budget: the default RAM/worker threshold
    // lets a single-worker run retain almost all host memory.
    pool: 'vmThreads',
    vmMemoryLimit: '1GB',
    server: {
      deps: {
        // A `vm` context loads externalized packages as Node does, and the
        // React Aria family ships ES module files inside CommonJS packages,
        // which Node rejects. Inlining sends them through Vite's transform.
        inline: [
          /@react-aria\//,
          /@react-stately\//,
          /@react-types\//,
          /\/react-aria\//,
          /\/react-stately\//,
          /@internationalized\//,
        ],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
