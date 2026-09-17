import { createFormStore } from './store';

function brokenValue() {
  return {
    get value(): never {
      throw new Error('input failed');
    },
  };
}

function brokenErrors(): string[] {
  return Object.defineProperty(new Array(1), '0', {
    get() {
      throw new Error('errors failed');
    },
  });
}

describe('modern command exception safety', () => {
  it('reads value command options before writing a value', () => {
    const store = createFormStore({ defaultValues: { a: 1 } });
    const before = store.getSnapshot();
    const options = {
      get touch(): never {
        throw new Error('options failed');
      },
    };
    expect(() => store.setValue('a', 2, options)).toThrow('options failed');
    expect(() => store.setValues({ a: 2 }, options)).toThrow('options failed');
    expect(store.getSnapshot()).toBe(before);
  });

  it('reads default command options before replacing the baseline', () => {
    const store = createFormStore({ defaultValues: { a: 1 } });
    const before = store.getSnapshot();
    const options = {
      get currentValues(): never {
        throw new Error('options failed');
      },
    };
    expect(() => store.setDefaultValues({ a: 2 }, options)).toThrow(
      'options failed',
    );
    expect(store.getSnapshot()).toBe(before);
  });

  it('preflights all setValues inputs before changing any field', () => {
    const store = createFormStore<{ a: number; b: object }>({
      defaultValues: { a: 1, b: {} },
    });
    const before = store.getSnapshot();
    expect(() => store.setValues({ a: 2, b: brokenValue() })).toThrow(
      'input failed',
    );
    expect(store.getSnapshot()).toBe(before);
    expect(store.getValues()).toEqual({ a: 1, b: {} });
  });

  it('does not create a field when a setValue input cannot be snapshotted', () => {
    const store = createFormStore();
    const before = store.getSnapshot();
    expect(() => store.setValue('a', brokenValue())).toThrow('input failed');
    expect(store.getSnapshot()).toBe(before);
    expect(store.getFieldSnapshot('a')).toBeUndefined();
  });

  it('does not leak a registration when a field default cannot be snapshotted', () => {
    const store = createFormStore();
    const before = store.getSnapshot();
    expect(() => store.register('a', { defaultValue: brokenValue() })).toThrow(
      'input failed',
    );
    expect(store.debug.registrationCount()).toBe(0);
    expect(store.getSnapshot()).toBe(before);
    expect(store.getActiveValues()).toEqual({});
  });

  it('leaves ownership and validation intact when a registration update is rejected', () => {
    const store = createFormStore();
    const first = store.register('a');
    store.register('a');
    const pending = store.startValidation('a');
    const before = store.getSnapshot();
    expect(() => first.update({ defaultValue: brokenValue() })).toThrow(
      'input failed',
    );
    expect(store.getSnapshot()).toBe(before);
    expect(pending.signal.aborted).toBe(false);
    first.update({ defaultValue: 'valid input' });
    expect(store.getValue('a')).toBe('valid input');
  });

  it('does not cancel validation when manual errors cannot be copied', () => {
    const store = createFormStore();
    store.register('a');
    const pending = store.startValidation('a');
    const before = store.getSnapshot();
    expect(() => store.setFieldErrors('a', brokenErrors())).toThrow(
      'errors failed',
    );
    expect(store.getSnapshot()).toBe(before);
    expect(pending.signal.aborted).toBe(false);
    expect(pending.complete([])).toBe(true);
  });

  it('keeps a validation token usable after a rejected completion payload', () => {
    const store = createFormStore();
    store.register('a');
    const pending = store.startValidation('a');
    const before = store.getSnapshot();
    expect(() => pending.complete(brokenErrors())).toThrow('errors failed');
    expect(store.getSnapshot()).toBe(before);
    expect(pending.complete([])).toBe(true);
  });

  it('keeps a submission token usable after a rejected completion payload', () => {
    const store = createFormStore();
    const pending = store.startSubmission()!;
    const before = store.getSnapshot();
    const result = {
      get error(): never {
        throw new Error('result failed');
      },
    };
    expect(() => pending.complete(result)).toThrow('result failed');
    expect(store.getSnapshot()).toBe(before);
    expect(pending.complete()).toBe(true);
  });

  it('keeps prior explicit batch writes while rejecting one malformed command', () => {
    const store = createFormStore();
    store.batch(() => {
      store.setValue('first', 1);
      expect(() =>
        store.setValues({ second: 2, third: brokenValue() }),
      ).toThrow('input failed');
      store.setValue('last', 4);
    });
    expect(store.getValues()).toEqual({ first: 1, last: 4 });
  });
});
