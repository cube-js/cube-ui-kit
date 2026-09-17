import type { ModernFormBrand } from '../backend';
import type { ModernValidationRule } from './validation';
import type { FormPath } from './values';

export type FieldStatus = 'unvalidated' | 'validating' | 'valid' | 'invalid';

export interface FieldState<ErrorValue = unknown> {
  readonly name: string;
  readonly value: unknown;
  readonly defaultValue: unknown;
  readonly errors: readonly ErrorValue[];
  readonly status: FieldStatus;
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly active: boolean;
  readonly registrationCount: number;
  readonly validationRevision: number;
}

export interface FormState<T extends object, ErrorValue = unknown> {
  readonly values: Readonly<Partial<T>>;
  readonly activeValues: Readonly<Partial<T>>;
  readonly defaultValues: Readonly<Partial<T>>;
  readonly fields: Readonly<Record<string, FieldState<ErrorValue>>>;
  readonly dirtyFields: ReadonlySet<string>;
  readonly touchedFields: ReadonlySet<string>;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isValid: boolean;
  readonly isInvalid: boolean;
  readonly isValidating: boolean;
  readonly isSubmitting: boolean;
  readonly submitError: unknown;
  readonly revision: number;
}

export interface RegistrationOptions<ErrorValue = unknown> {
  readonly rules?: readonly ModernValidationRule<ErrorValue>[];
  readonly rulesKey?: string;
  readonly validationDelay?: number;
  readonly validateTrigger?: 'onBlur' | 'onChange' | 'onSubmit';
  readonly errorPolicy?: 'first' | 'all';
  readonly defaultValue?: unknown;
  readonly preserve?: boolean;
  readonly isEqual?: (a: unknown, b: unknown) => boolean;
}

export interface RegistrationToken<ErrorValue = unknown> {
  readonly name: string;
  readonly released: boolean;
  update(options: RegistrationOptions<ErrorValue>): void;
  /** React effect replay can reconnect before the queued value removal. */
  release(options?: { deferValueRemoval?: boolean }): void;
}

export interface FormChange {
  readonly names: readonly string[];
  readonly source: 'user' | 'program';
  readonly kind: 'set' | 'reset' | 'adopt' | 'defaults';
}

export interface SetValueOptions {
  readonly validate?: 'auto' | 'always' | 'never';
  readonly source?: FormChange['source'];
  readonly touch?: boolean;
  readonly notify?: boolean;
}

export interface ModernSubmitContext {
  readonly include: 'active' | 'all';
  readonly signal: AbortSignal;
}

export interface FormCallbacks<T extends object> {
  readonly onSubmit?: (
    values: Readonly<Partial<T>>,
    context: ModernSubmitContext,
  ) => void | Promise<void>;
  readonly onSubmitFailed?: (error: unknown) => void | Promise<void>;
  readonly onValuesChange?: (
    values: Readonly<Partial<T>>,
    change: FormChange,
  ) => void | Promise<void>;
}

export interface CallbackBinding<T extends object> {
  update(callbacks: FormCallbacks<T>): void;
  release(): void;
}

export interface ModernFieldValidationResult<ErrorValue = unknown> {
  readonly name: string;
  readonly errors: readonly ErrorValue[];
  readonly isValid: boolean;
  readonly stale: boolean;
}

export interface ModernValidationResult<ErrorValue = unknown> {
  readonly fields: readonly ModernFieldValidationResult<ErrorValue>[];
  readonly isValid: boolean;
  readonly stale: boolean;
}

export type ModernSubmitResult<ErrorValue = unknown> =
  | { status: 'ignored'; reason: 'submitting' }
  | { status: 'stale' }
  | {
      status: 'invalid';
      errors: Readonly<Record<string, readonly ErrorValue[]>>;
    }
  | { status: 'failed'; error: unknown }
  | { status: 'submitted' };

export interface FormStoreOptions<T extends object> extends FormCallbacks<T> {
  readonly errorPolicy?: 'first' | 'all';
  readonly defaultValues?: Partial<T>;
  readonly onValuesChange?: (
    values: Readonly<Partial<T>>,
    change: FormChange,
  ) => void | Promise<void>;
  readonly onListenerError?: (error: unknown) => void;
  readonly onDevelopmentError?: (message: string) => void;
}

/** Internal state token owned by the validation pipeline. */
export interface ValidationToken<ErrorValue> {
  readonly signal: AbortSignal;
  complete(errors: readonly ErrorValue[]): boolean;
  cancel(): void;
}

/** A reset/disposal invalidates the token so a late completion cannot publish. */
export interface SubmissionToken {
  readonly signal: AbortSignal;
  complete(result?: { error: unknown }): boolean;
}

/** Internal until the React/controller API lands in subsequent phases. */
export interface FormStore<
  T extends object = Record<string, unknown>,
  ErrorValue = unknown,
> extends ModernFormBrand {
  getSnapshot(): FormState<T, ErrorValue>;
  getFieldSnapshot(path: FormPath): FieldState<ErrorValue> | undefined;
  getValue<K extends keyof T & string>(name: K): T[K] | undefined;
  getValue(path: FormPath): unknown;
  getValues(): Readonly<Partial<T>>;
  getActiveValues(): Readonly<Partial<T>>;
  subscribe(listener: () => void): () => void;
  subscribeSelector<Selected>(
    selector: (state: FormState<T, ErrorValue>) => Selected,
    listener: (value: Selected, previous: Selected) => void,
    isEqual?: (a: Selected, b: Selected) => boolean,
  ): () => void;
  register(
    path: FormPath,
    options?: RegistrationOptions<ErrorValue>,
  ): RegistrationToken<ErrorValue>;
  validate(
    paths?: readonly FormPath[],
    options?: { immediate?: boolean; signal?: AbortSignal },
  ): Promise<ModernValidationResult<ErrorValue>>;
  submit(options?: {
    include?: 'active' | 'all';
  }): Promise<ModernSubmitResult<ErrorValue>>;
  blur(path: FormPath): void;
  bindCallbacks(callbacks: FormCallbacks<T>): CallbackBinding<T>;
  setValue(path: FormPath, value: unknown, options?: SetValueOptions): void;
  setValues(values: Partial<T>, options?: SetValueOptions): void;
  /** Synchronous notification transaction; completed writes commit even if fn throws. */
  batch(fn: () => void): void;
  setDefaultValues(
    values: Partial<T>,
    options?: { currentValues?: 'preserve' | 'replace' },
  ): void;
  adoptDefaultValues(
    values: Partial<T>,
    options?: {
      when?: 'untouched' | 'clean' | 'always';
      preserveDirty?: boolean;
    },
  ): void;
  reset(options?: { values?: Partial<T> }): void;
  touch(path: FormPath, touched?: boolean): void;
  setFieldErrors(path: FormPath, errors: readonly ErrorValue[]): void;
  clearFieldErrors(path: FormPath): void;
  startValidation(path: FormPath): ValidationToken<ErrorValue>;
  startSubmission(): SubmissionToken | undefined;
  setSubmitError(error: unknown): void;
  clearSubmitError(): void;
  dispose(): void;
  readonly debug: {
    listenerCount(): number;
    registrationCount(): number;
  };
}
