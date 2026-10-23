import { render } from '../test';

import { GridProvider } from './GridProvider';

describe('<GridProvider />', () => {
  it('sets the grid custom properties inline, with numbers as pixels', () => {
    const { container } = render(
      // oxlint-disable-next-line tasty/consistent-token-usage -- checks that numbers become pixels
      <GridProvider columns={3} gap={8} width={400}>
        <div data-testid="child" />
      </GridProvider>,
    );

    const grid = container.querySelector(
      '[data-testid="child"]',
    )!.parentElement!;

    expect(grid.style.getPropertyValue('--grid-width')).toBe('400px');
    expect(grid.style.getPropertyValue('--columns-amount')).toBe('3');
    expect(grid.style.getPropertyValue('--column-gap')).toBe('8px');
  });

  it('passes a Tasty value through', () => {
    const { container } = render(
      <GridProvider gap="1x" width="50vw">
        <div data-testid="child" />
      </GridProvider>,
    );

    const grid = container.querySelector(
      '[data-testid="child"]',
    )!.parentElement!;

    expect(grid.style.getPropertyValue('--grid-width')).toBe('50vw');
    expect(grid.style.getPropertyValue('--column-gap')).toBe('var(--gap)');
  });
});
