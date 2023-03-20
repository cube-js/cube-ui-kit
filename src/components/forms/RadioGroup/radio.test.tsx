import {
  act,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
} from '../../../test';

import { Radio } from './Radio';

describe('<Radio /> and <RadioGroup />', () => {
  it('should work without form', async () => {
    const { getAllByRole } = renderWithRoot(
      <Radio.Group aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2">test2</Radio>
      </Radio.Group>,
    );
    const radio = getAllByRole('radio');
    await act(async () => await userEvent.click(radio[0]));

    expect(radio[0]).toBeChecked();
  });

  it('should interop with <Form />', async () => {
    const { formInstance } = renderWithForm(
      <Radio.Group name="test" aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2">test2</Radio>
      </Radio.Group>,
    );
    const radio = screen.getAllByRole('radio');

    await act(async () => await userEvent.click(radio[0]));

    expect(radio[0]).toBeChecked();

    expect(formInstance.getFieldValue('test')).toBe('test');
  });

  it("Radio shouldn't work without <RadioGroup />", () => {
    const inst = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderWithRoot(<Radio value="test">test</Radio>);
    }).toThrowError();

    inst.mockRestore();
  });
});
