import { FORM_BACKEND, isModernFormController } from '../backend';

import { createFormStore } from './store';

import type { ReactNode } from 'react';
import type {
  FormState,
  FormStore,
  FormStoreOptions,
  ModernFieldValidationResult as StoreFieldValidationResult,
  ModernSubmitResult as StoreSubmitResult,
  ModernValidationResult as StoreValidationResult,
} from './types';
import type { ModernValidationRule as StoreValidationRule } from './validation';

export type ModernValidationRule = StoreValidationRule<ReactNode>;
export type ModernValidationResult = StoreValidationResult<ReactNode>;
export type ModernFieldValidationResult = StoreFieldValidationResult<ReactNode>;
export type ModernSubmitResult = StoreSubmitResult<ReactNode>;

export type ModernFormState<T extends object = Record<string, unknown>> =
  FormState<T, ReactNode>;

export type UseFormControllerOptions<
  T extends object = Record<string, unknown>,
> = FormStoreOptions<T>;

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
      | 'getFieldSnapshot'
      | 'getValue'
      | 'getValues'
      | 'getActiveValues'
      | 'subscribe'
      | 'setValue'
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
    >
  >;

// Symbol.for also lets two copies of the kit share a controller, just as the
// backend brand does. This symbol and the store are not package exports.
const CONTROLLER_STORE = Symbol.for('@cube-dev/ui-kit/form-controller-store');

interface ControllerInternals<T extends object> {
  store: FormStore<T, ReactNode>;
  getServerSnapshot(): ModernFormState<T>;
}

/** Pure allocation for the creation hook; no listeners or external effects. */
export function createFormController<T extends object>(
  options?: UseFormControllerOptions<T>,
): FormController<T> {
  const store = createFormStore<T, ReactNode>(options);
  const serverSnapshot = store.getSnapshot();
  const internals: ControllerInternals<T> = {
    store,
    getServerSnapshot: () => serverSnapshot,
  };
  return Object.freeze({
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
  });
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
