import { renderWithForm, userEvent } from '../../../test';
import { Field } from '../../forms';

import { Select } from './Select';

describe('<Select />', () => {
  it('should interop with <Form />', async () => {
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
});
