import { createFormStore } from './store';

describe('validation dependency lifecycle', () => {
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

  it('tracks whole-values reads and respects validate: never on dependency writes', async () => {
    const store = createFormStore({ defaultValues: { a: 1, b: 2 } });
    const validator = vi.fn((_rule, _value, context) => {
      context.getValues();
    });
    store.register('b', { rules: [{ validator }] });
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
