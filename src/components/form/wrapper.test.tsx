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
import { SearchInput } from '../fields/SearchInput/SearchInput';
import { Switch } from '../fields/Switch/Switch';
import { TextInput } from '../fields/TextInput/TextInput';

import { Field } from './Form/Field';

vi.mock('../../_internal/hooks/use-warn');

/**
 * Without a `label`, a field renders the field chrome when it is bound to a
 * form or its caller passes a description or a message, unless it is
 * `isBare`. That is decided from the binding and the props, not from the text
 * they hold — `null` included — because a control moved in or out of the
 * wrapper is remounted by React and loses its focus.
 */
describe('field chrome without a label', () => {
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

  it('gives a bound Switch with a side label position no label column', () => {
    renderWithForm(
      <Switch name="primary" labelPosition="side">
        Primary key
      </Switch>,
    );

    expect(screen.getByTestId('Field')).not.toHaveAttribute('data-has-sider');
  });

  it('shows a search input description', () => {
    render(<SearchInput aria-label="Books" description="By title or author" />);

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
      expect(error.mock.calls.flat().map(String).join('\n')).not.toContain(
        'hasFieldChrome',
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
});

/**
 * `forceField` used to be the only way to show a label-less field's texts.
 * Bound fields and text props do that now, so it is deprecated: it still
 * forces the wrapper, and says so once.
 */
describe('the deprecated forceField', () => {
  // First in the file to pass `forceField`: the warning is once per module.
  it('still forces the wrapper, and warns once', () => {
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
});
