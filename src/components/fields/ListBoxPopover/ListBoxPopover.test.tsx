import { ReactNode } from 'react';

import { renderWithRoot, userEvent, waitFor } from '../../../test/index';
import { Button } from '../../actions/Button/Button';
import { Content } from '../../content/Content';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';
import { Checkbox } from '../Checkbox/Checkbox';
import { ComboBox } from '../ComboBox/ComboBox';
import { CommandTextArea } from '../CommandTextArea/CommandTextArea';
import { Radio } from '../RadioGroup/Radio';
import { RadioGroup } from '../RadioGroup/RadioGroup';
import { SearchComboBox } from '../SearchComboBox/SearchComboBox';
import { Switch } from '../Switch/Switch';
import { TagInput } from '../TagInput/TagInput';
import { TextInput } from '../TextInput/TextInput';

vi.mock('../../../_internal/hooks/use-warn');

const people = [
  { key: 'ann', label: 'Ann' },
  { key: 'bob', label: 'Bob' },
  { key: 'rex', label: 'Rex' },
];

/** The controls a press outside the open list should reach on its own. */
function OutsideControls({
  onSave,
  onLink,
}: {
  onSave?: () => void;
  onLink?: () => void;
}) {
  return (
    <>
      <Checkbox>Inbox</Checkbox>
      <Switch>Notify</Switch>
      <RadioGroup label="Delivery">
        <Radio value="now">Now</Radio>
        <Radio value="later">Later</Radio>
      </RadioGroup>
      <TextInput label="Subject" />
      <Button onPress={onSave}>Save</Button>
      <a
        href="#docs"
        onClick={(event) => {
          event.preventDefault();
          onLink?.();
        }}
      >
        Docs
      </a>
      <div data-qa="Blank">Blank space</div>
    </>
  );
}

function InDialog({ children }: { children: ReactNode }) {
  return (
    <DialogTrigger isDismissable type="modal">
      <Button>Open</Button>
      <Dialog aria-label="Scheduled task">
        <Content>{children}</Content>
      </Dialog>
    </DialogTrigger>
  );
}

async function openDialog(utils: ReturnType<typeof renderWithRoot>) {
  await userEvent.click(utils.getByRole('button', { name: 'Open' }));
  await waitFor(() => expect(utils.getByRole('dialog')).toBeVisible());
}

