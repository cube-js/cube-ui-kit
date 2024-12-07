import { renderWithForm, userEvent, render, act } from '../../../test';
import { Field, Switch } from '../../../index';

jest.mock('../../../_internal/hooks/use-warn');

describe('<Switch />', () => {
  it('should work without form', async () => {
    const { getByRole } = render(<Switch aria-label="test" />);
    const switchElement = getByRole('switch');

    await userEvent.click(switchElement);

    expect(switchElement).toBeChecked();
  });

  it('should interop with legacy <Field />', async () => {
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

  it('should interop with <Form />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Switch aria-label="test" name="test" />,
    );

    const switchElement = getByRole('switch');

    await userEvent.click(switchElement);

    expect(switchElement).toBeChecked();
    expect(formInstance.getFieldValue('test')).toBe(true);
  });
});
