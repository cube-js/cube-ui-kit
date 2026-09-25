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
    // The overflow verdict lands in a microtask after the commit, and turning
    // it on remounts the heading under `TooltipProvider`. Let both happen
    // before looking the heading up, or the hover lands on a detached node.
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
  });
});
