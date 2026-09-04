import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { isDevEnv, isDevEnvOrTest } from './is-dev-env';

describe('isDevEnv()', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    localStorage.removeItem('UIKIT_DEBUG');
  });

  describe('NODE_ENV', () => {
    it.each([
      ['production', false],
      ['test', false],
      ['development', true],
      ['staging', true],
    ])('is %s under NODE_ENV=%s', (nodeEnv, expected) => {
      process.env.NODE_ENV = nodeEnv;

      expect(isDevEnv()).toBe(expected);
    });

    it('is read on every call, not captured once at import', () => {
      // The bug this guards: a NODE_ENV comparison evaluated once - at module
      // scope, or worse at ui-kit build time - answers for whatever environment
      // did the evaluating and then answers the same way forever.
      process.env.NODE_ENV = 'production';
      expect(isDevEnv()).toBe(false);

      process.env.NODE_ENV = 'development';
      expect(isDevEnv()).toBe(true);
    });

    it('is off when NODE_ENV says nothing at all', () => {
      delete process.env.NODE_ENV;

      expect(isDevEnv()).toBe(false);
    });
  });

  describe('UIKIT_DEBUG', () => {
    it('forces diagnostics on in production', () => {
      process.env.NODE_ENV = 'production';
      localStorage.setItem('UIKIT_DEBUG', 'true');

      expect(isDevEnv()).toBe(true);
    });

    it('forces diagnostics off in development', () => {
      // The escape hatch has to work in both directions: a consumer whose build
      // reports "development" needs a way to silence us without shipping a patch.
      process.env.NODE_ENV = 'development';
      localStorage.setItem('UIKIT_DEBUG', 'false');

      expect(isDevEnv()).toBe(false);
    });

    it.each(['TRUE', 'True'])('accepts %s case-insensitively', (flag) => {
      process.env.NODE_ENV = 'production';
      localStorage.setItem('UIKIT_DEBUG', flag);

      expect(isDevEnv()).toBe(true);
    });

    it('defers to NODE_ENV when set to anything else', () => {
      process.env.NODE_ENV = 'production';
      localStorage.setItem('UIKIT_DEBUG', 'yes');

      expect(isDevEnv()).toBe(false);
    });
  });

  it('returns false rather than throwing when there is no `process`', () => {
    // A browser bundle that never substituted the NODE_ENV read has no `process`
    // to dereference. Before the build stopped folding NODE_ENV this could not
    // happen, because the read never reached the output - so the guard that keeps
    // a bare `process` reference from becoming a ReferenceError is load-bearing
    // now, and a plain `<script type="module">` consumer is what it protects.
    const realProcess = globalThis.process;

    // @ts-expect-error - deliberately removing a global to model that consumer.
    delete globalThis.process;

    try {
      expect(isDevEnv()).toBe(false);
    } finally {
      globalThis.process = realProcess;
    }
  });
});

describe('isDevEnvOrTest()', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    localStorage.removeItem('UIKIT_DEBUG');
  });

  it.each([
    ['production', false],
    ['test', true],
    ['development', true],
  ])('is %s under NODE_ENV=%s', (nodeEnv, expected) => {
    process.env.NODE_ENV = nodeEnv;

    expect(isDevEnvOrTest()).toBe(expected);
  });

  it('differs from isDevEnv() only under test', () => {
    // The split is the point: a deprecation warning is worth hearing from CI,
    // while a complaint about a zero-height measurement is simply wrong there,
    // because jsdom reports zero for everything.
    process.env.NODE_ENV = 'test';

    expect(isDevEnv()).toBe(false);
    expect(isDevEnvOrTest()).toBe(true);
  });

  it('is off when NODE_ENV says nothing at all', () => {
    delete process.env.NODE_ENV;

    expect(isDevEnvOrTest()).toBe(false);
  });

  it.each([
    ['true', 'production', true],
    ['false', 'development', false],
  ])('honours UIKIT_DEBUG=%s under NODE_ENV=%s', (flag, nodeEnv, expected) => {
    process.env.NODE_ENV = nodeEnv;
    localStorage.setItem('UIKIT_DEBUG', flag);

    expect(isDevEnvOrTest()).toBe(expected);
  });

  it('returns false rather than throwing when there is no `process`', () => {
    const realProcess = globalThis.process;

    // @ts-expect-error - deliberately removing a global to model that consumer.
    delete globalThis.process;

    try {
      expect(isDevEnvOrTest()).toBe(false);
    } finally {
      globalThis.process = realProcess;
    }
  });
});

describe('the published build', () => {
  // `isDevEnv()` is only a runtime answer if the NODE_ENV read survives into
  // `dist`. It did not: `platform: 'browser'` makes rolldown inline
  // `process.env.NODE_ENV` as the literal NODE_ENV of the release machine, which
  // shipped `isDevEnv()` hard-wired to `true` in v0.172.0 and replaced consumers'
  // Layout subtrees with a developer warning. Run the real config over the real
  // source and assert the read is still there.
  it('does not inline the NODE_ENV read', async () => {
    const { build } = await import('tsdown');
    const { default: config } = await import('../../tsdown.config');

    const outDir = mkdtempSync(join(tmpdir(), 'uikit-nodeenv-'));

    try {
      await build({
        ...(config as Record<string, unknown>),
        entry: { 'is-dev-env': 'src/utils/is-dev-env.ts' },
        outDir,
        // Types are irrelevant to the question and dominate the build time.
        dts: false,
        sourcemap: false,
        copy: [],
      });

      const code = readFileSync(join(outDir, 'is-dev-env.js'), 'utf-8')
        // The doc comments name `process.env.NODE_ENV` too; only code counts.
        .replace(/\/\*[\s\S]*?\*\//g, '');

      expect(code).toContain('process.env.NODE_ENV');

      // And the read is not merely present but live. Ask the built artifact
      // itself, in a fresh process per environment, because "contains the right
      // text" is what the folded build also managed for every other line.
      const ask = (nodeEnv: string) =>
        execFileSync(
          process.execPath,
          [
            '--input-type=module',
            '-e',
            `import { isDevEnv, isDevEnvOrTest } from ${JSON.stringify(
              pathToFileURL(join(outDir, 'is-dev-env.js')).href,
            )};` + `console.log(isDevEnv(), isDevEnvOrTest());`,
          ],
          { env: { ...process.env, NODE_ENV: nodeEnv }, encoding: 'utf-8' },
        ).trim();

      expect(ask('production')).toBe('false false');
      expect(ask('test')).toBe('false true');
      expect(ask('development')).toBe('true true');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 60_000);
});
