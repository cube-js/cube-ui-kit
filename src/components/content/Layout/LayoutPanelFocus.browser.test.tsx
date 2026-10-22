import { ReactNode, useState } from 'react';
import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Menu } from '../../actions/Menu/Menu';
import { MenuTrigger } from '../../actions/Menu/MenuTrigger';

import { Layout } from './index';

function wait(ms: number) {
  return act(() => new Promise((resolve) => setTimeout(resolve, ms)));
}

// The opener sits outside the Layout, as a toolbar button does in Cloud.
function FocusLayout({
  onOpenChange = () => {},
  opener = 'button',
  hideOnClose = false,
  panelContent,
}: {
  onOpenChange?: (isOpen: boolean) => void;
  opener?: 'button' | 'menu';
  hideOnClose?: boolean;
  panelContent?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {opener === 'button' ? (
        <Button onPress={() => setIsOpen(true)}>Open panel</Button>
      ) : null}
      <div style={{ overflow: 'hidden', height: 300 }}>
        <Layout hasTransition height={300} styles={{ $transition: '300ms' }}>
          <Layout.Panel
            qa="OverlayPanel"
            side="right"
            size={240}
            mode="overlay"
            hideOnClose={hideOnClose}
            isOpen={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              onOpenChange(open);
            }}
          >
            <input aria-label="Panel field" />
            <Button>Panel action</Button>
            {panelContent}
          </Layout.Panel>
          <Layout.Content>
            {opener === 'menu' ? (
              <MenuTrigger>
                <Button>Actions</Button>
                <Menu aria-label="Actions" onAction={() => setIsOpen(true)}>
                  <Menu.Item key="details">Details</Menu.Item>
                </Menu>
              </MenuTrigger>
            ) : null}
            <Button>Main action</Button>
          </Layout.Content>
        </Layout>
      </div>
      <Button>After layout</Button>
    </>
  );
}

// Handles Escape itself, as CodeMirror closes its autocomplete: a native
// listener prevents the default and lets the event bubble on.
function ClaimingField() {
  return (
    <input
      aria-label="Claiming field"
      ref={(input) => {
        if (!input) return;

        const claim = (event: KeyboardEvent) => {
          if (event.key === 'Escape') event.preventDefault();
        };

        input.addEventListener('keydown', claim);

        return () => input.removeEventListener('keydown', claim);
      }}
    />
  );
}

async function renderReady(ui: Parameters<typeof renderWithRoot>[0]) {
  renderWithRoot(ui);
  await wait(50);
}

// Opens the panel and waits out its 300ms slide: a pointer aimed inside it
// mid-slide lands on a control still translated off the page.
async function openAndSettle() {
  await act(() =>
    userEvent.click(screen.getByRole('button', { name: 'Open panel' })),
  );
  await waitFor(() =>
    expect(screen.getByLabelText('Panel field')).toHaveFocus(),
  );
  await wait(400);
}