describe('<ListBoxPopover /> outside presses', () => {
  describe('a ComboBox in a dialog', () => {
    async function renderWithOpenList(
      props: Partial<Parameters<typeof ComboBox>[0]> = {},
      onSave?: () => void,
      onLink?: () => void,
    ) {
      const utils = renderWithRoot(
        <InDialog>
          <ComboBox label="People" popoverTrigger="focus" {...props}>
            {people.map((person) => (
              <ComboBox.Item key={person.key}>{person.label}</ComboBox.Item>
            ))}
          </ComboBox>
          <OutsideControls onSave={onSave} onLink={onLink} />
        </InDialog>,
      );

      await openDialog(utils);
      await userEvent.click(utils.getByRole('combobox'));
      await waitFor(() => expect(utils.getByRole('listbox')).toBeVisible());

      return utils;
    }

    it.each([
      ['checkbox', 'Inbox'],
      ['switch', 'Notify'],
      ['radio', 'Later'],
    ])(
      'checks a %s on the first click and closes the list',
      async (role, name) => {
        const utils = await renderWithOpenList();
        const control = utils.getByRole(role, { name });

        await userEvent.click(control);

        expect(control).toBeChecked();
        await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
        expect(utils.getByRole('dialog')).toBeVisible();
      },
    );

    it('focuses a text field on the first click and closes the list', async () => {
      const utils = await renderWithOpenList();
      const field = utils.getByRole('textbox', { name: 'Subject' });

      await userEvent.click(field);

      expect(field).toHaveFocus();
      await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());

      await userEvent.keyboard('Weekly');
      expect(field).toHaveValue('Weekly');
    });

    it('presses a button on the first click and closes the list', async () => {
      const onSave = vi.fn();
      const utils = await renderWithOpenList({}, onSave);

      await userEvent.click(utils.getByRole('button', { name: 'Save' }));

      expect(onSave).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
    });

    it('follows a link on the first click and closes the list', async () => {
      const onLink = vi.fn();
      const utils = await renderWithOpenList({}, undefined, onLink);

      await userEvent.click(utils.getByRole('link', { name: 'Docs' }));

      expect(onLink).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
    });

    // The dialog itself takes focus (`tabindex="-1"`), but it holds the
    // field, so a press on its blank space is not a press on a control.
    it('only closes the list on blank space in the dialog', async () => {
      const onSelectionChange = vi.fn();
      const utils = await renderWithOpenList({ onSelectionChange });
      const input = utils.getByRole('combobox');

      await userEvent.type(input, 'r');
      await userEvent.click(utils.getByTestId('Blank'));

      await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
      expect(input).toHaveFocus();
      expect(input).toHaveValue('r');
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(utils.getByRole('dialog')).toBeVisible();
    });

    it('keeps its own input focused with the draft when the input is pressed', async () => {
      const onSelectionChange = vi.fn();
      const utils = await renderWithOpenList({ onSelectionChange });
      const input = utils.getByRole('combobox');

      await userEvent.type(input, 'r');
      await userEvent.click(input);

      expect(input).toHaveFocus();
      expect(input).toHaveValue('r');
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    // Focus leaves the field before the control acts, as on Tab: the field
    // settles its draft first, then the checkbox toggles.
    it('settles the typed draft before the outside control acts', async () => {
      const events: string[] = [];
      const utils = await renderWithOpenList({
        onSelectionChange: (key) => events.push(`select:${String(key)}`),
      });

      // "Re" names only Rex, so leaving the field picks it.
      await userEvent.type(utils.getByRole('combobox'), 'Re');

      const checkbox = utils.getByRole('checkbox', { name: 'Inbox' });

      checkbox.addEventListener('change', () => events.push('check'));
      await userEvent.click(checkbox);

      expect(events).toEqual(['select:rex', 'check']);
      expect(utils.getByRole('combobox')).toHaveValue('Rex');
    });
  });

  describe('a ComboBox in a popover', () => {
    function FiltersPopover({
      onSelectionChange,
    }: {
      onSelectionChange: (key: unknown) => void;
    }) {
      return (
        <DialogTrigger type="popover">
          <Button>Filters</Button>
          <Dialog aria-label="Filters">
            <Content>
              <ComboBox
                label="People"
                popoverTrigger="focus"
                onSelectionChange={onSelectionChange}
              >
                {people.map((person) => (
                  <ComboBox.Item key={person.key}>{person.label}</ComboBox.Item>
                ))}
              </ComboBox>
            </Content>
          </Dialog>
        </DialogTrigger>
      );
    }

    async function openList(utils: ReturnType<typeof renderWithRoot>) {
      await userEvent.click(utils.getByRole('button', { name: 'Filters' }));
      await waitFor(() =>
        expect(utils.getByRole('dialog', { name: 'Filters' })).toBeVisible(),
      );

      const input = utils.getByRole('combobox');

      // "r" names only Rex, so a blur would pick it.
      await userEvent.type(input, 'r');
      await waitFor(() => expect(utils.getByRole('listbox')).toBeVisible());

      return input;
    }

    // The popover isn't modal, but a control outside it is not in the field's
    // layer: the list takes the press as blank space and the popover stays.
    it('only closes the list on a control outside the popover', async () => {
      const onSelectionChange = vi.fn();
      const utils = renderWithRoot(
        <>
          <FiltersPopover onSelectionChange={onSelectionChange} />
          <Checkbox>Inbox</Checkbox>
        </>,
      );
      const input = await openList(utils);

      await userEvent.click(utils.getByRole('checkbox', { name: 'Inbox' }));

      await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
      expect(utils.getByRole('checkbox', { name: 'Inbox' })).not.toBeChecked();
      expect(input).toHaveValue('r');
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    // The dialog under the popover holds the field only through a portal, so
    // its surface is blank space too.
    it('only closes the list on blank space in the dialog it opened from', async () => {
      const onSelectionChange = vi.fn();
      const utils = renderWithRoot(
        <InDialog>
          <FiltersPopover onSelectionChange={onSelectionChange} />
          <div data-qa="Blank">Blank space</div>
        </InDialog>,
      );

      await openDialog(utils);

      const input = await openList(utils);

      await userEvent.click(utils.getByTestId('Blank'));

      await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
      expect(input).toHaveValue('r');
      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('a TagInput in a dialog', () => {
    async function renderWithOpenList(onChange: (value: string[]) => void) {
      const utils = renderWithRoot(
        <InDialog>
          <TagInput allowsCustomValue label="Principals" onChange={onChange}>
            <TagInput.Item key="admin">admin</TagInput.Item>
            <TagInput.Item key="analyst">analyst</TagInput.Item>
          </TagInput>
          <OutsideControls />
        </InDialog>,
      );

      await openDialog(utils);
      await userEvent.type(utils.getByRole('combobox'), 'ad');
      await waitFor(() => expect(utils.getByRole('listbox')).toBeVisible());

      return utils;
    }

    // As on the backdrop: the dialog holds the field, so its blank space is
    // not a control, and the typed text stays uncommitted in the input.
    it('only closes the list on blank space in the dialog', async () => {
      const onChange = vi.fn();
      const utils = await renderWithOpenList(onChange);
      const input = utils.getByRole('combobox');

      await userEvent.click(utils.getByTestId('Blank'));

      await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
      expect(input).toHaveFocus();
      expect(input).toHaveValue('ad');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('commits the typed text and checks an outside checkbox on the first click', async () => {
      const onChange = vi.fn();
      const utils = await renderWithOpenList(onChange);
      const checkbox = utils.getByRole('checkbox', { name: 'Inbox' });

      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(onChange).toHaveBeenLastCalledWith(['ad']);
      await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
    });
  });

  it('lets a SearchComboBox pass the first click to an outside checkbox', async () => {
    const utils = renderWithRoot(
      <>
        <SearchComboBox label="People">
          {people.map((person) => (
            <SearchComboBox.Item key={person.key}>
              {person.label}
            </SearchComboBox.Item>
          ))}
        </SearchComboBox>
        <OutsideControls />
      </>,
    );

    await userEvent.type(utils.getByRole('combobox'), 'b');
    await waitFor(() => expect(utils.getByRole('listbox')).toBeVisible());

    const checkbox = utils.getByRole('checkbox', { name: 'Inbox' });

    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
  });

  it('lets a CommandTextArea pass the first click to an outside checkbox', async () => {
    const utils = renderWithRoot(
      <>
        <CommandTextArea label="Message">
          <CommandTextArea.Item key="/clear" textValue="/clear">
            /clear
          </CommandTextArea.Item>
          <CommandTextArea.Item key="/help" textValue="/help">
            /help
          </CommandTextArea.Item>
        </CommandTextArea>
        <OutsideControls />
      </>,
    );

    await userEvent.type(utils.getByRole('combobox'), '/c');
    await waitFor(() => expect(utils.getByRole('listbox')).toBeVisible());

    const checkbox = utils.getByRole('checkbox', { name: 'Inbox' });

    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    await waitFor(() => expect(utils.queryByRole('listbox')).toBeNull());
  });
});

describe('<ListBoxPopover /> option size', () => {
  // As in Select: a small field opens medium options, which stay easy to
  // pick, and a large field opens large ones.
  it.each([
    ['small', 'medium'],
    ['medium', 'medium'],
    ['large', 'large'],
  ] as const)('gives a %s field %s options', async (size, optionSize) => {
    const utils = renderWithRoot(
      <ComboBox label="People" size={size}>
        {people.map((person) => (
          <ComboBox.Item key={person.key}>{person.label}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    await userEvent.click(utils.getByTestId('ComboBoxTrigger'));
    await waitFor(() => expect(utils.getByRole('listbox')).toBeVisible());

    expect(utils.getAllByRole('option')[0]).toHaveAttribute(
      'data-size',
      optionSize,
    );
  });
});
