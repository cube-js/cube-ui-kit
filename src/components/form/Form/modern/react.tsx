import { useContext, useState } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector.js';

import { ModernControllerContext } from './context';
import { createFormController, getControllerInternals } from './controller';

import type { ReactNode } from 'react';
import type {
  FormController,
  ModernFormState,
  UseFormControllerOptions,
} from './controller';

export function useFormController<T extends object = Record<string, unknown>>(
  options?: UseFormControllerOptions<T>,
): FormController<T> {
  // Initial options seed synchronously. A new options object never resets the
  // controller, and the creator does not subscribe its owner to form changes.
  const [controller] = useState(() => createFormController(options));
  // Do not dispose from effect cleanup: Strict Mode and hidden React trees
  // reconnect effects while preserving state. Subscriptions own their cleanup;
  // the controller has no external resources and is collected with its owner.
  return controller;
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
