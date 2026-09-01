import { tasty } from '@tenphi/tasty';

import { precompileStyles } from './index';

const AppPanel = tasty({
  styles: {
    display: 'grid',
    padding: '2x',
    color: '#purple',
  },
});

describe('precompileStyles', () => {
  it('compiles application cases under the UI Kit Root configuration', async () => {
    const result = await precompileStyles({
      id: '@cube-dev/example-app',
      recompileKitCatalog: false,
      cases: [
        {
          id: 'dashboard',
          render: () => <AppPanel>Dashboard</AppPanel>,
        },
      ],
    });

    expect(result.manifest.id).toBe('@cube-dev/example-app');
    expect(result.manifest.chunks.length).toBeGreaterThan(0);
    expect(result.css).toContain('display: grid');
    expect(result.report).toEqual([
      expect.objectContaining({ caseId: 'dashboard' }),
    ]);
    expect(result.report[0].addedClasses.length).toBeGreaterThan(0);
  });

  it('can use an application tree that already contains Root', async () => {
    const result = await precompileStyles({
      id: '@cube-dev/example-app/bare',
      root: false,
      recompileKitCatalog: false,
      cases: [{ id: 'empty', render: () => <div /> }],
    });

    expect(result.manifest.chunks).toEqual([]);
    expect(result.css).toBe('');
  });

  /**
   * The default path renders UI Kit's catalog, which imports the built kit —
   * so `dist/` has to exist and `pnpm test` does not build. That half is
   * covered by `scripts/precompile-app-parity.mjs`, which runs inside
   * `pnpm test:precompiled` after a build and asserts the folded artifact
   * reproduces the shipped catalog exactly.
   */
  it('reports the option it was given', async () => {
    const appOnly = await precompileStyles({
      id: '@cube-dev/example-app/app-only',
      recompileKitCatalog: false,
      cases: [
        { id: 'dashboard', render: () => <AppPanel>Dashboard</AppPanel> },
      ],
    });

    expect(appOnly.report.map(({ caseId }) => caseId)).toEqual(['dashboard']);
  });
});