describe('Layout.Panel overlay focus in a browser', () => {
  it('moves focus in while the panel slides in, and returns it', async () => {
    await renderReady(<FocusLayout />);

    await act(() =>
      userEvent.click(screen.getByRole('button', { name: 'Open panel' })),
    );

    const field = screen.getByLabelText('Panel field');

    await waitFor(() => expect(field).toHaveFocus());

    await act(() => userEvent.keyboard('{Escape}'));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open panel' })).toHaveFocus(),
    );
  });

  // A hidden panel stays mounted, so each open must read focus afresh.
  it('moves focus in on every open of a hideOnClose panel, and returns it', async () => {
    await renderReady(<FocusLayout hideOnClose />);

    const opener = screen.getByRole('button', { name: 'Open panel' });
    const field = screen.getByLabelText('Panel field');

    for (let cycle = 0; cycle < 2; cycle++) {
      await act(() => userEvent.click(opener));
      await waitFor(() => expect(field).toHaveFocus());

      await act(() => userEvent.keyboard('{Escape}'));
      await waitFor(() => expect(opener).toHaveFocus());
      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId('OverlayPanel')).display,
        ).toBe('none'),
      );
    }
  });

  it.each(['click', 'Enter'] as const)(
    'stays open and focused when a menu item opens it (%s)',
    async (how) => {
      const onOpenChange = vi.fn();

      await renderReady(
        <FocusLayout opener="menu" onOpenChange={onOpenChange} />,
      );

      await act(() =>
        userEvent.click(screen.getByRole('button', { name: 'Actions' })),
      );

      const item = await screen.findByRole('menuitem', { name: 'Details' });

      if (how === 'click') {
        await act(() => userEvent.click(item));
      } else {
        await waitFor(() => expect(item).toHaveFocus());
        await act(() => userEvent.keyboard('{Enter}'));
      }

      // Long enough for the menu to finish closing and hand focus back.
      await wait(700);

      expect(screen.getByLabelText('Panel field')).toHaveFocus();
      expect(screen.getByTestId('OverlayPanel')).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    },
  );

  it('moves focus in again when reopened while it slides out', async () => {
    await renderReady(<FocusLayout />);

    const openButton = screen.getByRole('button', { name: 'Open panel' });

    await act(() => userEvent.click(openButton));
    await waitFor(() =>
      expect(screen.getByLabelText('Panel field')).toHaveFocus(),
    );

    await act(() => userEvent.keyboard('{Escape}'));
    await waitFor(() => expect(openButton).toHaveFocus());
    // Still sliding out.
    expect(screen.getByTestId('OverlayPanel')).toBeInTheDocument();

    await act(() => userEvent.click(openButton));

    await waitFor(() =>
      expect(screen.getByLabelText('Panel field')).toHaveFocus(),
    );
  });

  it('lets Tab from the last control leave the Layout and stays open', async () => {
    const onOpenChange = vi.fn();

    await renderReady(<FocusLayout onOpenChange={onOpenChange} />);
    await act(() =>
      userEvent.click(screen.getByRole('button', { name: 'Open panel' })),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Panel field')).toHaveFocus(),
    );

    await act(() => userEvent.keyboard('{Tab}{Tab}'));

    expect(screen.getByRole('button', { name: 'After layout' })).toHaveFocus();
    expect(screen.getByTestId('OverlayPanel')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('stays open when a control inside claims Escape', async () => {
    const onOpenChange = vi.fn();
    // Stands in for an enclosing dialog, which must not close either.
    const onOuterKeyDown = vi.fn();

    await renderReady(
      <div onKeyDown={onOuterKeyDown}>
        <FocusLayout
          panelContent={<ClaimingField />}
          onOpenChange={onOpenChange}
        />
      </div>,
    );
    await openAndSettle();

    await act(() => userEvent.click(screen.getByLabelText('Claiming field')));
    await act(() => userEvent.keyboard('{Escape}'));
    await wait(400);

    expect(screen.getByTestId('OverlayPanel')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onOuterKeyDown).not.toHaveBeenCalled();

    // An Escape nothing claimed still closes it.
    await act(() => userEvent.click(screen.getByLabelText('Panel field')));
    await act(() => userEvent.keyboard('{Escape}'));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('closes only a menu open inside it on one backdrop press', async () => {
    const onOpenChange = vi.fn();

    await renderReady(
      <FocusLayout
        panelContent={
          <MenuTrigger>
            <Button>Panel menu</Button>
            <Menu aria-label="Panel menu">
              <Menu.Item key="rename">Rename</Menu.Item>
            </Menu>
          </MenuTrigger>
        }
        onOpenChange={onOpenChange}
      />,
    );
    await openAndSettle();

    await act(() =>
      userEvent.click(screen.getByRole('button', { name: 'Panel menu' })),
    );
    await screen.findByRole('menu', { name: 'Panel menu' });

    await act(() => userEvent.click(screen.getByTestId('PanelOverlay')));

    await waitFor(() =>
      expect(screen.queryByRole('menu', { name: 'Panel menu' })).toBeNull(),
    );
    await wait(400);

    expect(screen.getByTestId('OverlayPanel')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();

    // With nothing open inside, the next press closes the panel.
    await act(() => userEvent.click(screen.getByTestId('PanelOverlay')));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
