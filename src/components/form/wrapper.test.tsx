import { cloneElement, useState } from 'react';

import {
  act,
  render,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
} from '../../test';
import { FORM_ATTACHABLE_INPUTS } from '../../test/form-attachable-inputs';
import { Checkbox } from '../fields/Checkbox/Checkbox';
import { SearchComboBox } from '../fields/SearchComboBox/SearchComboBox';
import { SearchInput } from '../fields/SearchInput/SearchInput';
import { TagInput } from '../fields/TagInput/TagInput';
import { TextInput } from '../fields/TextInput/TextInput';

import { Field } from './Form/Field';
import { Form } from './Form/Form';
import { createFormController } from './Form/modern/controller';

import type { FieldBaseProps } from '../../shared/form';

vi.mock('../../_internal/hooks/use-warn');

/**
 * A field renders its chrome when there is something to show, and only the
 * control otherwise. Which props are passed decides, never what they hold, so
 * a message that comes and goes cannot remount a focused control.
 */
describe('field chrome without a label', () => {
  // `TagInput` has refusal messages of its own; see below.
  const quietInputs = FORM_ATTACHABLE_INPUTS.filter(
    ([name]) => name !== 'TagInput',
  );

  // Only these show the errors of a `validate` under the control.
  const showsValidateErrors = new Set([
    'NumberInput',
    'PasswordInput',
    'TextArea',
    'TextInput',
  ]);

  it.each(quietInputs)(
    '%s renders only the control without a label, binding or text props',
    (_, element) => {
      renderWithRoot(
        cloneElement(element, { label: undefined, 'aria-label': 'Billing' }),
      );

      expect(screen.queryByTestId('Field')).not.toBeInTheDocument();
    },
  );

  it.each(FORM_ATTACHABLE_INPUTS)(
    '%s renders one field wrapper with isBare={false}',
    (_, element) => {
      renderWithRoot(
        cloneElement(element, {
          label: undefined,
          'aria-label': 'Billing',
          isBare: false,
        }),
      );

      expect(screen.getAllByTestId('Field')).toHaveLength(1);
    },
  );

  it.each([
    ['a null message', { message: null }],
    ['an undefined message', { message: undefined }],
    ['an undefined description', { description: undefined }],
    ['an undefined error message', { errorMessage: undefined }],
    ['field styles', { fieldStyles: { width: '40x' } }],
    ['field props', { fieldProps: {} }],
    ['isHidden={false}', { isHidden: false }],
  ] satisfies [string, object][])(
    'renders the chrome for %s, whatever it holds',
    (_, props) => {
      render(<TextInput aria-label="Name" {...props} />);

      expect(screen.getByTestId('Field')).toBeInTheDocument();
    },
  );

  it.each(FORM_ATTACHABLE_INPUTS)(
    '%s hides without a label with isHidden',
    (_, element) => {
      renderWithRoot(
        cloneElement(element, {
          label: undefined,
          'aria-label': 'Billing',
          isHidden: true,
        }),
      );

      expect(screen.getByTestId('Field')).not.toBeVisible();
    },
  );

  it.each(quietInputs)(
    '%s asks for the chrome for a validate only when it shows its errors',
    (name, element) => {
      renderWithRoot(
        cloneElement(element, {
          label: undefined,
          'aria-label': 'Billing',
          validate: () => null,
        }),
      );

      expect(screen.queryAllByTestId('Field')).toHaveLength(
        showsValidateErrors.has(name) ? 1 : 0,
      );
    },
  );

  // A prop spread in only while there is an error would move the control into
  // the wrapper; `isBare={false}` keeps the wrapper from the start.
  it('preserves the input, focus and draft with isBare={false} when a message prop is added and omitted', async () => {
    function Name() {
      const [hasError, setHasError] = useState(false);

      return (
        <TextInput
          isBare={false}
          aria-label="Name"
          {...(hasError ? { errorMessage: 'Too short' } : {})}
          onChange={(value) => setHasError(value.length === 1)}
        />
      );
    }

    render(<Name />);
    const input = screen.getByRole('textbox', { name: 'Name' });

    await userEvent.type(input, 'a');

    expect(screen.getByRole('textbox', { name: 'Name' })).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue('a');
    expect(input).toHaveAccessibleDescription('Too short');

    await userEvent.type(input, 'b');

    expect(screen.getByRole('textbox', { name: 'Name' })).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue('ab');
    expect(screen.queryByText('Too short')).not.toBeInTheDocument();
  });

  it('shows and describes a standalone TagInput duplicate refusal by default', async () => {
    renderWithRoot(<TagInput aria-label="Tags" defaultValue={['alpha']} />);
    const input = screen.getByRole('textbox', { name: 'Tags' });

    await userEvent.type(input, 'alpha{Enter}');

    expect(screen.getByTestId('FieldMessage')).toHaveTextContent(
      '"alpha" is already added',
    );
    expect(input).toHaveAccessibleDescription(/"alpha" is already added/);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  // Its own validation errors need a place, as a form's do.
  it('shows the error of a label-less validate and keeps the control focused', async () => {
    render(
      <TextInput
        aria-label="Code"
        validate={(value) => (value.length < 3 ? 'Too short' : null)}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Code' });

    await userEvent.type(input, 'a');

    expect(screen.getByRole('textbox', { name: 'Code' })).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription('Too short');

    await userEvent.type(input, 'bc');

    expect(input).toHaveValue('abc');
    expect(screen.queryByText('Too short')).not.toBeInTheDocument();
  });

  it('keeps a control mounted and focused while its error clears', async () => {
    function TenantName() {
      const [error, setError] = useState<string | undefined>('Unknown tenant');

      return (
        <TextInput
          aria-label="Tenant"
          errorMessage={error}
          isInvalid={!!error}
          onChange={() => setError(undefined)}
        />
      );
    }

    render(<TenantName />);

    const input = screen.getByRole('textbox', { name: 'Tenant' });

    expect(screen.getByText('Unknown tenant')).toBeInTheDocument();

    await act(async () => {
      await userEvent.type(input, 'acme');
    });

    expect(screen.queryByText('Unknown tenant')).not.toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).toHaveValue('acme');
  });

  it('keeps a control mounted and focused when its error appears', async () => {
    function Terms() {
      const [error, setError] = useState<string>();

      return (
        <Checkbox
          defaultSelected
          errorMessage={error}
          isInvalid={!!error}
          onChange={(isSelected) =>
            setError(isSelected ? undefined : 'You must accept')
          }
        >
          Accept
        </Checkbox>
      );
    }

    render(<Terms />);

    const checkbox = screen.getByRole('checkbox', { name: 'Accept' });

    await act(async () => {
      checkbox.focus();
      await userEvent.keyboard(' ');
    });

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveFocus();
    expect(checkbox).toHaveAccessibleDescription('You must accept');
  });

  // `useState<string | null>(null)`: a `null` message is a passed prop too.
  it('keeps a control mounted while a null error turns into text', async () => {
    function Name() {
      const [error, setError] = useState<string | null>(null);

      return (
        <TextInput
          aria-label="Name"
          errorMessage={error}
          isInvalid={!!error}
          onChange={(value) => setError(value.length < 3 ? 'Too short' : null)}
        />
      );
    }

    render(<Name />);

    const input = screen.getByRole('textbox', { name: 'Name' });

    await act(async () => {
      await userEvent.type(input, 'ab');
    });

    expect(input).toHaveAccessibleDescription('Too short');

    await act(async () => {
      await userEvent.type(input, 'cd');
    });

    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).toHaveValue('abcd');
    expect(screen.queryByText('Too short')).not.toBeInTheDocument();
  });

  // A side label carries the description in its column; with no label it
  // would read as one.
  it('puts the description under the input with a side label position', () => {
    render(
      <Checkbox labelPosition="side" description="Sent weekly">
        Subscribe
      </Checkbox>,
    );

    expect(
      screen.getByText('Sent weekly').closest('[data-element]'),
    ).toHaveAttribute('data-element', 'Description');
    expect(
      screen.getByText('Sent weekly').closest('[data-element="InputArea"]'),
    ).not.toBeNull();
  });

  // They skip `useFieldProps`, so they ask for the chrome themselves.
  it.each([
    ['SearchInput', <SearchInput key="input" aria-label="Books" />],
    [
      'SearchComboBox',
      <SearchComboBox key="combo" aria-label="Books">
        <SearchComboBox.Item key="dune">Dune</SearchComboBox.Item>
      </SearchComboBox>,
    ],
  ])('%s renders the chrome only for a description', (_, element) => {
    const { rerender } = renderWithRoot(element);

    expect(screen.queryByTestId('Field')).not.toBeInTheDocument();

    rerender(cloneElement(element, { description: 'By title or author' }));

    expect(screen.getByTestId('Field')).toBeInTheDocument();
    expect(screen.getByText('By title or author')).toBeInTheDocument();
  });

  // An inline field has no room for the texts, but still says it is invalid.
  it('keeps the bare control with isBare, invalid state included', () => {
    render(
      <TextInput
        isBare
        isInvalid
        aria-label="Price"
        description="In USD"
        errorMessage="Too high"
      />,
    );

    expect(screen.queryByTestId('Field')).not.toBeInTheDocument();
    expect(screen.queryByText('In USD')).not.toBeInTheDocument();
    expect(screen.queryByText('Too high')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Price' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it.each(FORM_ATTACHABLE_INPUTS)(
    '%s renders bare with isBare and keeps the prop off the DOM',
    (_, element) => {
      const error = vi.spyOn(console, 'error');

      renderWithRoot(
        cloneElement(element, {
          label: undefined,
          'aria-label': 'Billing',
          isBare: true,
          description: 'Used on invoices',
          errorMessage: 'Too short',
        }),
      );

      expect(screen.queryByTestId('Field')).not.toBeInTheDocument();
      expect(screen.queryByText('Used on invoices')).not.toBeInTheDocument();
      expect(screen.queryByText('Too short')).not.toBeInTheDocument();
      expect(document.querySelector('[isbare]')).toBeNull();
      expect(error.mock.calls.flat().map(String).join('\n')).not.toContain(
        'isBare',
      );

      error.mockRestore();
    },
  );

  // Its rule errors come from the form, not from its props, and need a place.
  it.each(FORM_ATTACHABLE_INPUTS)(
    '%s bound to a form shows its rule error in one wrapper',
    async (_, element) => {
      const error = vi.spyOn(console, 'error');
      const { formInstance } = renderWithForm(
        cloneElement(element, {
          label: undefined,
          'aria-label': 'Billing',
          name: 'billing',
          rules: [
            {
              validator: async () => {
                throw new Error('Billing is wrong');
              },
            },
          ],
        }),
      );

      await act(async () => {
        await formInstance.validateFields().catch(() => {});
      });

      expect(screen.getAllByTestId('Field')).toHaveLength(1);
      expect(screen.getByText('Billing is wrong')).toBeInTheDocument();
      // The `isBare={false}` the binding asks with never reaches the DOM.
      expect(error.mock.calls.flat().map(String).join('\n')).not.toContain(
        'does not recognize',
      );

      error.mockRestore();
    },
  );

  it('keeps a bound field bare with isBare, invalid state included', async () => {
    const { formInstance } = renderWithForm(
      <Checkbox
        isBare
        name="terms"
        rules={[{ required: true, message: 'You must accept' }]}
      >
        Accept
      </Checkbox>,
    );

    await act(async () => {
      await formInstance.validateFields().catch(() => {});
    });

    expect(screen.queryByTestId('Field')).not.toBeInTheDocument();
    expect(screen.queryByText('You must accept')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  // The legacy `<Field>` binds its child and hands it the error.
  it('shows the rule error of a label-less legacy Form.Item child', async () => {
    const { formInstance } = renderWithForm(
      <Field
        name="terms"
        rules={[{ required: true, message: 'You must accept' }]}
      >
        <Checkbox>Accept</Checkbox>
      </Field>,
    );

    await act(async () => {
      await formInstance.validateFields().catch(() => {});
    });

    expect(
      screen.getByRole('checkbox', { name: 'Accept' }),
    ).toHaveAccessibleDescription('You must accept');
  });

  it.each([undefined, 'region'])(
    'keeps exactly one wrapper for a legacy Form.Item with name %s',
    (name) => {
      const { formInstance } = renderWithForm(
        <Field name={name} label="Region">
          <TextInput {...(name ? {} : { 'aria-label': 'Region' })} />
        </Field>,
      );

      expect(screen.getAllByTestId('Field')).toHaveLength(1);
      expect(
        screen.getByRole('textbox', { name: 'Region' }),
      ).toBeInTheDocument();
      expect(formInstance.getFieldNames()).toEqual(name ? [name] : []);
    },
  );
});

describe('field message slot precedence', () => {
  it.each([
    ['null', null],
    ['false', false],
    ['empty text', ''],
  ] as const)(
    'an explicit %s error slot suppresses the legacy message fallback',
    (_, errorMessage) => {
      render(
        <TextInput
          aria-label="Region"
          errorMessage={errorMessage}
          message="Legacy fallback"
        />,
      );

      expect(screen.queryByTestId('FieldMessage')).not.toBeInTheDocument();
      expect(
        screen.getByRole('textbox', { name: 'Region' }),
      ).not.toHaveAccessibleDescription();
    },
  );

  it('uses the legacy message when the error slot is undefined', () => {
    render(
      <TextInput
        aria-label="Region"
        errorMessage={undefined}
        message="Legacy fallback"
      />,
    );

    expect(screen.getByTestId('FieldMessage')).toHaveTextContent(
      'Legacy fallback',
    );
    expect(
      screen.getByRole('textbox', { name: 'Region' }),
    ).toHaveAccessibleDescription('Legacy fallback');
  });

  it('renders a numeric zero in the error slot without falling back', () => {
    render(
      <TextInput
        aria-label="Region"
        errorMessage={0}
        message="Legacy fallback"
      />,
    );

    expect(screen.getByTestId('FieldMessage')).toHaveTextContent(/^0$/);
    expect(
      screen.getByRole('textbox', { name: 'Region' }),
    ).toHaveAccessibleDescription('0');
    expect(screen.queryByText('Legacy fallback')).not.toBeInTheDocument();
  });

  describe.each(['legacy', 'modern'] as const)('%s form errors', (backend) => {
    it.each([
      ['an explicit null error slot', { errorMessage: null }, false],
      ['an undefined error slot', { errorMessage: undefined }, true],
      ['a null legacy message', { message: null }, true],
    ] satisfies [string, Partial<FieldBaseProps>, boolean][])(
      'respects %s without changing the invalid state',
      async (_, slots, showsError) => {
        const control = (
          <TextInput
            name="region"
            aria-label="Region"
            rules={[{ required: true, message: 'Choose a region' }]}
            {...slots}
          />
        );

        if (backend === 'legacy') {
          const { formInstance } = renderWithForm(control);

          await act(async () => {
            await formInstance.validateFields().catch(() => {});
          });
        } else {
          const form = createFormController({ defaultValues: { region: '' } });
          renderWithRoot(<Form form={form}>{control}</Form>);

          await act(async () => {
            await form.validate();
          });
        }

        const input = screen.getByRole('textbox', { name: 'Region' });
        expect(input).toHaveAttribute('aria-invalid', 'true');

        if (showsError) {
          expect(screen.getByTestId('FieldMessage')).toHaveTextContent(
            'Choose a region',
          );
          expect(input).toHaveAccessibleDescription('Choose a region');
        } else {
          expect(screen.queryByTestId('FieldMessage')).not.toBeInTheDocument();
          expect(input).not.toHaveAccessibleDescription();
        }
      },
    );
  });
});

/**
 * `forceField` renders the chrome as `isBare={false}` does, and warns once. It
 * cannot override an explicit request for a bare control.
 */
describe('the deprecated forceField', () => {
  // First in the file to pass `forceField`: the warning is once per module.
  it('renders the chrome without a label, and warns once', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <>
        <TextInput forceField aria-label="Name" />
        <TextInput forceField aria-label="Email" />
      </>,
    );

    expect(screen.getAllByTestId('Field')).toHaveLength(2);
    expect(
      spy.mock.calls.filter((args) => String(args[1]).includes('forceField')),
    ).toHaveLength(1);

    spy.mockRestore();
  });

  // `forceField` only ever forced the wrapper; `false` is no opt-out.
  it('treats forceField={false} as unset', () => {
    render(
      <Checkbox forceField={false} description="Sent weekly">
        Accept
      </Checkbox>,
    );

    expect(screen.getByText('Sent weekly')).toBeInTheDocument();
  });

  it('lets isBare win over a supplied label and deprecated forceField', () => {
    render(
      <TextInput
        isBare
        forceField
        label="Price"
        errorMessage="Too high"
        isInvalid
      />,
    );

    expect(screen.queryByTestId('Field')).not.toBeInTheDocument();
    expect(screen.queryByTestId('FieldMessage')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Price' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
