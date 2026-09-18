import { act, render, renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { TextInput } from '../../../fields/TextInput/TextInput';
import { Form } from '../index';

import { createFormController, getControllerInternals } from './controller';
import { FieldFixture } from './field.fixture';
import { createFormStore } from './store';

describe('modern Form consumer workflows', () => {
  it('revalidates when the descriptor validator is replaced', async () => {
    const form = createFormController({ defaultValues: { name: 'Ada' } });
    const view = render(
      <TextInput
        field={form.field('name', { validate: () => 'Strict error' })}
        label="Name"
      />,
    );
    await act(async () => {
      await form.validate();
    });
    expect(view.getByText('Strict error')).toBeInTheDocument();
    view.rerender(
      <TextInput
        field={form.field('name', { validate: () => undefined })}
        label="Name"
      />,
    );
    await waitFor(() =>
      expect(form.getFieldSnapshot('name')?.status).toBe('valid'),
    );
    expect(view.queryByText('Strict error')).not.toBeInTheDocument();
  });

  it('validates descriptor paths immediately and preserves literal DOM names', () => {
    const form = createFormController<Record<string, string>>();
    expect(() => form.field([])).toThrow('must not be empty');
    expect(() => form.field(['__proto__'])).toThrow('Unsafe form path');
    const view = render(
      <TextInput field={form.field('user.email')} label="Email" />,
    );
    expect(view.getByRole('textbox')).toHaveAttribute('name', 'user.email');
  });

  it('lets invalid modern forms submit again by default, with an explicit disable opt-in', async () => {
    const onSubmitFailed = vi.fn();
    const form = createFormController({
      defaultValues: { name: '' },
      onSubmitFailed,
    });
    const view = render(
      <Form form={form}>
        <TextInput name="name" label="Name" isRequired />
        <Form.Submit>Save</Form.Submit>
        <Form.Submit disableOnInvalid>Only valid</Form.Submit>
      </Form>,
    );
    const save = view.getByRole('button', { name: 'Save' });
    await userEvent.click(save);
    expect(save).toBeEnabled();
    expect(view.getByRole('button', { name: 'Only valid' })).toBeDisabled();
    await userEvent.click(save);
    expect(onSubmitFailed).toHaveBeenCalledTimes(2);
  });

  it.each([false, true])(
    'honors Reset click cancellation and calls press before resetting (root: %s)',
    async (withRoot) => {
      const form = createFormController({ defaultValues: { name: 'Ada' } });
      const onPress = vi.fn(() => expect(form.getValue('name')).toBe('Grace'));
      const content = (
        <>
          <TextInput field={form.field('name')} label="Name" />
          <Form.Reset
            form={form}
            onPress={onPress}
            onClick={(event) => event.preventDefault()}
          >
            Cancel
          </Form.Reset>
          <Form.Reset form={form} onPress={onPress} htmlType="reset">
            Reset
          </Form.Reset>
        </>
      );
      const view = render(
        withRoot ? <Form form={form}>{content}</Form> : content,
      );
      act(() => form.setValue('name', 'Grace'));
      await userEvent.click(view.getByRole('button', { name: 'Cancel' }));
      expect(form.getValue('name')).toBe('Grace');
      await userEvent.click(view.getByRole('button', { name: 'Reset' }));
      expect(form.getValue('name')).toBe('Ada');
      expect(onPress).toHaveBeenCalledTimes(2);
    },
  );

  it('keeps input rules unless the descriptor supplies its own rules', async () => {
    const form = createFormController({ defaultValues: { name: '' } });
    const inputRules = [{ required: true, message: 'Input rule' }];
    const view = render(
      <TextInput field={form.field('name')} rules={inputRules} label="Name" />,
    );
    await act(async () => {
      await form.validate();
    });
    expect(form.getFieldSnapshot('name')?.errors).toEqual(['Input rule']);
    view.rerender(
      <TextInput
        field={form.field('name', {
          rules: [{ required: true, message: 'Descriptor rule' }],
        })}
        rules={inputRules}
        label="Name"
      />,
    );
    await act(async () => {
      await form.validate();
    });
    expect(form.getFieldSnapshot('name')?.errors).toEqual(['Descriptor rule']);
  });

  it('previews nested edits in shouldUpdate without modifying current values', async () => {
    const defaults = { profile: { name: 'Ada', role: 'admin' } };
    const form = createFormController({ defaultValues: defaults });
    const shouldUpdate = vi.fn(
      (_previous, next) => next.profile.name.length <= 4,
    );
    const view = render(
      <TextInput
        field={form.field(['profile', 'name'])}
        shouldUpdate={shouldUpdate}
        label="Name"
      />,
    );
    await userEvent.type(view.getByRole('textbox'), 'XY');
    expect(shouldUpdate).toHaveBeenNthCalledWith(1, defaults, {
      profile: { name: 'AdaX', role: 'admin' },
    });
    expect(form.getValues()).toEqual({
      profile: { name: 'AdaX', role: 'admin' },
    });
    expect(defaults.profile.name).toBe('Ada');
  });

  it('renders nested defaults before registration, including on the server', () => {
    const form = createFormController({
      defaultValues: { profile: { name: 'Ada' } },
    });
    const html = renderToString(
      <TextInput field={form.field(['profile', 'name'])} label="Name" />,
    );
    expect(html).toContain('value="Ada"');
    expect(
      getControllerInternals(form, 'test').store.debug.registrationCount(),
    ).toBe(0);
  });

  it('submits the explicit controller from an external footer and another DOM form', async () => {
    const onSubmit = vi.fn();
    const wrongSubmit = vi.fn();
    const form = createFormController({
      defaultValues: { name: 'Ada', retained: 'draft' },
      onSubmit,
    });
    const other = createFormController({
      defaultValues: { name: 'Other' },
      onSubmit: wrongSubmit,
    });
    const view = render(
      <>
        <Form form={form} submitValues="all">
          <TextInput name="name" label="Name" />
          <Form.Submit>Inside</Form.Submit>
        </Form>
        <Form.Submit form={form}>External</Form.Submit>
        <Form form={other}>
          <TextInput name="name" label="Other" />
          <Form.Submit form={form}>Explicit</Form.Submit>
        </Form>
      </>,
    );
    for (const name of ['External', 'Explicit', 'Inside'])
      await userEvent.click(view.getByRole('button', { name }));
    expect(onSubmit).toHaveBeenCalledTimes(3);
    expect(wrongSubmit).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenLastCalledWith(
      { name: 'Ada', retained: 'draft' },
      expect.objectContaining({ include: 'all' }),
    );
    await userEvent.type(
      view.getByRole('textbox', { name: 'Name' }),
      '{Enter}',
    );
    expect(onSubmit).toHaveBeenCalledTimes(4);
  });

  it('submits a controller with standalone registered inputs and no root', async () => {
    const onSubmit = vi.fn();
    const form = createFormController({
      defaultValues: { name: 'Ada' },
      onSubmit,
    });
    const view = render(
      <>
        <TextInput field={form.field('name')} label="Name" />
        <Form.Submit form={form}>Save</Form.Submit>
      </>,
    );
    await userEvent.click(view.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('honors click cancellation and routes external buttons through native action forms', async () => {
    const onSubmit = vi.fn();
    const form = createFormController({
      defaultValues: { name: 'Ada' },
      onSubmit,
    });
    const view = render(
      <>
        <Form form={form} action="/save">
          <TextInput field={form.field('name')} label="Name" />
        </Form>
        <Form.Submit form={form}>Save</Form.Submit>
        <Form.Submit form={form} onClick={(event) => event.preventDefault()}>
          Cancel
        </Form.Submit>
      </>,
    );
    const native = vi.fn((event: Event) => event.preventDefault());
    view.container.querySelector('form')!.addEventListener('submit', native);
    await userEvent.click(view.getByRole('button', { name: 'Cancel' }));
    expect(native).not.toHaveBeenCalled();
    await userEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(native).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('commits fresh callbacks without changing controller or defaults', async () => {
    const save = vi.fn();
    const { result, rerender } = renderHook(
      ({ accountId }) =>
        Form.useController({
          defaultValues: { name: accountId },
          onSubmit: (values) => {
            save(accountId, values);
          },
        }),
      { initialProps: { accountId: 'old' } },
    );
    const form = result.current;
    render(<TextInput field={form.field('name')} label="Name" />);
    rerender({ accountId: 'new' });
    await act(async () => {
      await form.submit();
    });
    expect(result.current).toBe(form);
    expect(save).toHaveBeenCalledWith('new', { name: 'old' });
  });

  it('resets programmatic edits and honors the root reset event', async () => {
    const form = createFormController({ defaultValues: { name: 'Ada' } });
    const onReset = vi.fn((event) => event.preventDefault());
    const view = render(
      <Form form={form} onReset={onReset}>
        <TextInput name="name" label="Name" />
        <Form.Reset>Reset</Form.Reset>
      </Form>,
    );
    act(() => form.setValue('name', 'Grace'));
    expect(view.getByRole('button')).toBeEnabled();
    await userEvent.click(view.getByRole('button'));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(form.getValue('name')).toBe('Grace');
    view.rerender(
      <Form form={form}>
        <TextInput name="name" label="Name" />
        <Form.Reset>Reset</Form.Reset>
      </Form>,
    );
    await userEvent.click(view.getByRole('button'));
    expect(form.getValue('name')).toBe('Ada');
  });

  it('binds pure nested descriptors and subscribes only to selected field state', async () => {
    const form = createFormController({
      defaultValues: { profile: { name: 'Ada' }, other: '' },
    });
    const descriptor = form.field(['profile', 'name']);
    expect(
      getControllerInternals(form, 'test').store.debug.registrationCount(),
    ).toBe(0);
    const ownerRender = vi.fn();
    const valueRender = vi.fn();
    function Value() {
      const name = Form.useValue(form, ['profile', 'name']);
      valueRender(name);
      return <output>{name}</output>;
    }
    function Owner() {
      ownerRender();
      return (
        <Form form={form}>
          <TextInput field={form.field(['profile', 'name'])} label="Name" />
          <Value />
        </Form>
      );
    }
    const view = render(
      <StrictMode>
        <Owner />
      </StrictMode>,
    );
    ownerRender.mockClear();
    valueRender.mockClear();
    act(() => form.setValue('other', '!'));
    expect(valueRender).not.toHaveBeenCalled();
    expect(ownerRender).not.toHaveBeenCalled();
    await userEvent.type(view.getByRole('textbox'), '!');
    expect(form.getValue(['profile', 'name'])).toBe('Ada!');
    expect(view.getByRole('status').textContent).toBe('Ada!');
    expect(
      view.container.querySelector('[field],[deps],[dependson]'),
    ).toBeNull();
    expect(descriptor.path).toEqual(['profile', 'name']);
  });

  it('aborts obsolete validation and revalidates declared sibling dependencies', async () => {
    const store = createFormStore({
      defaultValues: { password: 'same', confirm: 'same' },
    });
    let release!: () => void;
    const pause = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const start = new Promise<void>((resolve) => {
      started = resolve;
    });
    let firstSignal: AbortSignal | undefined;
    store.register('password');
    store.register('confirm', {
      dependsOn: ['password'],
      rules: [
        {
          validator: async (_rule, value, context) => {
            firstSignal ??= context.signal;
            const password = context.getValue('password');
            started();
            await pause;
            return value === password ? undefined : 'Passwords differ';
          },
        },
      ],
    });
    const validation = store.validate(['confirm']);
    await start;
    store.setValue('password', 'different');
    expect(firstSignal!.aborted).toBe(true);
    expect((await validation).stale).toBe(true);
    release();
    await waitFor(() =>
      expect(store.getFieldSnapshot('confirm')?.errors).toEqual([
        'Passwords differ',
      ]),
    );
  });

  it('uses a consistent snapshot even when a sibling is first read after an await', async () => {
    const store = createFormStore({ defaultValues: { a: 'old', b: 'value' } });
    let release!: () => void;
    const pause = new Promise<void>((resolve) => {
      release = resolve;
    });
    const seen = vi.fn();
    store.register('b', {
      rules: [
        {
          validator: async (_rule, _value, context) => {
            await pause;
            seen(context.getValue('a'));
          },
        },
      ],
    });
    const validation = store.validate();
    store.setValue('a', 'new');
    release();
    expect((await validation).stale).toBe(true);
    expect(seen).toHaveBeenCalledWith('old');
  });

  it('lets rulesKey explicitly version all rules', async () => {
    const store = createFormStore({ defaultValues: { name: 'abc' } });
    const field = store.register('name', {
      rulesKey: 'organization',
      rules: [{ min: 2 }],
    });
    await store.validate();
    field.update({ rulesKey: 'organization', rules: [{ min: 5 }] });
    expect(store.getFieldSnapshot('name')?.status).toBe('valid');
    field.update({ rulesKey: 'new rules', rules: [{ min: 5 }] });
    await waitFor(() =>
      expect(store.getFieldSnapshot('name')?.status).toBe('invalid'),
    );
  });

  it('revalidates changed external deps while retaining inline closures across unrelated commits', async () => {
    const form = createFormController({ defaultValues: { name: 'Ada' } });
    const validate = vi.fn((_value, organization: string) =>
      organization === 'first' ? undefined : 'Unavailable',
    );
    const view = render(
      <FieldFixture form={form} organization="first" validate={validate} />,
    );
    await act(async () => {
      await form.validate();
    });
    view.rerender(
      <FieldFixture form={form} organization="first" validate={validate} />,
    );
    expect(validate).toHaveBeenCalledTimes(1);
    view.rerender(
      <FieldFixture form={form} organization="second" validate={validate} />,
    );
    expect(await view.findByText('Unavailable')).toBeInTheDocument();
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('renders explicit controller errors and exposes discriminated failures', async () => {
    const error = new Error('Server refused');
    const onSubmitFailed = vi.fn();
    const form = createFormController({
      defaultValues: { name: 'Ada' },
      onSubmit: () => {
        throw error;
      },
      onSubmitFailed,
    });
    const view = render(
      <>
        <TextInput field={form.field('name')} label="Name" />
        <Form.SubmitError
          form={form}
          renderError={(value) =>
            value instanceof Error ? value.message : 'Unknown'
          }
        />
      </>,
    );
    await act(async () => {
      await form.submit();
    });
    expect(view.getByText('Server refused')).toBeInTheDocument();
    expect(onSubmitFailed).toHaveBeenCalledWith({ status: 'failed', error });
  });
});
