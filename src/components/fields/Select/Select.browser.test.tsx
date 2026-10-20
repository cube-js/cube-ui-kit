import { cleanup } from '@testing-library/react';
import { useContextMenu } from 'react-aria';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';
import { ListBox } from '../ListBox/ListBox';

import { Select } from './Select';

import type { FormEvent } from 'react';

function ContextSelect({
  option = false,
  onContextMenu,
}: {
  option?: boolean;
  onContextMenu: () => void;
}) {
  const { contextMenuProps } = useContextMenu({ onContextMenu });
  const keyboardContextProps = {
    onKeyDown: contextMenuProps.onKeyDown,
    onContextMenu: contextMenuProps.onContextMenu,
  };
  return (
    <Select
      label="Colour"
      defaultSelectedKey="blue"
      {...(!option ? keyboardContextProps : {})}
    >
      <Select.Item key="blue">Blue</Select.Item>
      <Select.Item key="red" {...(option ? keyboardContextProps : {})}>
        Red
      </Select.Item>
    </Select>
  );
}

// Native activation of a refocused button is absent in jsdom/user-event.
describe('Select native keyboard selection on macOS', () => {
  let platformDescriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    platformDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      'userAgentData',
    );
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      value: { platform: 'macOS' },
    });
  });
  afterEach(() => {
    cleanup();
    if (platformDescriptor)
      Object.defineProperty(navigator, 'userAgentData', platformDescriptor);
    else
      delete (navigator as Navigator & { userAgentData?: unknown })
        .userAgentData;
  });

  it.each([false, true])(
    'commits Enter once without reopening (sections=%s)',
    async (sections) => {
      const onSelectionChange = vi.fn();
      const onOpenChange = vi.fn();
      const onKeyDown = vi.fn();
      const choices = [
        <Select.Item key="blue">Blue</Select.Item>,
        <Select.Item key="red" onKeyDown={onKeyDown}>
          Red
        </Select.Item>,
      ];
      renderWithRoot(
        <DialogTrigger>
          <Button>Open colour dialog</Button>
          <Dialog isDismissable aria-label="Colour dialog">
            <Select
              label="Colour"
              defaultSelectedKey="blue"
              onSelectionChange={onSelectionChange}
              onOpenChange={onOpenChange}
            >
              {sections ? (
                <Select.Section title="Colours">{choices}</Select.Section>
              ) : (
                choices
              )}
            </Select>
          </Dialog>
        </DialogTrigger>,
      );
      await act(() =>
        userEvent.click(
          screen.getByRole('button', { name: 'Open colour dialog' }),
        ),
      );
      const trigger = screen.getByRole('button', { name: /Colour/ });
      await act(() => trigger.focus());
      await act(() => userEvent.keyboard('{Enter}'));
      await waitFor(() =>
        expect(trigger).toHaveAttribute('aria-expanded', 'true'),
      );
      expect(screen.getByRole('listbox')).toContainElement(
        document.activeElement as HTMLElement,
      );
      onOpenChange.mockClear();
      await act(() => userEvent.keyboard('{ArrowDown}'));
      await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Red' })).toHaveFocus(),
      );
      await act(() => userEvent.keyboard('{Enter}'));
      expect(trigger).toHaveTextContent('Red');
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('red');
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      const event = onKeyDown.mock.calls[0][0];
      expect(event.nativeEvent.isTrusted).toBe(true);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveFocus();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(onOpenChange.mock.calls.every(([open]) => !open)).toBe(true);
      await act(() => userEvent.keyboard('{Escape}'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    },
  );

  it('preserves native Control+Enter contextmenu and trusted key events on the trigger', async () => {
    const onContextMenu = vi.fn();
    renderWithRoot(<ContextSelect onContextMenu={onContextMenu} />);
    const keys: KeyboardEvent[] = [];
    const record = (event: KeyboardEvent) => {
      if (event.key === 'Enter') keys.push(event);
    };
    document.addEventListener('keydown', record, true);
    document.addEventListener('keyup', record, true);
    try {
      await act(() => screen.getByRole('button', { name: /Colour/ }).focus());
      await act(() => userEvent.keyboard('{Control>}{Enter}{/Control}'));
      expect(keys).toHaveLength(2);
      for (const event of keys) {
        expect(event.isTrusted).toBe(true);
        expect(event.ctrlKey).toBe(true);
        expect(event.defaultPrevented).toBe(false);
      }
      await waitFor(() => expect(onContextMenu).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole('listbox')).toBeNull();
    } finally {
      document.removeEventListener('keydown', record, true);
      document.removeEventListener('keyup', record, true);
    }
  });

  it('preserves native Control+Enter on a focused option', async () => {
    const keys: KeyboardEvent[] = [];
    const contextmenu = vi.fn();
    const record = (event: KeyboardEvent) => {
      if (event.key === 'Enter') keys.push(event);
    };
    renderWithRoot(<ContextSelect option onContextMenu={contextmenu} />);
    await act(() =>
      userEvent.click(screen.getByRole('button', { name: /Colour/ })),
    );
    await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());
    const option = screen.getByRole('option', { name: 'Red' });
    await act(() => option.focus());
    expect(option).toHaveFocus();
    document.addEventListener('keydown', record, true);
    document.addEventListener('keyup', record, true);
    try {
      await act(() => userEvent.keyboard('{Control>}{Enter}{/Control}'));
      expect(keys).toHaveLength(2);
      for (const event of keys) {
        expect(event.isTrusted).toBe(true);
        expect(event.ctrlKey).toBe(true);
        expect(event.defaultPrevented).toBe(false);
      }
      // Key events remain native and uncancelled for Control+Enter.
      expect(keys[0].target).toBe(option);
      await waitFor(() => expect(contextmenu).toHaveBeenCalledTimes(1));
    } finally {
      document.removeEventListener('keydown', record, true);
      document.removeEventListener('keyup', record, true);
    }
  });

  it('selects an untyped destination option without native navigation', async () => {
    const originalUrl = location.href;
    const onSelectionChange = vi.fn();
    const onKeyDown = vi.fn();
    const destination: Record<string, unknown> = {
      as: 'a',
      href: '#select-destination',
    };
    renderWithRoot(
      <Select
        label="Destination"
        defaultSelectedKey="blue"
        onSelectionChange={onSelectionChange}
      >
        <Select.Item key="blue">Blue</Select.Item>
        <Select.Item key="link" {...destination} onKeyDown={onKeyDown}>
          Destination
        </Select.Item>
      </Select>,
    );
    try {
      await act(() =>
        userEvent.click(screen.getByRole('button', { name: /Destination/ })),
      );
      const option = screen.getByRole('option', { name: 'Destination' });
      expect(option).not.toHaveAttribute('href');
      await act(() => option.focus());
      await act(() => userEvent.keyboard('{Enter}'));
      expect(location.href).toBe(originalUrl);
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('link');
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown.mock.calls[0][0].nativeEvent.isTrusted).toBe(true);
      expect(onKeyDown.mock.calls[0][0].nativeEvent.defaultPrevented).toBe(
        true,
      );
    } finally {
      history.replaceState(null, '', originalUrl);
    }
  });

  it('preserves native Enter on a nested form input', async () => {
    const onKeyDown = vi.fn();
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );
    renderWithRoot(
      <Select label="Colour" defaultSelectedKey="blue" disabledKeys={['form']}>
        <Select.Item key="blue">Blue</Select.Item>
        <Select.Item key="form" textValue="Custom colour">
          <form onSubmit={onSubmit}>
            <input aria-label="Custom colour" onKeyDown={onKeyDown} />
            <button type="submit">Save custom colour</button>
          </form>
        </Select.Item>
      </Select>,
    );
    await act(() =>
      userEvent.click(screen.getByRole('button', { name: /Colour/ })),
    );
    const input = screen.getByRole('textbox', { name: 'Custom colour' });
    await act(() => input.focus());
    await act(() => userEvent.keyboard('{Enter}'));
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyDown.mock.calls[0][0].nativeEvent.isTrusted).toBe(true);
    expect(onKeyDown.mock.calls[0][0].defaultPrevented).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

