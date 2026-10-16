import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Menu } from '../../actions/Menu/Menu';
import { MenuTrigger } from '../../actions/Menu/MenuTrigger';
import { Content } from '../../content/Content';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';
import { Checkbox } from '../Checkbox/Checkbox';
import { ComboBox } from '../ComboBox/ComboBox';
import { TagInput } from '../TagInput/TagInput';
import { TextInput } from '../TextInput/TextInput';

const people = [
  { key: 'ann', label: 'Ann' },
  { key: 'bob', label: 'Bob' },
  { key: 'rex', label: 'Rex' },
];

function People({
  onSelectionChange,
}: {
  onSelectionChange: (key: unknown) => void;
}) {
  return (
    <ComboBox
      label="People"
      popoverTrigger="focus"
      onSelectionChange={onSelectionChange}
    >
      {people.map((person) => (
        <ComboBox.Item key={person.key}>{person.label}</ComboBox.Item>
      ))}
    </ComboBox>
  );
}

// Opens the dialog, then types "r", which names only Rex, so a blur would
// pick it.
async function openList(dialogName: string) {
  await act(() =>
    userEvent.click(screen.getByRole('button', { name: dialogName })),
  );
  await waitFor(() =>
    expect(screen.getByRole('dialog', { name: dialogName })).toBeVisible(),
  );

  const input = screen.getByRole('combobox');

  await act(() => userEvent.click(input));
  await act(() => userEvent.type(input, 'r'));
  await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());

  return input;
}

// Real presses: Chromium delivers a press on a disabled control the way a
// user's click does, and the layering cases depend on how long it is held.
describe('<ListBoxPopover /> outside presses in a browser', () => {
  it.each([
    ['a disabled text field', 'textbox', 'Archive'],
    ['a disabled native button', 'button', 'Locked'],
    ['a disabled UI Kit Button', 'button', 'Publish'],
    ['a UI Kit Button disabled with a tooltip', 'button', 'Share'],
  ])('ignores a press on %s', async (_, role, name) => {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <DialogTrigger isDismissable type="modal">
        <Button>Task</Button>
        <Dialog aria-label="Task">
          <Content>
            {/* Above the field, so the open list doesn't cover them. */}
            <TextInput isDisabled label="Archive" />
            <button disabled type="button">
              Locked
            </button>
            <Button isDisabled>Publish</Button>
            <Button isDisabled tooltip="Nothing to share yet">
              Share
            </Button>
            <People onSelectionChange={onSelectionChange} />
          </Content>
        </Dialog>
      </DialogTrigger>,
    );

    const input = await openList('Task');

    // `force`: Playwright otherwise waits for the control to be enabled.
    await act(() =>
      userEvent.click(screen.getByRole(role, { name }), { force: true }),
    );
    // Long enough for a blur to settle the draft, had focus moved.
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));

    // The control can't act, so the field keeps focus and its text, as on
    // blank space. A natively disabled control also leaves the list open; an
    // aria-disabled one closes it.
    expect(input).toHaveFocus();
    expect(input).toHaveValue('r');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  // The popover isn't modal, but the list takes a press outside it as blank
  // space: neither a quick nor a held press reaches the page's checkbox, the
  // popover stays open and the field keeps its text.
  it.each([0, 150])(
    'only closes the list on a control outside its popover (held %sms)',
    async (delay) => {
      const onSelectionChange = vi.fn();
      const onPageChange = vi.fn();

      renderWithRoot(
        <>
          <Checkbox onChange={onPageChange}>Inbox</Checkbox>
          <DialogTrigger type="popover">
            <Button>Filters</Button>
            <Dialog aria-label="Filters">
              <Content>
                <People onSelectionChange={onSelectionChange} />
              </Content>
            </Dialog>
          </DialogTrigger>
        </>,
      );

      const input = await openList('Filters');

      await act(() =>
        userEvent.click(screen.getByRole('checkbox', { name: 'Inbox' }), {
          delay,
        }),
      );

      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(onPageChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('r');
      expect(onSelectionChange).not.toHaveBeenCalled();
    },
  );

  it.each([0, 150])(
    'only closes the list of a field in a menu footer on a page control (held %sms)',
    async (delay) => {
      const onSelectionChange = vi.fn();
      const onPageChange = vi.fn();

      renderWithRoot(
        <>
          <Checkbox onChange={onPageChange}>Inbox</Checkbox>
          <MenuTrigger>
            <Button>Actions</Button>
            <Menu
              aria-label="Actions"
              footer={<People onSelectionChange={onSelectionChange} />}
            >
              <Menu.Item key="rename">Rename</Menu.Item>
            </Menu>
          </MenuTrigger>
        </>,
      );

      await act(() =>
        userEvent.click(screen.getByRole('button', { name: 'Actions' })),
      );
      await waitFor(() => expect(screen.getByRole('menu')).toBeVisible());

      const input = screen.getByRole('combobox');

      await act(() => userEvent.click(input));
      await act(() => userEvent.type(input, 'r'));
      await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());

      await act(() =>
        userEvent.click(screen.getByRole('checkbox', { name: 'Inbox' }), {
          delay,
        }),
      );

      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(onPageChange).not.toHaveBeenCalled();
      expect(input).toHaveFocus();
      expect(input).toHaveValue('r');
      expect(onSelectionChange).not.toHaveBeenCalled();
    },
  );

  it('keeps a TagInput draft when a control outside its popover is pressed', async () => {
    const onChange = vi.fn();
    const onPageChange = vi.fn();

    renderWithRoot(
      <>
        <Checkbox onChange={onPageChange}>Inbox</Checkbox>
        <DialogTrigger type="popover">
          <Button>Filters</Button>
          <Dialog aria-label="Filters">
            <Content>
              <TagInput
                allowsCustomValue
                label="Principals"
                onChange={onChange}
              >
                <TagInput.Item key="reader">reader</TagInput.Item>
                <TagInput.Item key="admin">admin</TagInput.Item>
              </TagInput>
            </Content>
          </Dialog>
        </DialogTrigger>
      </>,
    );

    const input = await openList('Filters');

    await act(() =>
      userEvent.click(screen.getByRole('checkbox', { name: 'Inbox' }), {
        delay: 150,
      }),
    );

    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(onPageChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('r');
    expect(onChange).not.toHaveBeenCalled();
  });
});
