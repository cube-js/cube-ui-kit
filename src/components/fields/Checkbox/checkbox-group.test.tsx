import { Checkbox, Field } from '../../../index';
import { act, render, renderWithForm, screen, userEvent } from '../../../test';

vi.mock('../../../_internal/hooks/use-warn');

describe('<CheckboxGroup />', () => {
  it('applies style props and styles to the group', () => {
    render(
      <Checkbox.Group
        label="test"
        gap="3x"
        width="40x"
        styles={{ fill: '#purple' }}
        inputStyles={{ fill: '#danger', flow: 'row' }}
      >
        <Checkbox value="one">One</Checkbox>
      </Checkbox.Group>,
    );

    const style = getComputedStyle(screen.getByRole('group'));

    expect(style.gap).toBe('calc(3 * var(--gap))');
    expect(style.width).toBe('calc(40 * var(--gap))');
    // `styles` goes over `inputStyles`, which still applies where it is alone.
    expect(style.backgroundColor).toBe('var(--purple-color)');
    expect(style.flexFlow).toBe('row');
  });

  it('clears a controlled value set to null and stays controlled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getAllByRole, rerender } = render(
      <Checkbox.Group label="test" value={['one']} onChange={() => {}}>
        <Checkbox value="one">One</Checkbox>
        <Checkbox value="two">Two</Checkbox>
      </Checkbox.Group>,
    );

    expect(getAllByRole('checkbox')[0]).toBeChecked();

    rerender(
      <Checkbox.Group label="test" value={null} onChange={() => {}}>
        <Checkbox value="one">One</Checkbox>
        <Checkbox value="two">Two</Checkbox>
      </Checkbox.Group>,
    );

    expect(getAllByRole('checkbox')[0]).not.toBeChecked();
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringMatching(/controlled to uncontrolled/),
    );

    warn.mockRestore();
  });

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

  it('enables its options with isDisabled={false} in a disabled form', async () => {
    const { getAllByRole } = renderWithForm(
      <Checkbox.Group isDisabled={false} label="test">
        <Checkbox value="one">One</Checkbox>
        <Checkbox isDisabled value="two">
          Two
        </Checkbox>
      </Checkbox.Group>,
      { formProps: { isDisabled: true } },
    );
    const checkbox = getAllByRole('checkbox');

    expect(checkbox[0]).not.toBeDisabled();
    expect(checkbox[0].closest('label')).not.toHaveAttribute('data-disabled');
    // An option's own `isDisabled` still wins over the group's.
    expect(checkbox[1]).toBeDisabled();

    await act(async () => await userEvent.click(checkbox[0]));

    expect(checkbox[0]).toBeChecked();
  });

  it('makes its options editable with isReadOnly={false} in a read-only form', async () => {
    const { getAllByRole } = renderWithForm(
      <Checkbox.Group isReadOnly={false} label="test">
        <Checkbox value="one">One</Checkbox>
      </Checkbox.Group>,
      { formProps: { isReadOnly: true } },
    );
    const [checkbox] = getAllByRole('checkbox');

    expect(checkbox).not.toHaveAttribute('aria-readonly');
    expect(checkbox.closest('label')).not.toHaveAttribute('data-readonly');

    await act(async () => await userEvent.click(checkbox));

    expect(checkbox).toBeChecked();
  });

  it('leaves the options of a group that sets nothing with their form', () => {
    const { getAllByRole } = renderWithForm(
      <Checkbox.Group label="test">
        <Checkbox value="one">One</Checkbox>
      </Checkbox.Group>,
      { formProps: { isDisabled: true } },
    );

    expect(getAllByRole('checkbox')[0]).toBeDisabled();
  });
});
