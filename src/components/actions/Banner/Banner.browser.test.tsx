import { renderWithRoot, screen } from '../../../test';

import { Banner } from './Banner';

/**
 * A sharp banner runs across the page, so like a sharp `Alert` it drops the
 * border along with the radius. The border width is a `var(--border-width)`,
 * which jsdom does not resolve, so this needs a real browser.
 */
describe('Banner shape', () => {
  const borderOf = (qa: string) =>
    getComputedStyle(screen.getByTestId(qa)).borderTopWidth;

  it('keeps the border of the default shape', () => {
    renderWithRoot(<Banner qa="Default">Note</Banner>);

    expect(borderOf('Default')).toBe('1px');
  });

  it('drops the border when sharp', () => {
    renderWithRoot(
      <Banner qa="Sharp" shape="sharp">
        Note
      </Banner>,
    );

    expect(borderOf('Sharp')).toBe('0px');
  });
});
