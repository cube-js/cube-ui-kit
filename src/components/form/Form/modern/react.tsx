import { useContext, useMemo, useState } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector.js';

import { useLayoutEffect } from '../../../../utils/react/useLayoutEffect';

import { ModernControllerContext } from './context';
import { createFormController, getControllerInternals } from './controller';
import { getFieldKey, normalizePath, readPath } from './values';

import type { ReactNode } from 'react';
import type {
  FormController,
  ModernFieldState,
  ModernFormState,
  UseFormControllerOptions,
} from './controller';
import type { CheckedFormPath, FormValueAtPath } from './path-types';
import type { FormReadValue } from './read-types';
import type { FormPath } from './values';

export function useFormController<T extends object = Record<string, unknown>>(
  options?: UseFormControllerOptions<T>,
): FormController<T> {
  // Initial options seed synchronously. A new options object never resets the
  // controller, and the creator does not subscribe its owner to form changes.
  const [controller] = useState(() => createFormController(options));
  const { store } = getControllerInternals(controller, 'Form.useController()');
  // Intentionally commit after every render: callbacks are live, unlike the
  // initial defaults/policy. Abandoned renders must never replace callbacks.
  useLayoutEffect(() => {
    store.updateCallbacks({
      onSubmit: options?.onSubmit,
      onSubmitFailed: options?.onSubmitFailed,
      onValuesChange: options?.onValuesChange,
    });
  });
  // Do not dispose from effect cleanup: Strict Mode and hidden React trees
  // reconnect effects while preserving state. Subscriptions own their cleanup;
  // the controller has no external resources and is collected with its owner.
  return controller;
}

export function useFormValue<T extends object, const Path extends FormPath>(
  form: FormController<T>,
  path: CheckedFormPath<T, Path>,
): FormReadValue<FormValueAtPath<T, Path>> | undefined {
  const normalized = useMemo(() => normalizePath(path), [path]);
  return useFormSelector(form, (state) =>
    readPath(state.values, normalized),
  ) as FormReadValue<FormValueAtPath<T, Path>> | undefined;
}

export function useFormFieldState<
  T extends object,
  const Path extends FormPath,
>(
  form: FormController<T>,
  path: CheckedFormPath<T, Path>,
): ModernFieldState<FormValueAtPath<T, Path>> | undefined {
  const key = useMemo(() => getFieldKey(path), [path]);
  return useFormSelector(form, (state) => state.fields[key]) as
    | ModernFieldState<FormValueAtPath<T, Path>>
    | undefined;
}

export interface FormSelectorOptions<Selected> {
  isEqual?: (previous: Selected, next: Selected) => boolean;
}

export function useFormSelector<T extends object, Selected>(
  controller: FormController<T>,
  selector: (state: ModernFormState<T>) => Selected,
  options?: FormSelectorOptions<Selected>,
): Selected {
  const { getServerSnapshot } = getControllerInternals(
    controller,
    'Form.useSelector()',
  );
  return useSyncExternalStoreWithSelector(
    controller.subscribe,
    controller.getSnapshot,
    getServerSnapshot,
    selector,
    options?.isEqual,
  );
}

export interface FormSubscribeProps<T extends object, Selected>
  extends FormSelectorOptions<Selected> {
  /** Omit to use modern context. An explicit undefined detaches from context. */
  form?: FormController<T>;
  selector: (state: ModernFormState<T>) => Selected;
  children: (selected: Selected) => ReactNode;
}

export function FormSubscribe<
  T extends object = Record<string, unknown>,
  Selected = unknown,
>(props: FormSubscribeProps<T, Selected>) {
  const fromContext = useContext(ModernControllerContext);
  const controller = Object.hasOwn(props, 'form') ? props.form : fromContext;
  if (!controller) {
    throw new Error(
      '<Form.Subscribe> requires a modern form prop or a modern <Form> root.',
    );
  }
  const selected = useFormSelector(controller, props.selector, {
    isEqual: props.isEqual,
  });
  return <>{props.children(selected)}</>;
}
