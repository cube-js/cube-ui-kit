import { FORM_BACKEND, isModernFormController } from '../backend';

import { createFormStore } from './store';
import { formValueEqual, getFieldKey } from './values';

describe('modern store: phase 2 value and ownership conformance', () => {
  it('seeds retained values before registration, with a stable branded identity', () => {
    const store = createFormStore({ defaultValues: { a: 1, b: null } });
    expect(store[FORM_BACKEND]).toBe('modern');
    expect(isModernFormController(store)).toBe(true);
    expect(store.getValues()).toEqual({ a: 1, b: null });
    expect(store.getActiveValues()).toEqual({});
    expect(store.getSnapshot()).toBe(store.getSnapshot());
    expect(Object.isFrozen(store)).toBe(true);
  });

  it('sets values before registration and shares only active values', () => {
    const store = createFormStore();
    store.setValues({ a: 1, b: 2 });
    const a = store.register('a');
    const b = store.register('b');
    b.release();
    expect(store.getValues()).toEqual({ a: 1, b: 2 });
    expect(store.getActiveValues()).toEqual({ a: 1 });
    expect(store.getFieldSnapshot('b')?.active).toBe(false);
    store.register('b');
    expect(store.getActiveValues()).toEqual({ a: 1, b: 2 });
    a.release();
  });

  it('lets controller defaults, including explicit undefined and null, win', () => {
    const store = createFormStore({ defaultValues: { a: null, b: undefined } });
    store.register('a', { defaultValue: 'fallback' });
    store.register('b', { defaultValue: 'fallback' });
    store.setValue('c', 3);
    store.register('c', { defaultValue: 4 });
    expect(store.getValues()).toEqual({ a: null, b: undefined, c: 3 });
    expect(store.getSnapshot().defaultValues).toEqual({
      a: null,
      b: undefined,
    });
  });

  it('seeds the first options carrying a default, but never reapplies later props', () => {
    const store = createFormStore();
    const token = store.register('a');
    token.update({ defaultValue: 'first' });
    token.update({ defaultValue: 'second' });
    expect(store.getValue('a')).toBe('first');
    store.setValue('a', 'edited');
    store.reset();
    expect(store.getValue('a')).toBe('first');
  });

  it('reports conflicting duplicate field defaults and retains the first', () => {
    const onDevelopmentError = vi.fn();
    const store = createFormStore({ onDevelopmentError });
    store.register('a', { defaultValue: 'first' });
    store.register('a', { defaultValue: 'second' });
    expect(onDevelopmentError).toHaveBeenCalledWith(
      expect.stringContaining('conflicting defaultValue'),
    );
    expect(store.getValue('a')).toBe('first');
  });

  it('does not report controller precedence as a duplicate-default conflict', () => {
    const onDevelopmentError = vi.fn();
    const store = createFormStore({
      defaultValues: { a: null },
      onDevelopmentError,
    });
    store.register('a', { defaultValue: 'first' });
    store.register('a', { defaultValue: 'second' });
    expect(onDevelopmentError).not.toHaveBeenCalled();
  });

  it('duplicates share a value until the final release, which controls preservation', () => {
    const store = createFormStore();
    const first = store.register('a', { preserve: false });
    const second = store.register('a', { preserve: false });
    store.setValue('a', 'typed');
    first.release();
    expect(store.getFieldSnapshot('a')?.registrationCount).toBe(1);
    expect(store.getValue('a')).toBe('typed');
    second.release();
    expect(store.getValues()).toEqual({});
    expect(store.getFieldSnapshot('a')).toBeUndefined();
    expect(store.debug.registrationCount()).toBe(0);
  });

  it('never lets a released token update or release a newer registration', () => {
    const store = createFormStore();
    const stale = store.register('a', { preserve: false });
    stale.release();
    const fresh = store.register('a');
    stale.update({ defaultValue: 'stale' });
    stale.release();
    expect(fresh.released).toBe(false);
    expect(store.getFieldSnapshot('a')?.registrationCount).toBe(1);
    expect(store.getValue('a')).toBeUndefined();
    fresh.release();
    expect(store.debug.registrationCount()).toBe(0);
  });

  it('keeps equivalent registration updates silent', () => {
    const store = createFormStore();
    const token = store.register('a', { defaultValue: 1 });
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();
    token.update({ defaultValue: 1 });
    token.update({ defaultValue: 2 });
    expect(store.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it('restores the latest remaining registration comparator when its owner releases', () => {
    const store = createFormStore({ defaultValues: { a: 1 } });
    const first = store.register('a', { isEqual: () => true });
    const second = store.register('a');
    store.setValue('a', 2);
    expect(store.getSnapshot().isDirty).toBe(true);
    first.update({ isEqual: () => true });
    expect(store.getSnapshot().isDirty).toBe(false);
    first.release();
    expect(store.getSnapshot().isDirty).toBe(true);
    second.release();
  });
});

describe('immutable snapshots and selector subscriptions', () => {
  it('preserves the identity of unaffected fields, values, and membership sets', () => {
    const store = createFormStore({ defaultValues: { a: 1, b: { x: 2 } } });
    store.register('a');
    store.register('b');
    const initial = store.getSnapshot();
    store.setValue('a', 10);
    const first = store.getSnapshot();
    expect(first.fields.b).toBe(initial.fields.b);
    expect(first.values.b).toBe(initial.values.b);
    store.setValue('a', 11);
    const second = store.getSnapshot();
    expect(second.dirtyFields).toBe(first.dirtyFields);
    store.touch('a');
    expect(store.getSnapshot().values).toBe(second.values);
    expect(store.getSnapshot().activeValues).toBe(second.activeValues);
    expect(store.getSnapshot().defaultValues).toBe(initial.defaultValues);
    expect(initial.values.a).toBe(1);
    expect(first.values.a).toBe(10);
  });

  it('keeps active values stable when an inactive retained value changes', () => {
    const store = createFormStore({ defaultValues: { a: 1, b: 2 } });
    store.register('a');
    const active = store.getSnapshot().activeValues;
    store.setValue('b', 3);
    expect(store.getSnapshot().activeValues).toBe(active);
  });

  it('does not publish for equal commands', () => {
    const store = createFormStore({ defaultValues: { a: 1 } });
    const initial = store.getSnapshot();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setValue('a', 1);
    store.clearSubmitError();
    store.batch(() => {});
    expect(store.getSnapshot()).toBe(initial);
    expect(listener).not.toHaveBeenCalled();
  });

  it('owns plain data without freezing the caller, and makes membership sets immutable', () => {
    const original = { a: { nested: { value: 1 } } };
    const store = createFormStore({ defaultValues: original });
    original.a.nested.value = 2;
    const initial = store.getSnapshot();
    expect(initial.values.a?.nested.value).toBe(1);
    expect(Object.isFrozen(original.a)).toBe(false);
    expect(() => {
      initial.values.a!.nested.value = 3;
    }).toThrow();
    expect(() => {
      (initial.fields as Record<string, unknown>).a = {};
    }).toThrow();
    store.touch('a');
    const touched = store.getSnapshot().touchedFields;
    expect('add' in touched).toBe(false);
    expect(() => Set.prototype.add.call(touched, 'b')).toThrow();
    touched.forEach((_value, _key, set) => {
      expect(set).toBe(touched);
    });
    expect([...initial.touchedFields]).toEqual([]);
  });

  it('uses one-level array/plain-object equality, with opaque values by identity', () => {
    const date = new Date();
    const store = createFormStore({
      defaultValues: { array: [1, 2], obj: { a: 1 }, date },
    });
    store.setValues({ array: [1, 2], obj: { a: 1 }, date });
    expect(store.getSnapshot().isDirty).toBe(false);
    store.setValue('date', new Date(date));
    expect(store.getFieldSnapshot('date')?.dirty).toBe(true);
    expect(formValueEqual(new Array(1), [])).toBe(false);
    expect(formValueEqual({ a: undefined }, {})).toBe(false);
  });

  it('notifies a selector only when its selection changes, including allocating selectors', () => {
    const store = createFormStore({ defaultValues: { a: 1, b: 2 } });
    const valueListener = vi.fn();
    const flagListener = vi.fn();
    store.subscribeSelector((state) => state.values.a, valueListener);
    store.subscribeSelector(
      (state) => ({ dirty: state.isDirty }),
      flagListener,
      formValueEqual,
    );
    store.setValue('b', 3);
    expect(valueListener).not.toHaveBeenCalled();
    expect(flagListener).toHaveBeenCalledTimes(1);
    store.setValue('b', 4);
    expect(flagListener).toHaveBeenCalledTimes(1);
    store.setValue('a', 10);
    expect(valueListener).toHaveBeenCalledWith(10, 1);
  });

  it('changes dirty membership even when aggregate dirtiness remains true', () => {
    const store = createFormStore({ defaultValues: { a: 1, b: 2 } });
    store.setValues({ a: 10, b: 20 });
    const before = store.getSnapshot();
    store.setValue('a', 1);
    expect(store.getSnapshot().isDirty).toBe(true);
    expect([...store.getSnapshot().dirtyFields]).toEqual(['b']);
    expect([...before.dirtyFields]).toEqual(['a', 'b']);
  });
});

describe('atomic commands, callbacks, and reentrancy', () => {
  it('publishes once per nested transaction and aggregates change callbacks', () => {
    const onValuesChange = vi.fn();
    const store = createFormStore({ onValuesChange });
    const listener = vi.fn();
    store.subscribe(listener);
    store.batch(() => {
      store.setValue('a', 1, { source: 'user' });
      store.batch(() => {
        store.setValues({ b: 2, c: 3 }, { notify: true });
      });
      expect(store.getValue('b')).toBe(2);
      expect(store.getSnapshot().values).toEqual({});
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith(
      { a: 1, b: 2, c: 3 },
      { names: ['a', 'b', 'c'], source: 'user', kind: 'set' },
    );
  });

  it('programmatic writes are silent unless requested and user writes touch', () => {
    const onValuesChange = vi.fn();
    const store = createFormStore({ onValuesChange });
    store.setValue('a', 1);
    expect(store.getSnapshot().isTouched).toBe(false);
    expect(onValuesChange).not.toHaveBeenCalled();
    store.setValue('a', 2, { source: 'user', notify: false });
    expect(store.getSnapshot().isTouched).toBe(true);
    expect(onValuesChange).not.toHaveBeenCalled();
    store.setValue('a', 3, { notify: true });
    expect(onValuesChange).toHaveBeenCalledTimes(1);
  });

  it('finishes delivery of the original snapshot before publishing reentrant writes', () => {
    const events: unknown[] = [];
    const store = createFormStore({
      onValuesChange: (values) => {
        events.push(['callback', values.a]);
      },
    });
    store.subscribe(() => {
      events.push(['first', store.getSnapshot().values.a]);
      if (store.getValue('a') === 1) store.setValue('a', 2, { notify: true });
    });
    store.subscribe(() => {
      events.push(['second', store.getSnapshot().values.a]);
    });
    store.setValue('a', 1, { notify: true });
    expect(events).toEqual([
      ['first', 1],
      ['second', 1],
      ['callback', 1],
      ['first', 2],
      ['second', 2],
      ['callback', 2],
    ]);
  });

  it('supports unsubscribe during delivery and independent identical callback registrations', () => {
    const store = createFormStore();
    const listener = vi.fn();
    const one = store.subscribe(listener);
    const two = store.subscribe(listener);
    one();
    store.setValue('a', 1);
    expect(listener).toHaveBeenCalledTimes(1);
    two();
    let release = () => {};
    store.subscribe(() => {
      release();
    });
    release = store.subscribe(listener);
    store.setValue('a', 2);
    expect(listener).toHaveBeenCalledTimes(1);
    release();
    store.dispose();
    expect(store.debug.listenerCount()).toBe(0);
  });

  it('contains listener, selector, and async callback failures', async () => {
    const error = new Error('failure');
    const onListenerError = vi.fn();
    const store = createFormStore({
      onListenerError,
      onValuesChange: async () => {
        throw error;
      },
    });
    store.subscribe(() => {
      throw error;
    });
    store.subscribeSelector(
      (state) => {
        if (state.isDirty) throw error;
        return false;
      },
      () => {},
    );
    const later = vi.fn();
    store.subscribe(later);
    store.setValue('a', 1, { notify: true });
    await Promise.resolve();
    expect(later).toHaveBeenCalledTimes(1);
    expect(onListenerError).toHaveBeenCalledTimes(3);
    expect(store.getValue('a')).toBe(1);
  });

  it('commits completed writes after a throwing transaction and remains usable', () => {
    const store = createFormStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(() =>
      store.batch(() => {
        store.setValue('a', 1);
        throw new Error('stop');
      }),
    ).toThrow('stop');
    expect(store.getSnapshot().values).toEqual({ a: 1 });
    store.setValue('b', 2);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('defaults, adoption, and reset', () => {
  it('replaces only the baseline by default, including removed defaults', () => {
    const store = createFormStore({ defaultValues: { a: 1, removed: 2 } });
    store.setValue('a', 3, { source: 'user' });
    store.setDefaultValues({ a: 3 });
    expect(store.getValues()).toEqual({ a: 3, removed: 2 });
    expect(store.getSnapshot().defaultValues).toEqual({ a: 3 });
    expect(store.getFieldSnapshot('a')?.dirty).toBe(false);
    expect(store.getSnapshot().isTouched).toBe(true);
    store.reset();
    expect(store.getValues()).toEqual({ a: 3 });
  });

  it('replaces defaults and current values atomically, clearing field metadata', () => {
    const onValuesChange = vi.fn();
    const store = createFormStore({ defaultValues: { a: 1 }, onValuesChange });
    store.touch('a');
    store.setFieldErrors('a', ['error']);
    store.setSubmitError('submit');
    const listener = vi.fn();
    store.subscribe(listener);
    store.setDefaultValues({ a: 2 }, { currentValues: 'replace' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toMatchObject({
      values: { a: 2 },
      defaultValues: { a: 2 },
      isDirty: false,
      isTouched: false,
      submitError: 'submit',
    });
    expect(store.getFieldSnapshot('a')).toMatchObject({
      errors: [],
      status: 'unvalidated',
    });
    expect(onValuesChange.mock.lastCall?.[1].kind).toBe('defaults');
  });

  it.each(['untouched', 'clean', 'always'] as const)(
    'adopts defaults with the %s guard',
    (when) => {
      const store = createFormStore({ defaultValues: { a: 1, b: 2 } });
      store.setValue('a', 10, { source: 'user' });
      store.adoptDefaultValues({ a: 100, b: 200 }, { when });
      expect(store.getValues()).toEqual({
        a: when === 'always' ? 100 : 10,
        b: 200,
      });
      expect(store.getSnapshot().defaultValues).toEqual({ a: 100, b: 200 });
    },
  );

  it('distinguishes a touched clean field from an untouched dirty field', () => {
    const store = createFormStore({ defaultValues: { a: 1, b: 2 } });
    store.touch('a');
    store.setValue('b', 20);
    store.adoptDefaultValues({ a: 100, b: 200 });
    expect(store.getValues()).toEqual({ a: 1, b: 200 });
    store.adoptDefaultValues(
      { a: 1000, b: 2000 },
      { when: 'always', preserveDirty: true },
    );
    expect(store.getValues()).toEqual({ a: 1, b: 2000 });
  });

  it('resets baseline and values together, dropping unseeded retained fields', () => {
    const store = createFormStore({ defaultValues: { a: 1, old: 2 } });
    store.register('a');
    store.setValue('extra', 'temporary', { source: 'user' });
    store.setFieldErrors('a', ['error']);
    store.setSubmitError('submit error');
    const listener = vi.fn();
    store.subscribe(listener);
    store.reset({ values: { a: null } as unknown as { a: number } });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getValues()).toEqual({ a: null });
    expect(store.getSnapshot().defaultValues).toEqual({ a: null });
    expect(store.getFieldSnapshot('extra')).toBeUndefined();
    expect(store.getSnapshot()).toMatchObject({
      isDirty: false,
      isTouched: false,
      submitError: undefined,
    });
    store.setValue('a', 3);
    store.reset();
    expect(store.getValue('a')).toBeNull();
  });
});

describe('nested paths and dynamic names', () => {
  it('retains literal names, including dots, whitespace, backslashes, and numeric strings', () => {
    const store = createFormStore();
    const names = [
      'CUBEJS_DB_HOST',
      'nested.path.value',
      'with space',
      '0',
      'with\\slash',
      '',
    ];
    names.forEach((name, index) => {
      store.register(name);
      store.setValue(name, index);
    });
    expect(Object.keys(store.getActiveValues()).sort()).toEqual(names.sort());
    expect(store.getValue('nested.path.value')).toBe(1);
    expect(getFieldKey('nested.path.value')).not.toBe(
      getFieldKey(['nested', 'path', 'value']),
    );
  });

  it('updates nested object/array paths while preserving unrelated ancestors', () => {
    const store = createFormStore({
      defaultValues: {
        user: { first: 'A', last: 'B' },
        rows: [{ id: 1 }, { id: 2 }],
      },
    });
    store.register(['user', 'first']);
    store.register(['rows', 1, 'id']);
    const before = store.getSnapshot();
    store.setValue(['rows', 1, 'id'], 20);
    const after = store.getSnapshot();
    expect(after.values.user).toBe(before.values.user);
    expect(after.values.rows?.[0]).toBe(before.values.rows?.[0]);
    expect(before.values.rows?.[1].id).toBe(2);
    expect(after.values.rows?.[1].id).toBe(20);
    expect(store.getActiveValues()).toEqual({
      user: { first: 'A' },
      rows: Object.assign(new Array(2), { 1: { id: 20 } }),
    });
    expect(store.getFieldSnapshot(['rows', 1, 'id'])?.dirty).toBe(true);
  });

  it('creates arrays, deletes without shifting indices, and retains inactive siblings', () => {
    const store = createFormStore();
    const token = store.register(['rows', 0, 'value'], { preserve: false });
    store.setValue(['rows', 0, 'value'], 1);
    store.setValue(['rows', 1, 'value'], 2);
    token.release();
    expect(store.getValue(['rows', 1, 'value'])).toBe(2);
    expect(store.getValue(['rows', 0, 'value'])).toBeUndefined();
    expect(store.getActiveValues()).toEqual({});
  });

  it('preserves a touched nested leaf when adopting a new parent object', () => {
    const store = createFormStore({
      defaultValues: { user: { first: 'A', last: 'B' } },
    });
    store.register(['user', 'first']);
    store.setValue(['user', 'first'], 'edit', { source: 'user' });
    store.adoptDefaultValues({ user: { first: 'server', last: 'new' } });
    expect(store.getValues()).toEqual({ user: { first: 'edit', last: 'new' } });
    expect(store.getSnapshot().defaultValues).toEqual({
      user: { first: 'server', last: 'new' },
    });
  });

  it('includes the complete object when a parent itself is active', () => {
    const store = createFormStore({
      defaultValues: { user: { first: 'A', last: 'B' } },
    });
    const parent = store.register('user');
    store.register(['user', 'first']);
    expect(store.getActiveValues()).toEqual(store.getValues());
    parent.release();
    expect(store.getActiveValues()).toEqual({ user: { first: 'A' } });
  });

  it('rejects unsafe paths and validates multi-field commands before any write', () => {
    const store = createFormStore();
    expect(() => store.setValue(['__proto__', 'polluted'], true)).toThrow(
      'Unsafe',
    );
    expect(() => store.register(['a', 'constructor', 'prototype'])).toThrow(
      'Unsafe',
    );
    expect(() => store.setValue([], 1)).toThrow('empty');
    expect(() => store.setValue(['rows', -1], 1)).toThrow('non-negative');
    expect(() =>
      store.setValues(
        Object.fromEntries([
          ['a', 1],
          ['__proto__', {}],
        ]),
      ),
    ).toThrow('Unsafe');
    expect(store.getValues()).toEqual({});
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('validation/submission state and lifecycle', () => {
  it('derives validity from active fields, and is not valid with zero active fields', () => {
    const store = createFormStore();
    expect(store.getSnapshot().isValid).toBe(false);
    const a = store.register('a');
    expect(store.getSnapshot()).toMatchObject({
      isValid: false,
      isInvalid: false,
    });
    const validation = store.startValidation('a');
    expect(store.getSnapshot().isValidating).toBe(true);
    expect(validation.complete([])).toBe(true);
    expect(store.getSnapshot().isValid).toBe(true);
    store.setFieldErrors('inactive', ['ignored by active validity']);
    expect(store.getSnapshot()).toMatchObject({
      isValid: true,
      isInvalid: false,
    });
    a.release();
    expect(store.getSnapshot().isValid).toBe(false);
  });

  it('retains visible errors while revalidating and clears them on an unvalidated edit', () => {
    const store = createFormStore();
    store.register('a');
    const errorNode = Object.freeze({
      type: 'span',
      props: { children: 'error' },
    });
    store.setFieldErrors('a', [errorNode]);
    const validation = store.startValidation('a');
    expect(store.getFieldSnapshot('a')).toMatchObject({
      errors: [errorNode],
      status: 'validating',
    });
    expect(store.getFieldSnapshot('a')?.errors[0]).toBe(errorNode);
    store.setValue('a', 'edited');
    expect(validation.signal.aborted).toBe(true);
    expect(validation.complete(['stale'])).toBe(false);
    expect(store.getFieldSnapshot('a')).toMatchObject({
      errors: [],
      status: 'unvalidated',
    });
  });

  it.each(['reset', 'release', 'replace', 'new run', 'dispose'] as const)(
    'rejects stale validation after %s',
    (operation) => {
      const store = createFormStore();
      const field = store.register('a');
      const validation = store.startValidation('a');
      if (operation === 'reset') store.reset();
      if (operation === 'release') field.release();
      if (operation === 'replace')
        store.setDefaultValues({ a: 2 }, { currentValues: 'replace' });
      if (operation === 'new run') store.startValidation('a');
      if (operation === 'dispose') store.dispose();
      expect(validation.signal.aborted).toBe(true);
      expect(validation.complete(['stale'])).toBe(false);
    },
  );

  it('invalidates nested validation on parent replacement and the reverse', () => {
    const store = createFormStore({ defaultValues: { user: { first: 'A' } } });
    store.register('user');
    store.register(['user', 'first']);
    const child = store.startValidation(['user', 'first']);
    store.setValue('user', { first: 'B' });
    expect(child.complete([])).toBe(false);
    const parent = store.startValidation('user');
    store.setValue(['user', 'first'], 'C');
    expect(parent.complete([])).toBe(false);
  });

  it('guards duplicate submissions and prevents late completion after reset', () => {
    const store = createFormStore();
    store.setSubmitError('previous');
    const first = store.startSubmission()!;
    expect(store.getSnapshot()).toMatchObject({
      isSubmitting: true,
      submitError: undefined,
    });
    expect(store.startSubmission()).toBeUndefined();
    store.reset();
    const second = store.startSubmission()!;
    expect(first.signal.aborted).toBe(true);
    expect(first.complete({ error: 'stale' })).toBe(false);
    expect(store.getSnapshot().isSubmitting).toBe(true);
    expect(second.complete({ error: 'failed' })).toBe(true);
    expect(store.getSnapshot()).toMatchObject({
      isSubmitting: false,
      submitError: 'failed',
    });
    store.setValue('a', 1);
    expect(store.getSnapshot().submitError).toBe('failed');
    store.clearSubmitError();
    expect(store.getSnapshot().submitError).toBeUndefined();
  });

  it('releases all listeners and registrations on disposal and blocks new commands', () => {
    const store = createFormStore();
    const field = store.register('a');
    const unlisten = store.subscribe(() => {});
    const validation = store.startValidation('a');
    const submission = store.startSubmission()!;
    store.dispose();
    store.dispose();
    field.release();
    field.update({ defaultValue: 'stale' });
    unlisten();
    expect(field.released).toBe(true);
    expect(store.debug.listenerCount()).toBe(0);
    expect(store.debug.registrationCount()).toBe(0);
    expect(validation.signal.aborted).toBe(true);
    expect(submission.signal.aborted).toBe(true);
    expect(store.getSnapshot()).toMatchObject({
      isSubmitting: false,
      isValidating: false,
      activeValues: {},
    });
    expect(() => store.setValue('a', 2)).toThrow('disposed');
    expect(() => store.register('b')).toThrow('disposed');
    expect(() => store.subscribe(() => {})).toThrow('disposed');
  });
});

describe('store boundary regressions', () => {
  it('never mistakes Object prototype properties for existing fields', () => {
    const store = createFormStore();
    expect(store.getFieldSnapshot('toString')).toBeUndefined();
    expect(store.getSnapshot().fields.toString).toBeUndefined();
    store.register('toString');
    store.setValue('toString', 'value');
    expect(store.getFieldSnapshot('toString')?.value).toBe('value');
  });

  it('preserves only an edited nested leaf when preserveDirty is requested', () => {
    const store = createFormStore({
      defaultValues: { user: { first: 'A', last: 'B' } },
    });
    store.register(['user', 'first']);
    store.setValue(['user', 'first'], 'edit');
    store.adoptDefaultValues(
      { user: { first: 'server', last: 'new' } },
      { when: 'always', preserveDirty: true },
    );
    expect(store.getValues()).toEqual({ user: { first: 'edit', last: 'new' } });
  });

  it('treats a registered object as a single value for guarded adoption', () => {
    const store = createFormStore({
      defaultValues: { user: { first: 'A', last: 'B' } },
    });
    store.register('user');
    store.setValue('user', { first: 'edit', last: 'B' });
    store.adoptDefaultValues(
      { user: { first: 'server', last: 'new' } },
      { when: 'always', preserveDirty: true },
    );
    expect(store.getValues()).toEqual({ user: { first: 'edit', last: 'B' } });
  });

  it('does not traverse a cyclic field value when projecting active values', () => {
    const first: { label: string; self?: unknown } = { label: 'first' };
    first.self = first;
    const store = createFormStore({ defaultValues: { node: first } });
    store.register('node');
    const before = store.getSnapshot();
    const next: { label: string; self?: unknown } = { label: 'next' };
    next.self = next;
    store.setValue('node', next);
    expect(store.getSnapshot().activeValues.node).toBe(
      store.getSnapshot().values.node,
    );
    expect(store.getSnapshot().values.node?.self).toBe(
      store.getSnapshot().values.node,
    );
    expect(before.activeValues.node?.label).toBe('first');
  });

  it('keeps store-owned nested values when assigning a snapshot subtree', () => {
    const store = createFormStore({
      defaultValues: { a: { child: { x: 1 } } },
    });
    store.setValue(['a', 'child', 'x'], 2);
    const value = store.getValue('a');
    const before = store.getSnapshot();
    store.setValue('a', value);
    expect(store.getSnapshot()).toBe(before);
  });

  it('keeps earlier error snapshots immutable when the caller reuses its array', () => {
    const store = createFormStore();
    const errors = ['first'];
    store.setFieldErrors('a', errors);
    const before = store.getSnapshot();
    errors.push('second');
    expect(before.fields.a.errors).toEqual(['first']);
    store.setFieldErrors('a', errors);
    expect(store.getSnapshot().fields.a.errors).toEqual(['first', 'second']);
    expect(before.fields.a.errors).toEqual(['first']);
  });

  it('stays usable when the error reporter also throws', () => {
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const store = createFormStore({
        onListenerError: () => {
          throw new Error('reporter');
        },
      });
      store.subscribe(() => {
        throw new Error('listener');
      });
      const later = vi.fn();
      store.subscribe(later);
      store.setValue('a', 1);
      expect(later).toHaveBeenCalledTimes(1);
      expect(logging).toHaveBeenCalledTimes(1);
    } finally {
      logging.mockRestore();
    }
  });

  it('allows a callback to issue another command without corrupting event payloads', () => {
    const seen: unknown[] = [];
    const store = createFormStore({
      onValuesChange: (values) => {
        seen.push(values);
        if (values.a === 1) store.setValue('a', 2, { notify: true });
      },
    });
    store.setValue('a', 1, { notify: true });
    expect(seen).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('starts listeners added during delivery on the next publication', () => {
    const store = createFormStore();
    const added = vi.fn();
    let didAdd = false;
    store.subscribe(() => {
      if (!didAdd) {
        didAdd = true;
        store.subscribe(added);
      }
    });
    store.setValue('a', 1);
    expect(added).not.toHaveBeenCalled();
    store.setValue('a', 2);
    expect(added).toHaveBeenCalledTimes(1);
  });

  it('retains no registrations or listeners through repeated setup/cleanup cycles', () => {
    const store = createFormStore();
    for (let i = 0; i < 100; i++) {
      const field = store.register('a');
      const listener = store.subscribe(() => {});
      field.release();
      listener();
    }
    expect(store.debug.registrationCount()).toBe(0);
    expect(store.debug.listenerCount()).toBe(0);
    expect(store.getFieldSnapshot('a')).toBeUndefined();
  });
});
