import { render, renderWithForm, userEvent } from '../../../test';
import { Field, Checkbox } from '../../../index';

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
      <Checkbox.Group label="test" name="test">
        <Checkbox value="one">One</Checkbox>
        <Checkbox value="two">Two</Checkbox>
      </Checkbox.Group>,
      {
        formProps: {
          defaultValues: {
            test: ['one'],
          },
        },
      },
    );
    const checkbox = getAllByRole('checkbox');

    expect(checkbox[0]).toBeChecked();
    expect(checkbox[1]).not.toBeChecked();

    await userEvent.click(checkbox[1]);

    expect(checkbox[0]).toBeChecked();
    expect(checkbox[1]).toBeChecked();

    expect(formInstance.getFieldValue('test')).toEqual(['one', 'two']);
  });

  it('should interop with <Form />', async () => {
    const { getAllByRole, formInstance } = renderWithForm(
      <Field name="test">
        <Checkbox.Group label="test">
          <Checkbox value="one">Buy milk</Checkbox>
          <Checkbox value="two">Buy coffee</Checkbox>
          <Checkbox value="three">Buy bread</Checkbox>
        </Checkbox.Group>
      </Field>,
      {
        formProps: {
          defaultValues: {
            test: ['two'],
          },
        },
      },
    );

    const checkbox = getAllByRole('checkbox');
    await userEvent.click(checkbox[0]);

    expect(checkbox[0]).toBeChecked();
    expect(checkbox[1]).toBeChecked();
    expect(formInstance.getFieldValue('test')).toEqual(['two', 'one']);
  });
});
