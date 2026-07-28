import { TextInput } from '../../../index';
import { act, renderWithForm, userEvent } from '../../../test/index';

import { useFormProps } from './index';

/**
 * External components wrap inputs and call `useFormProps` themselves to read the form context and then
 * detach a nested input from the form. `useFieldProps` now applies `useFormProps` internally, so these tests
 * pin down which of those patterns keep working.
 */
describe('unbinding a nested input from the form', () => {
  it('should stay bound when the form key is deleted, because the context is re-applied', async () => {
    function Wrapper() {
      const { form, ...rest } = useFormProps({} as any);

      return <TextInput {...rest} name="text" label="Text" />;
    }

    const { getByRole, formInstance } = renderWithForm(<Wrapper />);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'Hi');
    });

    expect(formInstance.getFieldValue('text')).toBe('Hi');
  });

  it('should unbind when form is explicitly set to undefined', async () => {
    const onChange = vi.fn();

    function Wrapper() {
      const props = useFormProps({} as any);

      return (
        <TextInput
          {...props}
          form={undefined}
          name="text"
          label="Text"
          onChange={onChange}
        />
      );
    }

    const { getByRole, formInstance } = renderWithForm(<Wrapper />);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'Hi');
    });

    expect(formInstance.getFieldValue('text')).toBeUndefined();
    expect(onChange).toHaveBeenCalled();
    expect(getByRole('textbox')).toHaveValue('Hi');
  });

  it('should unbind when no name is passed and keep the input controlled', async () => {
    const onChange = vi.fn();

    function Wrapper() {
      const { form, name, ...rest } = useFormProps({ name: 'text' } as any);

      return <TextInput {...rest} label="Text" onChange={onChange} />;
    }

    const { getByRole, formInstance } = renderWithForm(<Wrapper />);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'Hi');
    });

    expect(formInstance.getFieldValue('text')).toBeUndefined();
    expect(onChange).toHaveBeenCalled();
  });

  it('should inherit labelPosition from the form context', () => {
    function Wrapper() {
      const props = useFormProps({} as any);

      return <TextInput {...props} name="text" label="Text" />;
    }

    const { container } = renderWithForm(<Wrapper />, {
      formProps: { labelPosition: 'side' },
    });

    // `data-side` is set on the label only when the resolved labelPosition is `side`.
    expect(container.querySelector('label[data-side]')).not.toBeNull();
  });

  it('should let a wrapper override form context props it read via useFormProps', () => {
    function Wrapper() {
      const props = useFormProps({} as any);

      return (
        <TextInput {...props} labelPosition="top" name="text" label="Text" />
      );
    }

    const { container } = renderWithForm(<Wrapper />, {
      formProps: { labelPosition: 'side' },
    });

    expect(container.querySelector('label[data-side]')).toBeNull();
  });
});
