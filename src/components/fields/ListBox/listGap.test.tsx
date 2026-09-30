import { ReactElement } from 'react';

import {
  act,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../test';
import { ComboBox } from '../ComboBox/ComboBox';
import { CommandTextArea } from '../CommandTextArea/CommandTextArea';
import { FilterListBox } from '../FilterListBox/FilterListBox';
import { FilterPicker } from '../FilterPicker/FilterPicker';
import { Picker } from '../Picker/Picker';
import { SearchComboBox } from '../SearchComboBox/SearchComboBox';
import { Select } from '../Select/Select';
import { TagInput } from '../TagInput/TagInput';

import { ListBox } from './ListBox';

vi.mock('../../../_internal/hooks/use-warn');

/**
 * `listGap` reaches the list from every component that renders one. The value
 * rides on the list as `$list-gap`, which spaces its options; the spacing
 * itself is measured in `ListBox.browser.test.tsx`.
 */
describe('listGap', () => {
  const gapOf = (element: HTMLElement) =>
    element.style.getPropertyValue('--list-gap');

  const open = {
    none: async () => {},
    button: async () => {
      await act(async () => {
        await userEvent.click(screen.getByRole('button'));
      });
    },
    type: async () => {
      await userEvent.type(screen.getByRole('combobox'), 'r');
    },
    slash: async () => {
      await userEvent.type(screen.getByRole('combobox'), '/');
    },
    focus: async () => {
      await userEvent.click(screen.getByRole('combobox'));
    },
  };

  const cases: [string, (gap?: number) => ReactElement, keyof typeof open][] = [
    [
      'ListBox',
      (gap) => (
        <ListBox aria-label="Colors" listGap={gap}>
          <ListBox.Item key="red">Red</ListBox.Item>
          <ListBox.Item key="green">Green</ListBox.Item>
        </ListBox>
      ),
      'none',
    ],
    [
      'FilterListBox',
      (gap) => (
        <FilterListBox aria-label="Colors" listGap={gap}>
          <FilterListBox.Item key="red">Red</FilterListBox.Item>
          <FilterListBox.Item key="green">Green</FilterListBox.Item>
        </FilterListBox>
      ),
      'none',
    ],
    [
      'Picker',
      (gap) => (
        <Picker aria-label="Colors" listGap={gap}>
          <Picker.Item key="red">Red</Picker.Item>
          <Picker.Item key="green">Green</Picker.Item>
        </Picker>
      ),
      'button',
    ],
    [
      'FilterPicker',
      (gap) => (
        <FilterPicker aria-label="Colors" listGap={gap}>
          <FilterPicker.Item key="red">Red</FilterPicker.Item>
          <FilterPicker.Item key="green">Green</FilterPicker.Item>
        </FilterPicker>
      ),
      'button',
    ],
    [
      'ComboBox',
      (gap) => (
        <ComboBox aria-label="Colors" listGap={gap}>
          <ComboBox.Item key="red">Red</ComboBox.Item>
          <ComboBox.Item key="green">Green</ComboBox.Item>
        </ComboBox>
      ),
      'type',
    ],
    [
      'SearchComboBox',
      (gap) => (
        <SearchComboBox aria-label="Colors" listGap={gap}>
          <SearchComboBox.Item key="red">Red</SearchComboBox.Item>
          <SearchComboBox.Item key="green">Green</SearchComboBox.Item>
        </SearchComboBox>
      ),
      'type',
    ],
    [
      'TagInput',
      (gap) => (
        <TagInput aria-label="Colors" popoverTrigger="focus" listGap={gap}>
          <TagInput.Item key="red">Red</TagInput.Item>
          <TagInput.Item key="green">Green</TagInput.Item>
        </TagInput>
      ),
      'focus',
    ],
    [
      'CommandTextArea',
      (gap) => (
        <CommandTextArea aria-label="Message" listGap={gap}>
          <CommandTextArea.Item key="/clear" textValue="/clear">
            /clear
          </CommandTextArea.Item>
          <CommandTextArea.Item key="/help" textValue="/help">
            /help
          </CommandTextArea.Item>
        </CommandTextArea>
      ),
      'slash',
    ],
    [
      'Select',
      (gap) => (
        <Select aria-label="Colors" listGap={gap}>
          <Select.Item key="red">Red</Select.Item>
          <Select.Item key="green">Green</Select.Item>
        </Select>
      ),
      'button',
    ],
  ];

  it.each(cases)('%s hands it to its list', async (_name, render, how) => {
    renderWithRoot(render(4));
    await open[how]();

    const list = await waitFor(() => screen.getByRole('listbox'));

    expect(gapOf(list)).toBe('4px');
  });

  it.each(cases)(
    '%s leaves the default gap alone',
    async (_name, render, how) => {
      renderWithRoot(render());
      await open[how]();

      const list = await waitFor(() => screen.getByRole('listbox'));

      expect(gapOf(list)).toBe('');
    },
  );

  // A Select section list declares its own `$list-gap`, so it gets the value too.
  it('reaches the section lists of a Select', async () => {
    renderWithRoot(
      <Select aria-label="Colors" listGap={4}>
        <Select.Section title="Warm">
          <Select.Item key="red">Red</Select.Item>
        </Select.Section>
        <Select.Section title="Cool">
          <Select.Item key="blue">Blue</Select.Item>
        </Select.Section>
      </Select>,
    );
    await open.button();

    const list = await waitFor(() => screen.getByRole('listbox'));

    for (const group of within(list).getAllByRole('group')) {
      expect(gapOf(group)).toBe('4px');
    }
  });
});
