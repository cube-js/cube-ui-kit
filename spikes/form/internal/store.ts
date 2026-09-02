/**
 * Phase 2 spike — internal modern Form store.
 *
 * Framework-neutral. Owns values, defaults, registration tokens, validation
 * timers/abort state, callbacks and submission. Publishes one immutable,
 * structurally shared snapshot per command or batch.
 *
 * DISPOSABLE: this file exists to produce evidence for the architecture ADR.
 * Names are drafts (plan §6 / §14).
 */
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type FieldStatus = 'unvalidated' | 'validating' | 'valid' | 'invalid';
export type ChangeSource = 'user' | 'program';
export type ValidateTrigger = 'onChange' | 'onBlur' | 'onSubmit';
export type ErrorPolicy = 'first' | 'all';

export interface ValidationContext<T extends object> {
  readonly name: string;
  readonly signal: AbortSignal;
  getValue(name: string): unknown;
  getValues(): Readonly<Partial<T>>;
}

/** A validator rejects/throws or returns a message to fail. */
export type RuleValidator<T extends object = any> = (
  rule: ValidationRule<T>,
  value: unknown,
  context: ValidationContext<T>,
) => Promise<ReactNode | void> | ReactNode | void;

export interface ValidationRule<T extends object = any> {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: RuleValidator<T>;
  message?: ReactNode;
}

export interface FieldState<V = unknown> {
  readonly name: string;
  readonly value: V | undefined;
  readonly defaultValue: V | undefined;
  readonly errors: readonly ReactNode[];
  readonly status: FieldStatus;
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly active: boolean;
  readonly registrationCount: number;
  readonly validationRevision: number;
}

export interface FormState<T extends object = Record<string, unknown>> {
  /** Retained values, including values seeded before a field registers. */
  readonly values: Readonly<Partial<T>>;
  /** Values of fields with at least one live registration. */
  readonly activeValues: Readonly<Partial<T>>;
  readonly defaultValues: Readonly<Partial<T>>;
  readonly fields: Readonly<Record<string, FieldState>>;
  readonly dirtyFields: ReadonlySet<string>;
  readonly touchedFields: ReadonlySet<string>;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  /** Every active field validated and valid (false with no active fields). */
  readonly isValid: boolean;
  /** At least one active field invalid. */
  readonly isInvalid: boolean;
  readonly isValidating: boolean;
  readonly isSubmitting: boolean;
  readonly submitError: unknown;
  readonly revision: number;
}

export interface RegistrationOptions {
  /** Seeds the store only on first registration when no value/default exists. */
  defaultValue?: unknown;
  rules?: readonly ValidationRule[];
  /** Overrides the structural rules signature used for revision bumps. */
  rulesKey?: string;
  validationDelay?: number;
  validateTrigger?: ValidateTrigger;
  /** Keep the retained value after the final release. Default true. */
  preserve?: boolean;
  isEqual?: (a: unknown, b: unknown) => boolean;
}

export interface RegistrationToken {
  readonly id: number;
  readonly name: string;
  readonly released: boolean;
  update(options: RegistrationOptions): void;
  release(): void;
}

export interface FormChange {
  readonly names: readonly string[];
  readonly source: ChangeSource;
  readonly kind: 'set' | 'reset' | 'adopt' | 'defaults';
}

export interface SubmitContext {
  readonly include: 'active' | 'all';
}

export interface FormCallbacks<T extends object = Record<string, unknown>> {
  onSubmit?: (
    values: Readonly<Partial<T>>,
    context: SubmitContext,
  ) => void | Promise<void>;
  onSubmitFailed?: (error: unknown) => void | Promise<void>;
  onValuesChange?: (
    values: Readonly<Partial<T>>,
    change: FormChange,
  ) => void | Promise<void>;
}

export interface CallbackBinding<T extends object = Record<string, unknown>> {
  readonly id: number;
  readonly released: boolean;
  update(callbacks: FormCallbacks<T>): void;
  release(): void;
}

export interface SetValueOptions {
  /** Mark the field touched. Default true for `user`, false for `program`. */
  touch?: boolean;
  /**
   * `'auto'` (default) revalidates when the field trigger is `onChange` or the
   * field already shows errors; `'always'` and `'never'` are explicit.
   */
  validate?: 'auto' | 'always' | 'never';
  /** Default `'program'`; field bindings pass `'user'`. */
  source?: ChangeSource;
  /** Invoke `onValuesChange`. Default true for `user`, false for `program`. */
  notify?: boolean;
}

