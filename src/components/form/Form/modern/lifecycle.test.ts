import { createFormStore } from './store';

import type { ValidationToken } from './types';

describe('modern store lifecycle regressions', () => {
  it('keeps duplicate registrations quiet when both resend equivalent options', () => {
    const store = createFormStore();
    const first = store.register('a', { defaultValue: 1 });
    const second = store.register('a', { defaultValue: 1 });
    const pending = store.startValidation('a');
    const before = store.getSnapshot();
    const listener = vi.fn();
    store.subscribe(listener);
    first.update({ defaultValue: 1, preserve: true });
    second.update({ defaultValue: 1 });
    expect(store.getSnapshot()).toBe(before);
    expect(pending.signal.aborted).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps validation started from an abort handler instead of overwriting it', () => {
    const store = createFormStore();
    store.register('a');
    const first = store.startValidation('a');
    let reentrant: ValidationToken<unknown> | undefined;
    first.signal.addEventListener('abort', () => {
      reentrant = store.startValidation('a');
    });
    const second = store.startValidation('a');
    expect(second.signal.aborted).toBe(true);
    expect(second.complete(['stale'])).toBe(false);
    expect(reentrant?.complete(['latest'])).toBe(true);
    expect(store.getFieldSnapshot('a')?.errors).toEqual(['latest']);
  });

  it('delivers reset cancellation after every field and the snapshot have reset', () => {
    const store = createFormStore({ defaultValues: { a: 1, b: 2 } });
    store.register('a');
    store.register('b');
    store.setValues({ a: 10, b: 20 }, { source: 'user' });
    const first = store.startValidation('a');
    const second = store.startValidation('b');
    let duringAbort: unknown;
    let reentrant: ValidationToken<unknown> | undefined;
    first.signal.addEventListener('abort', () => {
      duringAbort = store.getSnapshot();
      reentrant = store.startValidation('b');
    });
    store.reset();
    expect(duringAbort).toMatchObject({
      values: { a: 1, b: 2 },
      isTouched: false,
      isValidating: false,
    });
    expect(second.signal.aborted).toBe(true);
    expect(reentrant?.signal.aborted).toBe(false);
    expect(reentrant?.complete([])).toBe(true);
  });

  it('invalidates validation when the first field default arrives through update', () => {
    const store = createFormStore();
    const field = store.register('a');
    const pending = store.startValidation('a');
    field.update({ defaultValue: 1 });
    expect(pending.signal.aborted).toBe(true);
    expect(pending.complete(['old'])).toBe(false);
    expect(store.getFieldSnapshot('a')).toMatchObject({
      value: 1,
      status: 'unvalidated',
      errors: [],
    });
  });

  it('invalidates validation of related paths when a nested default seeds', () => {
    const store = createFormStore({ defaultValues: { parent: {} } });
    store.register('parent');
    const pending = store.startValidation('parent');
    store.register(['parent', 'child'], { defaultValue: 1 });
    expect(pending.signal.aborted).toBe(true);
    expect(pending.complete([])).toBe(false);
  });

  it('does not reapply a field default after explicit reset removes its baseline', () => {
    const store = createFormStore();
    const field = store.register('a', { defaultValue: 'initial' });
    store.reset({ values: {} });
    field.update({ defaultValue: 'new prop' });
    expect(store.getValues()).toEqual({});
    expect(store.getSnapshot().defaultValues).toEqual({});
  });

  it('does not reapply an ignored field default after controller defaults are removed', () => {
    const store = createFormStore({ defaultValues: { a: 1 } });
    const field = store.register('a', { defaultValue: 2 });
    store.reset({ values: {} });
    field.update({ defaultValue: 2 });
    expect(store.getValues()).toEqual({});
  });

  it('reports a conflicting duplicate default only when first supplied', () => {
    const onDevelopmentError = vi.fn();
    const store = createFormStore({ onDevelopmentError });
    store.register('a', { defaultValue: 'first' });
    const second = store.register('a', { defaultValue: 'second' });
    second.update({ defaultValue: 'second' });
    second.update({ defaultValue: 'second' });
    expect(onDevelopmentError).toHaveBeenCalledTimes(1);
  });

  it('makes cancellation observers see the final disposed snapshot', () => {
    const store = createFormStore();
    store.register('a');
    const validation = store.startValidation('a');
    const submission = store.startSubmission()!;
    const snapshots: unknown[] = [];
    validation.signal.addEventListener('abort', () => {
      snapshots.push(store.getSnapshot());
    });
    submission.signal.addEventListener('abort', () => {
      snapshots.push(store.getSnapshot());
    });
    store.dispose();
    for (const snapshot of snapshots) {
      expect(snapshot).toMatchObject({
        isValidating: false,
        isSubmitting: false,
        activeValues: {},
      });
    }
    expect(snapshots).toHaveLength(2);
  });
});
