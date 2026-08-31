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
   * The default exists because a kit chunk's lookup key survives a
   * configuration change that alters the CSS behind it, so an application that
   * touches units, recipes or handlers needs the kit's chunks rebuilt under its
   * own configuration rather than the shipped ones.
   */
  // Rendering the whole kit matrix takes a couple of seconds on its own and
  // longer when the full suite is competing for the machine.
  it(
    'folds UI Kit’s own catalog in by default',
    { timeout: 60_000 },
    async () => {
      const withKit = await precompileStyles({
        id: '@cube-dev/example-app/with-kit',
        cases: [
          { id: 'dashboard', render: () => <AppPanel>Dashboard</AppPanel> },
        ],
      });
      const appOnly = await precompileStyles({
        id: '@cube-dev/example-app/app-only',
        recompileKitCatalog: false,
        cases: [
          { id: 'dashboard', render: () => <AppPanel>Dashboard</AppPanel> },
        ],
      });

      expect(withKit.manifest.chunks.length).toBeGreaterThan(
        appOnly.manifest.chunks.length,
      );

      // The application's own case still reports, and still last.
      expect(withKit.report.at(-1)).toEqual(
        expect.objectContaining({ caseId: 'dashboard' }),
      );

      // Every chunk the application needs on its own is still present, so
      // folding the kit in never costs app coverage.
      const foldedKeys = new Set(
        withKit.manifest.chunks.map(({ lookupKey }) => lookupKey),
      );
      for (const { lookupKey } of appOnly.manifest.chunks) {
        expect(foldedKeys).toContain(lookupKey);
      }
    },
  );
});
