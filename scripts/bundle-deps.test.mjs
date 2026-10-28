// @vitest-environment node
import {
  formatPackageReport,
  packageOf,
  packageSizes,
  TOLERANCE,
  unapprovedChanges,
} from './bundle-deps.mjs';

const pnpmPath = (name, file = 'dist/index.js') =>
  `/repo/node_modules/.pnpm/${name.replace('/', '+')}@1.0.0/node_modules/${name}/${file}`;

/**
 * Stats in the shape Statoscope writes: the chunk lists modules by id, and a
 * concatenated module carries the modules merged into it inline.
 */
function normalizedStats(modules, chunkModules) {
  return {
    chunks: [{ modules: chunkModules }],
    __statoscope: {
      normalization: { data: { compilations: [{ data: { modules } }] } },
    },
  };
}

describe('packageOf', () => {
  it('names the innermost package of a pnpm path', () => {
    expect(packageOf(pnpmPath('react-aria'))).toBe('react-aria');
    expect(packageOf(pnpmPath('@react-aria/ssr'))).toBe('@react-aria/ssr');
  });

  it('treats a module outside node_modules as UI Kit code', () => {
    expect(packageOf('/repo/dist/components/Button.js')).toBeNull();
  });
});

describe('packageSizes', () => {
  it('sums the modules concatenated into one, by third-party package', () => {
    const stats = normalizedStats(
      [
        [
          1,
          {
            name: 'index.js + 4 modules',
            size: 999,
            modules: [
              { identifier: 'a', nameForCondition: pnpmPath('clsx'), size: 10 },
              {
                identifier: 'b',
                nameForCondition: pnpmPath('clsx', 'lite.js'),
                size: 5,
              },
              {
                identifier: 'c',
                nameForCondition: pnpmPath('@tenphi/tasty'),
                size: 50,
              },
              { identifier: 'd', nameForCondition: '/repo/dist/a.js', size: 7 },
            ],
          },
        ],
      ],
      [1],
    );

    expect(packageSizes(stats)).toEqual({ clsx: 15 });
  });

  it('reads plain webpack stats and counts a module once across chunks', () => {
    const shared = { identifier: 'x', name: pnpmPath('diff'), size: 20 };
    const stats = {
      chunks: [{ modules: [shared] }, { modules: [{ ...shared }] }],
    };

    expect(packageSizes(stats)).toEqual({ diff: 20 });
  });

  it('fails loudly instead of approving an empty bundle', () => {
    expect(() => packageSizes({ chunks: [{ modules: [] }] })).toThrow(
      'no third-party packages',
    );
    expect(() => packageSizes(normalizedStats([], [7]))).toThrow('Module 7');
  });
});

describe('unapprovedChanges', () => {
  const approved = { 'react-aria': 1000, clsx: 100 };

  it('flags a package that enters the bundle', () => {
    expect(unapprovedChanges({ ...approved, diff: 1 }, approved)).toEqual([
      { name: 'diff', before: undefined, after: 1, status: 'new' },
    ]);
  });

  it('flags a package that leaves it, so it cannot return unreviewed', () => {
    expect(unapprovedChanges({ 'react-aria': 1000 }, approved)).toEqual([
      { name: 'clsx', before: 100, after: undefined, status: 'removed' },
    ]);
  });

  it('flags growth past the tolerance and nothing within it', () => {
    const changes = unapprovedChanges(
      { 'react-aria': 1000 + TOLERANCE + 1, clsx: 100 + TOLERANCE },
      approved,
    );

    expect(changes).toEqual([
      expect.objectContaining({ name: 'react-aria', status: 'grown' }),
    ]);
  });

  it('says nothing about a package that shrank', () => {
    expect(unapprovedChanges({ 'react-aria': 1, clsx: 100 }, approved)).toEqual(
      [],
    );
  });
});

describe('formatPackageReport', () => {
  it('lists each change and names the update command', () => {
    const report = formatPackageReport(
      unapprovedChanges(
        { clsx: 100 + 2048 + TOLERANCE, diff: 2048 },
        { clsx: 100, 'valid-url': 1024 },
      ),
    );

    expect(report).toContain('❌ **3 third-party packages need approval**');
    expect(report).toContain('pnpm size --update');
    expect(report).toMatch(/`clsx` .*\| \+12 KB +\|/);
    expect(report).toMatch(/`diff` +\| — +\| 2 KB +\| new in the bundle +\|/);
    expect(report).toMatch(/`valid-url` +\| 1 KB +\| — +\| left the bundle/);
  });

  it('passes in one line when the graph did not change', () => {
    expect(formatPackageReport([])).toMatch(/^✅ [^\n]+$/);
  });
});
