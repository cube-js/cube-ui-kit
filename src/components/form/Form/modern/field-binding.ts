import { getControllerInternals } from './controller';
import { getFieldKey } from './values';

import type { ReactNode } from 'react';
import type { FieldCoreProps, ValidateTrigger } from '../../../../shared/form';
import type { FormController } from './controller';
import type {
  FieldState,
  RegistrationOptions,
  RegistrationToken,
} from './types';

/** The only state a bound input renders; metadata stays in selector subscribers. */
export type FieldView = Pick<
  FieldState<ReactNode>,
  'value' | 'errors' | 'status'
>;

export interface FieldBackendHandle {
  subscribe(listener: () => void): () => void;
  getSnapshot(): FieldView | undefined;
  getServerSnapshot(): FieldView | undefined;
  register(): RegistrationToken<ReactNode> | undefined;
  change(value: unknown, dontTouch: boolean, trigger: ValidateTrigger): void;
  blur(): void;
}

export function sameFieldView(a?: FieldView, b?: FieldView) {
  return (
    Object.is(a?.value, b?.value) &&
    a?.errors === b?.errors &&
    a?.status === b?.status
  );
}

export function createModernFieldBackend(
  form: FormController<any>,
  name: string,
): FieldBackendHandle {
  const { store, getServerSnapshot } = getControllerInternals(
    form,
    `The "${name}" field`,
  );
  const key = getFieldKey(name);
  return {
    subscribe: store.subscribe,
    getSnapshot: () => store.getFieldSnapshot(name),
    getServerSnapshot: () => getServerSnapshot().fields[key],
    register: () => store.register(name),
    change: (value, dontTouch) =>
      store.setValue(name, value, {
        source: 'user',
        touch: !dontTouch,
        validate: dontTouch ? 'never' : 'auto',
      }),
    blur: () => store.blur(name),
  };
}

export function fieldRegistrationOptions(
  props: FieldCoreProps & {
    defaultValue?: unknown;
    validateTrigger?: ValidateTrigger;
  },
  defaultTrigger?: ValidateTrigger,
): RegistrationOptions<ReactNode> {
  return {
    ...(Object.hasOwn(props, 'defaultValue')
      ? { defaultValue: props.defaultValue }
      : {}),
    preserve: props.preserve,
    isEqual: props.isEqual,
    rules:
      props.isRequired && !props.rules?.some((rule) => rule.required)
        ? [{ required: true }, ...(props.rules ?? [])]
        : props.rules,
    rulesKey:
      props.rulesKey === undefined
        ? undefined
        : `${props.isRequired ? 'required:' : ''}${props.rulesKey}`,
    validationDelay: props.validationDelay,
    validateTrigger: props.validateTrigger ?? defaultTrigger ?? 'onBlur',
    errorPolicy: props.errorPolicy,
  };
}
