import type { ReactNode } from 'react';
import type { FormController } from './controller';
import type { CheckedFormPath, FormValueAtPath } from './path-types';
import type { FormReadValue, FormValues } from './read-types';
import type { RegistrationOptions } from './types';
import type { FormPath } from './values';

declare const FIELD_VALUE: unique symbol;

/** Pure configuration, never a mutable/reactive field instance. */
export interface FormField<Value = unknown> {
  readonly [FIELD_VALUE]: Value;
  readonly form: FormController<any>;
  readonly path: FormPath;
  readonly options: RegistrationOptions<ReactNode>;
}

export interface FormFieldContext<T extends object> {
  readonly signal: AbortSignal;
  getValue<const Path extends FormPath>(
    path: CheckedFormPath<T, Path>,
  ): FormReadValue<FormValueAtPath<T, Path>> | undefined;
  getValues(): FormValues<T>;
}

export interface FormFieldOptions<T extends object, Value>
  extends Omit<RegistrationOptions<ReactNode>, 'defaultValue' | 'isEqual'> {
  readonly validate?: (
    value: FormReadValue<Value> | undefined,
    context: FormFieldContext<T>,
  ) => ReactNode | void | Promise<ReactNode | void>;
  readonly defaultValue?: Value;
  readonly isEqual?: (
    previous: FormReadValue<Value> | undefined,
    next: FormReadValue<Value> | undefined,
  ) => boolean;
}

export function createFormField<T extends object, Value>(
  form: FormController<T>,
  path: FormPath,
  options: FormFieldOptions<T, Value> = {},
): FormField<Value> {
  const { validate, ...registration } = options;
  return Object.freeze({
    form,
    path: typeof path === 'string' ? path : Object.freeze([...path]),
    options: Object.freeze({
      ...registration,
      ...(validate && {
        rules: [
          ...(registration.rules ?? []),
          {
            validator: (_rule, value, context) =>
              validate(value, context as FormFieldContext<T>),
          },
        ],
      }),
    }),
  }) as FormField<Value>;
}
