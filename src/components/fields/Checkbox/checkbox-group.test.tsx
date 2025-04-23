import { Checkbox, Field } from '../../../index';
import { act, render, renderWithForm, userEvent } from '../../../test';

jest.mock('../../../_internal/hooks/use-warn');

describe('<CheckboxGroup />', () => {
  it('should respect defaultValue prop', () => {
    const { getAllByRole } = render(
      <Checkbox.Group defaultValue={['one']} label="test">
        <Checkbox value="one">One</Checkbox>
        <Checkbox value="two">Two</Checkbox>
      </Checkbox.Group>,
    );

    const checkbox = getAllByRole('checkbox');

    expect(checkbox[0]).toBeChecked();
    expect(checkbox[1]).not.toBeChecked();
  });

  it('should work with new <Form />', async () => {
    const { formInstance, getAllByRole } = renderWithForm(
      <Checkbox.Group defaultValue={['one']} label="test" name="test">
        <Checkbox value="one">One</Checkbox>
        <Checkbox value="two">Two</Checkbox>
      </Checkbox.Group>,
    );
    const checkbox = getAllByRole('checkbox');

    expect(checkbox[0]).toBeChecked();
    expect(checkbox[1]).not.toBeChecked();

    await act(async () => await userEvent.click(checkbox[1]));

    expect(checkbox[0]).toBeChecked();
    expect(checkbox[1]).toBeChecked();

    expect(formInstance.getFieldValue('test')).toEqual(['one', 'two']);
  });

  it('should interop with <Form />', async () => {
    const { getAllByRole, formInstance } = renderWithForm(
      <Field name="test" defaultValue={['two']}>
        <Checkbox.Group label="test">
          <Checkbox value="one">Buy milk</Checkbox>
          <Checkbox value="two">Buy coffee</Checkbox>
          <Checkbox value="three">Buy bread</Checkbox>
        </Checkbox.Group>
      </Field>,
    );

    const checkbox = getAllByRole('checkbox');
    await act(async () => await userEvent.click(checkbox[0]));

    expect(checkbox[0]).toBeChecked();
    expect(checkbox[1]).toBeChecked();
    expect(formInstance.getFieldValue('test')).toEqual(['two', 'one']);
  });
});
