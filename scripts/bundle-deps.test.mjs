// @vitest-environment node
import {
  compareSizes,
  formatPackageReport,
  packageOf,
  packageSizes,
  TOLERANCE,
} from './bundle-deps.mjs';

const pnpmPath = (name, file = 'dist/index.js') =>
  `/repo/node_modules/.pnpm/${name.replace('/', '+')}@1.0.0/node_modules/${name}/${file}`;

/** Stats in the shape Statoscope writes: modules once, by id, elsewhere. */
function normalizedStats(modules, chunkModules) {
  return {
    hash: 'abc',
    chunks: [{ modules: chunkModules }],
    __statoscope: {
      normalization: {
        data: { compilations: [{ id: 'abc', data: { modules } }] },
      },
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
  it('sums the modules concatenated into one, by package', () => {
    const stats = normalizedStats(
      [
        [1, { name: 'index.js + 3 modules', modules: [2, 3, 4], size: 999 }],
        [2, { identifier: 'a', nameForCondition: pnpmPath('clsx'), size: 10 }],
        [
          3,
          {
            identifier: 'b',
            nameForCondition: pnpmPath('clsx', 'lite.js'),
            size: 5,
          },
        ],
        [4, { identifier: 'c', nameForCondition: '/repo/dist/a.js', size: 7 }],
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
      'no node_modules packages',
    );
    expect(() => packageSizes(normalizedStats([], [7]))).toThrow('Module 7');
  });
});

describe('compareSizes', () => {
  const approved = { 'react-aria': 1000, clsx: 100, gone: 50 };

  it('blocks a third-party package that enters the bundle', () => {
    const [change] = compareSizes({ ...approved, gone: 50, diff: 1 }, approved);

    expect(change).toMatchObject({
      name: 'diff',
      status: 'new',
      blocking: true,
    });
  });

  it('blocks growth past the tolerance and tolerates growth within it', () => {
    const changes = compareSizes(
      {
        ...approved,
        'react-aria': 1000 + TOLERANCE + 1,
        clsx: 100 + TOLERANCE,
      },
      approved,
    );

    expect(changes).toEqual([
      expect.objectContaining({ name: 'react-aria', blocking: true }),
      expect.objectContaining({
        name: 'clsx',
        status: 'within tolerance',
        blocking: false,
      }),
    ]);
  });

  it('reports @tenphi packages without gating them', () => {
    const [change] = compareSizes(
      { ...approved, '@tenphi/tasty': 1e6 },
      approved,
    );

    expect(change).toMatchObject({ status: 'new', blocking: false });
  });

  it('lists what shrank or left the bundle without failing', () => {
    expect(compareSizes({ 'react-aria': 900, clsx: 100 }, approved)).toEqual([
      expect.objectContaining({
        name: 'gone',
        status: 'removed',
        blocking: false,
      }),
      expect.objectContaining({
        name: 'react-aria',
        status: 'smaller',
        blocking: false,
      }),
    ]);
  });

  it('reports nothing when every size matches the baseline', () => {
    expect(compareSizes({ ...approved }, approved)).toEqual([]);
  });
});

describe('formatPackageReport', () => {
  it('names the update command when a change needs approval', () => {
    const report = formatPackageReport(
      compareSizes({ clsx: 100, diff: 2048 }, { clsx: 100 }),
    );

    expect(report).toContain('❌');
    expect(report).toContain('pnpm size --update');
    expect(report).toMatch(/`diff` +\| — +\| 2 KB +\| new in the bundle ❌/);
  });

  it('passes with a table of tolerated changes', () => {
    const report = formatPackageReport(
      compareSizes(
        { clsx: 1124, '@tenphi/tasty': 5 },
        { clsx: 100, '@tenphi/tasty': 1029 },
      ),
    );

    expect(report).toContain('✅');
    expect(report).toMatch(/`@tenphi\/tasty` .*−1 KB \(not gated\)/);
    expect(report).toMatch(/`clsx` .*\+1 KB +\|/);
  });
});
