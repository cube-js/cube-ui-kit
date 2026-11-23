import { ReactNode, useState } from 'react';
import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, wait, waitFor } from '../test';

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
 * is enabled. Chromium sends a disabled `<button>` its pointer events but no
 * click, and React Aria's `usePress` used to keep the press it started on that
 * `pointerdown`, so the next real press only ended the stale one.
 *
 * Browser only: jsdom has no `PointerEvent`, so `usePress` takes its mouse
 * fallback there, and React drops mouse handlers on a disabled button.
 */

let setEnabled: (enabled: boolean) => void;

function Enableable({
  children,
}: {
  children: (enabled: boolean) => ReactNode;
}) {
  const [enabled, set] = useState(false);

  setEnabled = set;

  return children(enabled);
}

/** Presses the disabled control, then enables it. */
async function pressWhileDisabledThenEnable(control: HTMLElement) {
  expect(control).toBeDisabled();
  // `force` sends real pointer events to the disabled control.
  await userEvent.click(control, { force: true });
  // Past `usePress`'s 80ms fallback click, which would otherwise end the stale
  // press on an already enabled control and hide the bug.
  await wait(150);
  act(() => setEnabled(true));
  await waitFor(() => expect(control).toBeEnabled());
}

describe('a control pressed while disabled', () => {
  const ACTIONS = {
    Action,
    Button,
    ItemAction,
    ItemButton,
  };

  it.each(Object.keys(ACTIONS))(
    '%s acts on the first press after it is enabled',
    async (name) => {
      const Component = ACTIONS[name];
      const onPress = vi.fn();

      renderWithRoot(
        <Enableable>
          {(enabled) => (
            <Component qa="Control" isDisabled={!enabled} onPress={onPress}>
              Export
            </Component>
          )}
        </Enableable>,
      );

      const control = screen.getByTestId('Control');

      await pressWhileDisabledThenEnable(control);
      expect(onPress).not.toHaveBeenCalled();

      await userEvent.click(control);
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('closes its popover on the first press after it is enabled', async () => {
    const onPress = vi.fn();

    renderWithRoot(
      <Enableable>
        {(enabled) => (
          <DialogTrigger type="popover">
            <Button>Download</Button>
            <Dialog>
              <ItemButton qa="Csv" isDisabled={!enabled} onPress={onPress}>
                CSV
              </ItemButton>
              <ItemButton>PNG image</ItemButton>
            </Dialog>
          </DialogTrigger>
        )}
      </Enableable>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Download' }));

    const row = await screen.findByTestId('Csv');

    await pressWhileDisabledThenEnable(row);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(row);
    expect(onPress).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('Select opens on the first press after it is enabled', async () => {
    renderWithRoot(
      <Enableable>
        {(enabled) => (
          <Select aria-label="Format" isDisabled={!enabled}>
            <Select.Item key="csv">CSV</Select.Item>
            <Select.Item key="png">PNG image</Select.Item>
          </Select>
        )}
      </Enableable>,
    );

    const trigger = screen.getByRole('button', { name: /Format/ });

    await pressWhileDisabledThenEnable(trigger);

    await userEvent.click(trigger);
    // The press opens it at once; the default 15s wait would only time out.
    await waitFor(
      () => expect(screen.getByRole('listbox')).toBeInTheDocument(),
      { timeout: 1000 },
    );
  });

  it('ToggleGroup selects on the first press after it is enabled', async () => {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <Enableable>
        {(enabled) => (
          <ToggleGroup
            aria-label="Chart"
            isDisabled={!enabled}
            onSelectionChange={onSelectionChange}
          >
            <ToggleGroup.Item key="bar">Bar</ToggleGroup.Item>
            <ToggleGroup.Item key="line">Line</ToggleGroup.Item>
          </ToggleGroup>
        )}
      </Enableable>,
    );

    const item = screen.getByText('Line').closest('button')!;

    await pressWhileDisabledThenEnable(item);
    expect(onSelectionChange).not.toHaveBeenCalled();

    await userEvent.click(item);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });
});
