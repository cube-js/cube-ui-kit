import { tasty } from '@tenphi/tasty';

import { precompileUIKitStyles } from './index';

const AppPanel = tasty({
  styles: {
    display: 'grid',
    padding: '2x',
    color: '#purple',
  },
});

describe('precompileUIKitStyles', () => {
  it('compiles application cases under the UI Kit Root configuration', async () => {
    const result = await precompileUIKitStyles({
      id: '@cube-dev/example-app',
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
    const result = await precompileUIKitStyles({
      id: '@cube-dev/example-app/bare',
      root: false,
      cases: [{ id: 'empty', render: () => <div /> }],
    });

    expect(result.manifest.chunks).toEqual([]);
    expect(result.css).toBe('');
  });
});
