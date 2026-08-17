import { resolve } from 'node:path';

import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import baseConfig from './vitest.config';

/**
 * The probe's vitest project, run by `pnpm probe` — never by `pnpm test`.
 *
 * It builds on the main jsdom config (for `define`, the `oxc` JSX runtime and
 * `src/test/setup.ts`, all of which the probe wants precisely because they are
 * what the main suite sees) and narrows `include` to the single harness file.
 *
 * The harness is named `*.probe.tsx`, which cannot match vitest's default
 * `**\/*.{test,spec}.?(c|m)[jt]s?(x)`. That is what keeps it out of the main
 * suite without adding it to that project's `exclude`.
 */
export default defineConfig(
  mergeConfig(baseConfig, {
    resolve: {
      alias: {
        // So a snippet reads exactly like consumer code — and exactly like the
        // same snippet run through Cube Cloud's `yarn probe`, where the package
        // is a real dependency.
        //
        // The `/probe` entry has to come first: Vite's string aliases also match
        // `<find>/…`, so the bare specifier would otherwise rewrite it to
        // `src/index.ts/probe`.
        '@cube-dev/ui-kit/probe': resolve(import.meta.dirname, 'src/probe'),
        '@cube-dev/ui-kit': resolve(import.meta.dirname, 'src/index.ts'),
      },
    },
    test: {
      include: ['src/test/probe/harness.probe.tsx'],
      // One file, one worker: isolation buys nothing here and costs worker boot
      // on every invocation, which is the latency you actually feel.
      isolate: false,
      fileParallelism: false,
    },
  }),
);
