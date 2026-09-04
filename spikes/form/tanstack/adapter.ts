/**
 * Phase 2 spike — compatibility layer over TanStack Form (form-core 1.33.5).
 *
 * Implements the same draft `FormStore` interface as the internal store so the
 * shared conformance suite measures both. Everything TanStack does not model
 * (active vs retained values, registration tokens, tri-state status, notify
 * opt-out, batching across meta+values, root callback tokens) is bookkeeping
 * kept beside the `FormApi`; the goal is to see how much of the modern
 * semantics the engine provides versus how much the layer must re-implement.
 */
import { FieldApi, FormApi } from '@tanstack/form-core';

import {
  CallbackBinding,
  defaultIsEqual,
  EMPTY_ERRORS,
  FieldState,
  FieldValidationResult,
  FormCallbacks,
  FormState,
  FormStore,
  FormStoreOptions,
  RegistrationOptions,
  RegistrationToken,
  rulesSignature,
  runRules,
  SetValueOptions,
  SubmitResult,
  ValidationResult,
} from '../internal/store';

import type { ReactNode } from 'react';

interface Registration {
  id: number;
  options: RegistrationOptions;
  signature: string;
  order: number;
}

type AnyFormApi = FormApi<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;
type AnyFieldApi = FieldApi<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

interface Entry {
  name: string;
  api: AnyFieldApi | null;
  unmount: (() => void) | null;
  registrations: Map<number, Registration>;
  owner: Registration | null;
  revision: number;
  validatedRevision: number | null;
  wasValidating: boolean;
}

