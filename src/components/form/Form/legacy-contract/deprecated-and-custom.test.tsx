import { useRef, useState } from 'react';

import {
  act,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../../test/index';
import { Button } from '../../../actions/Button/Button';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { DialogForm } from '../../../overlays/Dialog/DialogForm';
import { DialogTrigger } from '../../../overlays/Dialog/DialogTrigger';
import { FieldWrapper } from '../../FieldWrapper/FieldWrapper';
import { wrapWithField } from '../../wrapper';
import { Form, useFormProps } from '../index';
import { useFieldProps } from '../use-field/use-field-props';
import { CubeFormInstance, useForm } from '../use-form';

vi.mock('../../../../_internal/hooks/use-warn');

/**
 * Legacy Form characterization — deprecated wrappers and custom controls.
 *
 * Covers plan §7.1 items 33 (`Field` / `Form.Item`, including render-prop
 * children), 34 (`DialogForm`, delayed resets, preservation) and 35 (custom
 * fields built on `useFormProps`, `useFieldProps`, `FieldWrapper` and
 * `wrapWithField`).
 */

describe('legacy contract: deprecated Field / Form.Item (§7.1 #33)', () => {
  it('[frozen] render-prop children receive the form instance', () => {
    let seen: unknown;

    const { formInstance } = renderWithForm(
      <Form.Item name="a" label="A">
        {(form) => {
          seen = form;

          return <TextInput />;
        }}
      </Form.Item>,
    );

    expect(seen).toBe(formInstance);
  });

  it('[frozen] Form.Item owns the registration; the wrapped input does not register a second field', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <Form.Item name="a" label="A">
        <TextInput />
      </Form.Item>,
    );

    expect(formInstance.getFieldNames()).toEqual(['a']);

    await waitFor(() =>
      expect(getByRole('textbox')).toHaveAttribute('id', 'a'),
    );
    expect(formInstance.getFieldNames()).toEqual(['a']);
  });

  it("[frozen] Form.Item forwards value, change handling, validation state and label to the child and discards the child's own onChange", async () => {
    const onChange = vi.fn();
    const { formInstance, getByRole } = renderWithForm(
      <Form.Item
        name="a"
        label="Label from item"
        rules={[{ min: 3, message: 'Too short' }]}
      >
        <TextInput onChange={onChange} />
      </Form.Item>,
    );
    const input = getByRole('textbox', { name: 'Label from item' });

    await act(async () => {
      await userEvent.type(input, 'ab');
      await userEvent.tab();
    });

    // `Field` replaces the child's `onChange` with the form handler rather than
    // chaining it (a dev warning says listeners on a `<Field>` child are unsupported).
    expect(onChange).not.toHaveBeenCalled();
    expect(formInstance.getFieldValue('a')).toBe('ab');

    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText('Too short')).toBeInTheDocument();

    await act(async () => {
      formInstance.setFieldValue('a', 'from form');
    });

    expect(input).toHaveValue('from form');
  });

  it('[frozen] Form.Item without a name wraps the child in field chrome without registering anything', () => {
    const { formInstance, getByText } = renderWithForm(
      <Form.Item label="Just a label">
        <TextInput aria-label="inner" />
      </Form.Item>,
    );

    expect(getByText('Just a label')).toBeInTheDocument();
    expect(formInstance.getFieldNames()).toEqual([]);
  });
});

describe('legacy contract: DialogForm (§7.1 #34)', () => {
  function renderDialogForm({
    ownForm = true,
    onSubmit = vi.fn(),
    onDismiss = vi.fn(),
    preserve,
  }: {
    ownForm?: boolean;
    onSubmit?: (data: any) => void;
    onDismiss?: () => void;
    preserve?: boolean;
  }) {
    let form!: CubeFormInstance<any>;

    // The form is created by a component in the same tree, as Cloud does, so
    // its rerender hook reaches the dialog. `isOpen` is controlled and never
    // flipped, so the dialog stays mounted after submit/cancel and the delayed
    // reset can be observed on live fields.
    function Owner() {
      const [ownedForm] = useForm();

      if (ownForm) {
        form = ownedForm;
      }

      return (
        <DialogTrigger isOpen>
          <Button>Open</Button>
          <DialogForm
            form={ownForm ? ownedForm : undefined}
            title="Contract"
            preserve={preserve}
            onSubmit={onSubmit}
            onDismiss={onDismiss}
          >
            <TextInput
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Required' }]}
            />
          </DialogForm>
        </DialogTrigger>
      );
    }

    const result = renderWithRoot(<Owner />);

    return {
      ...result,
      onSubmit,
      onDismiss,
      get form() {
        return form;
      },
    };
  }

  it('[frozen] DialogForm submits through the passed form and resets it 250ms after a successful submit', async () => {
    const { onSubmit, form } = renderDialogForm({});

    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'x');
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'x' }));
    expect(form.getFieldValue('name')).toBe('x');

    await waitFor(() => expect(form.getFieldValue('name')).toBeUndefined());
    expect(form.isTouched).toBe(false);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('');
  });

  it('[frozen] preserve keeps the values after a successful submit', async () => {
    const { onSubmit, form } = renderDialogForm({ preserve: true });

    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'x');
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'x' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    expect(form.getFieldValue('name')).toBe('x');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('x');
  });

  it('[frozen] cancelling calls onDismiss and schedules the same delayed reset', async () => {
    const { onDismiss, onSubmit, form } = renderDialogForm({});

    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'x');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();

    await waitFor(() => expect(form.getFieldValue('name')).toBeUndefined());
  });

  it('[frozen] DialogForm creates its own form when none is passed', async () => {
    const { onSubmit } = renderDialogForm({ ownForm: false });

    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'x');
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'x' }));
  });
});

