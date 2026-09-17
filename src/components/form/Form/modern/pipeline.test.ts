import { createFormStore } from './store';
import { rulesSignature } from './validation';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

afterEach(() => vi.useRealTimers());

describe('modern validation pipeline', () => {
  it('validates no-rule fields synchronously and keeps zero-field validity false', async () => {
    const store = createFormStore();
    expect(await store.validate()).toMatchObject({
      isValid: false,
      fields: [],
    });
    store.register('a');
    const result = store.validate();
    expect(store.getSnapshot().isValid).toBe(true);
    expect(await result).toMatchObject({ isValid: true, stale: false });
  });

  it.each(['first', 'all'] as const)(
    'orders errors by rules with policy %s',
    async (errorPolicy) => {
      const store = createFormStore({ errorPolicy });
      const first = deferred<string>();
      const second = vi.fn(() => 'second');
      store.register('a', {
        rules: [{ validator: () => first.promise }, { validator: second }],
      });
      const pending = store.validate();
      expect(store.getSnapshot().isValidating).toBe(true);
      first.resolve('first');
      const result = await pending;
      expect(result.fields[0].errors).toEqual(
        errorPolicy === 'first' ? ['first'] : ['first', 'second'],
      );
      expect(second).toHaveBeenCalledTimes(errorPolicy === 'first' ? 0 : 1);
    },
  );

  it('accepts opaque errors, synchronous validators, thrown errors, and built-in rules', async () => {
    const error = { arbitrary: 'payload' };
    const store = createFormStore({ defaultValues: { a: '' } });
    store.register('a', {
      errorPolicy: 'all',
      rules: [
        { required: true, message: error },
        {
          validator: () => {
            throw new Error('failed');
          },
        },
      ],
    });
    const result = await store.validate();
    expect(result.fields[0].errors).toEqual([error, 'failed']);
    expect(result.fields[0].errors[0]).toBe(error);
  });

  it.each([
    'value',
    'reset',
    'release',
    'rules',
    'dispose',
    'manual error',
  ] as const)(
    'settles an ignored-signal validator promptly after %s and rejects late publication',
    async (command) => {
      const store = createFormStore();
      const work = deferred<string>();
      let signal!: AbortSignal;
      const field = store.register('a', {
        rules: [
          {
            validator: (_rule, _value, context) => {
              signal = context.signal;
              return work.promise;
            },
          },
        ],
      });
      const pending = store.validate();
      await Promise.resolve();
      await Promise.resolve();
      if (command === 'value')
        store.setValue('a', 'next', { validate: 'never' });
      if (command === 'reset') store.reset();
      if (command === 'release') field.release();
      if (command === 'rules') field.update({ rules: [{ required: true }] });
      if (command === 'dispose') store.dispose();
      if (command === 'manual error') store.setFieldErrors('a', ['manual']);
      expect(await pending).toMatchObject({ stale: true, isValid: false });
      expect(signal?.aborted).toBe(true);
      const snapshot = store.getSnapshot();
      work.resolve('late');
      await Promise.resolve();
      await Promise.resolve();
      expect(store.getSnapshot()).toBe(snapshot);
    },
  );

  it('coalesces delays and removes timers on final release and reset', async () => {
    vi.useFakeTimers();
    const validate = vi.fn();
    const store = createFormStore();
    const field = store.register('a', {
      validateTrigger: 'onChange',
      validationDelay: 50,
      rules: [{ validator: validate }],
    });
    store.setValue('a', 'one');
    store.setValue('a', 'two');
    expect(vi.getTimerCount()).toBe(1);
    expect(store.getFieldSnapshot('a')?.status).toBe('validating');
    await vi.advanceTimersByTimeAsync(50);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate.mock.calls[0][1]).toBe('two');
    store.setValue('a', 'three');
    store.reset();
    expect(vi.getTimerCount()).toBe(0);
    store.setValue('a', 'four');
    field.release();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps visible errors during revalidation and clears them on a nonvalidating edit', async () => {
    const store = createFormStore();
    const work = deferred<void>();
    store.register('a', { rules: [{ validator: () => work.promise }] });
    store.setFieldErrors('a', ['visible']);
    store.setValue('a', 'next');
    expect(store.getFieldSnapshot('a')).toMatchObject({
      errors: ['visible'],
      status: 'validating',
    });
    store.setValue('a', 'skip', { validate: 'never' });
    expect(store.getFieldSnapshot('a')).toMatchObject({
      errors: [],
      status: 'unvalidated',
    });
    work.resolve();
  });

  it('does not invalidate equivalent inline rules/messages and uses the latest closure on the next run', async () => {
    const makeRule = (value: string) => ({
      validator: () => value,
      message: value,
    });
    const store = createFormStore();
    const field = store.register('a', { rules: [makeRule('first')] });
    await store.validate();
    const previous = store.getSnapshot();
    field.update({ rules: [makeRule('second')] });
    expect(store.getSnapshot()).toBe(previous);
    expect((await store.validate()).fields[0].errors).toEqual(['second']);
    field.update({
      rules: [makeRule('third')],
      rulesKey: 'new captured input',
    });
    expect(store.getFieldSnapshot('a')?.status).toBe('unvalidated');
    expect(rulesSignature([{ required: true }])).toBe(
      rulesSignature([{ required: true, message: 'new message' }]),
    );
    expect(rulesSignature([{ enum: ['a'] }])).not.toBe(
      rulesSignature([{ enum: ['b'] }]),
    );
    expect(rulesSignature([{ pattern: /a/i }])).not.toBe(
      rulesSignature([{ pattern: /a/ }]),
    );
  });

  it('restores the latest remaining duplicate rule owner and ignores stale token updates', async () => {
    const store = createFormStore();
    const first = store.register('a', {
      rules: [{ validator: () => 'first' }],
    });
    const second = store.register('a', {
      rules: [{ validator: () => 'second' }],
    });
    expect((await store.validate()).fields[0].errors).toEqual(['second']);
    first.update({ rules: [{ required: true, message: 'first updated' }] });
    expect((await store.validate()).fields[0].errors).toEqual([
      'first updated',
    ]);
    first.release();
    first.update({ rules: [] });
    expect((await store.validate()).fields[0].errors).toEqual(['second']);
    second.release();
  });

  it('validates literal and nested paths independently and invalidates parent/child races', async () => {
    const store = createFormStore({
      defaultValues: { user: { email: '' }, 'user.email': 'literal' },
    });
    store.register(['user', 'email'], { rules: [{ required: true }] });
    store.register('user.email');
    const result = await store.validate([['user', 'email']]);
    expect(result.fields.map((field) => field.name)).toEqual(['user.email']);
    expect(result.isValid).toBe(false);
    const work = deferred<string>();
    store.register(['user', 'email'], {
      rules: [{ validator: () => work.promise }],
    });
    const pending = store.validate([['user', 'email']]);
    store.setValue('user', { email: 'changed' }, { validate: 'never' });
    expect(await pending).toMatchObject({ stale: true });
    work.resolve('late');
  });
});

