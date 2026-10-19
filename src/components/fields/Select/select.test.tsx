import { createRef } from 'react';

import {
  act,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '../../../test/index';
import { Field } from '../../form';

import { Select } from './Select';

vi.mock('../../../_internal/hooks/use-warn');

const letters = [
  <Select.Item key="a">Alpha</Select.Item>,
  <Select.Item key="b">Bravo</Select.Item>,
  <Select.Item key="c">Charlie</Select.Item>,
];

const fifty = Array.from({ length: 50 }, (_, index) => (
  <Select.Item key={`item-${index + 1}`}>{`Item ${index + 1}`}</Select.Item>
));

function getTrigger() {
  return screen.getByTestId('Select');
}

async function focusTrigger() {
  await act(async () => getTrigger().focus());
}

describe('<Select />', () => {
  it('forwards its ref to the field', () => {
    let field: HTMLDivElement | null = null;
    const { getByTestId } = renderWithRoot(
      <Select
        ref={(node) => {
          field = node;
        }}
        label="test"
        qa="Fruit"
      >
        <Select.Item key="1">Blue</Select.Item>
      </Select>,
    );

    expect(field).toContainElement(getByTestId('Fruit'));
  });

  it('should select value', async () => {
    const { getByRole, getAllByRole } = renderWithRoot(
      <Select label="test" name="test">
        <Select.Item key="1">Blue</Select.Item>
        <Select.Item key="2">Red</Select.Item>
        <Select.Item key="3">Green</Select.Item>
      </Select>,
    );

    const select = getByRole('button');
    await act(async () => await userEvent.click(select));

    const options = getAllByRole('option');
    await act(async () => await userEvent.click(options[1]));

    expect(select).toHaveTextContent('Red');
  });

  it('should interop with legacy <Field />', async () => {
    const { getByRole, getAllByRole, formInstance } = renderWithForm(
      <Field name="test">
        <Select label="test">
          <Select.Item key="1">Blue</Select.Item>
          <Select.Item key="2">Red</Select.Item>
          <Select.Item key="3">Green</Select.Item>
        </Select>
      </Field>,
    );

    const select = getByRole('button');
    await act(async () => await userEvent.click(select));

    const options = getAllByRole('option');
    await act(async () => await userEvent.click(options[1]));

    expect(select).toHaveTextContent('Red');
    expect(formInstance.getFieldValue('test')).toBe('2');
  });

  it('should interop with <Form />', async () => {
    const { getByRole, getAllByRole, formInstance } = renderWithForm(
      <Select label="test" name="test">
        <Select.Item key="1">Blue</Select.Item>
        <Select.Item key="2">Red</Select.Item>
        <Select.Item key="3">Green</Select.Item>
      </Select>,
    );

    const select = getByRole('button');
    await act(async () => await userEvent.click(select));

    const options = getAllByRole('option');
    await act(async () => await userEvent.click(options[1]));

    expect(select).toHaveTextContent('Red');
    expect(formInstance.getFieldValue('test')).toBe('2');
  });

  it('should close popover when clicking trigger the second time', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <Select label="test" name="test">
        <Select.Item key="1">Blue</Select.Item>
        <Select.Item key="2">Red</Select.Item>
        <Select.Item key="3">Green</Select.Item>
      </Select>,
    );

    const select = getByRole('button');

    // First click - open the popover
    await act(async () => await userEvent.click(select));

    // Check that the listbox is visible
    const listbox = queryByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Second click - should close the popover
    await act(async () => await userEvent.click(select));

    // Wait for the exit transition to complete and element to be removed
    await waitForElementToBeRemoved(() => queryByRole('listbox'));
  });

  describe('Custom actions', () => {
    const items = [
      <Select.Item key="1">Blue</Select.Item>,
      <Select.Item key="2">Red</Select.Item>,
    ];

    it('should render custom actions before the clear button', () => {
      const { getByTestId } = renderWithRoot(
        <Select
          isClearable
          label="test"
          defaultSelectedKey="1"
          actions={<Select.Action qa="ResetAction">Reset</Select.Action>}
        >
          {items}
        </Select>,
      );

      const resetAction = getByTestId('ResetAction');
      const clearButton = getByTestId('SelectClearButton');

      expect(resetAction).toBeInTheDocument();
      // `Node.DOCUMENT_POSITION_FOLLOWING` — the clear button comes after the
      // custom action in document order, which is what "to the left of the
      // built-in actions" means in the trigger's LTR layout.
      expect(
        resetAction.compareDocumentPosition(clearButton) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('should call the action handler without opening the popover', async () => {
      const onReset = vi.fn();

      const { getByTestId, queryByRole } = renderWithRoot(
        <Select
          label="test"
          defaultSelectedKey="1"
          actions={
            <Select.Action qa="ResetAction" onPress={onReset}>
              Reset
            </Select.Action>
          }
        >
          {items}
        </Select>,
      );

      await act(async () => await userEvent.click(getByTestId('ResetAction')));

      expect(onReset).toHaveBeenCalledTimes(1);
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should run a custom action while the popover is open, and keep it open', async () => {
      const onReset = vi.fn();

      const { getByTestId, queryByRole } = renderWithRoot(
        <Select
          label="test"
          defaultSelectedKey="1"
          actions={
            <Select.Action qa="ResetAction" onPress={onReset}>
              Reset
            </Select.Action>
          }
        >
          {items}
        </Select>,
      );

      await act(async () => await userEvent.click(getByTestId('Select')));
      expect(queryByRole('listbox')).toBeInTheDocument();

      await act(async () => await userEvent.click(getByTestId('ResetAction')));

      // `useOverlay`'s dismiss predicate used to read a press on the trigger's
      // own trailing run as a press on the trigger, dismiss, and swallow it.
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    it('should clear while the popover is open', async () => {
      const onClear = vi.fn();

      const { getByTestId } = renderWithRoot(
        <Select
          isClearable
          label="test"
          defaultSelectedKey="1"
          onClear={onClear}
        >
          {items}
        </Select>,
      );

      await act(async () => await userEvent.click(getByTestId('Select')));
      await act(
        async () => await userEvent.click(getByTestId('SelectClearButton')),
      );

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('should still open the popover when the trigger itself is pressed', async () => {
      const { getByTestId, queryByRole } = renderWithRoot(
        <Select
          label="test"
          defaultSelectedKey="1"
          actions={<Select.Action qa="ResetAction">Reset</Select.Action>}
        >
          {items}
        </Select>,
      );

      await act(async () => await userEvent.click(getByTestId('Select')));

      expect(queryByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('read-only', () => {
    it('does not open, step or typeahead to another value', async () => {
      const onSelectionChange = vi.fn();
      const onOpenChange = vi.fn();

      renderWithRoot(
        <Select
          isReadOnly
          label="Letter"
          defaultSelectedKey="a"
          onSelectionChange={onSelectionChange}
          onOpenChange={onOpenChange}
        >
          {letters}
        </Select>,
      );

      const trigger = getTrigger();

      await act(async () => await userEvent.click(trigger));
      expect(trigger).toHaveFocus();
      await focusTrigger();
      await act(async () => await userEvent.keyboard('{ArrowDown}'));
      await act(async () => await userEvent.keyboard('{Enter}'));
      await act(async () => await userEvent.keyboard('{ArrowRight}'));
      await act(async () => await userEvent.keyboard('c'));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveTextContent('Alpha');
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('keeps the trigger focusable and enabled', () => {
      renderWithRoot(
        <Select isReadOnly label="Letter" defaultSelectedKey="a">
          {letters}
        </Select>,
      );

      expect(getTrigger()).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Letter/ })).toBe(getTrigger());
    });
  });

  describe('onOpenChange', () => {
    it('fires once per real transition and not on mount', async () => {
      const onOpenChange = vi.fn();

      renderWithRoot(
        <Select label="Letter" onOpenChange={onOpenChange}>
          {letters}
        </Select>,
      );

      expect(onOpenChange).not.toHaveBeenCalled();

      await act(async () => await userEvent.click(getTrigger()));
      expect(onOpenChange.mock.calls).toEqual([[true]]);

      await act(async () => await userEvent.keyboard('{Escape}'));
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    });
  });

  describe('popup size', () => {
    it.each([
      ['medium', 'medium'],
      ['large', 'large'],
    ])('a %s field opens %s options', async (size, optionSize) => {
      renderWithRoot(
        <Select label="Letter" size={size}>
          {letters}
        </Select>,
      );

      await act(async () => await userEvent.click(getTrigger()));

      for (const option of screen.getAllByRole('option')) {
        expect(option).toHaveAttribute('data-size', optionSize);
      }
    });
  });

  describe('sections', () => {
    it('keeps the divider between sections out of the listbox structure', async () => {
      renderWithRoot(
        <Select label="Colour">
          <Select.Section title="Warm">
            <Select.Item key="red">Red</Select.Item>
          </Select.Section>
          <Select.Section title="Cool">
            <Select.Item key="blue">Blue</Select.Item>
          </Select.Section>
        </Select>,
      );

      await act(async () => await userEvent.click(getTrigger()));

      const listbox = screen.getByRole('listbox');

      expect(within(listbox).queryByRole('separator')).not.toBeInTheDocument();
      expect(within(listbox).getAllByRole('group')).toHaveLength(2);
      // The divider stays on screen, as presentation only.
      expect(within(listbox).getByTestId('Divider')).toHaveAttribute(
        'role',
        'presentation',
      );
    });
  });

  describe('trigger props', () => {
    it('focuses the trigger with autoFocus', () => {
      renderWithRoot(
        <Select autoFocus label="Letter">
          {letters}
        </Select>,
      );

      expect(getTrigger()).toHaveFocus();
    });

    it('forwards inputProps to the trigger', () => {
      renderWithRoot(
        <Select label="Letter" inputProps={{ 'data-x': '1' }}>
          {letters}
        </Select>,
      );

      expect(getTrigger()).toHaveAttribute('data-x', '1');
    });

    it.each([
      ['the caret', {}],
      ['a custom rightIcon', { rightIcon: <span /> }],
    ])('replaces the loading icon with loadingIndicator (%s)', (_, props) => {
      renderWithRoot(
        <Select
          isLoading
          label="Letter"
          loadingIndicator={<span data-qa="CustomLoader" />}
          {...props}
        >
          {letters}
        </Select>,
      );

      expect(screen.getByTestId('CustomLoader')).toBeInTheDocument();
      expect(screen.queryByTestId('LoadingIcon')).not.toBeInTheDocument();
    });

    it('fills popoverRef with the popover element', async () => {
      const popoverRef = createRef<HTMLDivElement>();

      renderWithRoot(
        <Select label="Letter" popoverRef={popoverRef}>
          {letters}
        </Select>,
      );

      await act(async () => await userEvent.click(getTrigger()));

      expect(popoverRef.current).toContainElement(screen.getByRole('listbox'));
    });
  });

  describe('clearing', () => {
    it('reports the cleared value once', async () => {
      const onSelectionChange = vi.fn();
      const onClear = vi.fn();

      renderWithRoot(
        <Select
          isClearable
          label="Letter"
          defaultSelectedKey="a"
          onSelectionChange={onSelectionChange}
          onClear={onClear}
        >
          {letters}
        </Select>,
      );

      await act(
        async () =>
          await userEvent.click(screen.getByTestId('SelectClearButton')),
      );

      expect(onSelectionChange.mock.calls).toEqual([[null]]);
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(getTrigger()).toHaveFocus();
    });

    it('does not open the trigger tooltip when it hands focus back', async () => {
      renderWithRoot(
        <Select
          isClearable
          label="Letter"
          tooltip="Pick a letter"
          defaultSelectedKey="a"
        >
          {letters}
        </Select>,
      );

      const clear = screen.getByTestId('SelectClearButton');

      await act(async () => clear.focus());
      await act(async () => await userEvent.keyboard('{Enter}'));

      expect(getTrigger()).toHaveFocus();
      expect(getTrigger()).toHaveTextContent('');
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('cannot clear while loading', () => {
      renderWithRoot(
        <Select
          isClearable
          isLoading
          isDisabled={false}
          label="Letter"
          defaultSelectedKey="a"
        >
          {letters}
        </Select>,
      );

      expect(screen.queryByTestId('SelectClearButton')).not.toBeInTheDocument();
    });
  });

  describe('loading and disabled', () => {
    it('does not open or typeahead while loading', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <Select
          isLoading
          label="Letter"
          defaultSelectedKey="a"
          onSelectionChange={onSelectionChange}
        >
          {letters}
        </Select>,
      );

      const trigger = getTrigger();

      await act(async () => await userEvent.click(trigger));
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await focusTrigger();
      await act(async () => await userEvent.keyboard('c'));

      expect(trigger).toHaveTextContent('Alpha');
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it.each([
      ['isDisabled', { isDisabled: true }],
      ['isLoading', { isLoading: true }],
      ['isReadOnly', { isReadOnly: true }],
    ])('closes when %s turns on while open', async (_, lockProps) => {
      const onOpenChange = vi.fn();
      const ui = (props = {}) => (
        <Select label="Letter" onOpenChange={onOpenChange} {...props}>
          {letters}
        </Select>
      );

      const { rerender } = renderWithRoot(ui());

      await act(async () => await userEvent.click(getTrigger()));
      expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');

      rerender(ui(lockProps));

      await waitFor(() =>
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false'),
      );
      expect(onOpenChange).toHaveBeenLastCalledWith(false);

      rerender(ui());

      expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
      await waitFor(() =>
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
      );
      expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('opening focus', () => {
    it('opens on the last option with ArrowUp, even with a selection', async () => {
      renderWithRoot(
        <Select label="Item" defaultSelectedKey="item-40">
          {fifty}
        </Select>,
      );

      await focusTrigger();
      await act(async () => await userEvent.keyboard('{ArrowUp}'));

      await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Item 50' })).toHaveFocus(),
      );
    });

    it.each(['{ArrowDown}', '{Enter}'])(
      'opens on the selected option with %s',
      async (key) => {
        renderWithRoot(
          <Select label="Item" defaultSelectedKey="item-40">
            {fifty}
          </Select>,
        );

        await focusTrigger();
        await act(async () => await userEvent.keyboard(key));

        await waitFor(() =>
          expect(screen.getByRole('option', { name: 'Item 40' })).toHaveFocus(),
        );
      },
    );

    it('opens on the first option, not the one focused last time', async () => {
      renderWithRoot(<Select label="Letter">{letters}</Select>);

      await focusTrigger();
      await act(async () => await userEvent.keyboard('{ArrowDown}'));
      await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Alpha' })).toHaveFocus(),
      );

      await act(async () => await userEvent.keyboard('{ArrowDown}'));
      expect(screen.getByRole('option', { name: 'Bravo' })).toHaveFocus();

      await act(async () => await userEvent.keyboard('{Escape}'));
      await waitFor(() => expect(getTrigger()).toHaveFocus());
      await waitFor(() =>
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
      );

      await act(async () => await userEvent.keyboard('{ArrowDown}'));

      await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Alpha' })).toHaveFocus(),
      );
    });

    it('skips disabled options at either end', async () => {
      renderWithRoot(
        <Select label="Item" disabledKeys={['item-1', 'item-50']}>
          {fifty}
        </Select>,
      );

      await focusTrigger();
      await act(async () => await userEvent.keyboard('{ArrowUp}'));

      await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Item 49' })).toHaveFocus(),
      );
    });
  });
});
