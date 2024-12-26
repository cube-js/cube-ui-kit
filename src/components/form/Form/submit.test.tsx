import userEvents from '@testing-library/user-event';
import { act, waitFor } from '@testing-library/react';

import { renderWithForm } from '../../../test/index';
import { ResetButton, SubmitButton } from '../../form';
import { TextInput } from '../../fields';

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
});
