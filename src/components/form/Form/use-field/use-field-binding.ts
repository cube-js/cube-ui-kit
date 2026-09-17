import { useMemo, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector.js';

import { useEvent } from '../../../../_internal/hooks/use-event';
import { useLayoutEffect } from '../../../../utils/react/useLayoutEffect';
import { isModernFormController } from '../backend';
import {
  createModernFieldBackend,
  fieldRegistrationOptions,
  sameFieldView,
} from '../modern/field-binding';

import { useField } from './use-field';

import type { ReactNode } from 'react';
import type { FormController } from '../modern/controller';
import type { FieldBackendHandle, FieldView } from '../modern/field-binding';
import type { RegistrationToken } from '../modern/types';
import type { FieldTypes } from '../types';
import type { FieldReturnValue, UseFieldProps } from './types';
import type { UseFieldParams } from './use-field';

const noop = () => {};
const selectView = (view: FieldView | undefined) => view;

/**
 * One unconditional subscription/registration boundary. The frozen legacy
 * adapter still runs its original hooks, inert on the modern path, so an input
 * can cross backends without remounting or changing hook order. Its render-time
 * mutations remain contained in use-field.ts; modern handles are pure to create.
 */
export function useFieldBinding<
  T extends FieldTypes,
  P extends UseFieldProps<T>,
>(
  props: P,
  params: UseFieldParams,
  generatedId: string,
): Omit<FieldReturnValue<T>, 'form'> & {
  form?: FieldReturnValue<T>['form'] | FormController<any>;
  isLoading?: boolean;
} {
  const modern = !params.unbound && isModernFormController(props.form);
  const controller = modern
    ? (props.form as unknown as FormController<any>)
    : undefined;
  const name = props.name ?? '';
  const legacy = useField<T, P>(props, {
    ...params,
    unbound: params.unbound || modern,
  });
  const modernHandle = useMemo(
    () => (controller ? createModernFieldBackend(controller, name) : undefined),
    [controller, name],
  );
  const legacyHandle = useMemo<FieldBackendHandle>(() => {
    const snapshot: FieldView = {
      value: legacy.value,
      errors: legacy.field?.errors ?? [],
      status: legacy.field?.status ?? 'unvalidated',
    };
    return {
      subscribe: () => noop,
      getSnapshot: () => snapshot,
      getServerSnapshot: () => snapshot,
      register: () => undefined,
      change: (value, dontTouch, trigger) =>
        legacy.onChange?.(value, dontTouch, trigger),
      blur: legacy.onBlur,
    };
  }, [legacy]);
  const handle = modernHandle ?? legacyHandle;
  const field = useSyncExternalStoreWithSelector(
    handle.subscribe,
    handle.getSnapshot,
    handle.getServerSnapshot,
    selectView,
    sameFieldView,
  );
  const registration = useRef<RegistrationToken<ReactNode> | undefined>(
    undefined,
  );
  useLayoutEffect(() => {
    const token = handle.register();
    registration.current = token;
    return () => {
      token?.release({ deferValueRemoval: true });
      if (registration.current === token) registration.current = undefined;
    };
  }, [handle]);
  useLayoutEffect(() => {
    registration.current?.update(
      fieldRegistrationOptions(props, params.defaultValidationTrigger),
    );
  });
  const trigger =
    props.validateTrigger ?? params.defaultValidationTrigger ?? 'onBlur';
  const onChange = useEvent((value: unknown, dontTouch: boolean) => {
    if (controller && props.shouldUpdate !== undefined) {
      const previous = controller.getValues();
      if (
        props.shouldUpdate === false ||
        (typeof props.shouldUpdate === 'function' &&
          !props.shouldUpdate(previous, { ...previous, [name]: value }))
      )
        return;
    }
    handle.change(value, dontTouch, trigger);
  });
  const onBlur = useEvent(() => handle.blur());
  if (!controller) return legacy;

  const required =
    props.isRequired ||
    props.rules?.flat(Infinity).some((rule) => rule.required === true);
  const id =
    props.id ??
    `${props.idPrefix ? `${props.idPrefix}_` : ''}${name}-${generatedId}`;
  return {
    form: controller,
    name,
    id,
    nonInput: false,
    value: field ? field.value : props.defaultValue,
    onChange,
    onBlur,
    validateTrigger: trigger,
    isInvalid: props.isInvalid ?? !!field?.errors.length,
    isValid: props.isValid ?? !!(props.showValid && field?.status === 'valid'),
    isLoading: props.isLoading ?? field?.status === 'validating',
    ...(required ? { isRequired: true } : {}),
    ...(required && !props.isRequired && props.necessityIndicator === undefined
      ? { necessityIndicator: null }
      : {}),
    description: props.description,
    message: props.message !== undefined ? props.message : field?.errors[0],
    errorMessage:
      props.errorMessage !== undefined ? props.errorMessage : field?.errors[0],
  };
}
