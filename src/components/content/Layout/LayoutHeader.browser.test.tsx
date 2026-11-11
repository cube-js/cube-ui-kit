import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';

import { Layout } from './index';

/**
 * `Layout.Header` always asks for the auto tooltip on its title, and it never
 * fired. The title's grid column was `max-content`, so the heading grew past
 * its container instead of truncating, and the overflow was measured on an
 * inline wrapper, which reports a `clientWidth` of 0 whatever it holds.
 *
 * jsdom lays nothing out, so this is only observable in a real browser.
 */
describe('Layout.Header title', () => {
  const TITLE = 'A header title far too long for the layout it heads';

  it('truncates a title too long for the header and shows it in a tooltip', async () => {
    // The overflow verdict lands in a microtask after the commit. Let it land
    // before hovering, so the tooltip is already on.
    await act(async () => {
      renderWithRoot(
        <div style={{ width: 240, height: 200, display: 'grid' }}>
          <Layout>
            <Layout.Header title={TITLE} />
          </Layout>
        </div>,
      );
    });

    const title = screen.getByRole('heading', { name: TITLE });

    expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);

    // React Aria ignores a hover until a pointer move sets the modality.
    await userEvent.hover(document.body);
    await userEvent.hover(title);

    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent(TITLE),
    );

    // Positioned against the heading, below it as the header asks. A tooltip
    // with no anchor sits in the viewport's top-left corner instead.
    const heading = title.getBoundingClientRect();

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip').getBoundingClientRect();

      expect(tooltip.top).toBeGreaterThanOrEqual(heading.bottom - 1);
      expect(tooltip.top - heading.bottom).toBeLessThan(24);
      expect(tooltip.right).toBeGreaterThan(heading.left);
      expect(tooltip.left).toBeLessThan(heading.right);
    });

    // React Aria closes it on Escape only while it knows the trigger.
    await userEvent.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
  });
});

/**
 * `titlePreset` sizes the title apart from its `level`, so a page title can be
 * an `h1` in the outline and look like an `h3`. Computed fonts need a browser.
 */
describe('Layout.Header titlePreset', () => {
  function font(name: string) {
    const style = getComputedStyle(screen.getByRole('heading', { name }));

    return [style.fontSize, style.lineHeight, style.fontWeight];
  }

  it('gives a level-1 title the look of the preset it names', async () => {
    await act(async () => {
      renderWithRoot(
        <>
          <Layout>
            <Layout.Header title="Page" level={1} titlePreset="h3" />
          </Layout>
          <Layout>
            <Layout.Header title="Section" />
          </Layout>
          <Layout>
            <Layout.Header title="Plain page" level={1} />
          </Layout>
        </>,
      );
    });

    expect(screen.getByRole('heading', { name: 'Page' }).tagName).toBe('H1');
    expect(font('Page')).toEqual(font('Section'));
    expect(font('Page')).not.toEqual(font('Plain page'));
  });
});