describe('legacy contract: custom controls (§7.1 #35)', () => {
  function CustomControl(props: any) {
    props = useFieldProps(props, {
      defaultValidationTrigger: 'onChange',
      valuePropsMapper: ({ value, onChange }) => ({
        value: value ?? '',
        onChange,
      }),
    });

    const ref = useRef<HTMLInputElement>(null);
    const { value, onChange, id } = props;

    return wrapWithField(
      <input
        ref={ref}
        id={id}
        data-qa="custom-input"
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
      />,
      ref,
      props,
    );
  }

  it('[frozen] a useFieldProps + wrapWithField control registers, syncs both ways and renders label and errors', async () => {
    const { formInstance, getByTestId, getByText } = renderWithForm(
      <CustomControl name="custom" label="Custom" />,
    );
    const input = getByTestId('custom-input');

    expect(formInstance.getFieldNames()).toEqual(['custom']);

    await waitFor(() => expect(input).toHaveAttribute('id', 'custom'));
    expect(getByText('Custom').closest('label')).toHaveAttribute(
      'for',
      'custom',
    );

    await act(async () => {
      await userEvent.type(input, 'ab');
    });

    expect(formInstance.getFieldValue('custom')).toBe('ab');
    expect(formInstance.isFieldTouched('custom')).toBe(true);

    await act(async () => {
      formInstance.setFieldValue('custom', 'from form');
    });

    expect(input).toHaveValue('from form');

    await act(async () => {
      formInstance.setFieldError('custom', 'Wrong');
    });

    expect(getByText('Wrong')).toBeInTheDocument();
  });

  it('[frozen] without a name, useFieldProps leaves the control standalone with a generated id and its own value/onChange', async () => {
    function Standalone() {
      const [value, setValue] = useState('');

      return (
        <CustomControl
          label="Standalone"
          value={value}
          onChange={(next: string) => setValue(next.toUpperCase())}
        />
      );
    }

    const { formInstance, getByTestId } = renderWithForm(<Standalone />);
    const input = getByTestId('custom-input');

    await act(async () => {
      await userEvent.type(input, 'ab');
    });

    expect(input).toHaveValue('AB');
    expect(input.getAttribute('id')).toBeTruthy();
    expect(formInstance.getFieldNames()).toEqual([]);
  });

  it('[frozen] a wrapper using useFormProps reads the form instance and presentation context', () => {
    let seen: any;

    function Wrapper() {
      seen = useFormProps({});

      return null;
    }

    const { formInstance } = renderWithForm(<Wrapper />, {
      formProps: { labelPosition: 'side', name: 'wrapped' },
    });

    expect(seen.form).toBe(formInstance);
    expect(seen.labelPosition).toBe('side');
    expect(seen.idPrefix).toBe('wrapped');
    expect(seen.requiredMark).toBe(true);
  });

  it('[frozen] FieldWrapper renders a supplied Component with label, description and errorMessage', () => {
    const { getByText, getByTestId } = renderWithRoot(
      <FieldWrapper
        label="Wrapped"
        description="Some description"
        errorMessage="Some error"
        Component={<input data-qa="raw" />}
      />,
    );

    expect(getByTestId('raw')).toBeInTheDocument();
    expect(getByText('Wrapped')).toBeInTheDocument();
    expect(getByText('Some description')).toBeInTheDocument();
    expect(getByText('Some error')).toBeInTheDocument();
  });

  it('[frozen] form-only props never reach the DOM', () => {
    const { container, getByRole } = renderWithForm(
      <TextInput
        name="a"
        label="A"
        rules={[{ required: true }]}
        validateTrigger="onChange"
        validationDelay={10}
        showValid
        shouldUpdate
      />,
    );
    const input = getByRole('textbox');

    for (const attribute of [
      'rules',
      'validatetrigger',
      'validationdelay',
      'showvalid',
      'shouldupdate',
      'form',
    ]) {
      expect(input).not.toHaveAttribute(attribute);
      expect(container.querySelector(`[${attribute}]`)).toBeNull();
    }
  });
});
