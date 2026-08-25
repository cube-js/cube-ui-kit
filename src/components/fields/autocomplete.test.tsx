import {
  ColorInput,
  CommandTextArea,
  InlineInput,
  NumberInput,
  PasswordInput,
  SearchInput,
  TextArea,
  TextInput,
  TextInputBase,
  TextInputMapper,
} from '../../index';
import { renderWithRoot } from '../../test';

import type { Props } from '../../props';

/** Every field built on `TextInputBase` marks its control with `data-input-type`. */
function getInput(container: HTMLElement) {
  return container.querySelector(
    'input[data-input-type], textarea[data-input-type]',
  );
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

describe('autoComplete', () => {
  describe.each(FIELDS)('<$name />', ({ render }) => {
    it('should forward autoComplete to the input element', () => {
      const { container } = renderWithRoot(render({ autoComplete: 'email' }));

      expect(getInput(container)).toHaveAttribute('autocomplete', 'email');
    });

    it('should accept the deprecated lowercase alias', () => {
      const { container } = renderWithRoot(render({ autocomplete: 'email' }));

      expect(getInput(container)).toHaveAttribute('autocomplete', 'email');
    });

    it('should prefer autoComplete over the deprecated alias', () => {
      const { container } = renderWithRoot(
        render({ autoComplete: 'email', autocomplete: 'off' }),
      );

      expect(getInput(container)).toHaveAttribute('autocomplete', 'email');
    });
  });

  it('should leave the attribute off when neither prop is set', () => {
    const { container } = renderWithRoot(<TextInput label="field" />);

    expect(getInput(container)).not.toHaveAttribute('autocomplete');
  });

  it('should keep an autoComplete passed through inputProps', () => {
    // The attribute is applied after `inputProps` is merged onto the input, so an unset prop used
    // to overwrite whatever the caller (or the React Aria hook) had put there with `undefined`.
    const { container } = renderWithRoot(
      <TextInputBase
        label="field"
        inputProps={{ autoComplete: 'one-time-code' }}
      />,
    );

    expect(getInput(container)).toHaveAttribute(
      'autocomplete',
      'one-time-code',
    );
  });

  it('should keep the `off` that useNumberField sets for a number field', () => {
    const { container } = renderWithRoot(<NumberInput label="field" />);

    expect(getInput(container)).toHaveAttribute('autocomplete', 'off');
  });

  it('should turn autofill off for a color field', () => {
    const { container } = renderWithRoot(<ColorInput label="field" />);

    expect(getInput(container)).toHaveAttribute('autocomplete', 'off');
  });

  it('should forward autoComplete from TextInputMapper key and value props', () => {
    const { container } = renderWithRoot(
      <TextInputMapper
        label="field"
        value={{ key: 'value' }}
        keyProps={{ autoComplete: 'off' }}
        valueProps={{ autoComplete: 'off' }}
      />,
    );

    const inputs = container.querySelectorAll('input, textarea');

    expect(inputs.length).toBeGreaterThan(0);
    inputs.forEach((input) =>
      expect(input).toHaveAttribute('autocomplete', 'off'),
    );
  });

  it('should forward autoComplete from an InlineInput to its input', () => {
    const { getByRole } = renderWithRoot(
      <InlineInput
        defaultIsEditing
        aria-label="field"
        autoComplete="email"
        defaultValue="value"
      />,
    );

    expect(getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
  });
});