const EMPTY_SET: ReadonlySet<string> = new Set();

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function createTanStackStore<T extends object = Record<string, unknown>>(
  options: FormStoreOptions<T> = {},
): FormStore<T> {
  const {
    errorPolicy = 'first',
    onListenerError = (error) => {
      console.error('[tanstack-layer] listener failed', error);
    },
    onDevelopmentError = (message) => {
      console.error(`[tanstack-layer] ${message}`);
    },
  } = options;

  const entries = new Map<string, Entry>();
  const publishedFields = new Map<
    string,
    { key: unknown[]; field: FieldState }
  >();
  const listeners = new Set<() => void>();
  const defaultCallbacks: FormCallbacks<T> = { ...options.callbacks };
  let binding: { id: number; callbacks: FormCallbacks<T> } | null = null;
  let nextId = 1;
  let order = 0;
  let publishCount = 0;
  let batchDepth = 0;
  let pendingPublish = false;
  let submitError: unknown = undefined;
  let ownVersion = 0;
  let submitInclude: 'active' | 'all' = 'active';
  let lastRaw: unknown = null;
  let lastOwnVersion = -1;
  let lastState: FormState<T> | null = null;
  const pendingChanges: Array<{
    names: string[];
    source: 'user' | 'program';
    kind: 'set' | 'reset' | 'adopt' | 'defaults';
  }> = [];

  function resolveCallbacks(): FormCallbacks<T> {
    if (!binding) return defaultCallbacks;
    const resolved: FormCallbacks<T> = { ...defaultCallbacks };
    for (const key of [
      'onSubmit',
      'onSubmitFailed',
      'onValuesChange',
    ] as const) {
      if (key in binding.callbacks) {
        (resolved as Record<string, unknown>)[key] = binding.callbacks[key];
      }
    }
    return resolved;
  }

  function activeNames(): string[] {
    return Array.from(entries.values())
      .filter((entry) => entry.registrations.size > 0)
      .map((entry) => entry.name);
  }

  function pickActive(
    values: Record<string, unknown>,
  ): Record<string, unknown> {
    const picked: Record<string, unknown> = {};
    for (const name of activeNames()) {
      if (name in values) picked[name] = values[name];
    }
    return picked;
  }

  const form: AnyFormApi = new FormApi({
    defaultValues: { ...(options.defaultValues ?? {}) },
    onSubmit: async ({ value }: { value: Record<string, unknown> }) => {
      const values = (
        submitInclude === 'active' ? pickActive(value) : value
      ) as Partial<T>;
      await resolveCallbacks().onSubmit?.(values, { include: submitInclude });
    },
  });
  form.mount();

  // -- publish / subscribe ------------------------------------------------

  function notify() {
    if (batchDepth > 0) {
      pendingPublish = true;
      return;
    }
    pendingPublish = false;
    publishCount += 1;
    const snapshot = Array.from(listeners);
    for (const listener of snapshot) {
      if (!listeners.has(listener)) continue;
      try {
        listener();
      } catch (error) {
        onListenerError(error);
      }
    }
    flushChanges();
  }

  function flushChanges() {
    if (!pendingChanges.length) return;
    const changes = pendingChanges.splice(0);
    const cb = resolveCallbacks().onValuesChange;
    if (!cb) return;
    for (const change of changes) {
      try {
        const result = cb(getSnapshot().values, change);
        if (result && typeof (result as Promise<void>).catch === 'function') {
          (result as Promise<void>).catch(onListenerError);
        }
      } catch (error) {
        onListenerError(error);
      }
    }
  }

  function batch(fn: () => void) {
    batchDepth += 1;
    try {
      fn();
    } finally {
      batchDepth -= 1;
      if (batchDepth === 0 && pendingPublish) notify();
    }
  }

  function ownChange() {
    ownVersion += 1;
    notify();
  }

  form.store.subscribe(() => {
    // Track validation completion per field for the tri-state emulation.
    for (const entry of entries.values()) {
      const meta = form.getFieldMeta(entry.name as any);
      const validating = !!meta?.isValidating;
      if (entry.wasValidating && !validating) {
        entry.validatedRevision = entry.revision;
      }
      entry.wasValidating = validating;
    }
    notify();
  });

  // -- snapshot -----------------------------------------------------------

  function fieldStatus(
    entry: Entry | undefined,
    errors: readonly ReactNode[],
    validating: boolean,
  ) {
    if (validating) return 'validating' as const;
    if (errors.length) return 'invalid' as const;
    if (entry && entry.validatedRevision === entry.revision)
      return 'valid' as const;
    return 'unvalidated' as const;
  }

  function getSnapshot(): FormState<T> {
    const raw = form.store.state;
    if (raw === lastRaw && ownVersion === lastOwnVersion && lastState)
      return lastState;
    lastRaw = raw;
    lastOwnVersion = ownVersion;

    const values = raw.values as Record<string, unknown>;
    const defaults = (form.options.defaultValues ?? {}) as Record<
      string,
      unknown
    >;
    const names = new Set<string>([
      ...Object.keys(values),
      ...Object.keys(raw.fieldMeta ?? {}),
      ...entries.keys(),
    ]);

    const fields: Record<string, FieldState> = {};
    const active: Record<string, unknown> = {};
    const dirty = new Set<string>();
    const touched = new Set<string>();
    let activeCount = 0;
    let validCount = 0;
    let isInvalid = false;
    let isValidating = false;

    for (const name of names) {
      const entry = entries.get(name);
      const meta = raw.fieldMeta?.[name];
      const value = values[name];
      const errors = meta?.errors?.length
        ? (meta.errors.flat() as ReactNode[])
        : EMPTY_ERRORS;
      const validating = !!meta?.isValidating;
      const status = fieldStatus(entry, errors, validating);
      const isActive = !!entry && entry.registrations.size > 0;
      const registrationCount = entry?.registrations.size ?? 0;
      const isDirty =
        name in values &&
        !(entry?.owner?.options.isEqual ?? defaultIsEqual)(
          value,
          defaults[name],
        );
      const isTouched = !!meta?.isTouched;

      const key = [
        value,
        defaults[name],
        errors,
        status,
        isTouched,
        isDirty,
        isActive,
        registrationCount,
        entry?.revision ?? 0,
      ];
      const cached = publishedFields.get(name);
      let field: FieldState;
      if (cached && key.every((v, i) => Object.is(v, cached.key[i]))) {
        field = cached.field;
      } else {
        field = {
          name,
          value,
          defaultValue: defaults[name],
          errors,
          status,
          touched: isTouched,
          dirty: isDirty,
          active: isActive,
          registrationCount,
          validationRevision: entry?.revision ?? 0,
        };
        publishedFields.set(name, { key, field });
      }
      fields[name] = field;

      if (isDirty) dirty.add(name);
      if (isTouched) touched.add(name);
      if (isActive) {
        activeCount += 1;
        if (name in values) active[name] = value;
        if (status === 'valid') validCount += 1;
        if (status === 'invalid') isInvalid = true;
        if (status === 'validating') isValidating = true;
      }
    }

    const previous = lastState;
    lastState = {
      values: values as Partial<T>,
      activeValues: active as Partial<T>,
      defaultValues: defaults as Partial<T>,
      fields,
      dirtyFields:
        previous && setsEqual(dirty, previous.dirtyFields)
          ? previous.dirtyFields
          : dirty,
      touchedFields:
        previous && setsEqual(touched, previous.touchedFields)
          ? previous.touchedFields
          : touched,
      isDirty: dirty.size > 0,
      isTouched: touched.size > 0,
      isValid: activeCount > 0 && validCount === activeCount,
      isInvalid,
      isValidating,
      isSubmitting: raw.isSubmitting,
      submitError,
      revision: (previous?.revision ?? 0) + 1,
    };
    return lastState;
  }

  // -- registration -------------------------------------------------------

  function ensureEntry(name: string): Entry {
    let entry = entries.get(name);
    if (!entry) {
      entry = {
        name,
        api: null,
        unmount: null,
        registrations: new Map(),
        owner: null,
        revision: 0,
        validatedRevision: null,
        wasValidating: false,
      };
      entries.set(name, entry);
    }
    return entry;
  }

  function validatorsFor(entry: Entry) {
    const rules = entry.owner?.options.rules ?? [];
    const delay = entry.owner?.options.validationDelay ?? 0;
    const trigger = entry.owner?.options.validateTrigger ?? 'onBlur';
    const runner = async ({
      value,
      signal,
    }: {
      value: unknown;
      signal: AbortSignal;
    }) => {
      if (!rules.length) return undefined;
      const errors = await runRules(
        value,
        rules,
        {
          name: entry.name,
          signal,
          getValue: (n) => (form.state.values as Record<string, unknown>)[n],
          getValues: () => form.state.values,
        },
        errorPolicy,
      );
      return errors.length ? errors : undefined;
    };
    // The `submit` cause runs the change and blur validators as well, so the
    // runner is registered once; registering it under `onSubmitAsync` too
    // duplicated every error.
    return trigger === 'onChange'
      ? { onChangeAsync: runner, onChangeAsyncDebounceMs: delay }
      : { onBlurAsync: runner, onBlurAsyncDebounceMs: delay };
  }

  function mountApi(entry: Entry) {
    if (entry.api) {
      entry.api.update({
        form,
        name: entry.name,
        validators: validatorsFor(entry),
      } as any);
      return;
    }
    const api = new FieldApi({
      form,
      name: entry.name,
      validators: validatorsFor(entry),
    } as any);
    entry.api = api as Entry['api'];
    entry.unmount = api.mount();
  }

  function register(
    name: string,
    regOptions: RegistrationOptions = {},
  ): RegistrationToken {
    const id = nextId++;
    let released = false;
    const registration: Registration = {
      id,
      options: regOptions,
      signature: regOptions.rulesKey ?? rulesSignature(regOptions.rules),
      order: order++,
    };

    batch(() => {
      const entry = ensureEntry(name);
      seedDefault(entry, regOptions);
      entry.registrations.set(id, registration);
      entry.owner = registration;
      mountApi(entry);
      ownChange();
    });

    return {
      id,
      name,
      get released() {
        return released;
      },
      update(next) {
        if (released) return;
        const entry = entries.get(name);
        if (!entry || !entry.registrations.has(id)) return;
        const signature = next.rulesKey ?? rulesSignature(next.rules);
        const changed = signature !== registration.signature;
        registration.options = next;
        registration.signature = signature;
        batch(() => {
          seedDefault(entry, next);
          entry.owner = registration;
          mountApi(entry);
          if (changed) {
            entry.revision += 1;
            entry.validatedRevision = null;
            entry.api?.setMeta((meta: any) => ({
              ...meta,
              errorMap: {},
              errorSourceMap: {},
            }));
          }
          ownChange();
        });
      },
      release() {
        if (released) return;
        released = true;
        const entry = entries.get(name);
        if (!entry || !entry.registrations.delete(id)) return;
        batch(() => {
          if (entry.owner?.id === id) {
            entry.owner =
              Array.from(entry.registrations.values()).sort(
                (a, b) => b.order - a.order,
              )[0] ?? null;
          }
          if (entry.registrations.size === 0) {
            entry.unmount?.();
            entry.unmount = null;
            entry.api = null;
            entry.revision += 1;
            entry.validatedRevision = null;
            if (registration.options.preserve === false) {
              form.deleteField(name as any);
              entries.delete(name);
            } else {
              entry.api = null;
            }
          }
          ownChange();
        });
      },
    };
  }

  function seedDefault(entry: Entry, regOptions: RegistrationOptions) {
    if (!('defaultValue' in regOptions)) return;
    const defaults = (form.options.defaultValues ?? {}) as Record<
      string,
      unknown
    >;
    const hasValue = entry.name in (form.state.values as object);
    if (!(entry.name in defaults) && !hasValue) {
      // Baseline and value: `form.update` would reset every untouched value
      // to the new defaults, so both are written by hand.
      form.options = {
        ...form.options,
        defaultValues: { ...defaults, [entry.name]: regOptions.defaultValue },
      };
      form.setFieldValue(entry.name as any, regOptions.defaultValue, {
        dontUpdateMeta: true,
      });
    } else if (
      entry.name in defaults &&
      entry.registrations.size > 0 &&
      !defaultIsEqual(defaults[entry.name], regOptions.defaultValue)
    ) {
      onDevelopmentError(
        `Field "${entry.name}" registered twice with conflicting defaultValue; the first registration's default is kept.`,
      );
    }
  }

  // -- values -------------------------------------------------------------

  function setValues(values: Partial<T>, setOptions: SetValueOptions = {}) {
    const source = setOptions.source ?? 'program';
    const touch = setOptions.touch ?? source === 'user';
    const notifyChange = setOptions.notify ?? source === 'user';
    const names = Object.keys(values);
    batch(() => {
      const changedNames = names.filter(
        (name) =>
          !Object.is(
            (form.state.values as Record<string, unknown>)[name],
            (values as Record<string, unknown>)[name],
          ),
      );
      const touchChanges = touch
        ? names.filter((name) => !form.getFieldMeta(name as any)?.isTouched)
        : [];
      if (!changedNames.length && !touchChanges.length) return;
      for (const name of changedNames) {
        const entry = entries.get(name);
        if (entry) entry.revision += 1;
      }
      // One `baseStore.setState` is the only way to change several values and
      // their meta in one notification: FormApi has no batch command.
      form.baseStore.setState((prev: any) => {
        const nextValues = { ...prev.values, ...values };
        let fieldMetaBase = prev.fieldMetaBase;
        if (touch) {
          fieldMetaBase = { ...fieldMetaBase };
          for (const name of names) {
            fieldMetaBase[name] = {
              ...(fieldMetaBase[name] ?? {
                isTouched: false,
                isBlurred: false,
                isDirty: false,
                isValidating: false,
                errorMap: {},
                errorSourceMap: {},
              }),
              isTouched: true,
              isDirty: true,
            };
          }
        }
        return { ...prev, values: nextValues, fieldMetaBase };
      });
      for (const name of changedNames) {
        const entry = entries.get(name);
        if (entry?.api && entry.registrations.size > 0) {
          const trigger = entry.owner?.options.validateTrigger ?? 'onBlur';
          const hadErrors =
            (form.getFieldMeta(name as any)?.errors?.length ?? 0) > 0;
          if (
            setOptions.validate === 'always' ||
            (setOptions.validate !== 'never' &&
              (trigger === 'onChange' || hadErrors))
          ) {
            // Error maps are per cause: a `change` run does not touch the
            // errors a blur/submit run produced, so "revalidate because the
            // field shows errors" has to run every validator (`submit`).
            void form.validateField(
              name as any,
              hadErrors ? 'submit' : 'change',
            );
          } else {
            entry.api.setMeta((meta: any) => ({
              ...meta,
              errorMap: {},
              errorSourceMap: {},
            }));
          }
        }
      }
      if (notifyChange && names.length)
        pendingChanges.push({ names, source, kind: 'set' });
      ownChange();
    });
  }

  function setDefaultValues(
    defaults: Partial<T>,
    opts: { currentValues?: 'preserve' | 'replace' } = {},
  ) {
    batch(() => {
      form.options = {
        ...form.options,
        defaultValues: { ...(form.options.defaultValues ?? {}), ...defaults },
      };
      if ((opts.currentValues ?? 'preserve') === 'replace') {
        setValues(defaults, { source: 'program', validate: 'never' });
        for (const name of Object.keys(defaults)) {
          form.setFieldMeta(name as any, (meta: any) => ({
            ...meta,
            isTouched: false,
            isDirty: false,
          }));
        }
        pendingChanges.push({
          names: Object.keys(defaults),
          source: 'program',
          kind: 'defaults',
        });
      } else {
        // The derived store only recomputes `isDefaultValue` on a state write.
        form.baseStore.setState((prev: any) => ({ ...prev }));
      }
      ownChange();
    });
  }

  function adoptDefaultValues(
    defaults: Partial<T>,
    opts: {
      when?: 'untouched' | 'clean' | 'always';
      preserveDirty?: boolean;
    } = {},
  ) {
    const when = opts.when ?? 'untouched';
    batch(() => {
      const state = getSnapshot();
      const adopt: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(defaults)) {
        const field = state.fields[name];
        const wasDirty = !!field?.dirty;
        const allowed =
          when === 'always' ||
          (when === 'untouched' && !field?.touched) ||
          (when === 'clean' && !wasDirty);
        if (allowed && !(opts.preserveDirty && wasDirty)) adopt[name] = value;
      }
      form.options = {
        ...form.options,
        defaultValues: { ...(form.options.defaultValues ?? {}), ...defaults },
      };
      if (Object.keys(adopt).length) {
        setValues(adopt as Partial<T>, {
          source: 'program',
          validate: 'never',
        });
        pendingChanges.push({
          names: Object.keys(adopt),
          source: 'program',
          kind: 'adopt',
        });
      } else {
        form.baseStore.setState((prev: any) => ({ ...prev }));
      }
      ownChange();
    });
  }

  function reset(opts: { values?: Partial<T> } = {}) {
    batch(() => {
      const nextDefaults = {
        ...(form.options.defaultValues ?? {}),
        ...(opts.values ?? {}),
      };
      for (const entry of entries.values()) {
        entry.revision += 1;
        entry.validatedRevision = null;
      }
      form.reset(nextDefaults as any);
      submitError = undefined;
      pendingChanges.push({
        names: Object.keys(nextDefaults),
        source: 'program',
        kind: 'reset',
      });
      ownChange();
    });
  }

  // -- validation ---------------------------------------------------------

  async function validateOne(entry: Entry): Promise<FieldValidationResult> {
    const revision = entry.revision;
    const raw = (await form.validateField(
      entry.name as any,
      'submit',
    )) as unknown[];
    const stale = entry.revision !== revision || !entry.api;
    if (!stale) entry.validatedRevision = revision;
    ownChange();
    const errors = (raw ?? []).flat() as ReactNode[];
    return { name: entry.name, errors, isValid: errors.length === 0, stale };
  }

  async function validate(
    names?: readonly string[],
  ): Promise<ValidationResult> {
    const targets = (names ?? Array.from(entries.keys()))
      .map((name) => entries.get(name))
      .filter(
        (entry): entry is Entry => !!entry && entry.registrations.size > 0,
      );
    const fields = await Promise.all(targets.map(validateOne));
    return {
      isValid: fields.every((f) => f.isValid && !f.stale),
      stale: fields.some((f) => f.stale),
      fields,
    };
  }

  // -- submission ---------------------------------------------------------

  async function submit(
    opts: { include?: 'active' | 'all' } = {},
  ): Promise<SubmitResult> {
    if (form.state.isSubmitting)
      return { status: 'ignored', reason: 'submitting' };
    submitInclude = opts.include ?? 'active';
    submitError = undefined;
    ownChange();
    const callbacks = resolveCallbacks();
    try {
      await form.handleSubmit();
    } catch (error) {
      submitError = error;
      ownChange();
      await callbacks.onSubmitFailed?.(error);
      return { status: 'failed', error };
    }
    if (!form.state.isSubmitSuccessful) {
      const errors: Record<string, readonly ReactNode[]> = {};
      for (const [name, info] of Object.entries(form.getAllErrors().fields)) {
        errors[name] = (
          info as { errors: unknown[] }
        ).errors.flat() as ReactNode[];
      }
      await callbacks.onSubmitFailed?.(errors);
      return { status: 'invalid', errors };
    }
    return { status: 'submitted' };
  }

  // -- callbacks ----------------------------------------------------------

  function bindCallbacks(callbacks: FormCallbacks<T>): CallbackBinding<T> {
    const id = nextId++;
    let released = false;
    if (binding) {
      onDevelopmentError(
        'A second Form root tried to own the callbacks of this controller; the newest binding wins.',
      );
    }
    binding = { id, callbacks: { ...callbacks } };
    return {
      id,
      get released() {
        return released;
      },
      update(next) {
        if (released || binding?.id !== id) return;
        binding.callbacks = { ...next };
      },
      release() {
        if (released) return;
        released = true;
        if (binding?.id === id) binding = null;
      },
    };
  }

  return {
    '~brand': 'modern-form-store',
    getSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    register,
    getValue: (name) => (form.state.values as Record<string, unknown>)[name],
    getValues: () => getSnapshot().values,
    getActiveValues: () => getSnapshot().activeValues,
    setValue: (name, value, setOptions) =>
      setValues({ [name]: value } as Partial<T>, setOptions),
    setValues,
    batch,
    setDefaultValues,
    adoptDefaultValues,
    reset,
    touch(name) {
      form.setFieldMeta(name as any, (meta: any) => ({
        ...meta,
        isTouched: true,
      }));
    },
    blur(name) {
      entries.get(name)?.api?.handleBlur();
    },
    setFieldErrors(name, errors) {
      const entry = ensureEntry(name);
      if (!entry.api) mountApi(entry);
      entry.api!.setErrorMap({ onServer: errors as any } as any);
      entry.validatedRevision = entry.revision;
      ownChange();
    },
    clearFieldErrors(name) {
      const entry = entries.get(name);
      entry?.api?.setMeta((meta: any) => ({
        ...meta,
        errorMap: {},
        errorSourceMap: {},
      }));
      if (entry) entry.validatedRevision = null;
      ownChange();
    },
    setSubmitError(error) {
      submitError = error;
      ownChange();
    },
    clearSubmitError() {
      if (submitError === undefined) return;
      submitError = undefined;
      ownChange();
    },
    validate,
    submit,
    bindCallbacks,
    dispose() {
      for (const entry of entries.values()) entry.unmount?.();
      listeners.clear();
    },
    debug: {
      publishCount: () => publishCount,
      listenerCount: () => listeners.size,
      // TanStack owns its debounce timers; they are not observable.
      pendingTimerCount: () => -1,
      runningValidationCount: () =>
        Array.from(entries.values()).filter(
          (e) => form.getFieldMeta(e.name as any)?.isValidating,
        ).length,
      registrationCount: () =>
        Array.from(entries.values()).reduce(
          (sum, e) => sum + e.registrations.size,
          0,
        ),
    },
  };
}
