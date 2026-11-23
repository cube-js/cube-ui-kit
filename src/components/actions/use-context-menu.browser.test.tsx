import { useEffect } from 'react';
import { cdp } from 'vitest/browser';

import { act, renderWithRoot, screen, userEvent, waitFor } from '../../test';
import {
  nativePosition,
  pointIn,
  touchHold,
  touchMove,
  useTouchEmulation,
} from '../../test/touch';

import { ItemButton } from './ItemButton/ItemButton';
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

describe('useContextMenu on a touch screen', () => {
  useTouchEmulation();

  function Row({
    onPress,
    onOpenState,
  }: {
    onPress: () => void;
    onOpenState?: (isOpen: boolean) => void;
  }) {
    const { targetRef, isOpen, rendered } =
      useContextMenu<HTMLDivElement>(ContextMenu);

    useEffect(() => onOpenState?.(isOpen), [onOpenState, isOpen]);

    return (
      <div
        ref={targetRef}
        style={{ position: 'fixed', left: 20, top: 20, width: 300 }}
      >
        {rendered}
        <ItemButton qa="Row" onPress={onPress}>
          Row title
        </ItemButton>
      </div>
    );
  }

  /** A trusted `contextmenu`, as Android fires on its own long press. */
  async function nativeContextMenu(point: { x: number; y: number }) {
    const position = nativePosition(point.x, point.y);

    for (const type of ['mousePressed', 'mouseReleased'] as const) {
      await cdp().send('Input.dispatchMouseEvent', {
        type,
        button: 'right',
        buttons: type === 'mousePressed' ? 2 : 0,
        clickCount: 1,
        ...position,
      });
    }
  }

  it('opens the menu at the touch point on a long press, without pressing the row', async () => {
    const onPress = vi.fn();

    renderWithRoot(<Row onPress={onPress} />);
    const point = pointIn(screen.getByTestId('Row'));

    await touchHold(point, 700);

    expect(
      await screen.findByRole('menu', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    await expectPosition(point);
    // Chromium still sends a click after the lift; the long press swallows it.
    expect(onPress).not.toHaveBeenCalled();
  });

  it('leaves a tap to the row', async () => {
    const onPress = vi.fn();

    renderWithRoot(<Row onPress={onPress} />);

    await touchHold(pointIn(screen.getByTestId('Row')), 100);

    await waitFor(() => expect(onPress).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens nothing when the touch turns into a scroll', async () => {
    const onPress = vi.fn();

    renderWithRoot(<Row onPress={onPress} />);
    const point = pointIn(screen.getByTestId('Row'));

    await touchHold(point, 100, async () => {
      await touchMove({ x: point.x, y: point.y + 80 });
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('opens once when the platform fires its own contextmenu first', async () => {
    const onPress = vi.fn();
    const onOpenState = vi.fn();

    renderWithRoot(<Row onPress={onPress} onOpenState={onOpenState} />);
    const point = pointIn(screen.getByTestId('Row'));

    await touchHold(point, 300, async () => {
      await nativeContextMenu(point);
      // Past the 500 ms the long press would have fired at.
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    await screen.findByRole('menu', {}, { timeout: 2000 });
    await expectPosition(point);
    expect(onOpenState.mock.calls.map(([value]) => value)).toEqual([
      false,
      true,
    ]);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('keeps a text selection from starting while the finger is down', async () => {
    renderWithRoot(<Row onPress={() => {}} />);
    const title = screen.getByText('Row title');
    const selectStart = () =>
      title.dispatchEvent(
        new Event('selectstart', { bubbles: true, cancelable: true }),
      );
    let isAllowedDuringPress = true;

    await touchHold(pointIn(screen.getByTestId('Row')), 200, () => {
      isAllowedDuringPress = selectStart();
    });

    expect(isAllowedDuringPress).toBe(false);
    expect(selectStart()).toBe(true);
  });

  it('ignores a mouse long press', async () => {
    renderWithRoot(<Row onPress={() => {}} />);
    const { x, y } = pointIn(screen.getByTestId('Row'));
    const position = nativePosition(x, y);

    await act(async () => {
      await cdp().send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        button: 'left',
        buttons: 1,
        clickCount: 1,
        ...position,
      });
      await new Promise((resolve) => setTimeout(resolve, 700));
      await cdp().send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        button: 'left',
        buttons: 0,
        clickCount: 1,
        ...position,
      });
    });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
