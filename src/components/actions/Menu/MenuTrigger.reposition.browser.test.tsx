import { page } from 'vitest/browser';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../Button';

import { Menu } from './Menu';
import { MenuTrigger } from './MenuTrigger';

/**
 * An open menu that changes size moves to stay inside the screen.
 *
 * React Aria's `useOverlayPosition` re-places the overlay when it resizes, but
 * only if its `ResizeObserver` attached to the overlay element, and the
 * observer is attached once, when the hook first runs. `MenuTrigger` outlives
 * its popover, so the popover was never there to observe: a menu that gained a
 * longer item while open grew past the screen edge and stayed there, on every
 * opening.
 */

const WIDTH = 390;
const LONG_ITEM = 'Request a review of this dashboard from the data team';

afterEach(async () => page.viewport(1000, 800));

function App({ hasLongItem }: { hasLongItem: boolean }) {
  return (
    <div style={{ position: 'absolute', top: 8, right: 8 }}>
      <MenuTrigger>
        <Button qa="Trigger">⋮</Button>
        <Menu aria-label="Actions">
          <Menu.Item key="edit">Edit</Menu.Item>
          <Menu.Item key="share">Share</Menu.Item>
          {hasLongItem ? <Menu.Item key="review">{LONG_ITEM}</Menu.Item> : null}
        </Menu>
      </MenuTrigger>
    </div>
  );
}

function popoverRect() {
  const menu = screen.getByRole('menu');
  const popover = menu.closest('[data-qa="Popover"]') as HTMLElement;

  return popover.getBoundingClientRect();
}

describe('MenuTrigger reposition', () => {
  it.each([1, 2, 3])(
    'moves back inside the screen when an item arrives while open (opening %s)',
    async (openings) => {
      await page.viewport(WIDTH, 800);
      const user = userEvent.setup();
      const view = renderWithRoot(<App hasLongItem={false} />);

      for (let opening = 1; opening <= openings; opening++) {
        view.rerender(<App hasLongItem={false} />);
        await user.click(screen.getByTestId('Trigger'));
        await screen.findByRole('menu');

        await waitFor(() => {
          expect(popoverRect().right).toBeLessThanOrEqual(WIDTH);
        });

        view.rerender(<App hasLongItem />);
        await screen.findByRole('menuitem', { name: LONG_ITEM });

        // Shorter than the suite's 15s default, so a menu that never moves
        // fails on its position rather than on the test's timeout.
        await waitFor(
          () => {
            const rect = popoverRect();

            expect(rect.left).toBeGreaterThanOrEqual(0);
            expect(rect.right).toBeLessThanOrEqual(WIDTH);
          },
          { timeout: 2000 },
        );

        if (opening < openings) {
          await user.keyboard('{Escape}');
          await waitFor(() => {
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
          });
        }
      }
    },
  );
});
