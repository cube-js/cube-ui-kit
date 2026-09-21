import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';

import { TextInput } from '../../../fields/TextInput/TextInput';
import { FormScopeMask } from '../Form';
import { Form } from '../index';

import { createFormController } from './controller';
import { TupleNameFixture } from './field.fixture';

import type { ModernValidationRule } from './controller';

describe('modern tuple field names', () => {
  it('binds nested defaults, validates, submits, and resets through context', async () => {
    const onSubmit = vi.fn();
    const form = createFormController({
      defaultValues: { rows: [{ email: null as string | null }] },
      onSubmit,
    });
    const view = render(
      <StrictMode>
        <TupleNameFixture form={form} />
      </StrictMode>,
    );
    const input = view.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('name', 'rows.0.email');
    await userEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(form.getFieldSnapshot(['rows', 0, 'email'])?.status).toBe('invalid');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(input, 'a@example.com');
    await userEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith(
      { rows: [{ email: 'a@example.com' }] },
      expect.objectContaining({ include: 'active' }),
    );
    await userEvent.click(view.getByRole('button', { name: 'Reset' }));
    expect(input).toHaveValue('');
    expect(form.getValue(['rows', 0, 'email'])).toBeNull();
  });

  it('keeps pending validation on equivalent tuples and cancels it when rebinding', async () => {
    const form = createFormController({
      defaultValues: { rows: [{ email: 'first' }, { email: 'second' }] },
    });
    let signal: AbortSignal | undefined;
    const validator = vi.fn<NonNullable<ModernValidationRule['validator']>>(
      (_rule, _value, context) => {
        signal = context.signal;
        return new Promise(() => {});
      },
    );
    const view = render(<TupleNameFixture form={form} validator={validator} />);
    let pending: ReturnType<typeof form.validate>;
    act(() => {
      pending = form.validate();
    });
    await waitFor(() => expect(validator).toHaveBeenCalledTimes(1));
    view.rerender(<TupleNameFixture form={form} validator={validator} />);
    expect(signal?.aborted).toBe(false);
    expect(validator).toHaveBeenCalledTimes(1);
    view.rerender(
      <TupleNameFixture form={form} index={1} validator={validator} />,
    );
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      expect((await pending).stale).toBe(true);
    });
    expect(view.getByRole('textbox', { name: 'Email' })).toHaveValue('second');
    expect(form.getFieldSnapshot(['rows', 0, 'email'])?.active).toBe(false);
    expect(form.getFieldSnapshot(['rows', 1, 'email'])?.active).toBe(true);
    expect(form.getValue(['rows', 0, 'email'])).toBe('first');
  });

  it('removes only the released tuple value when preserve is false', async () => {
    const form = createFormController({
      defaultValues: { rows: [{ email: 'first' }, { email: 'second' }] },
    });
    const view = render(
      <StrictMode>
        <TupleNameFixture form={form} preserve={false} />
      </StrictMode>,
    );
    expect(form.getValue(['rows', 0, 'email'])).toBe('first');
    view.rerender(
      <StrictMode>
        <TupleNameFixture form={form} index={1} preserve={false} />
      </StrictMode>,
    );
    await waitFor(() =>
      expect(form.getValue(['rows', 0, 'email'])).toBeUndefined(),
    );
    expect(form.getValue(['rows', 1, 'email'])).toBe('second');
    act(() => form.reset());
    expect(form.getValue(['rows', 0, 'email'])).toBe('first');
  });

  it('previews nested edits and revalidates declared tuple dependencies', async () => {
    const form = createFormController({
      defaultValues: { user: { password: 'a', confirmation: 'a' } },
    });
    const shouldUpdate = vi.fn(
      (_previous, next) => next.user.password.length <= 2,
    );
    const view = render(
      <Form form={form}>
        <TextInput
          name={['user', 'password']}
          label="Password"
          shouldUpdate={shouldUpdate}
        />
        <TextInput
          name={['user', 'confirmation']}
          label="Confirmation"
          dependsOn={[['user', 'password']]}
          rules={[
            {
              validator: (_rule, value, { getValue }) =>
                value === getValue(['user', 'password'])
                  ? undefined
                  : 'Mismatch',
            },
          ]}
        />
      </Form>,
    );
    await act(async () => {
      await form.validate();
    });
    await userEvent.type(view.getByRole('textbox', { name: 'Password' }), 'bc');
    expect(form.getValue(['user', 'password'])).toBe('ab');
    expect(shouldUpdate).toHaveBeenLastCalledWith(
      { user: { password: 'ab', confirmation: 'a' } },
      { user: { password: 'abc', confirmation: 'a' } },
    );
    await waitFor(() => expect(view.getByText('Mismatch')).toBeInTheDocument());
  });

  it('normalizes detached names and gives descriptors precedence over tuple names', () => {
    const form = createFormController({
      defaultValues: { user: { email: 'chosen', other: 'ignored' } },
    });
    const view = render(
      <Form form={form}>
        <FormScopeMask value={{}}>
          <TextInput name={['user', 'masked']} label="Masked" />
        </FormScopeMask>
        <TextInput
          form={undefined}
          name={['user', 'detached']}
          label="Detached"
        />
        <TextInput
          name={['user', 'other']}
          field={form.field(['user', 'email'])}
          label="Descriptor"
        />
      </Form>,
    );
    expect(view.getByRole('textbox', { name: 'Masked' })).toHaveAttribute(
      'name',
      'user.masked',
    );
    expect(view.getByRole('textbox', { name: 'Detached' })).toHaveAttribute(
      'name',
      'user.detached',
    );
    expect(view.getByRole('textbox', { name: 'Descriptor' })).toHaveValue(
      'chosen',
    );
    expect(form.getActiveValues()).toEqual({ user: { email: 'chosen' } });
  });

  it.each([{ name: [] }, { name: ['__proto__', 'email'] }])(
    'rejects an invalid tuple $name before registration',
    ({ name }) => {
      const form = createFormController();
      expect(() =>
        render(<TextInput form={form} name={name} label="Email" />),
      ).toThrow();
      expect(form.getActiveValues()).toEqual({});
    },
  );

  it('shares descriptor state while keeping literal dotted and escaped names distinct', async () => {
    const form = createFormController({
      defaultValues: {
        'user.email': 'literal',
        user: { email: 'nested', 'email.work': 'work' },
      },
    });
    const view = render(
      <>
        <TextInput form={form} name="user.email" label="Literal" />
        <TextInput form={form} name={['user', 'email']} label="Nested" />
        <TextInput field={form.field(['user', 'email'])} label="Duplicate" />
        <TextInput form={form} name={['user', 'email.work']} label="Work" />
      </>,
    );
    expect(view.getByRole('textbox', { name: 'Literal' })).toHaveValue(
      'literal',
    );
    expect(view.getByRole('textbox', { name: 'Work' })).toHaveValue('work');
    expect(view.getByRole('textbox', { name: 'Work' })).toHaveAttribute(
      'name',
      'user.email\\.work',
    );
    const nested = view.getByRole('textbox', { name: 'Nested' });
    const duplicate = view.getByRole('textbox', { name: 'Duplicate' });
    expect(nested.id).not.toBe(duplicate.id);
    await userEvent.type(nested, '!');
    expect(duplicate).toHaveValue('nested!');
    expect(form.getValue('user.email')).toBe('literal');
  });

  it('rejects tuple names on a legacy form instead of creating a comma-separated key', () => {
    function Legacy() {
      const [form] = Form.useForm();
      return <TextInput form={form} name={['user', 'email']} label="Email" />;
    }
    expect(() => render(<Legacy />)).toThrow(
      'Tuple field names require a modern form controller',
    );
  });
});
