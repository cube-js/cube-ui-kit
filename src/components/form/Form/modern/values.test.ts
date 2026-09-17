import { createFormStore } from './store';
import { createValueSnapshotter, formValueEqual } from './values';

describe('modern value ownership and path regressions', () => {
  it('never reuses an incomplete copy after a getter throws during snapshotting', () => {
    const snapshot = createValueSnapshotter();
    let fail = true;
    const input = {
      first: { value: 1 },
      get second() {
        if (fail) throw new Error('unavailable');
        return { value: 2 };
      },
    };
    expect(() => snapshot(input)).toThrow('unavailable');
    fail = false;
    const result = snapshot(input);
    expect(result).toEqual({ first: { value: 1 }, second: { value: 2 } });
    expect(Object.isFrozen(result)).toBe(true);
    input.first.value = 3;
    expect(result.first.value).toBe(1);
  });

  it('retains enumerable symbol properties in plain values and dirty comparison', () => {
    const marker = Symbol('marker');
    const store = createFormStore({ defaultValues: { a: { [marker]: 1 } } });
    expect(store.getSnapshot().values.a?.[marker]).toBe(1);
    store.setValue('a', { [marker]: 2 });
    expect(store.getSnapshot().isDirty).toBe(true);
    expect(formValueEqual({ [marker]: 1 }, { [marker]: 2 })).toBe(false);
  });

  it('retains array properties when writing an element', () => {
    const marker = Symbol('marker');
    const array = Object.assign([1, 2], {
      label: 'rows',
      [marker]: 'metadata',
    });
    const store = createFormStore({ defaultValues: { array } });
    store.setValue(['array', 0], 10);
    const result = store.getSnapshot().values.array!;
    expect(result.label).toBe('rows');
    expect(result[marker]).toBe('metadata');
    expect(result).toHaveLength(2);
  });

  it('supports a registered array length without corrupting active projection', () => {
    const store = createFormStore({ defaultValues: { rows: [1, 2] } });
    store.register(['rows', 'length']);
    expect(store.getFieldSnapshot(['rows', 'length'])?.value).toBe(2);
    expect(store.getSnapshot().activeValues.rows).toHaveLength(2);
    store.setValue(['rows', 'length'], 1);
    expect(store.getValue('rows')).toEqual([1]);
    expect(store.getSnapshot().activeValues.rows).toHaveLength(1);
  });

  it('invalidates affected element validation when array length changes', () => {
    const store = createFormStore({ defaultValues: { rows: [1, 2] } });
    store.register(['rows', 1]);
    const pending = store.startValidation(['rows', 1]);
    store.setValue(['rows', 'length'], 1);
    expect(pending.signal.aborted).toBe(true);
    expect(pending.complete(['stale'])).toBe(false);
    expect(store.getFieldSnapshot(['rows', 1])?.value).toBeUndefined();
  });

  it('rejects sparse tuple paths instead of aliasing a literal empty name', () => {
    const store = createFormStore();
    expect(() => store.setValue(new Array(1), 1)).toThrow();
    expect(store.getSnapshot().values).toEqual({});
    expect(store.getFieldSnapshot('')).toBeUndefined();
  });

  it('keeps earlier valid copies when a later input graph fails to clone', () => {
    const snapshot = createValueSnapshotter();
    const stable = { value: 1 };
    const previous = snapshot(stable);
    const broken = {
      stable,
      get broken() {
        throw new Error('failure');
      },
    };
    expect(() => snapshot(broken)).toThrow();
    expect(snapshot(stable)).toBe(previous);
  });
});