// The browser viewport is phone-sized, so the fields stay narrower than it: a
// popup as wide as the viewport overflows it, and React Aria's keyboard
// scroll-into-view would then scroll the page, which closes the list.
const FIELD_WIDTH = '300px';

const hundred = Array.from({ length: 100 }, (_, index) => (
  <Select.Item key={`item-${index + 1}`}>{`Item ${index + 1}`}</Select.Item>
));

// The list is virtualized, so an option's place among the rendered options is
// not its place in the list once it has scrolled. Read the item's own number.
function focusedIndex() {
  const label = (document.activeElement as HTMLElement).textContent ?? '';

  return Number(/Item (\d+)/.exec(label)?.[1] ?? 0) - 1;
}

// React Aria measures a page from the options that are rendered, and the
// virtualizer renders the window a key scrolled to a frame later. A second key
// sent before then measures a stale window and can land one option off, so
// wait for focus to move and for the list to repaint between keys.
async function pressAndSettle(key: string) {
  const before = document.activeElement;

  await act(() => userEvent.keyboard(key));
  await waitFor(() => expect(document.activeElement).not.toBe(before));
  await act(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

function isInsideList(option: HTMLElement) {
  const list = screen.getByRole('listbox').getBoundingClientRect();
  const rect = option.getBoundingClientRect();

  return rect.top >= list.top - 1 && rect.bottom <= list.bottom + 1;
}

describe('Select popup scrolling and geometry', () => {
  afterEach(() => cleanup());

  it('scrolls the list itself, within the popup height', async () => {
    renderWithRoot(
      <Select label="Item" width={FIELD_WIDTH}>
        {hundred}
      </Select>,
    );

    await act(() =>
      userEvent.click(screen.getByRole('button', { name: /Item/ })),
    );

    const listbox = await screen.findByRole('listbox');

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Item 1' })).toBeVisible(),
    );
    await act(() => userEvent.keyboard('{End}'));
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Item 100' })).toHaveFocus(),
    );

    const popover = screen.getByTestId('SelectOverlay');

    // The list scrolls; the popup around it doesn't.
    await waitFor(() => expect(listbox.scrollTop).toBeGreaterThan(0));
    expect(popover.scrollTop).toBe(0);
    expect(listbox.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      popover.getBoundingClientRect().bottom,
    );
  });

  it('keeps the popup within the room React Aria leaves in the viewport', async () => {
    renderWithRoot(
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingBottom: '120px',
          boxSizing: 'border-box',
        }}
      >
        <Select label="Item" width={FIELD_WIDTH} shouldFlip={false}>
          {hundred}
        </Select>
      </div>,
    );

    await act(() =>
      userEvent.click(screen.getByRole('button', { name: /Item/ })),
    );

    const listbox = await screen.findByRole('listbox');
    const wrapper = screen.getByTestId('SelectOverlayWrapper');

    await waitFor(() => expect(wrapper.style.maxHeight).not.toBe(''));

    const popover = screen.getByTestId('SelectOverlay');
    const room = parseFloat(wrapper.style.maxHeight);

    expect(room).toBeLessThan(120);
    expect(popover.getBoundingClientRect().height).toBeLessThanOrEqual(
      room + 1,
    );
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
  });

  it('moves about one visible page with PageDown and PageUp', async () => {
    renderWithRoot(
      <Select label="Item" width={FIELD_WIDTH}>
        {hundred}
      </Select>,
    );

    await act(() => screen.getByRole('button', { name: /Item/ }).focus());
    await act(() => userEvent.keyboard('{ArrowDown}'));
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Item 1' })).toHaveFocus(),
    );

    const listbox = screen.getByRole('listbox');
    const optionHeight = screen
      .getByRole('option', { name: 'Item 1' })
      .getBoundingClientRect().height;
    const pageSize = Math.floor(listbox.clientHeight / optionHeight);

    await pressAndSettle('{PageDown}');

    const afterPageDown = focusedIndex();

    expect(afterPageDown).toBeGreaterThan(0);
    expect(afterPageDown).toBeLessThan(99);
    expect(Math.abs(afterPageDown - pageSize)).toBeLessThanOrEqual(2);
    expect(isInsideList(document.activeElement as HTMLElement)).toBe(true);

    await pressAndSettle('{PageDown}');
    await pressAndSettle('{PageUp}');

    expect(focusedIndex()).toBe(afterPageDown);
  });

  it.each([
    ['a click', 'click'],
    ['ArrowDown', 'keyboard'],
  ])(
    'scrolls the selected option into view on the first open with %s',
    async (_, how) => {
      renderWithRoot(
        <Select label="Item" width={FIELD_WIDTH} defaultSelectedKey="item-80">
          {hundred}
        </Select>,
      );

      const trigger = screen.getByRole('button', { name: /Item/ });

      if (how === 'click') {
        await act(() => userEvent.click(trigger));
      } else {
        await act(() => trigger.focus());
        await act(() => userEvent.keyboard('{ArrowDown}'));
      }

      const option = await screen.findByRole('option', { name: 'Item 80' });

      await waitFor(() => expect(option).toHaveFocus());
      // Let the enter transition settle before measuring.
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(isInsideList(option)).toBe(true);
    },
  );

  // Guards the measurement moved out of render: the popup takes the width the
  // trigger has when the list opens. That already held when it was read
  // during render, since opening re-renders Select.
  it('sizes the popup to the trigger width it has when it opens', async () => {
    function Resizable({ containerWidth }: { containerWidth: number }) {
      return (
        <div style={{ width: containerWidth }}>
          <Select aria-label="Item" styles={{ width: '100%' }}>
            {hundred}
          </Select>
        </div>
      );
    }

    const { rerender } = renderWithRoot(<Resizable containerWidth={200} />);
    const trigger = screen.getByTestId('Select');

    await act(() => userEvent.click(trigger));
    await screen.findByRole('listbox');
    await act(() => userEvent.keyboard('{Escape}'));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

    rerender(<Resizable containerWidth={360} />);
    await act(() => userEvent.click(trigger));
    await screen.findByRole('listbox');

    const popover = screen.getByTestId('SelectOverlay');

    await waitFor(() =>
      expect(popover.getBoundingClientRect().width).toBeGreaterThanOrEqual(
        trigger.getBoundingClientRect().width - 1,
      ),
    );
    expect(trigger.getBoundingClientRect().width).toBeGreaterThan(350);
  });

  it('closes the surrounding Dialog on one Escape after a keyboard clear', async () => {
    renderWithRoot(
      <DialogTrigger type="modal">
        <Button qa="OpenDialog">Open</Button>
        <Dialog>
          <Select
            isClearable
            aria-label="Colour"
            tooltip="Pick a colour"
            defaultSelectedKey="blue"
          >
            <Select.Item key="blue">Blue</Select.Item>
            <Select.Item key="red">Red</Select.Item>
          </Select>
        </Dialog>
      </DialogTrigger>,
    );

    await act(() => userEvent.click(screen.getByTestId('OpenDialog')));
    await screen.findByTestId('Dialog');

    await act(() => screen.getByTestId('SelectClearButton').focus());
    await act(() => userEvent.keyboard('{Enter}'));
    await waitFor(() => expect(screen.getByTestId('Select')).toHaveFocus());
    expect(screen.queryByRole('tooltip')).toBeNull();

    await act(() => userEvent.keyboard('{Escape}'));

    await waitFor(() => expect(screen.queryByTestId('Dialog')).toBeNull());
  });
});

