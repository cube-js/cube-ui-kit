import { cleanup } from '@testing-library/react';
import { useContextMenu } from 'react-aria';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

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

  it('preserves Enter activation of a link option', async () => {
    const originalUrl = location.href;
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    renderWithRoot(
      <Select label="Destination" defaultSelectedKey="blue">
        <Select.Item key="blue">Blue</Select.Item>
        <Select.Item
          key="link"
          as="a"
          href="#select-destination"
          onClick={onClick}
          onKeyDown={onKeyDown}
        >
          Destination
        </Select.Item>
      </Select>,
    );
    try {
      await act(() =>
        userEvent.click(screen.getByRole('button', { name: /Destination/ })),
      );
      await act(() =>
        screen.getByRole('option', { name: 'Destination' }).focus(),
      );
      await act(() => userEvent.keyboard('{Enter}'));
      expect(location.hash).toBe('#select-destination');
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown.mock.calls[0][0].nativeEvent.isTrusted).toBe(true);
      expect(onKeyDown.mock.calls[0][0].nativeEvent.defaultPrevented).toBe(
        false,
      );
      expect(onClick).toHaveBeenCalled();
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
