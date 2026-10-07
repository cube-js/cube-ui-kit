import { useEffect } from 'react';

import { act, renderWithRoot, screen, userEvent, waitFor } from '../../test';

import { Menu } from './Menu/Menu';
import { useContextMenu, UseContextMenuReturn } from './use-context-menu';

// Moving a zero-size anchor does not notify ResizeObserver. Only a browser can
// verify that the visible popover follows it while the menu stays mounted.
const firstPoint = { x: 80, y: 80 };
const secondPoint = { x: 220, y: 220 };

function ContextMenu() {
  return (
    <Menu aria-label="Context actions">
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.Item key="copy">Copy</Menu.Item>
    </Menu>
  );
}

function App({
  onReady,
  onOpenState,
}: {
  onReady: (open: UseContextMenuReturn['open']) => void;
  onOpenState: (isOpen: boolean) => void;
}) {
  const { targetRef, open, isOpen, rendered } =
    useContextMenu<HTMLDivElement>(ContextMenu);

  useEffect(() => onReady(open), [onReady, open]);
  useEffect(() => onOpenState(isOpen), [onOpenState, isOpen]);

  return (
    <div
      ref={targetRef}
      data-qa="ContextTarget"
      style={{ position: 'fixed', left: 20, top: 20, width: 620, height: 400 }}
    >
      Right-click for context actions
      {rendered}
    </div>
  );
}

async function expectPosition(point: { x: number; y: number }) {
  await waitFor(
    () => {
      const rect = screen.getByTestId('Popover').getBoundingClientRect();

      expect(Math.abs(rect.left - point.x)).toBeLessThan(2);
      expect(Math.abs(rect.top - point.y)).toBeLessThan(2);
    },
    { timeout: 2000 },
  );
}

describe('useContextMenu positioning', () => {
  it.each(['right-click', 'open'] as const)(
    'moves an open menu with %s without closing or remounting it',
    async (method) => {
      let open!: UseContextMenuReturn['open'];
      const onReady = (callback: UseContextMenuReturn['open']) => {
        open = callback;
      };
      const onOpenState = vi.fn();

      renderWithRoot(<App onReady={onReady} onOpenState={onOpenState} />);

      await act(async () => {
        open(
          undefined,
          undefined,
          new MouseEvent('contextmenu', {
            clientX: firstPoint.x,
            clientY: firstPoint.y,
          }),
        );
      });
      const menu = await screen.findByRole('menu');
      await expectPosition(firstPoint);

      // An already-open menu must retain its current selection/focus, rather
      // than opening a replacement that auto-focuses the first item again.
      const copyItem = screen.getByRole('menuitem', { name: 'Copy' });
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(copyItem).toHaveFocus());

      if (method === 'right-click') {
        await userEvent.pointer({
          keys: '[MouseRight]',
          target: screen.getByTestId('ContextTarget'),
          coords: { clientX: secondPoint.x, clientY: secondPoint.y },
        });
      } else {
        await act(async () => {
          open(
            undefined,
            undefined,
            new MouseEvent('contextmenu', {
              clientX: secondPoint.x,
              clientY: secondPoint.y,
            }),
          );
        });
      }

      await expectPosition(secondPoint);
      expect(screen.getByRole('menu')).toBe(menu);
      expect(onOpenState.mock.calls.map(([value]) => value)).toEqual([
        false,
        true,
      ]);
      if (method === 'open') expect(copyItem).toHaveFocus();

      if (method === 'open') {
        await userEvent.keyboard('{Escape}');
      } else {
        await userEvent.click(copyItem);
      }
      await waitFor(() => expect(onOpenState).toHaveBeenLastCalledWith(false));
    },
  );
});
