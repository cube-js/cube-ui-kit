// @vitest-environment node
import { vitestArgs } from './test-changed.mjs';

it('skips changes that the source suite does not read', () => {
  expect(vitestArgs(['docs/rules/ci.md'])).toEqual([]);
});

it.each(['scripts/a11y-diagnostics.mjs', 'src/removed-module.ts'])(
  'runs the full suite for %s',
  (path) => {
    expect(vitestArgs([path])).toEqual(['run']);
  },
);

it('includes the specs that read source directly for a package subpath change', () => {
  expect(vitestArgs(['src/probe/index.ts'])).toEqual([
    'related',
    '--run',
    'src/probe/index.ts',
    'src/public-api.test.ts',
    'src/tokens/tasty-config.test.ts',
    'scripts/ci/plan-jobs.test.mjs',
  ]);
});

it('selects the public API spec when its file snapshot changes', () => {
  expect(vitestArgs(['src/__snapshots__/public-api.md'])).toEqual([
    'related',
    '--run',
    'src/__snapshots__/public-api.md',
    'src/public-api.test.ts',
  ]);
});
