import { cloneElement, ReactElement } from 'react';

import {
  act,
  fireEvent,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../test';
import { Button } from '../actions/Button/Button';
import { Content } from '../content/Content';
import { Dialog } from '../overlays/Dialog/Dialog';
import { DialogTrigger } from '../overlays/Dialog/DialogTrigger';

import { ColorInput } from './ColorInput/ColorInput';
import { ComboBox } from './ComboBox/ComboBox';
import { CommandTextArea } from './CommandTextArea/CommandTextArea';
import { NumberInput } from './NumberInput/NumberInput';
import { PasswordInput } from './PasswordInput/PasswordInput';
import { SearchComboBox } from './SearchComboBox/SearchComboBox';
import { SearchInput } from './SearchInput/SearchInput';
import { TagInput } from './TagInput/TagInput';
import { TextArea } from './TextArea/TextArea';
import { TextInput } from './TextInput/TextInput';

import type { KeyboardEvent } from '@react-types/shared';

vi.mock('../../_internal/hooks/use-warn');

/**
 * One rule for every field a user types into: `Escape` and `Tab` go on to the
 * overlay around the field — a Dialog closes on `Escape`, its focus scope
 * moves focus on `Tab` — unless the field acts on the key or the caller's
 * `onKeyDown` prevents it. A prevented one stops at the input. Each field is
 * idle here: empty, with no list open, so it has nothing to act on.
 */
const FIELDS: [string, ReactElement<any>][] = [
  ['TextInput', <TextInput label="Field" />],
  ['TextArea', <TextArea label="Field" />],
  ['PasswordInput', <PasswordInput label="Field" />],
  ['NumberInput', <NumberInput label="Field" />],
  [
    'ComboBox',
    <ComboBox label="Field">
      <ComboBox.Item key="one">One</ComboBox.Item>
    </ComboBox>,
  ],
  [
    'SearchComboBox',
    <SearchComboBox label="Field">
      <SearchComboBox.Item key="one">One</SearchComboBox.Item>
    </SearchComboBox>,
  ],
  ['TagInput', <TagInput label="Field" />],
  ['CommandTextArea', <CommandTextArea label="Field" />],
];

// No `onKeyDown` of their own to hand the key to.
const FIELDS_WITHOUT_KEY_HANDLER: [string, ReactElement<any>][] = [
  ['ColorInput', <ColorInput label="Field" />],
  ['SearchInput', <SearchInput label="Field" />],
];

function pressInField(field: ReactElement<any>, key: string) {
  const onParentKeyDown = vi.fn();
  const { container } = renderWithRoot(
    <div onKeyDown={(e) => onParentKeyDown(e.key)}>{field}</div>,
  );

  fireEvent.keyDown(container.querySelector('input, textarea')!, { key });

  return onParentKeyDown.mock.calls.length > 0;
}

describe.each(['Escape', 'Tab'])('%s from an idle field', (key) => {
  describe.each(FIELDS)('%s', (_, field) => {
    it('reaches ancestors without a handler', () => {
      expect(pressInField(field, key)).toBe(true);
    });

    it('reaches ancestors when the handler leaves it', () => {
      const onKeyDown = vi.fn();

      expect(pressInField(cloneElement(field, { onKeyDown }), key)).toBe(true);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('stops at the input when the handler prevents it', () => {
      const onKeyDown = vi.fn((e) => e.preventDefault());

      expect(pressInField(cloneElement(field, { onKeyDown }), key)).toBe(false);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  it.each(FIELDS_WITHOUT_KEY_HANDLER)('%s reaches ancestors', (_, field) => {
    expect(pressInField(field, key)).toBe(true);
  });
});

describe.each(FIELDS)('%s in a modal dialog', (_, field) => {
  async function openDialog(prevents: boolean) {
    const onOpenChange = vi.fn();
    const onKeyDown = (e: KeyboardEvent) => {
      if (prevents) e.preventDefault();
    };

    renderWithRoot(
      <DialogTrigger type="modal" onOpenChange={onOpenChange}>
        <Button>Edit</Button>
        <Dialog>
          <Content>
            {cloneElement(field, { onKeyDown })}
            <Button>Next</Button>
          </Content>
        </Dialog>
      </DialogTrigger>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());

    const input = screen
      .getByRole('dialog')
      .querySelector<HTMLElement>('input, textarea')!;
    act(() => input.focus());

    return { input, onOpenChange };
  }

  it.each([false, true])(
    'closes on Escape unless the handler prevents it: %s',
    async (prevents) => {
      const { input, onOpenChange } = await openDialog(prevents);

      fireEvent.keyDown(input, { key: 'Escape' });

      // The overlay closes from the keydown itself; the dialog element only
      // lingers through its exit transition.
      expect(onOpenChange.mock.calls).toEqual(
        prevents ? [[true]] : [[true], [false]],
      );
    },
  );

  it.each([false, true])(
    'moves focus on Tab unless the handler prevents it: %s',
    async (prevents) => {
      const { input } = await openDialog(prevents);

      // The dialog's focus scope moves focus itself on a `Tab` it receives,
      // whether or not it was prevented.
      fireEvent.keyDown(input, { key: 'Tab' });

      if (prevents) {
        expect(input).toHaveFocus();
      } else {
        expect(input).not.toHaveFocus();
        expect(screen.getByRole('dialog')).toContainElement(
          document.activeElement as HTMLElement,
        );
      }
    },
  );
});
