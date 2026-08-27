/**
 * The probe's input/output channel.
 *
 * Results travel through a file rather than stdout. Stdout is not a usable
 * channel here: vitest interleaves reporter output with jsdom's complaints and
 * React's warnings, and — worse — a React warning can quote the probed markup,
 * so there is no delimiter that is safe to parse against arbitrary snippet
 * content.
 *
 * `node:fs` is correct for the jsdom tier and wrong for the browser tier, where
 * the harness runs inside Chromium and has no filesystem. That tier writes
 * through `commands.writeFile` from `@vitest/browser/context` instead, which is
 * why every filesystem call is confined to this module rather than inlined into
 * the harnesses.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { Styles } from '@tenphi/tasty';

export type ProbeMode = 'styles' | 'tokens' | 'render' | 'globals';

export interface ProbeInput {
  /** Fresh per invocation, so a stale result file can never be mistaken for this run's. */
  runId: string;
  mode: ProbeMode;
  /** Absolute path for the result JSON. */
  outPath: string;
  /**
   * Absolute path to the generated snippet module.
   *
   * Read from the input rather than written as a literal `import('./…')` so
   * TypeScript never tries to resolve it: the file does not exist in a fresh
   * checkout, and a literal specifier would fail a typecheck even though it
   * resolves fine at runtime.
   */
  snippetPath?: string;
  /**
   * The same module, addressed the way the browser tier has to reach it: a URL
   * relative to the Vite root. Chromium can only fetch what the dev server
   * serves, so an absolute filesystem path is requested as
   * `http://localhost:PORT/Users/…` and 404s.
   */
  snippetUrl?: string;
  styles?: Styles;
  tokenOptions?: { scheme?: 'light' | 'dark'; highContrast?: boolean };
  fullCss?: boolean;
  canonical?: boolean;
}

export function readInput(): ProbeInput {
  const path = process.env.PROBE_INPUT;

  if (!path) {
    throw new Error(
      'Probe harness: PROBE_INPUT is unset. Run this through `pnpm probe`, ' +
        'not directly through vitest.',
    );
  }

  return JSON.parse(readFileSync(path, 'utf-8')) as ProbeInput;
}

export function writeResult(
  input: ProbeInput,
  result: Record<string, unknown>,
): void {
  mkdirSync(dirname(input.outPath), { recursive: true });
  writeFileSync(
    input.outPath,
    JSON.stringify(
      {
        runId: input.runId,
        // Recorded because jsdom versions disagree about which CSS rules
        // survive, and Cube Cloud's probe runs a different major (^26) against
        // this same `@cube-dev/ui-kit/probe` code. Without this, two probes can
        // give different answers with no visible reason.
        jsdomVersion: process.env.PROBE_JSDOM_VERSION ?? 'unknown',
        ...result,
      },
      null,
      2,
    ),
  );
}
