import { FORM_BACKEND } from '../backend';

import { rulesSignature, runRules } from './validation';
import {
  createValueSnapshotter,
  defineValue,
  formValueEqual,
  freezeContainer,
  getFieldKey,
  hasPath,
  isPlainObject,
  normalizePath,
  readonlySet,
  readPath,
  sameMembers,
  writePath,
} from './values';

import type {
  CallbackBinding,
  FieldState,
  FormCallbacks,
  FormChange,
  FormState,
  FormStore,
  FormStoreOptions,
  ModernFieldValidationResult,
  ModernSubmitResult,
  ModernValidationResult,
  RegistrationOptions,
  RegistrationToken,
  SetValueOptions,
  SubmissionToken,
  ValidationToken,
} from './types';
import type { FormPath } from './values';

interface Registration<ErrorValue> {
  options: RegistrationOptions<ErrorValue>;
  signature: string;
  order: number;
  defaultConsidered: boolean;
}

interface FieldRecord<ErrorValue> {
  name: string;
  path: readonly string[];
  /** Defaults create aggregate metadata; explicit commands/fields own guards. */
  explicit: boolean;
  registrations: Set<Registration<ErrorValue>>;
  owner?: Registration<ErrorValue>;
  fieldDefault?: { value: unknown };
  touched: boolean;
  errors: readonly ErrorValue[];
  status: FieldState['status'];
  validationRevision: number;
  validation?: AbortController;
}

const EMPTY_ERRORS = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});
const EMPTY_FIELDS = Object.freeze(Object.create(null)) as Readonly<
  Record<string, never>
>;

function related(a: readonly string[], b: readonly string[]): boolean {
  return a
    .slice(0, Math.min(a.length, b.length))
    .every((key, index) => key === b[index]);
}

interface ActivePath {
  terminal: boolean;
  children: Map<string, ActivePath>;
}

/** Only traverse path ancestors; a field's value (even cyclic data) is a leaf. */
function projectActive(
  value: unknown,
  path: ActivePath,
  previous: unknown,
): unknown {
  if (path.terminal) return value;
  const result: Record<string, unknown> | unknown[] = Array.isArray(value)
    ? []
    : {};
  if (isPlainObject(value) || Array.isArray(value)) {
    for (const [key, child] of path.children) {
      if (!Object.hasOwn(value, key)) continue;
      defineValue(
        result,
        key,
        projectActive(
          Reflect.get(value, key),
          child,
          readPath(previous, [key]),
        ),
      );
    }
  }
  return formValueEqual(result, previous) ? previous : freezeContainer(result);
}

/**
 * Framework-neutral store, registration ownership, and async pipelines.
 * Not exported from the package; React receives the public command facade.
 */
export function createFormStore<
  T extends object = Record<string, unknown>,
  ErrorValue = unknown,
