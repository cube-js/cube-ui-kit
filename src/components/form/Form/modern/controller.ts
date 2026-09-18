import { FORM_BACKEND, isModernFormController } from '../backend';

import { createFormField } from './field';
import { createFormStore } from './store';

import type { ReactNode } from 'react';
import type { FormField, FormFieldOptions } from './field';
import type {
  CheckedFormDependencies,
  CheckedFormPath,
  FormValueAtPath,
} from './path-types';
import type { FormReadValue } from './read-types';
import type {
  FieldState,
  FormState,
  FormStore,
  FormStoreOptions,
  SetValueOptions,
  ModernFieldValidationResult as StoreFieldValidationResult,
  ModernSubmitFailure as StoreSubmitFailure,
  ModernSubmitResult as StoreSubmitResult,
  ModernValidationResult as StoreValidationResult,
} from './types';
import type { ModernValidationRule as StoreValidationRule } from './validation';
import type { FormPath } from './values';

export type ModernValidationRule = StoreValidationRule<ReactNode>;
export type ModernValidationResult = StoreValidationResult<ReactNode>;
export type ModernFieldValidationResult = StoreFieldValidationResult<ReactNode>;
export type ModernSubmitFailure = StoreSubmitFailure<ReactNode>;
export type ModernFieldState<Value = unknown> = Omit<
  FieldState<ReactNode>,
  'value' | 'defaultValue'
> & {
  readonly value: FormReadValue<Value> | undefined;
  readonly defaultValue: FormReadValue<Value> | undefined;
};

export type ModernSubmitResult = StoreSubmitResult<ReactNode>;

export type ModernFormState<T extends object = Record<string, unknown>> =
  FormState<T, ReactNode>;

export type UseFormControllerOptions<
  T extends object = Record<string, unknown>,
> = FormStoreOptions<T, ReactNode>;

/** Public commands; registration and pipeline state tokens stay internal. */
export type FormController<T extends object = Record<string, unknown>> =
  Readonly<
    Pick<
      FormStore<T, ReactNode>,
      | typeof FORM_BACKEND
      | 'validate'
      | 'submit'
      | 'blur'
      | 'getSnapshot'
      | 'getValues'
      | 'getActiveValues'
      | 'subscribe'
      | 'setValues'
      | 'batch'
      | 'setDefaultValues'
      | 'adoptDefaultValues'
      | 'reset'
      | 'touch'
      | 'setFieldErrors'
      | 'clearFieldErrors'
      | 'setSubmitError'
      | 'clearSubmitError'
    > & {
      getFieldSnapshot<const Path extends FormPath>(
        path: CheckedFormPath<T, Path>,
      ): ModernFieldState<FormValueAtPath<T, Path>> | undefined;
      getValue<const Path extends FormPath>(
        path: CheckedFormPath<T, Path>,
      ): FormReadValue<FormValueAtPath<T, Path>> | undefined;
      setValue<const Path extends FormPath>(
        path: CheckedFormPath<T, Path>,
        value: FormValueAtPath<T, NoInfer<Path>> | undefined,
        options?: SetValueOptions,
      ): void;
      field<
        const Path extends FormPath,
        const Dependencies extends readonly FormPath[] = readonly FormPath[],
      >(
        path: CheckedFormPath<T, Path>,
        options?: FormFieldOptions<T, FormValueAtPath<T, NoInfer<Path>>> & {
          dependsOn?: Dependencies & CheckedFormDependencies<T, Dependencies>;
        },
      ): FormField<FormValueAtPath<T, Path>>;
    }
  >;

// Symbol.for also lets two copies of the kit share a controller, just as the
// backend brand does. This symbol and the store are not package exports.
const CONTROLLER_STORE = Symbol.for('@cube-dev/ui-kit/form-controller-store');

interface ControllerInternals<T extends object> {
  store: FormStore<T, ReactNode>;
  getServerSnapshot(): ModernFormState<T>;
  getRootElement(): HTMLFormElement | undefined;
  bindRootElement(element: HTMLFormElement | null): () => void;
}

/** Pure allocation for the creation hook; no listeners or external effects. */
export function createFormController<T extends object>(
  options?: UseFormControllerOptions<T>,
): FormController<T> {
  const store = createFormStore<T, ReactNode>(options);
  const serverSnapshot = store.getSnapshot();
  let rootElement: HTMLFormElement | undefined;
  const internals: ControllerInternals<T> = {
    store,
    getServerSnapshot: () => serverSnapshot,
    getRootElement: () => rootElement,
    bindRootElement(element) {
      rootElement = element ?? undefined;
      return () => {
        if (rootElement === element) rootElement = undefined;
      };
    },
  };
  const controller = Object.freeze({
    [FORM_BACKEND]: 'modern' as const,
    [CONTROLLER_STORE]: internals,
    validate: store.validate,
    submit: store.submit,
    blur: store.blur,
    getSnapshot: store.getSnapshot,
    getFieldSnapshot: store.getFieldSnapshot,
    getValue: store.getValue,
    getValues: store.getValues,
    getActiveValues: store.getActiveValues,
    subscribe: store.subscribe,
    setValue: store.setValue,
    setValues: store.setValues,
    batch: store.batch,
    setDefaultValues: store.setDefaultValues,
    adoptDefaultValues: store.adoptDefaultValues,
    reset: store.reset,
    touch: store.touch,
    setFieldErrors: store.setFieldErrors,
    clearFieldErrors: store.clearFieldErrors,
    setSubmitError: store.setSubmitError,
    clearSubmitError: store.clearSubmitError,
    field: (path: FormPath, config?: FormFieldOptions<T, unknown>) =>
      createFormField(controller, path, config),
  }) as FormController<T>;
  return controller;
}

export function getControllerInternals<T extends object>(
  controller: FormController<T>,
  receiver: string,
): ControllerInternals<T> {
  const internals = isModernFormController(controller)
    ? (controller as unknown as Record<symbol, ControllerInternals<T>>)[
        CONTROLLER_STORE
      ]
    : undefined;
  if (!internals) {
    throw new Error(
      `${receiver} requires a modern form controller created by Form.useController(). Legacy Form instances and bare backend brands are not supported.`,
    );
  }
  return internals;
}
