import { userEvent } from 'vitest/browser';

import { renderWithRoot, screen, waitFor } from '../../../test';
import { CommandMenu } from '../CommandMenu/CommandMenu';

import { Menu } from './Menu';

const LONG_LABEL = 'A menu item label far too long for a narrow menu';

/**
 * `Menu.Section` and `CommandMenu` used to wrap every item that had a
 * `tooltip` in a second `TooltipProvider`, on top of the one the item renders
 * itself. Opening a tooltip closes any other, so the two shut each other: the
 * tooltip flashed and was gone. jsdom's timing hides that, so the count is
 * taken here, in a browser.
 */
describe('menu item tooltips', () => {
  it.each([
    ['Menu.Section', 'object'],
    ['Menu.Section', 'auto'],
    ['CommandMenu', 'object'],
    ['CommandMenu', 'auto'],
    ['CommandMenu.Section', 'object'],
    ['CommandMenu.Section', 'auto'],
  ])('%s shows an %s tooltip and keeps it open', async (where, form) => {
    const Component = where.startsWith('Menu') ? Menu : CommandMenu;
    const [tooltip, label, text] =
      form === 'auto'
        ? [true, LONG_LABEL, LONG_LABEL]
        : [{ title: 'Copy selected text' }, 'Copy', 'Copy selected text'];
    const items = [
      <Component.Item key="copy" tooltip={tooltip}>
        {label}
      </Component.Item>,
      <Component.Item key="paste">Paste</Component.Item>,
    ];

    renderWithRoot(
      <Component aria-label="Actions" styles={{ width: '200px' }}>
        {where.endsWith('Section') ? (
          <Component.Section key="edit" title="Edit">
            {items}
          </Component.Section>
        ) : (
          items
        )}
      </Component>,
    );

    await userEvent.hover(document.body);
    await userEvent.hover(screen.getAllByRole('menuitem')[0]);

    const matching = () =>
      Array.from(document.querySelectorAll('[role="tooltip"]')).filter(
        (tip) => tip.textContent === text,
      );

    await waitFor(() => expect(matching()).toHaveLength(1));
    // Long enough for a competing tooltip to open and close this one.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(matching()).toHaveLength(1);
  });
});
