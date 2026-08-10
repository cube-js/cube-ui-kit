import { ReactNode, useEffect, useState } from 'react';

import { PasswordInput, SearchInput, TextArea, TextInput } from '../../index';
import { act, renderWithForm, renderWithRoot, userEvent } from '../../test';

interface FieldProps {
  value: string;
  onChange: (next: string) => void;
  isBuffered?: boolean;
}

const FIELDS = [
  {
    name: 'TextInput',
    render: (props: FieldProps) => <TextInput label="field" {...props} />,
  },
  {
    name: 'TextArea',
    render: (props: FieldProps) => <TextArea label="field" {...props} />,
  },
  {
    name: 'PasswordInput',
    render: (props: FieldProps) => <PasswordInput label="field" {...props} />,
  },
  {
    name: 'SearchInput',
    render: (props: FieldProps) => <SearchInput label="field" {...props} />,
  },
] as const;

/**
 * A parent that applies every change one commit late — the shape of any value that reaches a
 * component through a store publishing in a layout effect, a debounce, or a deferred update. The
 * render immediately after a keystroke still carries the pre-keystroke string, which is exactly
 * what used to get written back into the DOM node and collapse the selection.
 */
function LaggingParent(props: {
  children: (value: string, onChange: (next: string) => void) => ReactNode;
  initialValue?: string;
}) {
  const { children, initialValue = 'hello' } = props;
  const [value, setValue] = useState(initialValue);
  const [inFlight, setInFlight] = useState<string | null>(null);

  useEffect(() => {
    if (inFlight !== null) {
      setValue(inFlight);
      setInFlight(null);
    }
  }, [inFlight]);

  return (
    <>
      {children(value, setInFlight)}
      <button data-qa="External" onClick={() => setValue('from elsewhere')}>
        external
      </button>
    </>
  );
}

async function typeInto(
  input: HTMLInputElement,
  text: string,
  at: number,
): Promise<void> {
  await act(async () => {
    await userEvent.type(input, text, {
      initialSelectionStart: at,
      initialSelectionEnd: at,
    });
  });
}

describe('buffered value in text fields', () => {
  it.each(FIELDS)(
    'keeps the caret in place while the parent lags ($name)',
    async ({ render }) => {
      const { getByTestId } = renderWithRoot(
        <LaggingParent>
          {(value, onChange) => render({ value, onChange })}
        </LaggingParent>,
      );
      const input = getByTestId('Input') as HTMLInputElement;

      await typeInto(input, 'X', 2);

      expect(input).toHaveValue('heXllo');
      expect(input.selectionStart).toBe(3);
    },
  );

  it.each(FIELDS)(
    'does not lose keystrokes typed before the echo lands ($name)',
    async ({ render }) => {
      const { getByTestId } = renderWithRoot(
        <LaggingParent>
          {(value, onChange) => render({ value, onChange })}
        </LaggingParent>,
      );
      const input = getByTestId('Input') as HTMLInputElement;

      await typeInto(input, 'XYZ', 2);

      expect(input).toHaveValue('heXYZllo');
      expect(input.selectionStart).toBe(5);
    },
  );

  it.each(FIELDS)(
    'lets an external change overwrite the draft ($name)',
    async ({ render }) => {
      const { getByTestId } = renderWithRoot(
        <LaggingParent>
          {(value, onChange) => render({ value, onChange })}
        </LaggingParent>,
      );
      const input = getByTestId('Input') as HTMLInputElement;

      await typeInto(input, 'X', 2);
      await act(async () => await userEvent.click(getByTestId('External')));

      expect(input).toHaveValue('from elsewhere');
    },
  );

  it.each(FIELDS)(
    'snaps back on blur when the parent declined the keystroke ($name)',
    async ({ render }) => {
      const onChange = vi.fn();
      const { getByTestId } = renderWithRoot(
        render({ value: 'hello', onChange }),
      );
      const input = getByTestId('Input') as HTMLInputElement;

      await typeInto(input, 'X', 2);
      // The parent never advanced its value, so the typed text is only ours for now.
      expect(input).toHaveValue('heXllo');
      expect(onChange).toHaveBeenCalledWith('heXllo');

      await act(async () => await userEvent.tab());

      expect(input).toHaveValue('hello');
    },
  );

  describe('inside a Form', () => {
    it('keeps the form value and the DOM in step', async () => {
      const { getByTestId, formInstance } = renderWithForm(
        <TextInput label="field" name="field" />,
      );
      const input = getByTestId('Input') as HTMLInputElement;

      await typeInto(input, 'abc', 0);

      expect(input).toHaveValue('abc');
      expect(formInstance.getFieldValue('field')).toBe('abc');

      // A programmatic write from outside has to win over the buffer.
      await act(async () => {
        formInstance.setFieldValue('field', 'from the form');
      });

      expect(input).toHaveValue('from the form');
    });
  });

  // The negative control: the same harness with buffering off is the bug this all exists for. The
  // text still lands — React writes the stale string, then the echo — but the caret is left at the
  // end of the field instead of after the character that was just typed.
  it('loses the caret with isBuffered={false}', async () => {
    const { getByTestId } = renderWithRoot(
      <LaggingParent>
        {(value, onChange) => (
          <TextInput
            label="field"
            value={value}
            onChange={onChange}
            isBuffered={false}
          />
        )}
      </LaggingParent>,
    );
    const input = getByTestId('Input') as HTMLInputElement;

    await typeInto(input, 'X', 2);

    expect(input).toHaveValue('heXllo');
    expect(input.selectionStart).toBe('heXllo'.length);
  });
});