export interface FieldValidationResult {
  readonly name: string;
  readonly errors: readonly ReactNode[];
  readonly isValid: boolean;
  /** Superseded by a newer value/rule/reset before it could commit. */
  readonly stale: boolean;
}

export interface ValidationResult {
  readonly isValid: boolean;
  /** At least one field run was superseded before it could commit. */
  readonly stale: boolean;
  readonly fields: readonly FieldValidationResult[];
}

export type SubmitResult =
  | { status: 'ignored'; reason: 'submitting' }
  | { status: 'invalid'; errors: Record<string, readonly ReactNode[]> }
  | { status: 'failed'; error: unknown }
  | { status: 'submitted' };

export interface FormStoreOptions<T extends object = Record<string, unknown>> {
  defaultValues?: Partial<T>;
  callbacks?: FormCallbacks<T>;
  errorPolicy?: ErrorPolicy;
  onListenerError?: (error: unknown) => void;
  onDevelopmentError?: (message: string) => void;
}

export interface FormStoreDebug {
  publishCount(): number;
  listenerCount(): number;
  pendingTimerCount(): number;
  runningValidationCount(): number;
  registrationCount(): number;
}

export interface FormStore<T extends object = Record<string, unknown>> {
  readonly ['~brand']: 'modern-form-store';
  getSnapshot(): FormState<T>;
  subscribe(listener: () => void): () => void;

  register(name: string, options?: RegistrationOptions): RegistrationToken;

  getValue(name: string): unknown;
  getValues(): Readonly<Partial<T>>;
  getActiveValues(): Readonly<Partial<T>>;
  setValue(name: string, value: unknown, options?: SetValueOptions): void;
  setValues(values: Partial<T>, options?: SetValueOptions): void;
  batch(fn: () => void): void;

  setDefaultValues(
    defaults: Partial<T>,
    options?: { currentValues?: 'preserve' | 'replace' },
  ): void;
  adoptDefaultValues(
    defaults: Partial<T>,
    options?: {
      when?: 'untouched' | 'clean' | 'always';
      preserveDirty?: boolean;
    },
  ): void;
  reset(options?: { values?: Partial<T> }): void;

  touch(name: string): void;
  blur(name: string): void;
  setFieldErrors(name: string, errors: readonly ReactNode[]): void;
  clearFieldErrors(name: string): void;
  setSubmitError(error: unknown): void;
  clearSubmitError(): void;

  validate(
    names?: readonly string[],
    options?: { trigger?: ValidateTrigger; immediate?: boolean },
  ): Promise<ValidationResult>;
  submit(options?: { include?: 'active' | 'all' }): Promise<SubmitResult>;

  bindCallbacks(callbacks: FormCallbacks<T>): CallbackBinding<T>;

  dispose(): void;
  readonly debug: FormStoreDebug;
}

// ---------------------------------------------------------------------------
// Equality and rule signatures
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/**
 * Default dirty equality: `Object.is`, one level of array/plain-object
 * structure. Field adapters may override per registration.
 */
export function defaultIsEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => Object.is(a[k], b[k]));
  }
  return false;
}

/**
 * Structural signature of a rule array. Functions compare by source text,
 * RegExps by source/flags, ReactNode messages are ignored (they do not change
 * validity). Equivalent inline arrays from a parent rerender share a signature,
 * so they do not bump the validation revision.
 */
export function rulesSignature(
  rules: readonly ValidationRule[] | undefined,
): string {
  if (!rules || rules.length === 0) return '';
  return rules
    .map((rule) =>
      Object.keys(rule)
        .sort()
        .map((key) => {
          const value = (rule as Record<string, unknown>)[key];
          if (key === 'message') return 'message';
          if (typeof value === 'function')
            return `${key}=fn:${value.toString()}`;
          if (value instanceof RegExp)
            return `${key}=re:${value.source}/${value.flags}`;
          if (value === null || typeof value !== 'object')
            return `${key}=${String(value)}`;
          return `${key}=obj`;
        })
        .join('|'),
    )
    .join(';');
}

