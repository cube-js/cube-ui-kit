import {
  act,
  renderWithForm,
  renderWithRoot,
  userEvent,
  waitForElementToBeRemoved,
} from '../../../test/index';
import { Field } from '../../form';

import { Select } from './Select';

vi.mock('../../../_internal/hooks/use-warn');

describe('<Select />', () => {
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
});
