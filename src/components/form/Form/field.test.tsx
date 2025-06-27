import { waitFor } from '@storybook/test';
import { render } from '@testing-library/react';
import { useEffect, useState } from 'react';

import { act, renderWithForm, userEvent } from '../../../test/index';
import { Radio } from '../../fields/RadioGroup/Radio';
import { TextInput } from '../../fields/TextInput/TextInput';
import { Root } from '../../Root';

import { Field, Form } from './index';

jest.mock('../../../_internal/hooks/use-warn');

describe('Legacy <Field />', () => {
  it('should set default value as value', () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
  });

  it('should update default value', () => {
    const { rerender, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('World!');
  });

  it('should not update default value if field is touched', async () => {
    const { rerender, formInstance, getByRole } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');

    const input = getByRole('textbox');

    await act(async () => {
      await userEvent.clear(input);
      await userEvent.type(input, 'Test!');
    });

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Test!');
  });

  it('should not replace changed value with default value', async () => {
    const { rerender, formInstance, getByRole } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await act(async () => {
      await userEvent.clear(input);
      await userEvent.type(input, 'Hello!');
    });

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello!');
  });

  it('should change value', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await act(async () => {
      await userEvent.type(input, ', World!');
    });

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
  });

  it('should infer default value from <Form />', () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test">
        <TextInput label="test" />
      </Field>,
      {
        formProps: {
          defaultValues: {
            test: 'Hello, World!',
          },
        },
      },
    );

    const input = getByRole('textbox');

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
    expect(input).toHaveValue('Hello, World!');
  });

  it('should work without <Field /> in controlled mode, when name is null', async () => {
    function Content() {
      const [deployMode, setDeployMode] = useState('cli');

      return (
        <Radio.Group
          label="Deploy mode"
          value={deployMode}
          onChange={(v) => setDeployMode(v)}
        >
          <Radio value="cli">Deploy with CLI</Radio>
          <Radio value="git">Deploy with GIT</Radio>
        </Radio.Group>
      );
    }
    const { getByRole } = renderWithForm(<Content />);

    const cliRadio = getByRole('radio', { name: 'Deploy with CLI' });
    const gitRadio = getByRole('radio', { name: 'Deploy with GIT' });

    expect(cliRadio).toBeChecked();

    await act(async () => {
      await userEvent.click(gitRadio);
    });

    expect(gitRadio).toBeChecked();
  });

  it('should ignore value in form-controlled mode, when name != null', async () => {
    function Content() {
      const [deployMode] = useState('git');

      return (
        <Radio.Group
          defaultValue="cli"
          label="Deploy mode"
          name="test"
          value={deployMode}
        >
          <Radio value="cli">Deploy with CLI</Radio>
          <Radio value="git">Deploy with GIT</Radio>
        </Radio.Group>
      );
    }
    const { getByRole, formInstance } = renderWithForm(<Content />);

    const cliRadio = getByRole('radio', { name: 'Deploy with CLI' });
    const gitRadio = getByRole('radio', { name: 'Deploy with GIT' });

    expect(cliRadio).toBeChecked();

    await act(async () => {
      await userEvent.click(gitRadio);
    });

    expect(formInstance.getFieldValue('test')).toBe('git');
    expect(gitRadio).toBeChecked();
  });

  it("shouldn't override onChange in component", async () => {
    const onChange = jest.fn();

    const { getByRole, formInstance } = renderWithForm(
      <Radio.Group label="Deploy mode" name="test" onChange={onChange}>
        <Radio value="cli">Deploy with CLI</Radio>
        <Radio value="git">Deploy with GIT</Radio>
      </Radio.Group>,
    );

    const cliRadio = getByRole('radio', { name: 'Deploy with CLI' });

    await act(async () => await userEvent.click(cliRadio));

    expect(formInstance.getFieldValue('test')).toBe('cli');
    expect(onChange).toHaveBeenCalled();
  });

  it('should work if children == null', () => {
    expect(() =>
      renderWithForm(
        <Field name="test">
          {/* @ts-expect-error */}
          {null}
        </Field>,
      ),
    ).not.toThrow();
  });

  it('should render default values correctly after form re-render', () => {
    const TestForm = ({ defaultValues }) => {
      const [form] = Form.useForm();

      return (
        <Root>
          <Form form={form} defaultValues={defaultValues}>
            <Field name="test">
              <TextInput label="test" />
            </Field>
            {defaultValues.test2 && (
              <Field name="test2">
                <TextInput label="test2" />
              </Field>
            )}
          </Form>
        </Root>
      );
    };

    // Initial render with a single input and default values
    const { getByRole, rerender } = render(
      <TestForm defaultValues={{ test: 'Hello, world!' }} />,
    );

    // Check initial input value
    const input1 = getByRole('textbox', { name: 'test' });
    expect(input1).toHaveValue('Hello, world!');

    // Re-render with two inputs and updated default values
    rerender(
      <TestForm
        defaultValues={{ test: 'Hello, world!', test2: 'Goodbye, world!' }}
      />,
    );

    // Check both inputs for default values
    const input2 = getByRole('textbox', { name: 'test2' });
    expect(input1).toHaveValue('Hello, world!');
    expect(input2).toHaveValue('Goodbye, world!');
  });

  it("shouldn't change current value after default values change in form", () => {
    const TestForm = ({ defaultValues }) => {
      const [form] = Form.useForm();

      return (
        <Root>
          <Form form={form} defaultValues={defaultValues}>
            <Field name="test">
              <TextInput label="test" />
            </Field>
          </Form>
        </Root>
      );
    };

    // Initial render with a single input and default values
    const { getByRole, rerender } = render(
      <TestForm defaultValues={{ test: 'Hello, world!' }} />,
    );

    // Check initial input value
    const input = getByRole('textbox', { name: 'test' });
    expect(input).toHaveValue('Hello, world!');

    // Re-render with two inputs and updated default values
    rerender(<TestForm defaultValues={{ test: 'Goodbye, world!' }} />);

    expect(input).toHaveValue('Hello, world!');
  });

  it('should set to new default value after its change and form reset', () => {
    const TestForm = ({ defaultValues, forceReset = false }) => {
      const [form] = Form.useForm();

      useEffect(() => {
        if (forceReset) {
          form.resetFields();
        }
      }, []);

      return (
        <Root>
          <Form form={form} defaultValues={defaultValues}>
            <Field name="test">
              <TextInput label="test" />
            </Field>
          </Form>
        </Root>
      );
    };

    // Initial render with a single input and default values
    const { getByRole, rerender } = render(
      <TestForm defaultValues={{ test: 'Hello, world!' }} />,
    );

    // Check initial input value
    const input = getByRole('textbox', { name: 'test' });
    expect(input).toHaveValue('Hello, world!');

    // Re-render with two inputs and updated default values
    rerender(<TestForm defaultValues={{ test: 'Goodbye, world!' }} />);

    expect(input).toHaveValue('Hello, world!');

    // Re-render with two inputs and updated default values
    rerender(
      <TestForm
        defaultValues={{ test: 'Goodbye, world!', forceReset: true }}
      />,
    );

    waitFor(() => {
      // Check that default value is reset
      expect(input).toHaveValue('Goodbye, world!');
    });
  });

  it('should display custom errorMessage when provided', async () => {
    const customErrorMessage = 'Custom error message';

    const { getByRole, getByText, formInstance } = renderWithForm(
      <TextInput
        name="test"
        label="Test Input"
        errorMessage={customErrorMessage}
        rules={[
          { required: true, message: 'Field is required' },
          { min: 5, message: 'Must be at least 5 characters' },
        ]}
      />,
    );

    const input = getByRole('textbox');

    // Enter a short value to trigger validation errors
    await act(async () => {
      await userEvent.type(input, 'ab');
      await userEvent.tab(); // Trigger onBlur validation
    });

    // Should display the custom error message instead of validation errors
    expect(getByText(customErrorMessage)).toBeInTheDocument();
  });

  it('should display first validation error when errorMessage is not provided', async () => {
    const { getByRole, getByText, formInstance } = renderWithForm(
      <TextInput
        name="test"
        label="Test Input"
        rules={[
          { required: true, message: 'Field is required' },
          { min: 5, message: 'Must be at least 5 characters' },
        ]}
      />,
    );

    const input = getByRole('textbox');

    // Enter a short value to trigger validation errors
    await act(async () => {
      await userEvent.type(input, 'ab');
      await userEvent.tab(); // Trigger onBlur validation
    });

    // Should display the first validation error
    expect(getByText('Must be at least 5 characters')).toBeInTheDocument();
  });

  it('should handle errorMessage as function with ValidationResult', async () => {
    const errorMessageFunction = jest.fn((validationResult) => {
      const { isInvalid, validationErrors } = validationResult;

      if (!isInvalid) return null;

      // Combine all validation errors
      return `Combined errors: ${validationErrors.join(', ')}`;
    });

    const { getByRole, getByText, formInstance } = renderWithForm(
      <TextInput
        name="test"
        label="Test Input"
        errorMessage={errorMessageFunction}
        rules={[
          { required: true, message: 'Field is required' },
          { min: 5, message: 'Must be at least 5 characters' },
        ]}
      />,
    );

    const input = getByRole('textbox');

    // Enter a short value to trigger validation errors
    await act(async () => {
      await userEvent.type(input, 'ab');
      await userEvent.tab(); // Trigger onBlur validation
    });

    // Check that function was called with proper ValidationResult
    expect(errorMessageFunction).toHaveBeenCalledWith({
      isInvalid: true,
      validationErrors: expect.arrayContaining([
        'Must be at least 5 characters',
      ]),
      validationDetails: expect.any(Object),
    });

    // Should display the combined error message
    expect(
      getByText('Combined errors: Must be at least 5 characters'),
    ).toBeInTheDocument();
  });
});
