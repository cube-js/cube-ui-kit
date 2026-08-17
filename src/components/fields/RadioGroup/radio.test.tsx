import {
  act,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
} from '../../../test';

import { Radio } from './Radio';

vi.mock('../../../_internal/hooks/use-warn');

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

  it('should not select a loading button radio', async () => {
    const { getAllByRole } = renderWithRoot(
      <Radio.ButtonGroup aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2" isLoading>
          test2
        </Radio>
      </Radio.ButtonGroup>,
    );
    const radio = getAllByRole('radio');

    expect(radio[1]).toBeDisabled();

    await act(async () => await userEvent.click(radio[1]));

    expect(radio[1]).not.toBeChecked();
  });

  it('should keep a loading button radio selectable with an explicit isDisabled={false}', async () => {
    const { getAllByRole } = renderWithRoot(
      <Radio.ButtonGroup aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2" isLoading isDisabled={false}>
          test2
        </Radio>
      </Radio.ButtonGroup>,
    );
    const radio = getAllByRole('radio');

    expect(radio[1]).not.toBeDisabled();

    await act(async () => await userEvent.click(radio[1]));

    expect(radio[1]).toBeChecked();
  });

  it('should leave a classic radio selectable while loading', async () => {
    const { getAllByRole } = renderWithRoot(
      <Radio.Group aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2" isLoading>
          test2
        </Radio>
      </Radio.Group>,
    );
    const radio = getAllByRole('radio');

    await act(async () => await userEvent.click(radio[1]));

    expect(radio[1]).toBeChecked();
  });

  it("Radio shouldn't work without <RadioGroup />", () => {
    const inst = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderWithRoot(<Radio value="test">test</Radio>);
    }).toThrowError();

    inst.mockRestore();
  });
});
