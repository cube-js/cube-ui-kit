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
    // Each file still gets its own context, but a `vm` context inside a
    // long-lived worker reuses the compiled module graph instead of re-importing
    // it per file: the suite runs ~35% faster than on `threads`, for roughly
    // 2.5× the peak memory. `vmMemoryLimit` (default: system memory ÷ CPUs)
    // recycles a worker that outgrows it. Sharing one context across files
    // (`isolate: false`) is not the same thing: it fails dozens of specs.
    pool: 'vmThreads',
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
