import userEvents from '@testing-library/user-event';
import { act, waitFor } from '@testing-library/react';

import { renderWithForm } from '../../../test/index';
import { SubmitButton } from '../../actions/index';
import { TextInput } from '../../fields/TextInput/TextInput';

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
});
