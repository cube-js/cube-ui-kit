import userEvents from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';

import { renderWithForm } from '../../../test';
import { Submit } from '../../actions';
import { TextInput } from '../TextInput/TextInput';

import { Form } from '.';

describe('<SubmitError />', () => {
  it('should trigger uncaught exception if the error is not handled properly', async () => {
    const onSubmit = jest.fn(() => Promise.reject('Error'));

    const { getByRole, getByText } = renderWithForm(
      <>
        <Form.Item name="test" label="Test">
          <TextInput />
        </Form.Item>

        <Submit>Submit</Submit>

        <Form.SubmitError />
      </>,
      { formProps: { onSubmit } },
    );

    const submit = getByRole('button');
    const input = getByRole('textbox');

    await userEvents.type(input, 'test');
    await userEvents.click(submit);

    await waitFor(() => {
      expect(onSubmit).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(getByText('Error')).toBeInTheDocument();
    });
  });
});
