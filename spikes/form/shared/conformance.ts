/**
 * Store-level conformance suite for the Phase 2 spike.
 *
 * Runs the plan's exercise list (§9 Phase 2) against any object implementing
 * the draft `FormStore` interface, so the internal store and the TanStack
 * compatibility layer are measured by the same assertions. `caps` lets an
 * engine declare a semantic it cannot provide; those tests run as `it.fails`
 * so the gap is visible in the report instead of silently skipped.
 */
import { createElement } from 'react';

import type { FormStore, FormStoreOptions } from '../internal/store';

export interface EngineCapabilities {
  /** Field status distinguishes `unvalidated` from `valid`. */
  triStateStatus: boolean;
  /** Unchanged field snapshot objects keep their identity across commits. */
  stableFieldIdentity: boolean;
  /** `values` identity survives a metadata-only change (touch). */
  stableValuesOnMetaChange: boolean;
  /** Baseline can be replaced without touching current values. */
  baselineOnlyReplace: boolean;
  /** Validation delay timers are owned by the engine and cancelled on release. */
  ownsTimers: boolean;
  /** Programmatic set can opt out of `onValuesChange`. */
  notifyOptOut: boolean;
  /** A pending validation promise settles (as stale) on reset/unregister. */
  settlesCancelledValidation: boolean;
  /** A run started before a value change can never commit its result. */
  rejectsStaleResults: boolean;
  /** A value or rule change aborts (signals) the superseded run. */
  abortsSupersededRuns: boolean;
  /** Errors stay visible while the field revalidates (no flicker). */
  keepsErrorsWhileRevalidating: boolean;
}

export const FULL_CAPABILITIES: EngineCapabilities = {
  triStateStatus: true,
  stableFieldIdentity: true,
  stableValuesOnMetaChange: true,
  baselineOnlyReplace: true,
  ownsTimers: true,
  notifyOptOut: true,
  settlesCancelledValidation: true,
  rejectsStaleResults: true,
  abortsSupersededRuns: true,
  keepsErrorsWhileRevalidating: true,
};

export type StoreFactory = <T extends object = Record<string, unknown>>(
  options?: FormStoreOptions<T>,
) => FormStore<T>;

