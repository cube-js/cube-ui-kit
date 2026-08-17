import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import browserConfig from './vitest.browser.config';

/**
 * The probe's browser project, run by `pnpm probe:browser`.
 *
 * It shares everything with the `*.browser.test.tsx` project — same Chromium,
 * same `src/test/setup.browser.ts`, same deliberate absence of the jsdom stubs —
 * and swaps in the harness as the only file.
 *
 * `mergeConfig` CONCATENATES arrays, so the base project's own `include` cannot
 * be overridden by merging: it would survive alongside ours and every browser
 * spec in the repo would run on each probe. It has to be dropped from the base
 * first, on a copy so the imported config object is left intact.
 */
const base = { ...browserConfig, test: { ...browserConfig.test } };

delete base.test.include;

export default defineConfig(
  mergeConfig(base, {
    // The harness runs inside Chromium, so `process.env.PROBE_INPUT` — how the
    // jsdom tier receives its input — does not exist. Bake the input in at
    // config time instead; the config is re-evaluated on every invocation, so it
    // is always this run's.
    define: {
      __PROBE_INPUT__: JSON.stringify(
        readFileSync(process.env.PROBE_INPUT ?? '', 'utf-8'),
      ),
    },
    resolve: {
      alias: {
        // `/probe` first — see the note in `vitest.probe.config.ts`.
        '@cube-dev/ui-kit/probe': resolve(import.meta.dirname, 'src/probe'),
        '@cube-dev/ui-kit': resolve(import.meta.dirname, 'src/index.ts'),
      },
    },
    test: {
      include: ['src/test/probe/harness.browser.probe.tsx'],
      browser: {
        // `commands.writeFile` is gated on `allowWrite`, which silently flips to
        // false when `api.host` is set to anything but localhost. Left unset on
        // purpose.
        screenshotFailures: false,
      },
    },
  }),
);
