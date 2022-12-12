import userEvent from '@testing-library/user-event';

import { render, renderWithForm } from '../../../test';
import { Field } from '../Form';

import { Checkbox } from './Checkbox';

describe('<Checkbox />', () => {
  it('should work without form', async () => {
    const { getByRole } = render(<Checkbox>Test</Checkbox>);
    const checkboxElement = getByRole('checkbox');

    await userEvent.click(checkboxElement);

    expect(checkboxElement).toBeChecked();
  });

  it('should interop with <Form />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Checkbox name="test">Test</Checkbox>,
    );

    const checkboxElement = getByRole('checkbox');

    await userEvent.click(checkboxElement);

    expect(checkboxElement).toBeChecked();
    expect(formInstance.getFieldValue('test')).toBe(true);
  });

  it('should interop with legacy <Field />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test">
        <Checkbox>Test</Checkbox>
      </Field>,
    );

    const checkboxElement = getByRole('checkbox');

    await userEvent.click(checkboxElement);

    expect(checkboxElement).toBeChecked();
    expect(formInstance.getFieldValue('test')).toBe(true);
  });
});