export const EMPTY_ERRORS: readonly ReactNode[] = Object.freeze([]);

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export async function runRules<T extends object>(
  value: unknown,
  rules: readonly ValidationRule[],
  context: ValidationContext<T>,
  policy: ErrorPolicy,
): Promise<ReactNode[]> {
  const errors: ReactNode[] = [];

  for (const rule of rules) {
    if (context.signal.aborted) return errors;

    let error: ReactNode | undefined;

    try {
      if (rule.required && isEmptyValue(value)) {
        error = rule.message ?? 'Required';
      } else if (
        rule.min != null &&
        ((typeof value === 'string' && value.length < rule.min) ||
          (typeof value === 'number' && value < rule.min))
      ) {
        error = rule.message ?? `Min ${rule.min}`;
      } else if (
        rule.max != null &&
        ((typeof value === 'string' && value.length > rule.max) ||
          (typeof value === 'number' && value > rule.max))
      ) {
        error = rule.message ?? `Max ${rule.max}`;
      } else if (
        rule.pattern &&
        typeof value === 'string' &&
        !rule.pattern.test(value)
      ) {
        error = rule.message ?? 'Invalid format';
      } else if (rule.validator) {
        const result = await rule.validator(rule, value, context);
        if (result !== undefined && result !== null && result !== '') {
          error = result;
        }
      }
    } catch (thrown) {
      error =
        thrown instanceof Error
          ? thrown.message || rule.message || 'Invalid'
          : (thrown as ReactNode) ?? rule.message ?? 'Invalid';
    }

    if (error !== undefined) {
      errors.push(error);
      if (policy === 'first') break;
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Internal records
// ---------------------------------------------------------------------------

interface Registration {
  id: number;
  options: RegistrationOptions;
  signature: string;
  order: number;
}

interface FieldRecord {
  name: string;
  value: unknown;
  hasValue: boolean;
  defaultValue: unknown;
  hasDefault: boolean;
  errors: readonly ReactNode[];
  status: FieldStatus;
  touched: boolean;
  registrations: Map<number, Registration>;
  /** The registration whose options currently own rules/delay/trigger. */
  owner: Registration | null;
  validationRevision: number;
  timer: ReturnType<typeof setTimeout> | null;
  abort: AbortController | null;
  /** Promises waiting for a delayed run that has not started yet. */
  waiters: Array<(result: FieldValidationResult) => void>;
  published: FieldState | null;
  changed: boolean;
}

const EMPTY_SET: ReadonlySet<string> = new Set();

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export function createFormStore<T extends object = Record<string, unknown>>(
  options: FormStoreOptions<T> = {},
): FormStore<T> {
  const {
    errorPolicy = 'first',
    onListenerError = (error) => {
      console.error('[form-store] listener failed', error);
    },
    onDevelopmentError = (message) => {
      console.error(`[form-store] ${message}`);
    },
  } = options;

  const records = new Map<string, FieldRecord>();
  const listeners = new Set<() => void>();
  const defaultCallbacks: FormCallbacks<T> = { ...options.callbacks };

  let binding: { id: number; callbacks: FormCallbacks<T> } | null = null;
  let nextId = 1;
  let registrationOrder = 0;
  let batchDepth = 0;
  let pendingPublish = false;
  let anyFieldChanged = false;
  let valuesChanged = false;
  let activeChanged = false;
  let defaultsChanged = false;
  let metaChanged = false;
  let isSubmitting = false;
  let submitError: unknown = undefined;
  let submitChanged = false;
  let publishCount = 0;
  let runningValidations = 0;

  const pendingChanges: FormChange[] = [];

  let state: FormState<T> = {
    values: {} as Partial<T>,
    activeValues: {} as Partial<T>,
    defaultValues: {} as Partial<T>,
    fields: {},
    dirtyFields: EMPTY_SET,
    touchedFields: EMPTY_SET,
    isDirty: false,
    isTouched: false,
    isValid: false,
    isInvalid: false,
    isValidating: false,
    isSubmitting: false,
    submitError: undefined,
    revision: 0,
  };

  // -- records ------------------------------------------------------------

  function ensureRecord(name: string): FieldRecord {
    let record = records.get(name);
    if (!record) {
      record = {
        name,
        value: undefined,
        hasValue: false,
        defaultValue: undefined,
        hasDefault: false,
        errors: EMPTY_ERRORS,
        status: 'unvalidated',
        touched: false,
        registrations: new Map(),
        owner: null,
        validationRevision: 0,
        timer: null,
        abort: null,
        waiters: [],
        published: null,
        changed: true,
      };
      records.set(name, record);
      anyFieldChanged = true;
    }
    return record;
  }

  function isActive(record: FieldRecord): boolean {
    return record.registrations.size > 0;
  }

  function isDirtyRecord(record: FieldRecord): boolean {
    const isEqual = record.owner?.options.isEqual ?? defaultIsEqual;
    if (!record.hasValue) return false;
    return !isEqual(record.value, record.defaultValue);
  }

  function markMeta(record: FieldRecord) {
    record.changed = true;
    anyFieldChanged = true;
    metaChanged = true;
  }

  function dropIfEmpty(record: FieldRecord) {
    if (!isActive(record) && !record.hasValue && !record.hasDefault) {
      cancelValidation(record, true);
      records.delete(record.name);
      anyFieldChanged = true;
      valuesChanged = true;
    }
  }

  // -- validation bookkeeping ---------------------------------------------

  function resolveWaiters(record: FieldRecord, result: FieldValidationResult) {
    const waiters = record.waiters;
    record.waiters = [];
    for (const resolve of waiters) resolve(result);
  }

  /** Invalidate whatever is pending or running for this record. */
  function cancelValidation(record: FieldRecord, bumpRevision: boolean) {
    if (record.timer) {
      clearTimeout(record.timer);
      record.timer = null;
    }
    if (record.abort) {
      record.abort.abort();
      record.abort = null;
    }
    if (bumpRevision) {
      record.validationRevision += 1;
      markMeta(record);
    }
    resolveWaiters(record, {
      name: record.name,
      errors: record.errors,
      isValid: false,
      stale: true,
    });
  }

  // -- publish ------------------------------------------------------------

  function publish() {
    if (batchDepth > 0) {
      pendingPublish = true;
      return;
    }
    pendingPublish = false;

    const changed =
      anyFieldChanged ||
      valuesChanged ||
      activeChanged ||
      defaultsChanged ||
      metaChanged ||
      submitChanged;

    if (!changed) return;

    let fields = state.fields;
    let values = state.values;
    let activeValues = state.activeValues;
    let defaultValues = state.defaultValues;

    if (anyFieldChanged) {
      const nextFields: Record<string, FieldState> = {};
      for (const record of records.values()) {
        if (record.changed || !record.published) {
          record.published = {
            name: record.name,
            value: record.value,
            defaultValue: record.defaultValue,
            errors: record.errors,
            status: record.status,
            touched: record.touched,
            dirty: isDirtyRecord(record),
            active: isActive(record),
            registrationCount: record.registrations.size,
            validationRevision: record.validationRevision,
          };
          record.changed = false;
        }
        nextFields[record.name] = record.published;
      }
      fields = nextFields;
    }

    if (valuesChanged) {
      const next: Record<string, unknown> = {};
      for (const record of records.values()) {
        if (record.hasValue) next[record.name] = record.value;
      }
      values = next as Partial<T>;
    }

    if (valuesChanged || activeChanged) {
      const next: Record<string, unknown> = {};
      for (const record of records.values()) {
        if (record.hasValue && isActive(record))
          next[record.name] = record.value;
      }
      activeValues = next as Partial<T>;
    }

    if (defaultsChanged) {
      const next: Record<string, unknown> = {};
      for (const record of records.values()) {
        if (record.hasDefault) next[record.name] = record.defaultValue;
      }
      defaultValues = next as Partial<T>;
    }

    const dirty = new Set<string>();
    const touched = new Set<string>();
    let isValid = false;
    let isInvalid = false;
    let isValidating = false;
    let activeCount = 0;
    let validCount = 0;

    for (const field of Object.values(fields)) {
      if (field.dirty) dirty.add(field.name);
      if (field.touched) touched.add(field.name);
      if (field.active) {
        activeCount += 1;
        if (field.status === 'valid') validCount += 1;
        if (field.status === 'invalid') isInvalid = true;
        if (field.status === 'validating') isValidating = true;
      }
    }
    isValid = activeCount > 0 && validCount === activeCount;

    state = {
      values,
      activeValues,
      defaultValues,
      fields,
      dirtyFields: setsEqual(dirty, state.dirtyFields)
        ? state.dirtyFields
        : dirty,
      touchedFields: setsEqual(touched, state.touchedFields)
        ? state.touchedFields
        : touched,
      isDirty: dirty.size > 0,
      isTouched: touched.size > 0,
      isValid,
      isInvalid,
      isValidating,
      isSubmitting,
      submitError,
      revision: state.revision + 1,
    };

    anyFieldChanged = false;
    valuesChanged = false;
    activeChanged = false;
    defaultsChanged = false;
    metaChanged = false;
    submitChanged = false;
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

    flushValueChangeCallbacks();
  }

  function flushValueChangeCallbacks() {
    if (pendingChanges.length === 0) return;
    const changes = pendingChanges.splice(0);
    const onValuesChange = resolveCallbacks().onValuesChange;
    if (!onValuesChange) return;
    for (const change of changes) {
      try {
        const result = onValuesChange(state.values, change);
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
      if (batchDepth === 0) publish();
    }
  }

  // -- values -------------------------------------------------------------

  function writeValue(
    record: FieldRecord,
    value: unknown,
    opts: Required<Pick<SetValueOptions, 'touch' | 'validate'>>,
  ) {
    const same = record.hasValue && Object.is(record.value, value);
    let changed = false;
    if (!same) {
      record.value = value;
      record.hasValue = true;
      valuesChanged = true;
      changed = true;
      // A running validation belongs to the previous value.
      cancelValidation(record, true);
    }
    if (opts.touch && !record.touched) {
      record.touched = true;
      changed = true;
    }
    if (changed) markMeta(record);

    if (!same) {
      const trigger = record.owner?.options.validateTrigger ?? 'onBlur';
      const shouldValidate =
        opts.validate === 'always' ||
        (opts.validate === 'auto' &&
          (trigger === 'onChange' || record.errors.length > 0));

      if (shouldValidate && isActive(record)) {
        // Keep the visible errors while the new run is pending: no flicker.
        void validateRecord(record, { immediate: false });
      } else {
        record.errors = EMPTY_ERRORS;
        record.status = 'unvalidated';
      }
    }
  }

  function setValue(
    name: string,
    value: unknown,
    options: SetValueOptions = {},
  ) {
    setValues({ [name]: value } as Partial<T>, options);
  }

  function setValues(values: Partial<T>, options: SetValueOptions = {}) {
    const source = options.source ?? 'program';
    const touch = options.touch ?? source === 'user';
    const validate = options.validate ?? 'auto';
    const notify = options.notify ?? source === 'user';
    const names = Object.keys(values);

    batch(() => {
      for (const name of names) {
        writeValue(
          ensureRecord(name),
          (values as Record<string, unknown>)[name],
          {
            touch,
            validate,
          },
        );
      }
      if (notify && names.length) {
        pendingChanges.push({ names, source, kind: 'set' });
      }
    });
  }

  function setDefaultValues(
    defaults: Partial<T>,
    options: { currentValues?: 'preserve' | 'replace' } = {},
  ) {
    const mode = options.currentValues ?? 'preserve';
    batch(() => {
      for (const [name, value] of Object.entries(defaults)) {
        const record = ensureRecord(name);
        record.defaultValue = value;
        record.hasDefault = true;
        defaultsChanged = true;
        markMeta(record);
        if (mode === 'replace') {
          writeValue(record, value, { touch: false, validate: 'never' });
          record.touched = false;
        }
      }
      if (mode === 'replace') {
        pendingChanges.push({
          names: Object.keys(defaults),
          source: 'program',
          kind: 'defaults',
        });
      }
    });
  }

  function adoptDefaultValues(
    defaults: Partial<T>,
    options: {
      when?: 'untouched' | 'clean' | 'always';
      preserveDirty?: boolean;
    } = {},
  ) {
    const when = options.when ?? 'untouched';
    const preserveDirty = options.preserveDirty ?? false;
    batch(() => {
      const adopted: string[] = [];
      for (const [name, value] of Object.entries(defaults)) {
        const record = ensureRecord(name);
        const wasDirty = isDirtyRecord(record);
        const allowed =
          when === 'always' ||
          (when === 'untouched' && !record.touched) ||
          (when === 'clean' && !wasDirty);

        record.defaultValue = value;
        record.hasDefault = true;
        defaultsChanged = true;
        markMeta(record);

        if (allowed && !(preserveDirty && wasDirty)) {
          writeValue(record, value, { touch: false, validate: 'never' });
          adopted.push(name);
        }
      }
      if (adopted.length) {
        pendingChanges.push({
          names: adopted,
          source: 'program',
          kind: 'adopt',
        });
      }
    });
  }

  function reset(options: { values?: Partial<T> } = {}) {
    batch(() => {
      const overrides = (options.values ?? {}) as Record<string, unknown>;
      for (const name of Object.keys(overrides)) {
        const record = ensureRecord(name);
        record.defaultValue = overrides[name];
        record.hasDefault = true;
        defaultsChanged = true;
      }
      for (const record of Array.from(records.values())) {
        cancelValidation(record, true);
        if (record.hasDefault) {
          record.value = record.defaultValue;
          record.hasValue = true;
        } else {
          record.value = undefined;
          record.hasValue = false;
        }
        record.touched = false;
        record.errors = EMPTY_ERRORS;
        record.status = 'unvalidated';
        valuesChanged = true;
        markMeta(record);
        dropIfEmpty(record);
      }
      submitError = undefined;
      submitChanged = true;
      pendingChanges.push({
        names: Array.from(records.keys()),
        source: 'program',
        kind: 'reset',
      });
    });
  }

  // -- registration -------------------------------------------------------

  function register(
    name: string,
    options: RegistrationOptions = {},
  ): RegistrationToken {
    const id = nextId++;
    let released = false;

    const registration: Registration = {
      id,
      options,
      signature: options.rulesKey ?? rulesSignature(options.rules),
      order: registrationOrder++,
    };

    batch(() => {
      const record = ensureRecord(name);
      const wasActive = isActive(record);

      if ('defaultValue' in options) {
        if (!record.hasDefault && !record.hasValue) {
          record.defaultValue = options.defaultValue;
          record.hasDefault = true;
          record.value = options.defaultValue;
          record.hasValue = true;
          defaultsChanged = true;
          valuesChanged = true;
        } else if (
          record.hasDefault &&
          record.registrations.size > 0 &&
          !defaultIsEqual(record.defaultValue, options.defaultValue)
        ) {
          onDevelopmentError(
            `Field "${name}" registered twice with conflicting defaultValue; the first registration's default is kept.`,
          );
        }
      }

      record.registrations.set(id, registration);
      adoptOwner(record, registration);

      if (!wasActive) activeChanged = true;
      markMeta(record);
    });

    const token: RegistrationToken = {
      id,
      name,
      get released() {
        return released;
      },
      update(nextOptions: RegistrationOptions) {
        if (released) return;
        const record = records.get(name);
        if (!record || !record.registrations.has(id)) return;
        const nextSignature =
          nextOptions.rulesKey ?? rulesSignature(nextOptions.rules);
        const signatureChanged = nextSignature !== registration.signature;
        registration.options = nextOptions;
        registration.signature = nextSignature;
        batch(() => {
          // A field-level default reaching the store through `update()` (the
          // React hook registers first and pushes options afterwards) seeds
          // only while the field has neither a value nor a default.
          if (
            'defaultValue' in nextOptions &&
            !record.hasDefault &&
            !record.hasValue
          ) {
            record.defaultValue = nextOptions.defaultValue;
            record.hasDefault = true;
            record.value = nextOptions.defaultValue;
            record.hasValue = true;
            defaultsChanged = true;
            valuesChanged = true;
          }
          adoptOwner(record, registration);
          if (signatureChanged) {
            // A genuine rule change invalidates whatever the old rules decided.
            cancelValidation(record, true);
            record.status = 'unvalidated';
            record.errors = EMPTY_ERRORS;
            markMeta(record);
          }
        });
      },
      release() {
        if (released) return;
        released = true;
        const record = records.get(name);
        if (!record) return;
        // A stale token cannot release a newer registration: keyed by id.
        if (!record.registrations.delete(id)) return;
        batch(() => {
          if (record.owner?.id === id) {
            record.owner = latestRegistration(record);
          }
          if (!isActive(record)) {
            activeChanged = true;
            cancelValidation(record, true);
            record.status = 'unvalidated';
            record.errors = EMPTY_ERRORS;
            if (registration.options.preserve === false) {
              record.value = undefined;
              record.hasValue = false;
              record.touched = false;
              valuesChanged = true;
            }
          }
          markMeta(record);
          dropIfEmpty(record);
        });
      },
    };

    return token;
  }

  function latestRegistration(record: FieldRecord): Registration | null {
    let latest: Registration | null = null;
    for (const registration of record.registrations.values()) {
      if (!latest || registration.order > latest.order) latest = registration;
    }
    return latest;
  }

  /** The most recently registered/updated registration owns rules. */
  function adoptOwner(record: FieldRecord, registration: Registration) {
    registration.order = registrationOrder++;
    record.owner = registration;
  }

  // -- validation ---------------------------------------------------------

  function makeContext(
    record: FieldRecord,
    signal: AbortSignal,
  ): ValidationContext<T> {
    return {
      name: record.name,
      signal,
      getValue: (name) => records.get(name)?.value,
      getValues: () => state.values,
    };
  }

  function validateRecord(
    record: FieldRecord,
    options: { immediate: boolean },
  ): Promise<FieldValidationResult> {
    const rules = record.owner?.options.rules ?? [];
    const revision = record.validationRevision;

    // Cancel a pending or running run without bumping the revision: the value
    // has not changed, the new run replaces the old one for the same revision.
    if (record.timer) {
      clearTimeout(record.timer);
      record.timer = null;
    }
    if (record.abort) {
      record.abort.abort();
      record.abort = null;
    }

    if (rules.length === 0) {
      batch(() => {
        record.errors = EMPTY_ERRORS;
        record.status = 'valid';
        markMeta(record);
      });
      const result = {
        name: record.name,
        errors: EMPTY_ERRORS,
        isValid: true,
        stale: false,
      };
      resolveWaiters(record, result);
      return Promise.resolve(result);
    }

    batch(() => {
      record.status = 'validating';
      markMeta(record);
    });

    const delay = options.immediate
      ? 0
      : record.owner?.options.validationDelay ?? 0;

    return new Promise<FieldValidationResult>((resolve) => {
      record.waiters.push(resolve);

      const run = async () => {
        record.timer = null;
        if (record.validationRevision !== revision) return; // superseded

        const controller = new AbortController();
        record.abort = controller;
        runningValidations += 1;

        let errors: ReactNode[];
        try {
          errors = await runRules(
            record.value,
            rules,
            makeContext(record, controller.signal),
            errorPolicy,
          );
        } finally {
          runningValidations -= 1;
        }

        if (
          controller.signal.aborted ||
          record.validationRevision !== revision ||
          records.get(record.name) !== record
        ) {
          return; // stale: a newer run or cancelValidation resolves the waiters
        }

        record.abort = null;
        batch(() => {
          record.errors = errors.length ? errors : EMPTY_ERRORS;
          record.status = errors.length ? 'invalid' : 'valid';
          markMeta(record);
        });
        resolveWaiters(record, {
          name: record.name,
          errors: record.errors,
          isValid: errors.length === 0,
          stale: false,
        });
      };

      if (delay > 0) {
        record.timer = setTimeout(() => void run(), delay);
      } else {
        void run();
      }
    });
  }

  function validate(
    names?: readonly string[],
    options: { trigger?: ValidateTrigger; immediate?: boolean } = {},
  ): Promise<ValidationResult> {
    const targets = (names ?? Array.from(records.keys()))
      .map((name) => records.get(name))
      .filter((record): record is FieldRecord => !!record && isActive(record));

    let results: Promise<FieldValidationResult>[] = [];
    batch(() => {
      results = targets.map((record) =>
        validateRecord(record, { immediate: options.immediate ?? true }),
      );
    });

    return Promise.all(results).then((fields) => ({
      isValid: fields.every((field) => field.isValid && !field.stale),
      stale: fields.some((field) => field.stale),
      fields,
    }));
  }

  // -- callbacks ----------------------------------------------------------

  function resolveCallbacks(): FormCallbacks<T> {
    if (!binding) return defaultCallbacks;
    const resolved: FormCallbacks<T> = { ...defaultCallbacks };
    for (const key of [
      'onSubmit',
      'onSubmitFailed',
      'onValuesChange',
    ] as const) {
      if (key in binding.callbacks) {
        // An explicit `undefined` removes the callback rather than falling back.
        (resolved as Record<string, unknown>)[key] = binding.callbacks[key];
      }
    }
    return resolved;
  }

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
        // Only its own binding: a stale root cannot unbind a newer one.
        if (binding?.id === id) binding = null;
      },
    };
  }

  // -- submission ---------------------------------------------------------

  async function submit(
    options: { include?: 'active' | 'all' } = {},
  ): Promise<SubmitResult> {
    const include = options.include ?? 'active';

    if (isSubmitting) return { status: 'ignored', reason: 'submitting' };

    batch(() => {
      isSubmitting = true;
      submitError = undefined;
      submitChanged = true;
    });

    const callbacks = resolveCallbacks();

    try {
      const validation = await validate(undefined, {
        trigger: 'onSubmit',
        immediate: true,
      });

      if (!validation.isValid) {
        const errors: Record<string, readonly ReactNode[]> = {};
        for (const field of validation.fields) {
          if (!field.isValid) errors[field.name] = field.errors;
        }
        await callbacks.onSubmitFailed?.(errors);
        return { status: 'invalid', errors };
      }

      const values = include === 'active' ? state.activeValues : state.values;

      try {
        await callbacks.onSubmit?.(values, { include });
        return { status: 'submitted' };
      } catch (error) {
        batch(() => {
          submitError = error;
          submitChanged = true;
        });
        await callbacks.onSubmitFailed?.(error);
        return { status: 'failed', error };
      }
    } finally {
      batch(() => {
        isSubmitting = false;
        submitChanged = true;
      });
    }
  }

  // -- misc commands ------------------------------------------------------

  function touch(name: string) {
    const record = records.get(name);
    if (!record || record.touched) return;
    batch(() => {
      record.touched = true;
      markMeta(record);
    });
  }

  function blur(name: string) {
    const record = records.get(name);
    if (!record || !isActive(record)) return;
    const trigger = record.owner?.options.validateTrigger ?? 'onBlur';
    if (trigger === 'onBlur') {
      void validateRecord(record, { immediate: false });
    }
  }

  function setFieldErrors(name: string, errors: readonly ReactNode[]) {
    batch(() => {
      const record = ensureRecord(name);
      cancelValidation(record, true);
      record.errors = errors.length ? errors : EMPTY_ERRORS;
      record.status = errors.length ? 'invalid' : 'valid';
      markMeta(record);
    });
  }

  function clearFieldErrors(name: string) {
    const record = records.get(name);
    if (!record) return;
    batch(() => {
      cancelValidation(record, true);
      record.errors = EMPTY_ERRORS;
      record.status = 'unvalidated';
      markMeta(record);
    });
  }

  function setSubmitError(error: unknown) {
    batch(() => {
      submitError = error;
      submitChanged = true;
    });
  }

  function clearSubmitError() {
    if (submitError === undefined) return;
    setSubmitError(undefined);
  }

  function dispose() {
    for (const record of records.values()) cancelValidation(record, false);
    listeners.clear();
  }

  // -- seed ---------------------------------------------------------------

  if (options.defaultValues) {
    setDefaultValues(options.defaultValues, { currentValues: 'replace' });
    // Seeding is not a change worth notifying.
    pendingChanges.length = 0;
    // Nothing subscribes yet: publish synchronously so the first getSnapshot
    // already reflects the defaults.
  }

  return {
    '~brand': 'modern-form-store',
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    register,
    getValue: (name) => records.get(name)?.value,
    getValues: () => state.values,
    getActiveValues: () => state.activeValues,
    setValue,
    setValues,
    batch,
    setDefaultValues,
    adoptDefaultValues,
    reset,
    touch,
    blur,
    setFieldErrors,
    clearFieldErrors,
    setSubmitError,
    clearSubmitError,
    validate,
    submit,
    bindCallbacks,
    dispose,
    debug: {
      publishCount: () => publishCount,
      listenerCount: () => listeners.size,
      pendingTimerCount: () =>
        Array.from(records.values()).filter((record) => record.timer !== null)
          .length,
      runningValidationCount: () => runningValidations,
      registrationCount: () =>
        Array.from(records.values()).reduce(
          (sum, record) => sum + record.registrations.size,
          0,
        ),
    },
  };
}

export function isModernFormStore(value: unknown): value is FormStore<any> {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>)['~brand'] === 'modern-form-store'
  );
}
