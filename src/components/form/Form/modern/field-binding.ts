import { getControllerInternals } from './controller';
import { getFieldKey, hasPath, normalizePath, readPath } from './values';

import type { ReactNode } from 'react';
import type { FieldCoreProps, ValidateTrigger } from '../../../../shared/form';
import type { FormController, ModernFormState } from './controller';
import type {
  FieldState,
  RegistrationOptions,
  RegistrationToken,
} from './types';
import type { FormPath } from './values';

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
  name: FormPath,
): FieldBackendHandle {
  const { store, getServerSnapshot } = getControllerInternals(
    form,
    `The "${name}" field`,
  );
  const key = getFieldKey(name);
  const path = normalizePath(name);
  const views = new WeakMap<object, FieldView>();
  const view = (state: ModernFormState): FieldView | undefined => {
    if (state.fields[key]) return state.fields[key];
    if (!hasPath(state.values, path)) return undefined;
    let cached = views.get(state);
    if (!cached) {
      cached = Object.freeze({
        value: readPath(state.values, path),
        errors: Object.freeze([]),
        status: 'unvalidated',
      });
      views.set(state, cached);
    }
    return cached;
  };
  return {
    subscribe: store.subscribe,
    getSnapshot: () => view(store.getSnapshot()),
    getServerSnapshot: () => view(getServerSnapshot()),
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
  const rules = props.rules?.flat(Infinity);
  return {
    ...(Object.hasOwn(props, 'defaultValue')
      ? { defaultValue: props.defaultValue }
      : {}),
    preserve: props.preserve,
    dependsOn: props.dependsOn,
    deps: props.deps,
    isEqual: props.isEqual,
    rules:
      props.isRequired && !rules?.some((rule) => rule.required)
        ? [{ required: true }, ...(rules ?? [])]
        : rules,
    rulesKey:
      props.rulesKey === undefined
        ? undefined
        : `${props.isRequired ? 'required:' : ''}${props.rulesKey}`,
    validationDelay: props.validationDelay,
    validateTrigger: props.validateTrigger ?? defaultTrigger ?? 'onBlur',
    errorPolicy: props.errorPolicy,
  };
}