>(inputOptions: FormStoreOptions<T> = {}): FormStore<T, ErrorValue> {
  const options = { ...inputOptions };
  const ownValue = createValueSnapshotter();
  const records = new Map<string, FieldRecord<ErrorValue>>();
  // Subscription identity belongs to the registration, not to the callback.
  const listeners = new Set<{ notify: () => void }>();
  let values: object = ownValue(options.defaultValues ?? {});
  let defaults = values;
  let submitError: unknown;
  let submission: AbortController | undefined;
  let binding: { callbacks: FormCallbacks<T> } | undefined;
  let order = 0;
  let depth = 0;
  let notifying = false;
  let disposed = false;
  let pending = false;
  let changes: FormChange[] = [];
  const cancellations = new Set<AbortController>();

  let state: FormState<T, ErrorValue> = Object.freeze({
    values: values as Partial<T>,
    defaultValues: defaults as Partial<T>,
    activeValues: EMPTY_OBJECT,
    fields: EMPTY_FIELDS,
    dirtyFields: readonlySet<string>([]),
    touchedFields: readonlySet<string>([]),
    isDirty: false,
    isTouched: false,
    isValid: false,
    isInvalid: false,
    isValidating: false,
    isSubmitting: false,
    submitError: undefined,
    revision: 0,
  });

  function assertLive() {
    if (disposed) throw new Error('Cannot use a disposed modern form store.');
  }

  function report(error: unknown) {
    try {
      if (options.onListenerError) options.onListenerError(error);
      else console.error('[form-store] Listener failed', error);
    } catch (reportError) {
      // An error reporter must not break delivery to the remaining listeners.
      console.error('[form-store] Error reporter failed', reportError);
    }
  }

  function developmentError(message: string) {
    if (process.env.NODE_ENV === 'production') return;
    try {
      if (options.onDevelopmentError) options.onDevelopmentError(message);
      else console.error(`[form-store] ${message}`);
    } catch (error) {
      report(error);
    }
  }

  function ensure(path: FormPath, explicit = true): FieldRecord<ErrorValue> {
    const normalized = normalizePath(path);
    const name = getFieldKey(normalized);
    let record = records.get(name);
    if (!record) {
      record = {
        name,
        path: normalized,
        explicit,
        registrations: new Set(),
        touched: false,
        errors: EMPTY_ERRORS,
        status: 'unvalidated',
        validationRevision: 0,
      };
      records.set(name, record);
    }
    record.explicit ||= explicit;
    return record;
  }

  function dirty(record: FieldRecord<ErrorValue>): boolean {
    return (
      hasPath(values, record.path) &&
      !(record.owner?.options.isEqual ?? formValueEqual)(
        readPath(values, record.path),
        readPath(defaults, record.path),
      )
    );
  }

  function invalidate(record: FieldRecord<ErrorValue>, keepErrors = false) {
    const controller = record.validation;
    record.validation = undefined;
    record.validationRevision++;
    record.status = 'unvalidated';
    if (!keepErrors) record.errors = EMPTY_ERRORS;
    // Abort handlers are user code. Deliver them after the complete snapshot
    // publishes, so they cannot interleave writes with the command cancelling
    // them (or resurrect a token that command later overwrites).
    if (controller) cancellations.add(controller);
  }

  function cancelPending() {
    for (const controller of Array.from(cancellations)) {
      cancellations.delete(controller);
      controller.abort();
    }
  }

  function invalidateRelated(
    path: readonly string[],
    previous: object,
    config?: SetValueOptions,
  ) {
    for (const record of records.values()) {
      if (
        related(path, record.path) ||
        !Object.is(
          readPath(previous, record.path),
          readPath(values, record.path),
        ) ||
        hasPath(previous, record.path) !== hasPath(values, record.path)
      ) {
        const revalidate =
          !!config &&
          !!record.registrations.size &&
          (config.validate === 'always' ||
            (config.validate !== 'never' &&
              (record.owner?.options.validateTrigger === 'onChange' ||
                !!record.errors.length)));
        invalidate(record, revalidate);
        if (revalidate) void validateRecord(record, false);
      }
    }
  }

  function activeValues(): object {
    const tree: ActivePath = { terminal: false, children: new Map() };
    // A registered parent includes its complete object, including inactive
    // descendants. Register only the leaves to submit only those leaves.
    for (const record of records.values()) {
      if (!record.registrations.size || !hasPath(values, record.path)) continue;
      let node = tree;
      for (const key of record.path) {
        let child = node.children.get(key);
        if (!child) {
          child = { terminal: false, children: new Map() };
          node.children.set(key, child);
        }
        node = child;
      }
      node.terminal = true;
    }
    return projectActive(values, tree, state.activeValues) as object;
  }

  function buildSnapshot(): FormState<T, ErrorValue> {
    const fields: Record<string, FieldState<ErrorValue>> = Object.create(null);
    const dirtyNames = new Set<string>();
    const touchedNames = new Set<string>();
    let activeCount = 0;
    let validCount = 0;
    let invalid = false;
    let validating = false;
    for (const record of records.values()) {
      const field: FieldState<ErrorValue> = {
        name: record.name,
        value: readPath(values, record.path),
        defaultValue: readPath(defaults, record.path),
        errors: record.errors,
        status: record.status,
        touched: record.touched,
        dirty: dirty(record),
        active: record.registrations.size > 0,
        registrationCount: record.registrations.size,
        validationRevision: record.validationRevision,
      };
      const previous = state.fields[record.name];
      Object.defineProperty(fields, record.name, {
        value: formValueEqual(field, previous)
          ? previous
          : Object.freeze(field),
        enumerable: true,
      });
      if (field.dirty) dirtyNames.add(record.name);
      if (field.touched) touchedNames.add(record.name);
      if (field.active) {
        activeCount++;
        if (field.status === 'valid') validCount++;
        invalid ||= field.status === 'invalid';
        validating ||= field.status === 'validating';
      }
    }
    const next: FormState<T, ErrorValue> = {
      values: values as Partial<T>,
      defaultValues: defaults as Partial<T>,
      activeValues: activeValues() as Partial<T>,
      fields: formValueEqual(fields, state.fields)
        ? state.fields
        : Object.freeze(fields),
      dirtyFields: sameMembers(dirtyNames, state.dirtyFields)
        ? state.dirtyFields
        : readonlySet(dirtyNames),
      touchedFields: sameMembers(touchedNames, state.touchedFields)
        ? state.touchedFields
        : readonlySet(touchedNames),
      isDirty: dirtyNames.size > 0,
      isTouched: touchedNames.size > 0,
      isValid: activeCount > 0 && validCount === activeCount,
      isInvalid: invalid,
      isValidating: validating,
      isSubmitting: !!submission,
      submitError,
      revision: state.revision,
    };
    if (formValueEqual(next, state)) return state;
    return Object.freeze({ ...next, revision: state.revision + 1 });
  }

  function flush() {
    if (depth || notifying || disposed) return;
    notifying = true;
    try {
      while ((pending || cancellations.size) && !disposed) {
        pending = false;
        const events = changes;
        changes = [];
        const previous = state;
        state = buildSnapshot();
        const published = state;
        if (state !== previous) {
          for (const listener of Array.from(listeners)) {
            if (!listeners.has(listener)) continue;
            try {
              listener.notify();
            } catch (error) {
              report(error);
            }
          }
        }
        if (events.length && !disposed && resolveCallbacks().onValuesChange) {
          // One callback per transaction; names are unioned, user source wins,
          // and the final command supplies the transaction's kind.
          const change: FormChange = Object.freeze({
            names: Object.freeze(
              Array.from(new Set(events.flatMap((event) => event.names))),
            ),
            source: events.some((event) => event.source === 'user')
              ? 'user'
              : 'program',
            kind: events[events.length - 1].kind,
          });
          try {
            const result = resolveCallbacks().onValuesChange?.(
              published.values,
              change,
            );
            if (result) Promise.resolve(result).catch(report);
          } catch (error) {
            report(error);
          }
        }
        cancelPending();
      }
    } finally {
      notifying = false;
    }
  }

  function batch(fn: () => void) {
    assertLive();
    depth++;
    try {
      fn();
    } finally {
      depth--;
      pending = true;
      flush();
    }
  }

  function event(
    names: string[],
    kind: FormChange['kind'],
    source: FormChange['source'] = 'program',
  ) {
    if (names.length) changes.push({ names, kind, source });
  }

  function write(
    path: FormPath,
    value: unknown,
    config: SetValueOptions = {},
  ): boolean {
    const normalized = normalizePath(path);
    const previous = values;
    const next = writePath(values, normalized, ownValue(value));
    const record = ensure(normalized);
    const changed = next !== values;
    if (changed) {
      values = next;
      invalidateRelated(record.path, previous, config);
    }
    if (config.touch ?? config.source === 'user') record.touched = true;
    if (changed && (config.notify ?? config.source === 'user')) {
      event([record.name], 'set', config.source);
    }
    return changed;
  }

  function setValue(path: FormPath, value: unknown, config?: SetValueOptions) {
    // Validate paths before entering a transaction (no partial invalid writes).
    const normalized = normalizePath(path);
    const prepared = { ...config };
    batch(() => {
      write(normalized, value, prepared);
    });
  }

  function setValues(next: Partial<T>, config?: SetValueOptions) {
    assertLive();
    const prepared = { ...config };
    const entries = Object.entries(next).map(
      ([name, value]) => [normalizePath(name), ownValue(value)] as const,
    );
    // Copying input or an invalid array-length write can throw. Check every
    // value/path before the first write, including when inside an outer batch.
    let checked = values;
    for (const [path, value] of entries)
      checked = writePath(checked, path, value);
    batch(() => {
      for (const [path, value] of entries) write(path, value, prepared);
    });
  }

  function prepareRegistration(
    path: FormPath,
    config: RegistrationOptions<ErrorValue>,
  ): RegistrationOptions<ErrorValue> {
    const prepared = {
      ...config,
      rules: config.rules?.map((rule) =>
        Object.freeze({
          ...rule,
          ...(rule.enum ? { enum: Object.freeze([...rule.enum]) } : {}),
        }),
      ),
    };
    if (Object.hasOwn(prepared, 'defaultValue')) {
      prepared.defaultValue = ownValue(prepared.defaultValue);
      const normalized = normalizePath(path);
      if (!hasPath(values, normalized) && !hasPath(defaults, normalized)) {
        writePath(values, normalized, prepared.defaultValue);
        writePath(defaults, normalized, prepared.defaultValue);
      }
    }
    return prepared;
  }

  function seed(
    record: FieldRecord<ErrorValue>,
    registration: Registration<ErrorValue>,
  ) {
    if (
      registration.defaultConsidered ||
      !Object.hasOwn(registration.options, 'defaultValue')
    )
      return;
    registration.defaultConsidered = true;
    const value = ownValue(registration.options.defaultValue);
    if (!hasPath(values, record.path) && !hasPath(defaults, record.path)) {
      const previous = values;
      values = writePath(values, record.path, value);
      defaults = writePath(defaults, record.path, value);
      record.fieldDefault = { value };
      invalidateRelated(record.path, previous);
    } else if (
      record.fieldDefault &&
      record.registrations.size > 1 &&
      !formValueEqual(record.fieldDefault.value, value)
    ) {
      developmentError(
        `Field "${record.name}" registered with conflicting defaultValue; the first default is kept.`,
      );
    }
  }

  function register(
    path: FormPath,
    config: RegistrationOptions<ErrorValue> = {},
  ): RegistrationToken<ErrorValue> {
    assertLive();
    const normalized = normalizePath(path);
    const prepared = prepareRegistration(normalized, config);
    const signature = prepared.rulesKey ?? rulesSignature(prepared.rules);
    const record = ensure(normalized);
    const registration: Registration<ErrorValue> = {
      options: prepared,
      signature,
      order: ++order,
      defaultConsidered: false,
    };
    let released = false;
    batch(() => {
      record.registrations.add(registration);
      record.owner = registration;
      seed(record, registration);
      invalidate(record);
    });
    return Object.freeze({
      name: record.name,
      get released() {
        return released || disposed;
      },
      update(next: RegistrationOptions<ErrorValue>) {
        if (released || disposed) return;
        const prepared = prepareRegistration(record.path, next);
        const signature = prepared.rulesKey ?? rulesSignature(prepared.rules);
        const validationChanged =
          registration.signature !== signature ||
          registration.options.validationDelay !== prepared.validationDelay ||
          registration.options.validateTrigger !== prepared.validateTrigger ||
          registration.options.errorPolicy !== prepared.errorPolicy;
        const hasNewDefault =
          !registration.defaultConsidered &&
          Object.hasOwn(prepared, 'defaultValue');
        if (
          !hasNewDefault &&
          !validationChanged &&
          (registration.options.preserve ?? true) ===
            (prepared.preserve ?? true) &&
          registration.options.isEqual === prepared.isEqual
        ) {
          // Keep the latest closures/messages without invalidating equivalent rules.
          registration.options = prepared;
          return;
        }
        batch(() => {
          registration.options = prepared;
          registration.signature = signature;
          registration.order = ++order;
          // Only an ownership change invalidates; equivalent options pushed
          // after every React commit must not cause a publication loop.
          if (record.owner !== registration || validationChanged)
            invalidate(record);
          record.owner = registration;
          seed(record, registration);
        });
      },
      release(config: { deferValueRemoval?: boolean } = {}) {
        if (released || disposed) return;
        released = true;
        batch(() => {
          record.registrations.delete(registration);
          if (record.owner === registration) {
            record.owner = Array.from(record.registrations).sort(
              (a, b) => b.order - a.order,
            )[0];
            invalidate(record);
          }
          if (!record.registrations.size) {
            if (registration.options.preserve === false) {
              const removeValue = () => {
                values = writePath(values, record.path, undefined, true);
                record.touched = false;
                for (const other of records.values()) {
                  if (other !== record && related(other.path, record.path))
                    invalidate(other);
                }
                if (!hasPath(defaults, record.path))
                  records.delete(record.name);
              };
              if (config.deferValueRemoval) {
                // Unregister and abort immediately. Only destructive retention
                // cleanup waits one microtask, allowing Strict Mode's effect
                // replay to reconnect without losing the current value.
                const revision = record.validationRevision;
                queueMicrotask(() => {
                  if (
                    !disposed &&
                    records.get(record.name) === record &&
                    !record.registrations.size &&
                    record.validationRevision === revision
                  )
                    batch(removeValue);
                });
              } else removeValue();
            }
            if (
              !hasPath(values, record.path) &&
              !hasPath(defaults, record.path)
            )
              records.delete(record.name);
          }
        });
      },
    });
  }

  function replaceDefaults(next: Partial<T>) {
    const entries = Object.keys(next);
    entries.forEach((name) => normalizePath(name));
    defaults = ownValue(next);
    for (const name of entries) ensure(name, false);
    for (const record of records.values()) record.fieldDefault = undefined;
  }

  function setDefaultValues(
    next: Partial<T>,
    config: { currentValues?: 'preserve' | 'replace' } = {},
  ) {
    const replace = config.currentValues === 'replace';
    batch(() => {
      replaceDefaults(next);
      if (replace) {
        values = defaults;
        for (const record of records.values()) {
          invalidate(record);
          record.touched = false;
        }
        event(Array.from(records.keys()), 'defaults');
      }
    });
  }

  function adoptDefaultValues(
    next: Partial<T>,
    config: {
      when?: 'untouched' | 'clean' | 'always';
      preserveDirty?: boolean;
    } = {},
  ) {
    const when = config.when ?? 'untouched';
    const preserveDirty = config.preserveDirty ?? false;
    batch(() => {
      // Retain edits at the narrowest guarded field path. This also protects a
      // nested edited leaf when the server replaces its containing object.
      const candidates = Array.from(records.values());
      const preserved = candidates
        .filter((record) => {
          // An implicitly tracked parent must not shield untouched siblings
          // when an explicit nested field is the actual edited control.
          if (
            !record.explicit &&
            candidates.some(
              (child) =>
                child.explicit &&
                child.path.length > record.path.length &&
                related(record.path, child.path),
            )
          )
            return false;
          return (
            (when === 'untouched' && record.touched) ||
            (when === 'clean' && dirty(record)) ||
            (preserveDirty && dirty(record))
          );
        })
        .map((record) => ({
          path: record.path,
          exists: hasPath(values, record.path),
          value: readPath(values, record.path),
        }));
      const previous = values;
      replaceDefaults(next);
      values = defaults;
      for (const saved of preserved.sort(
        (a, b) => a.path.length - b.path.length,
      )) {
        values = writePath(values, saved.path, saved.value, !saved.exists);
      }
      const names: string[] = [];
      for (const record of records.values()) {
        if (
          !Object.is(
            readPath(previous, record.path),
            readPath(values, record.path),
          ) ||
          hasPath(previous, record.path) !== hasPath(values, record.path)
        ) {
          invalidate(record);
          names.push(record.name);
        }
      }
      event(names, 'adopt');
    });
  }

  function reset(config: { values?: Partial<T> } = {}) {
    batch(() => {
      if (Object.hasOwn(config, 'values')) replaceDefaults(config.values ?? {});
      values = defaults;
      const names = Array.from(records.keys());
      for (const record of records.values()) {
        invalidate(record);
        record.touched = false;
        if (!record.registrations.size && !hasPath(values, record.path))
          records.delete(record.name);
      }
      const previous = submission;
      submission = undefined;
      submitError = undefined;
      if (previous) cancellations.add(previous);
      event(names, 'reset');
    });
  }

  function setFieldErrors(path: FormPath, errors: readonly ErrorValue[]) {
    assertLive();
    const copied = errors.length ? Object.freeze([...errors]) : EMPTY_ERRORS;
    batch(() => {
      const record = ensure(path);
      const status = copied.length ? 'invalid' : 'valid';
      if (record.status === status && formValueEqual(record.errors, copied))
        return;
      invalidate(record);
      record.errors = copied;
      record.status = status;
    });
  }

  function startValidation(path: FormPath): ValidationToken<ErrorValue> {
    assertLive();
    const record = records.get(getFieldKey(path));
    if (!record?.registrations.size)
      throw new Error('Only active form fields can validate.');
    const controller = new AbortController();
    batch(() => {
      invalidate(record, true);
      record.validation = controller;
      record.status = 'validating';
    });
    const current = () =>
      !disposed &&
      record.validation === controller &&
      !controller.signal.aborted;
    return Object.freeze({
      signal: controller.signal,
      complete(errors: readonly ErrorValue[]) {
        if (!current()) return false;
        const copied = errors.length
          ? Object.freeze([...errors])
          : EMPTY_ERRORS;
        batch(() => {
          record.validation = undefined;
          record.errors = copied;
          record.status = copied.length ? 'invalid' : 'valid';
        });
        return true;
      },
      cancel() {
        if (current())
          batch(() => {
            invalidate(record, true);
          });
      },
    });
  }

  function startSubmission(): SubmissionToken | undefined {
    assertLive();
    if (submission) return undefined;
    const controller = new AbortController();
    batch(() => {
      submission = controller;
      submitError = undefined;
    });
    return Object.freeze({
      signal: controller.signal,
      complete(result?: { error: unknown }) {
        if (disposed || submission !== controller || controller.signal.aborted)
          return false;
        const error = result?.error;
        batch(() => {
          submission = undefined;
          submitError = error;
        });
        return true;
      },
    });
  }

  function validateRecord(
    record: FieldRecord<ErrorValue>,
    immediate: boolean,
    parentSignal?: AbortSignal,
  ): Promise<ModernFieldValidationResult<ErrorValue>> {
    const result = (errors: readonly ErrorValue[], stale = false) => ({
      name: record.name,
      errors,
      isValid: !stale && !errors.length,
      stale,
    });
    if (parentSignal?.aborted)
      return Promise.resolve(result(EMPTY_ERRORS, true));
    const config = record.owner?.options;
    const rules = config?.rules ?? [];
    const token = startValidation(record.path);
    const revision = record.validationRevision;
    if (token.signal.aborted || parentSignal?.aborted) {
      token.cancel();
      return Promise.resolve(result(EMPTY_ERRORS, true));
    }
    if (!rules.length) {
      const committed = token.complete(EMPTY_ERRORS);
      return Promise.resolve(
        result(
          EMPTY_ERRORS,
          !committed || record.validationRevision !== revision,
        ),
      );
    }
    const value = readPath(values, record.path);
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let settled = false;
      const finish = (errors: readonly ErrorValue[], stale: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        token.signal.removeEventListener('abort', abort);
        parentSignal?.removeEventListener('abort', cancel);
        resolve(result(errors, stale));
      };
      const abort = () => finish(EMPTY_ERRORS, true);
      const cancel = () => token.cancel();
      token.signal.addEventListener('abort', abort, { once: true });
      parentSignal?.addEventListener('abort', cancel, { once: true });
      const run = async () => {
        timer = undefined;
        const errors = await runRules(
          value,
          rules,
          {
            name: record.name,
            signal: token.signal,
            getValue: (path) => readPath(values, normalizePath(path)),
            getValues: () => values as Partial<T>,
          },
          config?.errorPolicy ?? options.errorPolicy ?? 'first',
        );
        if (!settled) {
          const committed = token.complete(errors);
          finish(
            Object.freeze(errors),
            !committed ||
              record.validationRevision !== revision ||
              !!parentSignal?.aborted,
          );
        }
      };
      const delay = immediate ? 0 : config?.validationDelay ?? 0;
      if (delay > 0) timer = setTimeout(() => void run(), delay);
      else void run();
    });
  }

  function validate(
    paths?: readonly FormPath[],
    config: { immediate?: boolean; signal?: AbortSignal } = {},
  ): Promise<ModernValidationResult<ErrorValue>> {
    assertLive();
    const targets = paths
      ? Array.from(new Set(paths.map(getFieldKey))).map((key) =>
          records.get(key),
        )
      : Array.from(records.values());
    const active = targets.filter(
      (record): record is FieldRecord<ErrorValue> =>
        !!record?.registrations.size,
    );
    let runs: Promise<ModernFieldValidationResult<ErrorValue>>[] = [];
    let revisions: number[] = [];
    batch(() => {
      runs = active.map((record) =>
        validateRecord(record, config.immediate ?? true, config.signal),
      );
      // Capture before publishing: a synchronous subscriber can edit/reset.
      revisions = active.map((record) => record.validationRevision);
    });
    return Promise.all(runs).then((results) => {
      const fields = results.map((result, index) => {
        const record = active[index];
        return record.validationRevision === revisions[index] &&
          !!record.registrations.size &&
          !config.signal?.aborted
          ? result
          : { ...result, stale: true, isValid: false };
      });
      return {
        fields,
        stale: fields.some((field) => field.stale) || !!config.signal?.aborted,
        isValid: !!fields.length && fields.every((field) => field.isValid),
      };
    });
  }

  function resolveCallbacks(): FormCallbacks<T> {
    return { ...options, ...binding?.callbacks };
  }

  function cancelSubmission() {
    batch(() => {
      if (submission) cancellations.add(submission);
      submission = undefined;
    });
  }

  function bindCallbacks(callbacks: FormCallbacks<T>): CallbackBinding<T> {
    assertLive();
    if (binding)
      developmentError(
        'A second Form root owns this controller; the newest callback binding wins.',
      );
    const own = { callbacks: { ...callbacks } };
    binding = own;
    let released = false;
    return Object.freeze({
      update(next: FormCallbacks<T>) {
        if (!released && !disposed && binding === own)
          own.callbacks = { ...next };
      },
      release() {
        if (released || disposed) return;
        released = true;
        if (binding === own) {
          binding = undefined;
          cancelSubmission();
        }
      },
    });
  }

  async function submit(
    config: { include?: 'active' | 'all' } = {},
  ): Promise<ModernSubmitResult<ErrorValue>> {
    const token = startSubmission();
    if (!token) return { status: 'ignored', reason: 'submitting' };
    const include = config.include ?? 'active';
    // Cancellation settles promptly even if a validator or callback ignores its signal.
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: ModernSubmitResult<ErrorValue>) => {
        if (settled) return;
        settled = true;
        token.signal.removeEventListener('abort', abort);
        resolve(result);
      };
      const abort = () => finish({ status: 'stale' });
      token.signal.addEventListener('abort', abort, { once: true });
      if (token.signal.aborted) {
        abort();
        return;
      }
      const run = async () => {
        const pendingValidation = validate(undefined, { signal: token.signal });
        const validatedRecords = Array.from(records.values()).filter(
          (record) => record.registrations.size,
        );
        const revisions = validatedRecords.map(
          (record) => record.validationRevision,
        );
        const validation = await pendingValidation;
        if (settled) return;
        const changedSinceValidation =
          validatedRecords.length !== validation.fields.length ||
          validatedRecords.length !==
            Array.from(records.values()).filter(
              (record) => record.registrations.size,
            ).length ||
          validatedRecords.some(
            (record, index) =>
              !record.registrations.size ||
              record.validationRevision !== revisions[index],
          );
        if (validation.stale || changedSinceValidation) {
          token.complete();
          finish({ status: 'stale' });
          return;
        }
        const callbacks = resolveCallbacks();
        let result: ModernSubmitResult<ErrorValue>;
        if (!validation.isValid) {
          const errors = Object.fromEntries(
            validation.fields
              .filter((field) => !field.isValid)
              .map((field) => [field.name, field.errors]),
          );
          result = { status: 'invalid', errors: Object.freeze(errors) };
          try {
            await callbacks.onSubmitFailed?.(errors);
          } catch (error) {
            report(error);
          }
          if (!settled) {
            token.complete();
            finish(result);
          }
          return;
        }
        try {
          await callbacks.onSubmit?.(
            (include === 'all' ? values : activeValues()) as Partial<T>,
            { include, signal: token.signal },
          );
          result = { status: 'submitted' };
        } catch (error) {
          if (settled) return;
          // Keep the guard active while failure callbacks run.
          batch(() => {
            submitError = error;
          });
          try {
            await callbacks.onSubmitFailed?.(error);
          } catch (failure) {
            report(failure);
          }
          result = { status: 'failed', error };
        }
        if (!settled) {
          token.complete(
            result.status === 'failed' ? { error: result.error } : undefined,
          );
          finish(result);
        }
      };
      void run().catch((error) => {
        if (!settled) {
          token.complete({ error });
          finish({ status: 'failed', error });
        }
      });
    });
  }

  function subscribe(listener: () => void) {
    assertLive();
    const entry = { notify: listener };
    listeners.add(entry);
    return () => {
      listeners.delete(entry);
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    listeners.clear();
    binding = undefined;
    changes = [];
    pending = false;
    for (const record of records.values()) {
      record.registrations.clear();
      record.owner = undefined;
      invalidate(record);
    }
    const previous = submission;
    submission = undefined;
    if (previous) cancellations.add(previous);
    state = buildSnapshot();
    records.clear();
    cancelPending();
  }

  for (const name of Object.keys(values)) ensure(name, false);
  state = buildSnapshot();

  return Object.freeze({
    [FORM_BACKEND]: 'modern' as const,
    getSnapshot: () => state,
    getFieldSnapshot: (path: FormPath) => state.fields[getFieldKey(path)],
    getValue: (path: FormPath) => readPath(values, normalizePath(path)),
    getValues: () => values as Partial<T>,
    getActiveValues: () => activeValues() as Partial<T>,
    subscribe,
    subscribeSelector<Selected>(
      selector: (snapshot: FormState<T, ErrorValue>) => Selected,
      listener: (value: Selected, previous: Selected) => void,
      isEqual: (a: Selected, b: Selected) => boolean = Object.is,
    ) {
      let selected = selector(state);
      return subscribe(() => {
        const next = selector(state);
        if (isEqual(selected, next)) return;
        const previous = selected;
        selected = next;
        listener(next, previous);
      });
    },
    register,
    validate,
    submit,
    bindCallbacks,
    blur(path: FormPath) {
      const record = records.get(getFieldKey(path));
      if (!record?.registrations.size) return;
      batch(() => {
        record.touched = true;
        if ((record.owner?.options.validateTrigger ?? 'onBlur') === 'onBlur')
          void validateRecord(record, false);
      });
    },
    setValue,
    setValues,
    batch,
    setDefaultValues,
    adoptDefaultValues,
    reset,
    touch(path: FormPath, touched = true) {
      batch(() => {
        ensure(path).touched = touched;
      });
    },
    setFieldErrors,
    clearFieldErrors: (path: FormPath) => setFieldErrors(path, EMPTY_ERRORS),
    startValidation,
    startSubmission,
    setSubmitError(error: unknown) {
      batch(() => {
        submitError = error;
      });
    },
    clearSubmitError() {
      batch(() => {
        submitError = undefined;
      });
    },
    dispose,
    debug: Object.freeze({
      listenerCount: () => listeners.size,
      registrationCount: () =>
        Array.from(records.values()).reduce(
          (count, record) => count + record.registrations.size,
          0,
        ),
    }),
  }) as FormStore<T, ErrorValue>;
}