describe('modern callback ownership and submission', () => {
  it('submits active values by default, supports retained values, and guards duplicate submits', async () => {
    const wait = deferred<void>();
    const onSubmit = vi.fn(() => wait.promise);
    const store = createFormStore({
      defaultValues: { active: 'a', retained: 'b' },
      onSubmit,
    });
    store.register('active');
    const pending = store.submit();
    expect(store.getSnapshot().isSubmitting).toBe(true);
    expect(await store.submit()).toEqual({
      status: 'ignored',
      reason: 'submitting',
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(onSubmit).toHaveBeenCalledWith(
      { active: 'a' },
      expect.objectContaining({ include: 'active' }),
    );
    wait.resolve();
    expect(await pending).toEqual({ status: 'submitted' });
    await store.submit({ include: 'all' });
    expect(onSubmit).toHaveBeenLastCalledWith(
      { active: 'a', retained: 'b' },
      expect.objectContaining({ include: 'all' }),
    );
  });

  it('reports invalid fields without invoking onSubmit', async () => {
    const onSubmit = vi.fn();
    const onSubmitFailed = vi.fn();
    const store = createFormStore({ onSubmit, onSubmitFailed });
    store.register('a', { rules: [{ required: true, message: 'Required A' }] });
    expect(await store.submit()).toEqual({
      status: 'invalid',
      errors: { a: ['Required A'] },
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSubmitFailed).toHaveBeenCalledExactlyOnceWith({
      a: ['Required A'],
    });
    expect(store.getSnapshot().isSubmitting).toBe(false);
  });

  it('handles failure callbacks safely and follows submitError clearing rules', async () => {
    const onListenerError = vi.fn();
    const store = createFormStore({
      onSubmit: () => {
        throw 'failure';
      },
      onSubmitFailed: () => {
        throw 'reporting';
      },
      onListenerError,
    });
    store.register('a');
    expect(await store.submit()).toEqual({
      status: 'failed',
      error: 'failure',
    });
    expect(onListenerError).toHaveBeenCalledExactlyOnceWith('reporting');
    store.setValue('a', 'edit');
    expect(store.getSnapshot().submitError).toBe('failure');
    const next = store.submit();
    expect(store.getSnapshot().submitError).toBeUndefined();
    await next;
    store.reset();
    expect(store.getSnapshot().submitError).toBeUndefined();
  });

  it.each(['reset', 'dispose', 'root release'] as const)(
    'settles stale submission after %s without later failure publication',
    async (command) => {
      const work = deferred<void>();
      let signal!: AbortSignal;
      const store = createFormStore({
        onSubmit: (_values, context) => {
          signal = context.signal;
          return work.promise;
        },
      });
      const binding = store.bindCallbacks({});
      store.register('a');
      const pending = store.submit();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      if (command === 'reset') store.reset();
      if (command === 'dispose') store.dispose();
      if (command === 'root release') binding.release();
      expect(await pending).toEqual({ status: 'stale' });
      expect(signal.aborted).toBe(true);
      const snapshot = store.getSnapshot();
      work.reject('late failure');
      await Promise.resolve();
      await Promise.resolve();
      expect(store.getSnapshot()).toBe(snapshot);
    },
  );

  it('replaces/removes bindings, protects a new owner from stale cleanup, and reports duplicate roots', async () => {
    const defaults = vi.fn();
    const first = vi.fn();
    const second = vi.fn();
    const warning = vi.fn();
    const store = createFormStore({
      onValuesChange: defaults,
      onDevelopmentError: warning,
    });
    const one = store.bindCallbacks({ onValuesChange: first });
    store.setValue('a', 1, { notify: true });
    expect(first).toHaveBeenCalledTimes(1);
    one.update({});
    store.setValue('a', 2, { notify: true });
    expect(defaults).toHaveBeenCalledTimes(1);
    const two = store.bindCallbacks({ onValuesChange: second });
    one.release();
    one.update({ onValuesChange: first });
    store.setValue('a', 3, { notify: true });
    expect(second).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledTimes(1);
    two.update({ onValuesChange: undefined });
    store.setValue('a', 4, { notify: true });
    expect(defaults).toHaveBeenCalledTimes(1);
    two.release();
    store.setValue('a', 5, { notify: true });
    expect(defaults).toHaveBeenCalledTimes(2);
  });

  it('cancels pending submission validation on root unmount and clears owned timers', async () => {
    vi.useFakeTimers();
    const store = createFormStore();
    store.register('a', {
      validationDelay: 100,
      rules: [{ validator: () => new Promise(() => {}) }],
    });
    const binding = store.bindCallbacks({});
    const pending = store.submit();
    binding.release();
    expect(await pending).toEqual({ status: 'stale' });
    expect(store.getSnapshot().isValidating).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
