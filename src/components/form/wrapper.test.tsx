import { useState } from 'react';

import { act, render, renderWithForm, screen, userEvent } from '../../test';
import { Checkbox } from '../fields/Checkbox/Checkbox';
import { SearchInput } from '../fields/SearchInput/SearchInput';
import { TextInput } from '../fields/TextInput/TextInput';

vi.mock('../../_internal/hooks/use-warn');

/**
 * Without a `label`, a field renders the field chrome when the caller passes a
 * description or a message. That is decided from the props, not from the text
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

  it('shows a search input description', () => {
    render(<SearchInput aria-label="Books" description="By title or author" />);

    expect(screen.getByText('By title or author')).toBeInTheDocument();
  });

  it('keeps the bare control with forceField={false}', () => {
    render(
      <Checkbox forceField={false} description="Sent weekly">
        Accept
      </Checkbox>,
    );

    expect(screen.queryByTestId('Field')).not.toBeInTheDocument();
  });

  // Wrapping every bound field would change the layout of inline and grid
  // rows, so a bound field without these props stays bare.
  it('keeps a bound field without text props bare', async () => {
    const { formInstance } = renderWithForm(
      <Checkbox name="terms" rules={[{ required: true, message: 'Required' }]}>
        Accept
      </Checkbox>,
    );

    await act(async () => {
      await formInstance.validateFields().catch(() => {});
    });

    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.queryByTestId('Field')).not.toBeInTheDocument();
  });

  it('shows a bound field’s rule error with forceField', async () => {
    const { formInstance } = renderWithForm(
      <Checkbox
        forceField
        name="terms"
        rules={[{ required: true, message: 'You must accept' }]}
      >
        Accept
      </Checkbox>,
    );

    await act(async () => {
      await formInstance.validateFields().catch(() => {});
    });

    expect(
      screen.getByRole('checkbox', { name: 'Accept' }),
    ).toHaveAccessibleDescription('You must accept');
  });
});
