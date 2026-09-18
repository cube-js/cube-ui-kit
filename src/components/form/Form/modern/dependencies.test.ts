import { createFormStore } from './store';

describe('validation dependency lifecycle', () => {
  it.each([undefined, [], ['org-1']])(
    'revalidates a replacement validator with deps %j',
    async (deps) => {
      const store = createFormStore({ defaultValues: { a: 'value' } });
      const registration = store.register('a', {
        deps,
        rules: [{ validator: () => 'Strict error' }],
      });
      await store.validate();
      expect(store.getFieldSnapshot('a')?.errors).toEqual(['Strict error']);
      registration.update({ deps, rules: [{ validator: () => undefined }] });
      await vi.waitFor(() => {
        expect(store.getFieldSnapshot('a')?.status).toBe('valid');
        expect(store.getFieldSnapshot('a')?.errors).toEqual([]);
      });
    },
  );

  it.each(['', 'revision'])(
    'versions functions explicitly without serializing them (rulesKey: %j)',
    async (rulesKey) => {
      const store = createFormStore({ defaultValues: { a: 'value' } });
      const validate = () => 'Strict error';
      const source = vi.spyOn(validate, 'toString');
      const registration = store.register('a', {
        rulesKey,
        rules: [{ validator: validate }],
      });
      await store.validate();
      const snapshot = store.getFieldSnapshot('a');
      registration.update({
        rulesKey,
        rules: [{ validator: () => undefined }],
      });
      expect(store.getFieldSnapshot('a')).toBe(snapshot);
      expect(source).not.toHaveBeenCalled();
      registration.update({
        rulesKey: `${rulesKey}:next`,
        rules: [{ validator: () => undefined }],
      });
      await vi.waitFor(() =>
        expect(store.getFieldSnapshot('a')?.status).toBe('valid'),
      );
    },
  );

  it.each([false, true])(
    'only declared dependencies rerun validation, even after a short circuit (declared: %s)',
    async (declared) => {
      const store = createFormStore({
        defaultValues: { password: 'first', confirm: '' },
      });
      const validator = vi.fn((_rule, value, context) => {
        if (!value) return 'Required';
        return value === context.getValue('password') ? undefined : 'Mismatch';
      });
      store.register('confirm', {
        dependsOn: declared ? ['password'] : undefined,
        rules: [{ validator }],
      });
      await store.validate();
      store.setValue('password', 'second');
      if (declared)
        await vi.waitFor(() => expect(validator).toHaveBeenCalledTimes(2));
      else expect(validator).toHaveBeenCalledTimes(1);
      store.setValue('confirm', 'second', { validate: 'never' });
      await store.validate();
      validator.mockClear();
      store.setValue('password', 'third');
      if (declared) {
        await vi.waitFor(() =>
          expect(store.getFieldSnapshot('confirm')?.errors).toEqual([
            'Mismatch',
          ]),
        );
        expect(validator).toHaveBeenCalledTimes(1);
      } else {
        expect(validator).not.toHaveBeenCalled();
        expect(store.getFieldSnapshot('confirm')?.status).toBe('valid');
      }
    },
  );

  it('cancels a changed read without scheduling an undeclared dependent run', async () => {
    const store = createFormStore({
      defaultValues: { source: 1, dependent: 2 },
    });
    const validator = vi.fn((_rule, _value, context) => {
      context.getValues();
      return new Promise<void>(() => {});
    });
    const registration = store.register('dependent', {
      rules: [{ validator }],
    });
    const pending = store.validate();
    await vi.waitFor(() => expect(validator).toHaveBeenCalledTimes(1));
    store.setValue('source', 3);
    expect((await pending).stale).toBe(true);
    expect(store.getFieldSnapshot('dependent')?.status).toBe('unvalidated');
    expect(validator).toHaveBeenCalledTimes(1);
    registration.release();
    const retained = store.getFieldSnapshot('dependent');
    store.setValue('source', 4);
    expect(store.getFieldSnapshot('dependent')).toBe(retained);
  });

  it('reports only changed values when defaults invalidate a dependent field', async () => {
    const onValuesChange = vi.fn();
    const store = createFormStore({
      defaultValues: { source: 'old', dependent: 'same' },
      onValuesChange,
    });
    store.register('dependent', {
      dependsOn: ['source'],
      rules: [{ required: true }],
    });
    await store.validate();
    store.adoptDefaultValues(
      { source: 'new', dependent: 'same' },
      { when: 'always' },
    );
    expect(store.getFieldSnapshot('dependent')?.status).toBe('unvalidated');
    expect(onValuesChange).toHaveBeenCalledExactlyOnceWith(
      { source: 'new', dependent: 'same' },
      { names: ['source'], source: 'program', kind: 'adopt' },
    );
  });

  it.each(['adoption', 'release'] as const)(
    'cancels a sibling validator after %s',
    async (operation) => {
      const store = createFormStore({
        defaultValues: { source: 'old', dependent: 'value' },
      });
      const source = store.register('source', { preserve: false });
      let start!: () => void;
      const started = new Promise<void>((resolve) => {
        start = resolve;
      });
      let signal!: AbortSignal;
      store.register('dependent', {
        rules: [
          {
            validator: (_rule, _value, context) => {
              signal = context.signal;
              context.getValue('source');
              start();
              return new Promise<void>(() => {});
            },
          },
        ],
      });
      const pending = store.validate(['dependent']);
      await started;
      const originalSignal = signal;
      if (operation === 'adoption')
        store.adoptDefaultValues(
          { source: 'new', dependent: 'value' },
          { when: 'always' },
        );
      else source.release();
      expect(originalSignal.aborted).toBe(true);
      expect((await pending).stale).toBe(true);
      store.dispose();
    },
  );

  it('respects validate: never on declared dependency writes', async () => {
    const store = createFormStore({ defaultValues: { a: 1, b: 2 } });
    const validator = vi.fn((_rule, _value, context) => {
      context.getValues();
    });
    store.register('b', { dependsOn: ['a'], rules: [{ validator }] });
    await store.validate();
    store.setValue('a', 3, { validate: 'never' });
    expect(store.getFieldSnapshot('b')?.status).toBe('unvalidated');
    expect(validator).toHaveBeenCalledTimes(1);
  });

  it('uses declared dependencies before a pending validator reads them', async () => {
    const store = createFormStore({
      defaultValues: { source: 'old', dependent: '' },
    });
    store.register('dependent', {
      dependsOn: ['source'],
      rules: [{ validator: () => new Promise<void>(() => {}) }],
    });
    const pending = store.validate();
    store.setValue('source', 'new', { validate: 'never' });
    expect((await pending).stale).toBe(true);
    store.dispose();
  });
});
