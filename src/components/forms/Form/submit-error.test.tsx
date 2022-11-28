import userEvents from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';

import { renderWithForm } from '../../../test';
import { Submit } from '../../actions';
import { TextInput } from '../TextInput/TextInput';

import { Form } from '.';

describe('<SubmitError />', () => {
  it('should display a submit error if onSubmit callback is failed', async () => {
    const onSubmit = jest.fn(() => Promise.reject('Custom Error'));
    const onSubmitFailed = jest.fn(() => {});

    const { getByRole, getByText } = renderWithForm(
      <>
        <Form.Item name="test" label="Test">
          <TextInput />
        </Form.Item>

        <Submit>Submit</Submit>

        <Form.SubmitError />
      </>,
      { formProps: { onSubmit, onSubmitFailed } },
    );

    const submit = getByRole('button');
    const input = getByRole('textbox');

    await userEvents.type(input, 'test');
    await userEvents.click(submit);

    await waitFor(() => {
      // onSubmitFailed callback should only be called if onSubmit callback is called and failed
      expect(onSubmitFailed).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(onSubmit).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(getByText('Custom Error')).toBeInTheDocument();
    });
  });

  it('should clean the submit error if any value is changed', async () => {
    const onSubmit = jest.fn(() => Promise.reject('Custom Error'));
    const onSubmitFailed = jest.fn(() => {});

    const { getByRole, getByText, queryByText } = renderWithForm(
      <>
        <Form.Item name="test" label="Test">
          <TextInput />
        </Form.Item>

        <Submit>Submit</Submit>

        <Form.SubmitError />
      </>,
      { formProps: { onSubmit, onSubmitFailed } },
    );

    const submit = getByRole('button');
    const input = getByRole('textbox');

    await userEvents.type(input, 'test');
    await userEvents.click(submit);

    await waitFor(() => {
      // onSubmitFailed callback should only be called if onSubmit callback is called and failed
      expect(onSubmitFailed).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(onSubmit).toBeCalledTimes(1);
    });

    let submitErrorElement;

    await waitFor(() => {
      submitErrorElement = getByText('Custom Error');
      expect(submitErrorElement).toBeInTheDocument();
    });

    await userEvents.type(input, 'changed');

    await waitFor(() => {
      expect(submitErrorElement).not.toBeInTheDocument();
    });
  });

  it('should display an error placeholder if error is not handled properly', async () => {
    const onSubmit = jest.fn(() => {
      return Promise.reject([]); // non-valid error
    });
    const onSubmitFailed = jest.fn(() => {});

    const { getByRole, getByText } = renderWithForm(
      <>
        <Form.Item name="test" label="Test">
          <TextInput />
        </Form.Item>

        <Submit>Submit</Submit>

        <Form.SubmitError />
      </>,
      { formProps: { onSubmit, onSubmitFailed } },
    );

    const submit = getByRole('button');
    const input = getByRole('textbox');

    await userEvents.type(input, 'test');
    await userEvents.click(submit);

    await waitFor(() => {
      // onSubmitFailed callback should only be called if onSubmit callback is called and failed
      expect(onSubmitFailed).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(onSubmit).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(getByText('Internal error')).toBeInTheDocument();
    });
  });
});
