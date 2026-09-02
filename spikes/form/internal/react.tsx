/**
 * Phase 2 spike — React adapter over the internal store.
 *
 * `useSyncExternalStore` (via the official with-selector shim) for selection;
 * registration and callback binding live in effects, never in render. No ref
 * is written during render anywhere in this file.
 */
import {
  createContext,
  FormEvent,
  FormHTMLAttributes,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

import { useEvent } from '../../../src/_internal/hooks/use-event';

import {
  CallbackBinding,
  createFormStore,
  EMPTY_ERRORS,
  FieldStatus,
  FormCallbacks,
  FormState,
  FormStore,
  FormStoreOptions,
  isModernFormStore,
  RegistrationOptions,
  RegistrationToken,
} from './store';

/** Draft public name for the modern controller (plan §6.2). */
export type FormController<T extends object = Record<string, unknown>> =
  FormStore<T>;

// ---------------------------------------------------------------------------
// Controller creation
// ---------------------------------------------------------------------------

export function useFormController<T extends object = Record<string, unknown>>(
  options?: FormStoreOptions<T>,
): FormController<T> {
  // Options identity changes after the first render are ignored on purpose
  // (plan §7.3: later options-object identity changes never reset a form).
  const [controller] = useState(() => createFormStore<T>(options));

  useEffect(() => () => controller.dispose(), [controller]);

  return controller;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

function assertModern(controller: unknown, hook: string): void {
  if (!isModernFormStore(controller)) {
    throw new Error(
      `${hook} requires a modern form controller. A legacy Form instance is not reactive; migrate the form with Form.useController().`,
    );
  }
}

export function useFormSelector<T extends object, Selected>(
  controller: FormController<T>,
  selector: (state: FormState<T>) => Selected,
  options?: { isEqual?: (a: Selected, b: Selected) => boolean },
): Selected {
  assertModern(controller, 'useFormSelector');

  return useSyncExternalStoreWithSelector(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
    selector,
    options?.isEqual,
  );
}

export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const key of ka) {
    if (
      !Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      )
    ) {
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Root and context
// ---------------------------------------------------------------------------

const ControllerContext = createContext<FormController<any> | null>(null);

export function useFormControllerContext<
  T extends object = Record<string, unknown>,
>(): FormController<T> {
  const controller = useContext(ControllerContext);
  if (!controller) {
    throw new Error(
      'useFormControllerContext() must be used under a modern <Form> root.',
    );
  }
  return controller;
}

export function useOptionalFormController<
  T extends object = Record<string, unknown>,
>(): FormController<T> | null {
  return useContext(ControllerContext);
}

export interface ModernFormProps<T extends object>
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>,
    FormCallbacks<T> {
  controller: FormController<T>;
  children?: ReactNode;
}

/**
 * Tokenized callback binding. Only the keys this root provides are bound; a
 * key that is omitted (or becomes `undefined`) falls back to the controller
 * default. Explicit removal of a default stays a store-level operation
 * (`bindCallbacks({ onSubmit: undefined })`) — gate decision, see the ADR.
 */
export function ModernForm<T extends object>({
  controller,
  onSubmit,
  onSubmitFailed,
  onValuesChange,
  children,
  ...rest
}: ModernFormProps<T>) {
  assertModern(controller, '<Form>');

  const bindingRef = useRef<CallbackBinding<T> | null>(null);

  useLayoutEffect(() => {
    const binding = controller.bindCallbacks({});
    bindingRef.current = binding;
    return () => {
      binding.release();
      if (bindingRef.current === binding) bindingRef.current = null;
    };
  }, [controller]);

  useLayoutEffect(() => {
    const next: FormCallbacks<T> = {};
    if (onSubmit) next.onSubmit = onSubmit;
    if (onSubmitFailed) next.onSubmitFailed = onSubmitFailed;
    if (onValuesChange) next.onValuesChange = onValuesChange;
    bindingRef.current?.update(next);
  });

  const handleSubmit = useEvent((event: FormEvent<HTMLFormElement>) => {
    // A native action/method form keeps the browser submission (plan §10 OAuth).
    if (rest.action) return;
    event.preventDefault();
    event.stopPropagation();
    void controller.submit();
  });

  return (
    <ControllerContext.Provider value={controller}>
      <form noValidate {...rest} onSubmit={handleSubmit}>
        {children}
      </form>
    </ControllerContext.Provider>
  );
}

export function FormSubscribe<T extends object, Selected>({
  controller,
  selector,
  isEqual,
  children,
}: {
  controller?: FormController<T>;
  selector: (state: FormState<T>) => Selected;
  isEqual?: (a: Selected, b: Selected) => boolean;
  children: (selected: Selected) => ReactNode;
}) {
  const fromContext = useOptionalFormController<T>();
  const resolved = controller ?? fromContext;
  if (!resolved) {
    throw new Error(
      '<Form.Subscribe> needs a modern controller prop or a modern <Form> root.',
    );
  }
  const selected = useFormSelector(resolved, selector, { isEqual });
  return <>{children(selected)}</>;
}

// ---------------------------------------------------------------------------
// Field registration hook
// ---------------------------------------------------------------------------

export interface FieldSlice<V = unknown> {
  readonly value: V | undefined;
  readonly errors: readonly ReactNode[];
  readonly status: FieldStatus;
  readonly touched: boolean;
  readonly dirty: boolean;
}

const EMPTY_SLICE: FieldSlice = Object.freeze({
  value: undefined,
  errors: EMPTY_ERRORS,
  status: 'unvalidated' as FieldStatus,
  touched: false,
  dirty: false,
});

export function selectFieldSlice<T extends object>(
  state: FormState<T>,
  name: string,
): FieldSlice {
  const field = state.fields[name];
  if (!field) return EMPTY_SLICE;
  return {
    value: field.value,
    errors: field.errors,
    status: field.status,
    touched: field.touched,
    dirty: field.dirty,
  };
}

export interface FieldBinding<V = unknown> extends FieldSlice<V> {
  readonly name: string;
  readonly isInvalid: boolean;
  readonly errorMessage: ReactNode | undefined;
  onChange(value: V, options?: { touch?: boolean }): void;
  onBlur(): void;
}

/**
 * One unconditional hook per field. Registration happens in a layout effect
 * keyed by controller/name; the options (rules, delay, default) are pushed
 * through `token.update()` after every render, and the store decides whether
 * anything semantically changed.
 */
export function useFormField<V = unknown>(
  controller: FormController<any>,
  name: string,
  options: RegistrationOptions = {},
): FieldBinding<V> {
  assertModern(controller, 'useFormField');

  const tokenRef = useRef<RegistrationToken | null>(null);

  useLayoutEffect(() => {
    const token = controller.register(name);
    tokenRef.current = token;
    return () => {
      token.release();
      if (tokenRef.current === token) tokenRef.current = null;
    };
  }, [controller, name]);

  useLayoutEffect(() => {
    tokenRef.current?.update(options);
  });

  const slice = useFormSelector(
    controller,
    (state) => selectFieldSlice(state, name),
    { isEqual: shallowEqual },
  ) as FieldSlice<V>;

  const onChange = useEvent((value: V, changeOptions?: { touch?: boolean }) => {
    controller.setValue(name, value, {
      source: 'user',
      touch: changeOptions?.touch ?? true,
    });
  });

  const onBlur = useEvent(() => {
    controller.blur(name);
  });

  return {
    name,
    ...slice,
    isInvalid: slice.status === 'invalid',
    errorMessage: slice.status === 'invalid' ? slice.errors[0] : undefined,
    onChange,
    onBlur,
  };
}

export { ControllerContext as ModernControllerContext };
