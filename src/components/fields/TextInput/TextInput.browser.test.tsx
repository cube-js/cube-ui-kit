import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { NumberInput } from '../NumberInput/NumberInput';
import { SearchInput } from '../SearchInput/SearchInput';
import { TextArea } from '../TextArea/TextArea';

import { TextInput } from './TextInput';

const wrapperOf = (input: HTMLElement) =>
  input.closest('[data-qa="InputWrapper"]') as HTMLElement;

/** Press a point of the field box given relative to its top-left corner. */
async function pressWrapperAt(wrapper: HTMLElement, x: number, y: number) {
  await act(() => userEvent.click(wrapper, { position: { x, y } }));
}

/**
 * The visible field box is larger than the native input: the prefix and suffix
 * areas, the icons in them and a textarea's vertical margins are all inside
 * the border but outside the input. A press there has to focus the input, the
 * way a press anywhere in a native field does. Whether a press lands on the
 * input or beside it is a matter of real geometry, so this needs a browser.
 */
describe('pressing the field box', () => {
  it('focuses the input from the icon area', async () => {
    renderWithRoot(<SearchInput aria-label="Search" />);

    const input = screen.getByRole('searchbox');
    const icon = wrapperOf(input).querySelector(
      '[data-element="Prefix"]',
    ) as HTMLElement;

    await act(() => userEvent.click(icon));

    expect(input).toHaveFocus();
  });

  it('focuses the input from the prefix and validation areas', async () => {
    renderWithRoot(
      <TextInput isInvalid aria-label="Price" prefix={<span>$</span>} />,
    );

    const input = screen.getByRole('textbox');
    const wrapper = wrapperOf(input);

    await act(() =>
      userEvent.click(
        wrapper.querySelector('[data-element="Prefix"]') as HTMLElement,
      ),
    );

    expect(input).toHaveFocus();

    (input as HTMLInputElement).blur();

    await act(() =>
      userEvent.click(
        wrapper.querySelector('[data-element="State"]') as HTMLElement,
      ),
    );

    expect(input).toHaveFocus();
  });

  it('focuses a textarea from the margin above it', async () => {
    renderWithRoot(<TextArea aria-label="Note" />);

    const textarea = screen.getByRole('textbox');
    const wrapper = wrapperOf(textarea);
    const box = wrapper.getBoundingClientRect();
    const gap = textarea.getBoundingClientRect().top - box.top;

    // The press must land beside the textarea for this to test anything.
    expect(gap).toBeGreaterThan(2);

    await pressWrapperAt(wrapper, box.width / 2, gap / 2);

    expect(textarea).toHaveFocus();
  });

  it('leaves presses on interactive children to them', async () => {
    const onPress = vi.fn();

    renderWithRoot(
      <>
        <NumberInput aria-label="Quantity" defaultValue={1} />
        <TextInput
          aria-label="Name"
          suffix={<Button onPress={onPress}>Generate</Button>}
        />
      </>,
    );

    await act(() =>
      userEvent.click(
        screen.getByRole('button', { name: 'Increase Quantity' }),
      ),
    );

    expect(screen.getByRole('textbox', { name: 'Quantity' })).toHaveValue('2');

    await act(() =>
      userEvent.click(screen.getByRole('button', { name: 'Generate' })),
    );

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Generate' })).toHaveFocus();
  });

  it('does nothing in a disabled field', async () => {
    renderWithRoot(<SearchInput isDisabled aria-label="Search" />);

    const input = screen.getByRole('searchbox');

    await act(() =>
      userEvent.click(
        wrapperOf(input).querySelector(
          '[data-element="Prefix"]',
        ) as HTMLElement,
      ),
    );

    expect(input).not.toHaveFocus();
  });
});
