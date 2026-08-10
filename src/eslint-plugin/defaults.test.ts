import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULTS } from './defaults.generated';
import { componentsWithDocumentedDefaults } from './docs-defaults';
import { FIXTURES } from './fixtures';
import { buildRegistry, serializeRegistry, summarize } from './generate';

/**
 * The sync guard.
 *
 * Re-proves every registry entry against the live components. A default that
 * moves, an exclusion that stops being condition-dependent, or a newly
 * documented default all fail here — which is what stops the registry rotting
 * silently between releases.
 *
 * Regenerate with:  UPDATE_DEFAULTS=1 pnpm test defaults
 */

const OUTPUT = join(
  process.cwd(),
  'src',
  'eslint-plugin',
  'defaults.generated.ts',
);

describe('defaults registry', () => {
  const fresh = buildRegistry();

  if (process.env.UPDATE_DEFAULTS) {
    it('regenerates defaults.generated.ts', () => {
      writeFileSync(OUTPUT, serializeRegistry(fresh), 'utf8');

      expect(Object.keys(fresh.components).length).toBe(FIXTURES.length);
    });

    return;
  }

  it('matches what the components actually render', () => {
    expect(summarize(fresh)).toEqual(summarize(DEFAULTS));
  });

  it('covers every fixture', () => {
    expect(Object.keys(DEFAULTS.components).sort()).toEqual(
      FIXTURES.map((f) => f.name).sort(),
    );
  });

  it('every fixture names a component that documents defaults', () => {
    // Catches a typo'd or renamed fixture, which would otherwise silently
    // produce an empty entry rather than an error.
    const documented = new Set(componentsWithDocumentedDefaults());

    expect(
      FIXTURES.map((f) => f.name).filter((name) => !documented.has(name)),
    ).toEqual([]);
  });

  it('does not regress coverage', () => {
    // Coverage is partial by design — each component needs a hand-written render
    // fixture. This guards the ratchet: it may go up, never down. Raise
    // COVERED when you add fixtures. Lower it only when a component is removed
    // outright — that shrinks `total` too, so it is not a coverage regression.
    const COVERED = 74;
    const total = componentsWithDocumentedDefaults().length;
    const covered = Object.keys(DEFAULTS.components).length;

    expect(covered).toBeGreaterThanOrEqual(COVERED);
    expect(covered).toBeLessThanOrEqual(total);
  });
});