const tick = (ms = 0) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function describeStoreConformance(
  label: string,
  create: StoreFactory,
  caps: EngineCapabilities = FULL_CAPABILITIES,
) {
  const maybe = (cap: boolean) => (cap ? it : it.fails);

  describe(`${label}: store conformance`, () => {
    describe('defaults and seeding', () => {
      it('seeds defaultValues synchronously before the first read', () => {
        const store = create<{ a: string; b: number }>({
          defaultValues: { a: 'x', b: 1 },
        });
        const state = store.getSnapshot();
        expect(state.values).toEqual({ a: 'x', b: 1 });
        expect(state.defaultValues).toEqual({ a: 'x', b: 1 });
        expect(state.isDirty).toBe(false);
        expect(store.getValue('a')).toBe('x');
      });

      it('keeps a value set before the field registers and activates it on registration', () => {
        const store = create();
        store.setValue('later', 'seeded');
        expect(store.getSnapshot().values).toEqual({ later: 'seeded' });
        expect(store.getSnapshot().activeValues).toEqual({});
        expect(store.getSnapshot().fields.later.active).toBe(false);

        const token = store.register('later');
        expect(store.getSnapshot().activeValues).toEqual({ later: 'seeded' });
        expect(store.getSnapshot().fields.later.active).toBe(true);
        token.release();
      });

      it('field-level default seeds only when the controller has no value or default', () => {
        const store = create<{ a: string; b: string; c: string | null }>({
          defaultValues: { a: 'controller', c: null },
        });
        store.setValue('b', 'seeded-before');
        const a = store.register('a', { defaultValue: 'field' });
        const b = store.register('b', { defaultValue: 'field' });
        const c = store.register('c', { defaultValue: 'field' });
        const d = store.register('d', { defaultValue: 'field' });

        const { values, defaultValues } = store.getSnapshot();
        expect(values).toEqual({
          a: 'controller',
          b: 'seeded-before',
          c: null,
          d: 'field',
        });
        expect(defaultValues).toEqual({ a: 'controller', c: null, d: 'field' });
        // `null` from the controller wins over a field default (plan §7.3).
        expect(values.c).toBeNull();
        [a, b, c, d].forEach((token) => token.release());
      });

      it('a later field-level default change does not mutate current state', () => {
        const store = create();
        const token = store.register('a', { defaultValue: 'one' });
        expect(store.getValue('a')).toBe('one');
        token.update({ defaultValue: 'two' });
        expect(store.getValue('a')).toBe('one');
        expect(store.getSnapshot().defaultValues).toEqual({ a: 'one' });
        token.release();
      });

      it('conflicting duplicate defaults warn and keep the first registration default', () => {
        const onDevelopmentError = vi.fn();
        const store = create({ onDevelopmentError });
        const first = store.register('a', { defaultValue: 'one' });
        const second = store.register('a', { defaultValue: 'two' });
        expect(store.getValue('a')).toBe('one');
        expect(onDevelopmentError).toHaveBeenCalledTimes(1);
        expect(onDevelopmentError.mock.calls[0][0]).toMatch(
          /conflicting defaultValue/,
        );
        first.release();
        second.release();
      });
    });

    describe('active versus retained values', () => {
      it('unregistering keeps the retained value but removes it from active values and submission', async () => {
        const onSubmit = vi.fn();
        const store = create({ callbacks: { onSubmit } });
        const a = store.register('a');
        const b = store.register('b');
        store.setValue('a', 1);
        store.setValue('b', 2);
        b.release();

        expect(store.getSnapshot().values).toEqual({ a: 1, b: 2 });
        expect(store.getSnapshot().activeValues).toEqual({ a: 1 });
        expect(store.getSnapshot().fields.b.active).toBe(false);

        await store.submit();
        expect(onSubmit).toHaveBeenCalledWith({ a: 1 }, { include: 'active' });

        await store.submit({ include: 'all' });
        expect(onSubmit).toHaveBeenLastCalledWith(
          { a: 1, b: 2 },
          { include: 'all' },
        );
        a.release();
      });

      it('remounting restores the retained input', () => {
        const store = create();
        let token = store.register('a');
        store.setValue('a', 'typed', { source: 'user' });
        token.release();
        token = store.register('a');
        expect(store.getSnapshot().activeValues).toEqual({ a: 'typed' });
        token.release();
      });

      it('preserve: false removes the retained value on the final release only', () => {
        const store = create();
        const first = store.register('a', { preserve: false });
        const second = store.register('a', { preserve: false });
        store.setValue('a', 'typed');
        first.release();
        expect(store.getSnapshot().values).toEqual({ a: 'typed' });
        second.release();
        expect(store.getSnapshot().values).toEqual({});
        expect(store.getSnapshot().fields.a).toBeUndefined();
      });
    });

    describe('registration ownership', () => {
      it('duplicate names share a value and stay active until the final release', () => {
        const store = create();
        const first = store.register('a');
        const second = store.register('a');
        store.setValue('a', 'v');
        expect(store.getSnapshot().fields.a.registrationCount).toBe(2);
        first.release();
        expect(store.getSnapshot().fields.a.active).toBe(true);
        expect(store.getSnapshot().fields.a.registrationCount).toBe(1);
        second.release();
        expect(store.getSnapshot().fields.a.active).toBe(false);
      });

      it('a stale token cannot release a newer registration', () => {
        const store = create();
        const stale = store.register('a');
        stale.release();
        const fresh = store.register('a');
        stale.release(); // second release of the stale token: no-op
        expect(store.getSnapshot().fields.a.active).toBe(true);
        expect(stale.released).toBe(true);
        expect(fresh.released).toBe(false);
        fresh.release();
        expect(store.debug.registrationCount()).toBe(0);
      });

      it('dynamic string names are plain keys', () => {
        const store = create();
        const names = [
          'CUBEJS_DB_HOST',
          'nested.path.value',
          'with space',
          '0',
        ];
        const tokens = names.map((name) => store.register(name));
        names.forEach((name, i) => store.setValue(name, i));
        expect(Object.keys(store.getSnapshot().activeValues).sort()).toEqual(
          [...names].sort(),
        );
        tokens.forEach((token) => token.release());
      });
    });

    describe('atomic commands and snapshots', () => {
      it('setValues publishes one coherent snapshot and notifies once', () => {
        const store = create();
        const seen: unknown[] = [];
        store.subscribe(() => seen.push(store.getSnapshot().values));
        store.setValues({ a: 1, b: 2, c: 3 });
        expect(seen).toEqual([{ a: 1, b: 2, c: 3 }]);
      });

      it('batch() collapses several commands into one publish', () => {
        const store = create();
        const listener = vi.fn();
        store.subscribe(listener);
        const before = store.debug.publishCount();
        store.batch(() => {
          store.setValue('a', 1);
          store.setValue('b', 2);
          store.touch('a');
        });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(store.debug.publishCount() - before).toBe(1);
      });

      it('getSnapshot returns the same object until observable state changes', () => {
        const store = create({ defaultValues: { a: 1 } });
        const s1 = store.getSnapshot();
        expect(store.getSnapshot()).toBe(s1);
        store.setValue('a', 1); // same value: nothing observable changes
        expect(store.getSnapshot()).toBe(s1);
        store.setValue('a', 2);
        expect(store.getSnapshot()).not.toBe(s1);
      });

      maybe(caps.stableFieldIdentity)(
        'unchanged field objects keep their identity when another field changes',
        () => {
          const store = create({ defaultValues: { a: 1, b: 2 } });
          const before = store.getSnapshot();
          store.setValue('a', 10);
          const after = store.getSnapshot();
          expect(after.fields.b).toBe(before.fields.b);
          expect(after.fields.a).not.toBe(before.fields.a);
          expect(after.fields.a.value).toBe(10);
        },
      );

      maybe(caps.stableValuesOnMetaChange)(
        '`values` keeps its identity when only metadata changes',
        () => {
          const store = create({ defaultValues: { a: 1 } });
          const token = store.register('a');
          const before = store.getSnapshot();
          store.touch('a');
          const after = store.getSnapshot();
          expect(after).not.toBe(before);
          expect(after.values).toBe(before.values);
          expect(after.isTouched).toBe(true);
          token.release();
        },
      );

      it('dirtyFields keeps identity while membership is unchanged and updates when it changes', () => {
        const store = create({ defaultValues: { a: 1, b: 2 } });
        store.setValue('a', 10);
        const s1 = store.getSnapshot();
        expect(Array.from(s1.dirtyFields)).toEqual(['a']);
        store.setValue('a', 11);
        expect(store.getSnapshot().dirtyFields).toBe(s1.dirtyFields);
        store.setValue('b', 20);
        expect(Array.from(store.getSnapshot().dirtyFields).sort()).toEqual([
          'a',
          'b',
        ]);
      });

      it('dirty-field membership changes while aggregate dirtiness stays true', () => {
        const store = create({ defaultValues: { a: 1, b: 2 } });
        store.setValues({ a: 10, b: 20 });
        expect(store.getSnapshot().isDirty).toBe(true);
        store.setValue('a', 1); // back to baseline
        const state = store.getSnapshot();
        expect(state.isDirty).toBe(true);
        expect(Array.from(state.dirtyFields)).toEqual(['b']);
        expect(state.fields.a.dirty).toBe(false);
      });

      it('dirty equality is structural one level deep and overridable per field', () => {
        const store = create({
          defaultValues: { list: [1, 2], obj: { k: 1 } },
        });
        store.setValue('list', [1, 2]);
        store.setValue('obj', { k: 1 });
        expect(store.getSnapshot().isDirty).toBe(false);
        const token = store.register('obj', {
          isEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        });
        store.setValue('obj', { k: 1, extra: undefined });
        expect(store.getSnapshot().fields.obj.dirty).toBe(false);
        token.release();
      });
    });

    describe('defaults, baseline and reset commands', () => {
      maybe(caps.baselineOnlyReplace)(
        'setDefaultValues preserves current values and recomputes dirtiness',
        () => {
          const store = create({ defaultValues: { a: 1 } });
          store.setValue('a', 2, { source: 'user' });
          store.setDefaultValues({ a: 2 });
          const state = store.getSnapshot();
          expect(state.values).toEqual({ a: 2 });
          expect(state.defaultValues).toEqual({ a: 2 });
          expect(state.isDirty).toBe(false);
          expect(state.isTouched).toBe(true);
        },
      );

      it('reset({ values }) replaces baseline and current values atomically and clears touched/errors', async () => {
        const store = create({ defaultValues: { a: 1 } });
        const token = store.register('a', {
          rules: [{ required: true, message: 'req' }],
        });
        store.setValue('a', '', { source: 'user' });
        await store.validate(['a']);
        expect(store.getSnapshot().fields.a.status).toBe('invalid');
        store.setSubmitError('boom');

        const listener = vi.fn();
        store.subscribe(listener);
        store.reset({ values: { a: 5 } });

        const state = store.getSnapshot();
        expect(listener).toHaveBeenCalledTimes(1);
        expect(state.values).toEqual({ a: 5 });
        expect(state.defaultValues).toEqual({ a: 5 });
        expect(state.isDirty).toBe(false);
        expect(state.isTouched).toBe(false);
        expect(state.fields.a.errors).toEqual([]);
        expect(state.submitError).toBeUndefined();
        token.release();
      });

      it('reset() without values returns to the baseline and drops unseeded retained values', () => {
        const store = create<Record<string, unknown>>({
          defaultValues: { a: 1 },
        });
        store.setValues({ a: 2, extra: 'x' });
        store.reset();
        expect(store.getSnapshot().values).toEqual({ a: 1 });
        expect(store.getSnapshot().fields.extra).toBeUndefined();
      });

      it('adoptDefaultValues({ when: "untouched" }) keeps touched user input', () => {
        const store = create({
          defaultValues: { a: 'server-1', b: 'server-1' },
        });
        const tokens = [store.register('a'), store.register('b')];
        store.setValue('a', 'typed', { source: 'user' });
        store.adoptDefaultValues({ a: 'server-2', b: 'server-2' });
        const state = store.getSnapshot();
        expect(state.values).toEqual({ a: 'typed', b: 'server-2' });
        expect(state.defaultValues).toEqual({ a: 'server-2', b: 'server-2' });
        expect(state.fields.a.dirty).toBe(true);
        tokens.forEach((token) => token.release());
      });

      it('adoptDefaultValues({ when: "clean" }) uses dirtiness, and preserveDirty keeps dirty values under "always"', () => {
        const store = create({ defaultValues: { a: 1, b: 1 } });
        store.setValue('a', 2, { source: 'user' });
        store.setValue('b', 1, { source: 'user' }); // touched but clean
        store.adoptDefaultValues({ a: 3, b: 3 }, { when: 'clean' });
        expect(store.getSnapshot().values).toEqual({ a: 2, b: 3 });

        store.adoptDefaultValues(
          { a: 4, b: 4 },
          { when: 'always', preserveDirty: true },
        );
        expect(store.getSnapshot().values).toEqual({ a: 2, b: 4 });

        store.adoptDefaultValues({ a: 5 }, { when: 'always' });
        expect(store.getSnapshot().values.a).toBe(5);
      });
    });

    describe('validation', () => {
      maybe(caps.triStateStatus)(
        'status is unvalidated → validating → valid/invalid; isValid needs every active field valid',
        async () => {
          const store = create({ defaultValues: { a: 'ok', b: '' } });
          const a = store.register('a', { rules: [{ required: true }] });
          const b = store.register('b', {
            rules: [{ required: true, message: 'B required' }],
          });
          const initial = store.getSnapshot();
          expect(initial.fields.a.status).toBe('unvalidated');
          expect(initial.isValid).toBe(false);
          expect(initial.isInvalid).toBe(false);

          const pending = store.validate(['a']);
          expect(store.getSnapshot().fields.a.status).toBe('validating');
          expect(store.getSnapshot().isValidating).toBe(true);
          await pending;
          expect(store.getSnapshot().fields.a.status).toBe('valid');
          expect(store.getSnapshot().isValid).toBe(false); // b is still unvalidated

          const result = await store.validate();
          expect(result.isValid).toBe(false);
          expect(store.getSnapshot().fields.b.errors).toEqual(['B required']);
          expect(store.getSnapshot().isInvalid).toBe(true);
          a.release();
          b.release();
        },
      );

      it('a ReactNode error is kept by identity', async () => {
        const store = create();
        const node = createElement('b', null, 'Rich error');
        const token = store.register('a', {
          rules: [{ validator: () => Promise.reject(node) }],
        });
        await store.validate(['a']);
        expect(store.getSnapshot().fields.a.errors[0]).toBe(node);
        token.release();
      });

      it('error order follows rule order; policy "first" stops at the first failure', async () => {
        const first = create();
        const token = first.register('a', {
          rules: [{ validator: () => 'one' }, { validator: () => 'two' }],
        });
        await first.validate(['a']);
        expect(first.getSnapshot().fields.a.errors).toEqual(['one']);
        token.release();

        const all = create({ errorPolicy: 'all' });
        const token2 = all.register('a', {
          rules: [{ validator: () => 'one' }, { validator: () => 'two' }],
        });
        await all.validate(['a']);
        expect(all.getSnapshot().fields.a.errors).toEqual(['one', 'two']);
        token2.release();
      });

      maybe(caps.rejectsStaleResults)(
        'a stale async result never commits after the value changed',
        async () => {
          const store = create();
          const resolvers: Array<() => void> = [];
          const validator = vi.fn(
            (_rule: unknown, value: unknown) =>
              new Promise<string | void>((resolve) => {
                resolvers.push(() =>
                  resolve(value === 'old' ? 'old is bad' : undefined),
                );
              }),
          );
          const token = store.register('a', {
            rules: [{ validator }],
            validateTrigger: 'onChange',
          });
          store.setValue('a', 'old', { source: 'user', validate: 'never' });
          const firstRun = store.validate(['a']);
          await tick(10); // engines may start validators a few ticks later
          expect(validator).toHaveBeenCalledTimes(1);
          const revisionBefore =
            store.getSnapshot().fields.a.validationRevision;

          store.setValue('a', 'new', { source: 'user' });
          expect(
            store.getSnapshot().fields.a.validationRevision,
          ).toBeGreaterThan(revisionBefore);
          await tick(10);

          // Resolve every run that was started for 'old'; none may commit.
          resolvers.splice(0, 1).forEach((resolve) => resolve());
          const stale = await firstRun;
          expect(stale.stale).toBe(true);
          await tick();
          expect(store.getSnapshot().fields.a.errors).toEqual([]);
          expect(store.getSnapshot().fields.a.status).not.toBe('invalid');
          resolvers.forEach((resolve) => resolve());
          token.release();
        },
      );

      maybe(caps.abortsSupersededRuns)(
        'validators receive an abort signal that fires when superseded',
        async () => {
          const store = create();
          let signal!: AbortSignal;
          const token = store.register('a', {
            rules: [
              {
                validator: (_rule, _value, ctx) => {
                  signal = ctx.signal;
                  return new Promise<void>(() => {});
                },
              },
            ],
          });
          void store.validate(['a']);
          await tick(10);
          expect(signal.aborted).toBe(false);
          store.setValue('a', 'changed');
          await tick(10);
          expect(signal.aborted).toBe(true);
          token.release();
        },
      );

      maybe(caps.ownsTimers)(
        'delayed validation coalesces rapid changes and the store owns the timer',
        async () => {
          vi.useFakeTimers();
          try {
            const validator = vi.fn(async () => undefined);
            const store = create();
            const token = store.register('a', {
              rules: [{ validator }],
              validationDelay: 100,
              validateTrigger: 'onChange',
            });
            store.setValue('a', 'x', { source: 'user' });
            store.setValue('a', 'xy', { source: 'user' });
            store.setValue('a', 'xyz', { source: 'user' });
            expect(store.debug.pendingTimerCount()).toBe(1);
            expect(validator).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(100);
            expect(validator).toHaveBeenCalledTimes(1);
            expect(validator.mock.calls[0][1]).toBe('xyz');
            expect(store.getSnapshot().fields.a.status).toBe('valid');
            expect(store.debug.pendingTimerCount()).toBe(0);

            store.setValue('a', 'again', { source: 'user' });
            expect(store.debug.pendingTimerCount()).toBe(1);
            token.release();
            expect(store.debug.pendingTimerCount()).toBe(0);
          } finally {
            vi.useRealTimers();
          }
        },
      );

      it('inline rule arrays with the same shape do not bump the revision; a genuine change does', () => {
        const store = create();
        const validator = async () => undefined;
        const token = store.register('a', {
          rules: [{ required: true }, { validator }],
        });
        const revision = () => store.getSnapshot().fields.a.validationRevision;
        const before = revision();
        token.update({ rules: [{ required: true }, { validator }] });
        token.update({
          rules: [{ required: true }, { validator: async () => undefined }],
        });
        expect(revision()).toBe(before);
        token.update({ rules: [{ required: true }, { min: 3 }] });
        expect(revision()).toBeGreaterThan(before);
        token.release();
      });

      maybe(caps.abortsSupersededRuns)(
        'a genuine rule change during a run discards the pending result',
        async () => {
          const store = create();
          let release!: () => void;
          const token = store.register('a', {
            rules: [
              {
                validator: () =>
                  new Promise<string>((r) => (release = () => r('err'))),
              },
            ],
          });
          const run = store.validate(['a']);
          await tick(10);
          token.update({ rules: [{ min: 1 }] });
          release();
          expect((await run).stale).toBe(true);
          expect(store.getSnapshot().fields.a.status).toBe('unvalidated');
          token.release();
        },
      );

      maybe(caps.settlesCancelledValidation)(
        'reset and release during validation leave no pending state behind',
        async () => {
          const store = create();
          const validator = vi.fn(() => new Promise<void>(() => {}));
          const token = store.register('a', { rules: [{ validator }] });
          const run = store.validate(['a']);
          store.reset();
          expect((await run).stale).toBe(true);
          expect(store.getSnapshot().fields.a?.status ?? 'unvalidated').toBe(
            'unvalidated',
          );

          const again = store.validate(['a']);
          token.release();
          expect((await again).stale).toBe(true);
          expect(store.debug.pendingTimerCount()).toBe(0);
          expect(store.debug.registrationCount()).toBe(0);
        },
      );

      it('setFieldErrors / clearFieldErrors are explicit commands', () => {
        const store = create();
        store.setFieldErrors('a', ['server says no']);
        expect(store.getSnapshot().fields.a.status).toBe('invalid');
        expect(store.getSnapshot().fields.a.errors).toEqual(['server says no']);
        store.clearFieldErrors('a');
        expect(store.getSnapshot().fields.a.errors).toEqual([]);
      });

      maybe(caps.keepsErrorsWhileRevalidating)(
        'changing an invalid field keeps the error visible until the revalidation result arrives',
        async () => {
          const store = create();
          const token = store.register('a', {
            rules: [{ min: 3, message: 'short' }],
          });
          store.setValue('a', 'ab', { source: 'user' });
          await store.validate(['a']);
          expect(store.getSnapshot().fields.a.errors).toEqual(['short']);

          store.setValue('a', 'abc', { source: 'user' });
          if (caps.triStateStatus) {
            expect(store.getSnapshot().fields.a.status).toBe('validating');
          }
          expect(store.getSnapshot().fields.a.errors).toEqual(['short']);
          await tick();
          expect(store.getSnapshot().fields.a.status).toBe('valid');
          expect(store.getSnapshot().fields.a.errors).toEqual([]);
          token.release();
        },
      );
    });

    describe('callbacks and submission', () => {
      it('bound root callbacks override controller defaults and release restores them', async () => {
        const defaultSubmit = vi.fn();
        const rootSubmit = vi.fn();
        const store = create({ callbacks: { onSubmit: defaultSubmit } });
        const binding = store.bindCallbacks({ onSubmit: rootSubmit });
        await store.submit();
        expect(rootSubmit).toHaveBeenCalledTimes(1);
        expect(defaultSubmit).not.toHaveBeenCalled();
        binding.release();
        await store.submit();
        expect(defaultSubmit).toHaveBeenCalledTimes(1);
      });

      it('an explicit undefined removes a callback; an omitted key keeps the default', async () => {
        const defaultSubmit = vi.fn();
        const defaultFailed = vi.fn();
        const store = create({
          callbacks: { onSubmit: defaultSubmit, onSubmitFailed: defaultFailed },
        });
        const binding = store.bindCallbacks({ onSubmit: undefined });
        await store.submit();
        expect(defaultSubmit).not.toHaveBeenCalled();
        binding.update({});
        await store.submit();
        expect(defaultSubmit).toHaveBeenCalledTimes(1);
        binding.release();
      });

      it('a second owning root is a development error and a stale release cannot unbind the newer root', async () => {
        const onDevelopmentError = vi.fn();
        const store = create({ onDevelopmentError });
        const first = store.bindCallbacks({ onSubmit: vi.fn() });
        const newer = vi.fn();
        const second = store.bindCallbacks({ onSubmit: newer });
        expect(onDevelopmentError).toHaveBeenCalledTimes(1);
        first.release();
        await store.submit();
        expect(newer).toHaveBeenCalledTimes(1);
        second.release();
      });

      it('submit validates active fields, reports invalid, and guards against double submit', async () => {
        const onSubmit = vi.fn(() => tick(20));
        const onSubmitFailed = vi.fn();
        const store = create({ callbacks: { onSubmit, onSubmitFailed } });
        const token = store.register('a', {
          rules: [{ required: true, message: 'req' }],
        });

        const invalid = await store.submit();
        expect(invalid).toEqual({ status: 'invalid', errors: { a: ['req'] } });
        expect(onSubmitFailed).toHaveBeenCalledWith({ a: ['req'] });
        expect(onSubmit).not.toHaveBeenCalled();

        store.setValue('a', 'v');
        const first = store.submit();
        expect(store.getSnapshot().isSubmitting).toBe(true);
        const second = await store.submit();
        expect(second).toEqual({ status: 'ignored', reason: 'submitting' });
        expect(await first).toEqual({ status: 'submitted' });
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(store.getSnapshot().isSubmitting).toBe(false);
        token.release();
      });

      it('a rejected onSubmit sets submitError through the store, and the next submit clears it', async () => {
        const error = new Error('server');
        const onSubmit = vi
          .fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce(undefined);
        const store = create({ callbacks: { onSubmit } });
        const failed = await store.submit();
        expect(failed).toEqual({ status: 'failed', error });
        expect(store.getSnapshot().submitError).toBe(error);
        store.clearSubmitError();
        expect(store.getSnapshot().submitError).toBeUndefined();
        store.setSubmitError('manual');
        await store.submit();
        expect(store.getSnapshot().submitError).toBeUndefined();
      });

      it('user changes notify onValuesChange once with a coherent snapshot; programmatic changes opt in', () => {
        const onValuesChange = vi.fn();
        const store = create({ callbacks: { onValuesChange } });
        store.setValues({ a: 1, b: 2 }, { source: 'user' });
        expect(onValuesChange).toHaveBeenCalledTimes(1);
        expect(onValuesChange.mock.calls[0][0]).toEqual({ a: 1, b: 2 });
        expect(onValuesChange.mock.calls[0][1]).toEqual({
          names: ['a', 'b'],
          source: 'user',
          kind: 'set',
        });

        store.setValue('a', 3);
        expect(onValuesChange).toHaveBeenCalledTimes(caps.notifyOptOut ? 1 : 2);

        store.setValue('a', 4, { notify: true });
        expect(onValuesChange).toHaveBeenCalledTimes(caps.notifyOptOut ? 2 : 3);
        expect(onValuesChange.mock.lastCall?.[1].source).toBe('program');
      });

      it('a rejecting onValuesChange does not corrupt the store', async () => {
        const onListenerError = vi.fn();
        const store = create({
          callbacks: { onValuesChange: () => Promise.reject(new Error('cb')) },
          onListenerError,
        });
        store.setValue('a', 1, { source: 'user' });
        await tick();
        expect(onListenerError).toHaveBeenCalledTimes(1);
        expect(store.getSnapshot().values).toEqual({ a: 1 });
        store.setValue('a', 2, { source: 'user' });
        expect(store.getSnapshot().values).toEqual({ a: 2 });
      });
    });

    describe('listeners', () => {
      it('a throwing listener does not prevent the others from being notified', () => {
        const onListenerError = vi.fn();
        const store = create({ onListenerError });
        const second = vi.fn();
        store.subscribe(() => {
          throw new Error('listener');
        });
        store.subscribe(second);
        store.setValue('a', 1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(onListenerError).toHaveBeenCalledTimes(1);
      });

      it('tolerates unsubscribe and reentrant commands during notification', () => {
        const store = create();
        const calls: string[] = [];
        let unsubscribeB = () => {};
        store.subscribe(() => {
          calls.push('a');
          unsubscribeB();
          if (store.getValue('x') === 1) store.setValue('x', 2);
        });
        unsubscribeB = store.subscribe(() => calls.push('b'));
        store.subscribe(() => calls.push(`c:${String(store.getValue('x'))}`));
        store.setValue('x', 1);
        // The reentrant command publishes immediately: every remaining
        // listener (including the origin) sees the nested change, then the
        // outer cycle continues with the latest snapshot.
        expect(calls).toEqual(['a', 'a', 'c:2', 'c:2']);
        expect(store.getValue('x')).toBe(2);
        expect(store.debug.listenerCount()).toBe(2);
      });

      maybe(caps.ownsTimers)(
        'dispose clears listeners and pending timers',
        () => {
          vi.useFakeTimers();
          try {
            const store = create();
            store.subscribe(() => {});
            const token = store.register('a', {
              rules: [{ validator: async () => undefined }],
              validationDelay: 50,
              validateTrigger: 'onChange',
            });
            store.setValue('a', 'x', { source: 'user' });
            expect(store.debug.pendingTimerCount()).toBe(1);
            store.dispose();
            expect(store.debug.listenerCount()).toBe(0);
            expect(store.debug.pendingTimerCount()).toBe(0);
            token.release();
          } finally {
            vi.useRealTimers();
          }
        },
      );
    });
  });
}
