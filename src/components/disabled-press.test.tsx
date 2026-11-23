import { renderWithRoot, screen, userEvent, wait, waitFor } from '../test';

import { Action } from './actions/Action/Action';
import { Button } from './actions/Button/Button';
import { ItemAction } from './actions/ItemAction/ItemAction';
import { ItemButton } from './actions/ItemButton/ItemButton';
import { Select } from './fields/Select/Select';
import { ToggleGroup } from './fields/ToggleGroup/ToggleGroup';
import { Dialog } from './overlays/Dialog/Dialog';
import { DialogTrigger } from './overlays/Dialog/DialogTrigger';

/**
 * A control pressed while natively disabled acts on the first press after it
 * is enabled. A browser sends a disabled `<button>` its pointer events but no
 * click, and React Aria's `usePress` marks itself pressed on that
 * `pointerdown` with nothing to clear it, so the kit gives a disabled control
 * no press handlers at all.
 *
 * `userEvent.setup()` keeps one pointer resting on the control between
 * clicks, as a person's mouse does. The bare `userEvent.click` starts a new
 * pointer each time, and the `pointerenter` that sends would hide the bug.
 */

type User = ReturnType<typeof userEvent.setup>;

async function pressWhileDisabled(user: User, control: HTMLElement) {
  expect(control).toBeDisabled();
  // Sends the pointer events a browser sends to a disabled control.
  await user.click(control, { pointerEventsCheck: 0 });
  // Past `usePress`'s 80ms fallback click, which would otherwise end the stale
  // press on a control already enabled and hide the bug.
  await wait(150);
}

describe('a control pressed while disabled', () => {
  const ACTIONS = { Action, Button, ItemAction, ItemButton };

  it.each(Object.keys(ACTIONS))(
    '%s acts on the first press after it is enabled',
    async (name) => {
      const Component = ACTIONS[name];
      const user = userEvent.setup();
      const onPress = vi.fn();
      const ui = (isDisabled: boolean) => (
        <Component qa="Control" isDisabled={isDisabled} onPress={onPress}>
          Export
        </Component>
      );
      const { rerender } = renderWithRoot(ui(true));
      const control = screen.getByTestId('Control');

      await pressWhileDisabled(user, control);
      rerender(ui(false));
      expect(onPress).not.toHaveBeenCalled();

      await user.click(control);
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('closes its popover on the first press after it is enabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const ui = (isDisabled: boolean) => (
      <DialogTrigger type="popover">
        <Button>Download</Button>
        <Dialog>
          <ItemButton qa="Csv" isDisabled={isDisabled} onPress={onPress}>
            CSV
          </ItemButton>
          <ItemButton>PNG image</ItemButton>
        </Dialog>
      </DialogTrigger>
    );
    const { rerender } = renderWithRoot(ui(true));

    await user.click(screen.getByRole('button', { name: 'Download' }));

    const row = await screen.findByTestId('Csv');

    await pressWhileDisabled(user, row);
    rerender(ui(false));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(row);
    expect(onPress).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('Select opens on the first press after it is enabled', async () => {
    const user = userEvent.setup();
    const ui = (isDisabled: boolean) => (
      <Select aria-label="Format" isDisabled={isDisabled}>
        <Select.Item key="csv">CSV</Select.Item>
        <Select.Item key="png">PNG image</Select.Item>
      </Select>
    );
    const { rerender } = renderWithRoot(ui(true));
    const trigger = screen.getByRole('button', { name: /Format/ });

    await pressWhileDisabled(user, trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(ui(false));

    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('ToggleGroup selects on the first press after it is enabled', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const ui = (isDisabled: boolean) => (
      <ToggleGroup
        aria-label="Chart"
        isDisabled={isDisabled}
        onSelectionChange={onSelectionChange}
      >
        <ToggleGroup.Item key="bar">Bar</ToggleGroup.Item>
        <ToggleGroup.Item key="line">Line</ToggleGroup.Item>
      </ToggleGroup>
    );
    const { rerender } = renderWithRoot(ui(true));
    const item = screen.getByRole('radio', { name: 'Line' });

    await pressWhileDisabled(user, item);
    rerender(ui(false));
    expect(onSelectionChange).not.toHaveBeenCalled();

    await user.click(item);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });
});
