import { renderWithForm, userEvent } from '../../../test';
import { Field } from '../Form';

import { Switch } from './Switch';

describe('<Switch />', () => {
  it('should interop with <Form />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test">
        <Switch aria-label="test" />
      </Field>,
    );

    const switchElement = getByRole('switch');

    await userEvent.click(switchElement);

    expect(switchElement).toBeChecked();
    expect(formInstance.getFieldValue('test')).toBe(true);
  });
});
