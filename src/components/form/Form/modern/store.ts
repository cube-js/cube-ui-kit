import { FORM_BACKEND } from '../backend';

import {
  createValueSnapshotter,
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
  FieldState,
  FormChange,
  FormState,
  FormStore,
  FormStoreOptions,
  RegistrationOptions,
  RegistrationToken,
  SetValueOptions,
  SubmissionToken,
  ValidationToken,
} from './types';
import type { FormPath } from './values';

interface Registration {
  options: RegistrationOptions;
  order: number;
}

interface FieldRecord<ErrorValue> {
  name: string;
  path: readonly string[];
  /** Defaults create aggregate metadata; explicit commands/fields own guards. */
  explicit: boolean;
  registrations: Set<Registration>;
  owner?: Registration;
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
      Object.defineProperty(result, key, {
        value: projectActive(
          Reflect.get(value, key),
          child,
          readPath(previous, [key]),
        ),
        enumerable: true,
      });
    }
  }
  return formValueEqual(result, previous) ? previous : freezeContainer(result);
}

/**
 * Phase 4's framework-neutral command layer. Not exported from the package.
 * React registration, root callbacks, rule execution and submit orchestration
 * are deliberately separate later phases; their state transitions live here.
 */
export function createFormStore<
  T extends object = Record<string, unknown>,
  ErrorValue = unknown,
>(options: FormStoreOptions<T> = {}): FormStore<T, ErrorValue> {
  const ownValue = createValueSnapshotter();
  const records = new Map<string, FieldRecord<ErrorValue>>();
  // Subscription identity belongs to the registration, not to the callback.
  const listeners = new Set<{ notify: () => void }>();
  let values: object = ownValue(options.defaultValues ?? {});
  let defaults = values;
  let submitError: unknown;
  let submission: AbortController | undefined;
  let order = 0;
  let depth = 0;
  let notifying = false;
  let disposed = false;
  let pending = false;
  let changes: FormChange[] = [];

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
    // Reentrant abort handlers see an already invalidated token.
    controller?.abort();
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
      while (pending && !disposed) {
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
        if (events.length && !disposed && options.onValuesChange) {
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
            const result = options.onValuesChange(published.values, change);
            if (result) Promise.resolve(result).catch(report);
          } catch (error) {
            report(error);
          }
        }
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
    const record = ensure(path);
    const next = writePath(values, record.path, ownValue(value));
    const changed = next !== values;
    if (changed) {
      values = next;
      for (const other of records.values()) {
        if (related(record.path, other.path)) invalidate(other);
      }
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
    batch(() => {
      write(normalized, value, config);
    });
  }

  function setValues(next: Partial<T>, config?: SetValueOptions) {
    const entries = Object.entries(next).map(
      ([name, value]) => [normalizePath(name), value] as const,
    );
    batch(() => {
      for (const [path, value] of entries) write(path, value, config);
    });
  }

  function seed(record: FieldRecord<ErrorValue>, registration: Registration) {
    if (!Object.hasOwn(registration.options, 'defaultValue')) return;
    const value = ownValue(registration.options.defaultValue);
    if (!hasPath(values, record.path) && !hasPath(defaults, record.path)) {
      values = writePath(values, record.path, value);
      defaults = writePath(defaults, record.path, value);
      record.fieldDefault = { value };
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
    config: RegistrationOptions = {},
  ): RegistrationToken {
    assertLive();
    const record = ensure(path);
    const registration: Registration = {
      options: { ...config },
      order: ++order,
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
      update(next: RegistrationOptions) {
        if (released || disposed) return;
        batch(() => {
          registration.options = { ...next };
          registration.order = ++order;
          // Only an ownership change invalidates; equivalent options pushed
          // after every React commit must not cause a publication loop.
          if (record.owner !== registration) invalidate(record);
          record.owner = registration;
          seed(record, registration);
        });
      },
      release() {
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
              values = writePath(values, record.path, undefined, true);
              record.touched = false;
              for (const other of records.values()) {
                if (other !== record && related(other.path, record.path))
                  invalidate(other);
              }
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
    batch(() => {
      replaceDefaults(next);
      if (config.currentValues === 'replace') {
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
          const when = config.when ?? 'untouched';
          return (
            (when === 'untouched' && record.touched) ||
            (when === 'clean' && dirty(record)) ||
            (config.preserveDirty && dirty(record))
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
      previous?.abort();
      event(names, 'reset');
    });
  }

  function setFieldErrors(path: FormPath, errors: readonly ErrorValue[]) {
    batch(() => {
      const record = ensure(path);
      const status = errors.length ? 'invalid' : 'valid';
      if (record.status === status && formValueEqual(record.errors, errors))
        return;
      invalidate(record);
      record.errors = errors.length ? Object.freeze([...errors]) : EMPTY_ERRORS;
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
        batch(() => {
          record.validation = undefined;
          record.errors = errors.length
            ? Object.freeze([...errors])
            : EMPTY_ERRORS;
          record.status = errors.length ? 'invalid' : 'valid';
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
        batch(() => {
          submission = undefined;
          submitError = result?.error;
        });
        return true;
      },
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
    changes = [];
    pending = false;
    for (const record of records.values()) {
      record.registrations.clear();
      record.owner = undefined;
      invalidate(record);
    }
    const previous = submission;
    submission = undefined;
    previous?.abort();
    state = buildSnapshot();
    records.clear();
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
