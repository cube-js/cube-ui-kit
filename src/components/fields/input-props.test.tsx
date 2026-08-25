import {
  CommandTextArea,
  NumberInput,
  PasswordInput,
  SearchInput,
  TextArea,
  TextInput,
} from '../../index';
import { act, renderWithRoot, userEvent } from '../../test';

import type { Props } from '../../props';

/** Every field built on `TextInputBase` marks its control with `data-input-type`. */
function getInput(container: HTMLElement) {
  return container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    'input[data-input-type], textarea[data-input-type]',
  )!;
}

const FIELDS = [
  {
    name: 'TextInput',
    render: (props: Props) => <TextInput label="field" {...props} />,
  },
  {
    name: 'TextArea',
    render: (props: Props) => <TextArea label="field" {...props} />,
  },
  {
    name: 'PasswordInput',
    render: (props: Props) => <PasswordInput label="field" {...props} />,
  },
  {
    name: 'SearchInput',
    render: (props: Props) => <SearchInput label="field" {...props} />,
  },
  {
    name: 'NumberInput',
    render: (props: Props) => <NumberInput label="field" {...props} />,
  },
  {
    name: 'CommandTextArea',
    render: (props: Props) => <CommandTextArea label="field" {...props} />,
  },
] as const;

describe('inputProps', () => {
  describe.each(FIELDS)('<$name />', ({ render }) => {
    it('should pass caller props through to the input element', () => {
      const { container } = renderWithRoot(
        render({
          inputProps: { 'data-custom': 'yes', autoCapitalize: 'none' },
        }),
      );

      const input = getInput(container);

      expect(input).toHaveAttribute('data-custom', 'yes');
      expect(input).toHaveAttribute('autocapitalize', 'none');
    });

    it('should keep the React Aria wiring when inputProps is set', async () => {
      // The hook's own props used to be replaced wholesale by the caller's `inputProps` (or the
      // other way round, depending on the component), which broke value tracking and the ids that
      // tie the input to its label.
      const { container } = renderWithRoot(
        render({ inputProps: { 'data-custom': 'yes' } }),
      );

      const input = getInput(container);

      await act(async () => await userEvent.type(input, '1'));

      expect(input).toHaveValue('1');
      expect(input).toHaveAttribute('id');
    });

    it('should chain a handler the hook sets on the same key', async () => {
      // `onChange` is set by the React Aria hook on every one of these fields, so a caller's own
      // handler on that key is the case where one side silently replacing the other would show.
      const onChange = vi.fn();
      const { container } = renderWithRoot(
        render({ inputProps: { onChange } }),
      );

      const input = getInput(container);

      await act(async () => await userEvent.type(input, '1'));

      expect(onChange).toHaveBeenCalled();
      expect(input).toHaveValue('1');
    });
  });

  it('should let inputProps carry an autoComplete through TextInput', () => {
    const { container } = renderWithRoot(
      <TextInput
        label="field"
        inputProps={{ autoComplete: 'one-time-code' }}
      />,
    );

    expect(getInput(container)).toHaveAttribute(
      'autocomplete',
      'one-time-code',
    );
  });

  it('should let an explicit prop win over the same key in inputProps', () => {
    const { container } = renderWithRoot(
      <TextInput
        label="field"
        autoComplete="email"
        inputProps={{ autoComplete: 'one-time-code' }}
      />,
    );

    expect(getInput(container)).toHaveAttribute('autocomplete', 'email');
  });
});
