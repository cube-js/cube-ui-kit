import {
  act,
  renderWithForm,
  renderWithRoot,
  userEvent,
} from '../../../test/index';
import { Field } from '../../form';

import { Select } from './Select';

jest.mock('../../../_internal/hooks/use-warn');

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
    await userEvent.click(select);

    const options = getAllByRole('option');
    await userEvent.click(options[1]);

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
    await userEvent.click(select);

    const options = getAllByRole('option');
    await userEvent.click(options[1]);

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
    await userEvent.click(select);

    const options = getAllByRole('option');
    await userEvent.click(options[1]);

    expect(select).toHaveTextContent('Red');
    expect(formInstance.getFieldValue('test')).toBe('2');
  });
});
