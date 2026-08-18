import { useEffect, useRef, useState } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../Button';

import { Menu } from './Menu';
import { MenuTrigger } from './MenuTrigger';

/**
 * The focus hand-off from a closing menu, in a real browser (CUB-3962).
 *
 * jsdom does detect the original bug, but only sometimes: whether the opened
 * surface's mount effect runs before or after the trigger's restore depends on
 * React's effect order, and in jsdom the outcome flipped between runs — one
 * configuration in four caught it on any given run. The race is decided by
 * real blur/focusin ordering across a real 350ms popover exit, so a browser
 * settles it deterministically. It is also the only place `Enter` on a menu
 * item is a real key press rather than a synthesised event.
 */

/** A surface that claims focus on its own container, as a panel with a ✕ must. */
function Panel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={ref} tabIndex={-1} data-qa="Panel">
      <button type="button">Close</button>
      Panel content
    </div>
  );
}

/** `panelFirst` puts the panel before the trigger in tree order, so its mount
 * effect runs first and the trigger's restore is what lands last. */
function App({
  panelFirst = false,
  shouldRestoreFocus,
}: {
  panelFirst?: boolean;
  shouldRestoreFocus?: boolean;
}) {
  const [isPanelOpen, setPanelOpen] = useState(false);

  const menu = (
    <MenuTrigger shouldRestoreFocus={shouldRestoreFocus}>
      <Button qa="Trigger">Menu</Button>
      <Menu onAction={() => setPanelOpen(true)}>
        <Menu.Item key="open">Open panel</Menu.Item>
      </Menu>
    </MenuTrigger>
  );

  return (
    <>
      {panelFirst && isPanelOpen ? <Panel /> : null}
      {menu}
      {!panelFirst && isPanelOpen ? <Panel /> : null}
    </>
  );
}

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId('Trigger'));
  await screen.findByRole('menu');
};

describe('MenuTrigger focus hand-off', () => {
  it.each([true, false])(
    'leaves focus on the surface an action opens (panel first: %s)',
    async (panelFirst) => {
      const user = userEvent.setup();

      renderWithRoot(<App panelFirst={panelFirst} />);

      await openMenu(user);
      await user.click(screen.getByRole('menuitem', { name: 'Open panel' }));

      const panel = await screen.findByTestId('Panel');

      // Past the trigger's own restore and the popover FocusScope's unmount
      // restore, both of which used to fire after the panel took focus.
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(panel).toHaveFocus();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    },
  );

  it('hands off when the item is activated with Enter', async () => {
    const user = userEvent.setup();

    renderWithRoot(<App />);

    await user.click(screen.getByTestId('Trigger'));
    await screen.findByRole('menu');

    // Keyboard activation goes through a different path than a press, and
    // this is a real key event rather than a synthesised one.
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Open panel' }),
      ).toHaveFocus(),
    );
    await user.keyboard('{Enter}');

    const panel = await screen.findByTestId('Panel');
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(panel).toHaveFocus();
  });

  it('still restores focus to the trigger when an action moves focus nowhere', async () => {
    const user = userEvent.setup();

    renderWithRoot(
      <MenuTrigger>
        <Button qa="Trigger">Menu</Button>
        <Menu onAction={() => {}}>
          <Menu.Item key="copy">Copy</Menu.Item>
        </Menu>
      </MenuTrigger>,
    );

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));

    await waitFor(() => expect(screen.getByTestId('Trigger')).toHaveFocus());
  });

  it('never restores focus to the trigger with shouldRestoreFocus={false}', async () => {
    const user = userEvent.setup();

    renderWithRoot(
      <MenuTrigger shouldRestoreFocus={false}>
        <Button qa="Trigger">Menu</Button>
        <Menu onAction={() => {}}>
          <Menu.Item key="copy">Copy</Menu.Item>
        </Menu>
      </MenuTrigger>,
    );

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));

    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(screen.getByTestId('Trigger')).not.toHaveFocus();
  });
});