/**
 * A mouse press picks the option it started on (CUB-5598). Select picks on
 * press up, and React Aria then takes whatever option the pointer comes up
 * over, so a list that moves between press and release (still animating in,
 * or scrolling while it closes) used to pick a neighbour.
 */
describe('Select press on a list that moves', () => {
  function mouse(type: string, target: Element, x: number, y: number) {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerdown' ? 1 : 0,
        clientX: x,
        clientY: y,
      }),
    );
  }

  it('selects the option the press started on', async () => {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <Select label="Fruit" width="200px" onSelectionChange={onSelectionChange}>
        <Select.Item key="apple">Apple</Select.Item>
        <Select.Item key="banana">Banana</Select.Item>
        <Select.Item key="cherry">Cherry</Select.Item>
      </Select>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Fruit/ }));

    const apple = await screen.findByRole('option', { name: 'Apple' });
    const box = apple.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;

    mouse('pointerdown', apple, x, y);
    screen.getByRole('listbox').style.transform =
      `translateY(-${box.height}px)`;

    const under = document.elementFromPoint(x, y);

    expect(under?.closest('[role="option"]')).toBe(
      screen.getByRole('option', { name: 'Banana' }),
    );

    mouse('pointerup', under!, x, y);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('apple');
    });
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  /**
   * A press on an option that never ends in a `pointerup` at the window (a
   * drag start sends `pointercancel`; a handler may stop the `pointerup`)
   * must not leave a record behind that swallows the next press, here a
   * press on the trigger released on an option.
   */
  describe.each([
    [
      'ended by pointercancel',
      (option: HTMLElement) => mouse('pointercancel', option, 0, 0),
    ],
    [
      'whose pointerup never reached the window',
      (option: HTMLElement) => {
        const stop = (event: Event) => event.stopPropagation();

        option.parentElement!.addEventListener('pointerup', stop);
        mouse('pointerup', option, 0, 0);
        option.parentElement!.removeEventListener('pointerup', stop);
      },
    ],
  ])('after a list press %s', (_name, endPress) => {
    it('still picks an option with a press on the trigger', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <>
          <ListBox aria-label="Other list">
            <ListBox.Item key="one">One</ListBox.Item>
          </ListBox>
          <Select
            label="Fruit"
            width="200px"
            onSelectionChange={onSelectionChange}
          >
            <Select.Item key="apple">Apple</Select.Item>
            <Select.Item key="banana">Banana</Select.Item>
          </Select>
        </>,
      );

      const one = screen.getByRole('option', { name: 'One' });

      mouse('pointerdown', one, 0, 0);
      endPress(one);

      const trigger = screen.getByRole('button', { name: /Fruit/ });
      const box = trigger.getBoundingClientRect();

      await act(async () => {
        mouse('pointerdown', trigger, box.left + 4, box.top + 4);
      });

      const banana = await screen.findByRole('option', { name: 'Banana' });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
      });

      const target = banana.getBoundingClientRect();

      await act(async () => {
        mouse(
          'pointerup',
          banana,
          target.left + target.width / 2,
          target.top + target.height / 2,
        );
      });

      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalledWith('banana');
      });
    });
  });
});
