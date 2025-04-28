import { act, waitFor } from '@testing-library/react';
import userEvents from '@testing-library/user-event';

import { renderWithForm } from '../../../test/index';
import { TextInput } from '../../fields';
import { ResetButton, SubmitButton } from '../../form';

import { Form } from './index';

jest.mock('../../../_internal/hooks/use-warn');

describe('<Form />', () => {
  it('should not be displayed if validation is failed on submit', async () => {
    jest.setTimeout(10000);
    const onSubmit = jest.fn(() => Promise.reject('Custom Error'));
    const onSubmitFailed = jest.fn(() => {});

    const { getByRole, formInstance } = renderWithForm(
      <>
        <Form.Item
          name="test"
          label="Test"
          rules={[
            {
              validator(rule, value) {
                return Promise.reject('invalid');
              },
            },
          ]}
        >
          <TextInput />
        </Form.Item>

        <SubmitButton>Submit</SubmitButton>

        <Form.SubmitError />
      </>,
      { formProps: { onSubmit, onSubmitFailed } },
    );

    const submit = getByRole('button');
    const input = getByRole('textbox');

    await act(async () => {
      await userEvents.type(input, 'test');
    });

    await userEvents.click(submit);

    await waitFor(() => {
      // onSubmitFailed callback should only be called if onSubmit callback is called and failed
      expect(onSubmitFailed).not.toBeCalled();
    });

    await waitFor(() => {
      expect(formInstance.submitError).toBeNull();
    });
  });

  it('should throw uncaught rejection if error is not handled', async () => {
    const onSubmit = jest.fn(() => {
      throw new Error('Custom Error');
    });
    const onSubmitFailed = jest.fn(() => {});

    const { getByRole, getByText, formInstance } = renderWithForm(
      <>
        <Form.Item name="test" label="Test">
          <TextInput />
        </Form.Item>

        <SubmitButton>Submit</SubmitButton>

        <Form.SubmitError />
      </>,
      { formProps: { onSubmit, onSubmitFailed } },
    );

    const input = getByRole('textbox');

    await act(async () => {
      await userEvents.type(input, 'test');
      await expect(formInstance.submit()).rejects.toThrow('Custom Error');
    });

    await expect(onSubmitFailed).toBeCalledTimes(1);
    await expect(onSubmit).toBeCalledTimes(1);

    await waitFor(() => {
      expect(getByText('Internal error')).toBeInTheDocument();
    });
  });

  it('should handle reset button behavior correctly', async () => {
    const onSubmit = jest.fn((data) => {});

    const { getByRole, getByText } = renderWithForm(
      <>
        <Form.Item
          name="test"
          label="Test"
          rules={[
            {
              async validator(rule, value) {
                return value ? Promise.resolve() : Promise.reject('Required');
              },
            },
          ]}
        >
          <TextInput />
        </Form.Item>

        <SubmitButton>Submit</SubmitButton>
        <ResetButton>Reset</ResetButton>
        <Form.SubmitError />
      </>,
      { formProps: { onSubmit } },
    );

    const input = getByRole('textbox');
    const submitButton = getByRole('button', { name: 'Submit' });
    const resetButton = getByRole('button', { name: 'Reset' });

    // Check initial button states
    expect(submitButton).toBeEnabled();
    expect(resetButton).toBeDisabled();

    // Click submit button and verify state
    await userEvents.click(submitButton);

    await waitFor(() => {
      expect(getByText('Required')).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
    expect(resetButton).toBeDisabled();

    // Type into input and verify reset button becomes active
    await act(async () => {
      await userEvents.type(input, 'test');
    });

    expect(resetButton).toBeEnabled();
    expect(submitButton).toBeEnabled();

    // Click reset button and verify states
    await userEvents.click(resetButton);

    await waitFor(() => {
      expect(resetButton).toBeDisabled();
    });

    expect(input).toHaveValue('');
    expect(submitButton).toBeEnabled();
  });

  it('should respect the isDisabled:true property for ResetButton and SubmitButton', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    const onSubmitFailed = jest.fn(() => {});

    const { getByRole } = renderWithForm(
      <>
        <Form.Item
          name="test"
          label="Test"
          rules={[
            {
              validator(rule, value) {
                return value ? Promise.resolve() : Promise.reject('Required');
              },
            },
          ]}
        >
          <TextInput />
        </Form.Item>

        {/* Explicitly set isDisabled */}
        <SubmitButton isDisabled={true}>Submit</SubmitButton>
        <ResetButton isDisabled={true}>Reset</ResetButton>
      </>,
      { formProps: { onSubmit, onSubmitFailed } },
    );

    const input = getByRole('textbox');
    const submitButton = getByRole('button', { name: 'Submit' });
    const resetButton = getByRole('button', { name: 'Reset' });

    // Check that both buttons are disabled because isDisabled is true
    expect(submitButton).toBeDisabled();
    expect(resetButton).toBeDisabled();

    // Try typing in input
    await act(async () => {
      await userEvents.type(input, 'test');
    });

    // Buttons should still be disabled because of isDisabled
    expect(submitButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
  });

  it('Respect isDisabled:false property for ResetButton and SubmitButton', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    const onSubmitFailed = jest.fn(() => {});

    // Render with isDisabled = false for buttons
    const { getByRole: getByRoleNew } = renderWithForm(
      <>
        <Form.Item
          name="test"
          label="Test"
          rules={[
            {
              validator(rule, value) {
                return value ? Promise.resolve() : Promise.reject('Required');
              },
            },
          ]}
        >
          <TextInput />
        </Form.Item>

        <SubmitButton isDisabled={false}>Submit</SubmitButton>
        <ResetButton isDisabled={false}>Reset</ResetButton>
      </>,
      { formProps: { onSubmit, onSubmitFailed } },
    );

    const submitButton = getByRoleNew('button', { name: 'Submit' });
    const resetButton = getByRoleNew('button', { name: 'Reset' });

    // Verify default behavior without isDisabled=true
    expect(submitButton).toBeEnabled();
    expect(resetButton).toBeDisabled();

    // Type in input and verify reset button becomes enabled
    const inputNew = getByRoleNew('textbox');
    await act(async () => {
      await userEvents.type(inputNew, 'test');
    });

    expect(resetButton).toBeEnabled();

    // Click reset button and verify behavior
    await userEvents.click(resetButton);

    await waitFor(() => {
      expect(inputNew).toHaveValue('');
      expect(submitButton).toBeEnabled();
      expect(resetButton).toBeDisabled();
    });
  });

  it('should clear validation errors using clearFieldsValidation', async () => {
    const onSubmit = jest.fn(() => Promise.reject('Submit Error'));

    const { getByRole, getByText, formInstance } = renderWithForm(
      <>
        <Form.Item
          name="test"
          label="Test"
          rules={[
            {
              validator(rule, value) {
                return value
                  ? Promise.resolve()
                  : Promise.reject('Field is required');
              },
            },
          ]}
        >
          <TextInput />
        </Form.Item>

        <SubmitButton>Submit</SubmitButton>
      </>,
      { formProps: { onSubmit } },
    );

    const input = getByRole('textbox');
    const submitButton = getByRole('button', { name: 'Submit' });

    // Initial state: no validation error
    expect(() => getByText('Field is required')).toThrow();

    // Click submit and check for validation error
    await userEvents.click(submitButton);

    await waitFor(() => {
      expect(getByText('Field is required')).toBeInTheDocument();
    });

    // Clear all validation errors
    await act(async () => {
      formInstance.resetFieldsValidation();
    });

    await waitFor(() => {
      expect(() => getByText('Field is required')).toThrow(); // Error should be gone
    });

    // Click submit again to re-trigger validation error
    await userEvents.click(submitButton);

    await waitFor(() => {
      expect(getByText('Field is required')).toBeInTheDocument();
    });

    // Clear validation error for specific field
    await act(async () => {
      formInstance.resetFieldsValidation(['test']);
    });

    await waitFor(() => {
      expect(() => getByText('Field is required')).toThrow(); // Error should be gone
    });
  });

  it('should set validation error using setFieldError', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());

    const { getByRole, getByText, formInstance } = renderWithForm(
      <>
        <Form.Item
          name="test"
          label="Test"
          rules={[
            {
              validator(rule, value) {
                return value
                  ? Promise.resolve()
                  : Promise.reject('Field is required');
              },
            },
          ]}
        >
          <TextInput />
        </Form.Item>

        <SubmitButton>Submit</SubmitButton>
      </>,
      { formProps: { onSubmit } },
    );

    const input = getByRole('textbox');
    const submitButton = getByRole('button', { name: 'Submit' });

    // Initial state: no validation error
    expect(() => getByText('Custom Error Message')).toThrow();

    // Set validation error programmatically
    await act(async () => {
      formInstance.setFieldError('test', 'Custom Error Message');
    });

    await waitFor(() => {
      expect(getByText('Custom Error Message')).toBeInTheDocument();
    });

    // Type into input and verify error remains
    await act(async () => {
      await userEvents.type(input, 'test');
    });

    // Typing remove the error
    expect(() => getByText('Custom Error Message')).toThrow();

    await userEvents.click(submitButton);

    expect(() => getByText('Field is required')).toThrow();
  });

  it('should update isTouched when an input is interacted with', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    const { getByRole, formInstance } = renderWithForm(
      <>
        <Form.Item name="test" label="Test">
          <TextInput />
        </Form.Item>
        <SubmitButton>Submit</SubmitButton>
      </>,
    );

    // Initially, isTouched should be false
    expect(formInstance.isTouched).toBeFalsy();

    // Simulate user interaction
    const input = getByRole('textbox');
    await act(async () => {
      await userEvents.type(input, 'hello');
    });

    // After typing, isTouched should be true
    expect(formInstance.isTouched).toBeTruthy();
  });

  it('should update isDirty when input value differs from the initial value', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    const defaultValues = { test: 'initial' };
    const { getByRole, formInstance } = renderWithForm(
      <>
        <TextInput name="test" label="Test" />
        <SubmitButton>Submit</SubmitButton>
      </>,
      { formProps: { onSubmit, defaultValues } },
    );

    // Initially, isDirty should be false because the value is same as initial
    expect(formInstance.isDirty).toBeFalsy();

    // Change the input value
    const input = getByRole('textbox');
    await act(async () => {
      await userEvents.clear(input);
      await userEvents.type(input, 'changed');
    });

    // After change, isDirty should be true
    expect(formInstance.isDirty).toBeTruthy();
  });

  it('should maintain isTouched true but set isDirty false when input value reverts to initial', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    const initialValue = { test: 'initial' };
    const { getByRole, formInstance } = renderWithForm(
      <>
        <Form.Item name="test" label="Test">
          <TextInput />
        </Form.Item>
        <SubmitButton>Submit</SubmitButton>
      </>,
      { formProps: { onSubmit, defaultValues: initialValue } },
    );

    // Initially, both isTouched and isDirty should be false
    expect(formInstance.isTouched).toBeFalsy();
    expect(formInstance.isDirty).toBeFalsy();

    // Change the input to a different value
    const input = getByRole('textbox');
    await act(async () => {
      await userEvents.clear(input);
      await userEvents.type(input, 'changed');
    });

    // After change, both isTouched and isDirty should be true
    expect(formInstance.isTouched).toBeTruthy();
    expect(formInstance.isDirty).toBeTruthy();

    // Revert the input back to its initial value
    await act(async () => {
      await userEvents.clear(input);
      await userEvents.type(input, 'initial');
    });

    // After reverting, isTouched remains true, but isDirty should be false
    expect(formInstance.isTouched).toBeTruthy();
    expect(formInstance.isDirty).toBeFalsy();
  });
});
