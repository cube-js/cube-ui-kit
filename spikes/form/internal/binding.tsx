/**
 * Phase 2 spike — the shared field-binding boundary.
 *
 * Shape proven here: "a uniform backend adapter consumed by one unconditional
 * field hook" (plan §5.4). `useBoundField` calls the same hooks in the same
 * order whatever the backend is — modern controller, legacy instance, or none
 * (standalone / inside the deprecated `<Field>`). Backend-specific behaviour,
 * including the legacy render-phase field creation, lives inside the adapter
 * objects, which are plain closures rather than hooks.
 */
import {
  ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

import { useEvent } from '../../../src/_internal/hooks/use-event';
import { useInsideLegacyField } from '../../../src/components/form/Form/Field';
import { FormContext } from '../../../src/components/form/Form/Form';
import { mergeProps } from '../../../src/utils/react/index';

import { ModernControllerContext } from './react';
import { isModernFormStore, ValidateTrigger, ValidationRule } from './store';

import type { CubeFormInstance } from '../../../src/components/form/Form/use-form';
import type { FormController } from './react';

// ---------------------------------------------------------------------------
// Adapter contract
// ---------------------------------------------------------------------------

export interface BindingSnapshot {
  readonly value: unknown;
  readonly errors: readonly ReactNode[];
  readonly status: 'unvalidated' | 'validating' | 'valid' | 'invalid';
  readonly touched: boolean;
}

export interface BackendRegistrationOptions {
  rules?: readonly ValidationRule[];
  defaultValue?: unknown;
  validationDelay?: number;
  validateTrigger?: ValidateTrigger;
}

export interface BackendRegistration {
  update(options: BackendRegistrationOptions): void;
  release(): void;
}

export interface FieldBackendHandle {
  readonly kind: 'modern' | 'legacy' | 'none';
  subscribe(listener: () => void): () => void;
  /** `null` means "this field is not bound to any backend". */
  getSnapshot(): BindingSnapshot | null;
  register(): BackendRegistration | null;
  change(
    value: unknown,
    meta: { touch: boolean; trigger: ValidateTrigger },
  ): void;
  blur(trigger: ValidateTrigger): void;
}

export interface FieldBackend {
  readonly kind: 'modern' | 'legacy' | 'none';
  field(name: string): FieldBackendHandle;
}

const noop = () => {};
const noopUnsubscribe = () => noop;

// ---------------------------------------------------------------------------
// None
// ---------------------------------------------------------------------------

const NONE_HANDLE: FieldBackendHandle = {
  kind: 'none',
  subscribe: noopUnsubscribe,
  getSnapshot: () => null,
  register: () => null,
  change: noop,
  blur: noop,
};

export const NONE_BACKEND: FieldBackend = {
  kind: 'none',
  field: () => NONE_HANDLE,
};

// ---------------------------------------------------------------------------
// Modern
// ---------------------------------------------------------------------------

export function createModernBackend(
  controller: FormController<any>,
): FieldBackend {
  const handles = new Map<string, FieldBackendHandle>();

  return {
    kind: 'modern',
    field(name) {
      let handle = handles.get(name);
      if (handle) return handle;

      let lastField: unknown = undefined;
      let lastSnapshot: BindingSnapshot | null = null;

      handle = {
        kind: 'modern',
        subscribe: controller.subscribe,
        getSnapshot() {
          const field = controller.getSnapshot().fields[name];
          if (field === lastField && lastSnapshot) return lastSnapshot;
          lastField = field;
          lastSnapshot = {
            value: field?.value,
            errors: field?.errors ?? [],
            status: field?.status ?? 'unvalidated',
            touched: field?.touched ?? false,
          };
          return lastSnapshot;
        },
        register() {
          const token = controller.register(name);
          return {
            update: (options) => token.update(options),
            release: () => token.release(),
          };
        },
        change(value, meta) {
          controller.setValue(name, value, {
            source: 'user',
            touch: meta.touch,
          });
        },
        blur() {
          controller.blur(name);
        },
      };
      handles.set(name, handle);
      return handle;
    },
  };
}

// ---------------------------------------------------------------------------
// Legacy
// ---------------------------------------------------------------------------

/**
 * Wraps a mutable `CubeFormInstance`. The legacy engine has no change events:
 * the owner rerender re-runs `getSnapshot()`, which rebuilds the snapshot only
 * when the field's observable props changed. Field creation stays lazy and
 * render-phase, exactly as the legacy `useField` does today — but it is now
 * contained in this legacy adapter module instead of the shared hook.
 */
export function createLegacyBackend(form: CubeFormInstance<any>): FieldBackend {
  const handles = new Map<string, FieldBackendHandle>();

  return {
    kind: 'legacy',
    field(name) {
      let handle = handles.get(name);
      if (handle) return handle;

      let lastKey: unknown[] | null = null;
      let lastSnapshot: BindingSnapshot | null = null;

      const ensureField = () =>
        (form.getFieldInstance(name) ?? form.createField(name, true))!;

      handle = {
        kind: 'legacy',
        subscribe: noopUnsubscribe,
        getSnapshot() {
          const field = ensureField();
          const key = [field.value, field.errors, field.status, field.touched];
          if (lastKey && key.every((v, i) => Object.is(v, lastKey![i]))) {
            return lastSnapshot;
          }
          lastKey = key;
          lastSnapshot = {
            value: field.value,
            errors: field.errors ?? [],
            status: field.status ?? 'unvalidated',
            touched: !!field.touched,
          };
          return lastSnapshot;
        },
        register() {
          ensureField();
          return {
            update(options) {
              const field = ensureField();
              field.rules = options.rules as any;
              if (field.value == null && options.defaultValue != null) {
                form.setFieldValue(name, options.defaultValue, false, true);
                form.updateInitialFieldsValue({ [name]: options.defaultValue });
              }
            },
            release() {
              form.removeField(name);
            },
          };
        },
        change(value, meta) {
          const field = form.getFieldInstance(name);
          form.setFieldValue(name, value, meta.touch);
          if (
            meta.touch &&
            (meta.trigger === 'onChange' || (field?.errors?.length ?? 0) > 0)
          ) {
            form.validateField(name).catch(noop);
          }
        },
        blur(trigger) {
          if (trigger === 'onBlur') {
            setTimeout(() => form.validateField(name).catch(noop));
          }
        },
      };
      handles.set(name, handle);
      return handle;
    },
  };
}

const backendCache = new WeakMap<object, FieldBackend>();

function backendFor(source: object): FieldBackend {
  let backend = backendCache.get(source);
  if (!backend) {
    backend = isModernFormStore(source)
      ? createModernBackend(source)
      : createLegacyBackend(source as CubeFormInstance<any>);
    backendCache.set(source, backend);
  }
  return backend;
}

// ---------------------------------------------------------------------------
// The one field hook
// ---------------------------------------------------------------------------

export interface BoundFieldProps {
  name?: string;
  id?: string;
  /** Explicit legacy instance (outside a legacy `<Form>`). */
  form?: CubeFormInstance<any>;
  /** Explicit modern controller (outside a modern root). */
  controller?: FormController<any>;
  rules?: ValidationRule[];
  defaultValue?: unknown;
  validationDelay?: number;
  validateTrigger?: ValidateTrigger;
  errorMessage?: ReactNode;
  isInvalid?: boolean;
  [key: string]: unknown;
}

export interface UseBoundFieldParams {
  /** Maps the stored value and change handler onto the component's own props. */
  mapper?: (
    value: unknown,
    onChange: (value: unknown, dontTouch?: boolean) => void,
  ) => object;
  defaultValidationTrigger?: ValidateTrigger;
}

/** Form-only props that must never reach the wrapped input or the DOM. */
const BINDING_PROP_NAMES = [
  'name',
  'form',
  'controller',
  'rules',
  'defaultValue',
  'validationDelay',
  'validateTrigger',
] as const;

export function useBoundField<P extends BoundFieldProps>(
  props: P,
  params: UseBoundFieldParams = {},
): P {
  const legacyContext = useContext(FormContext) as {
    form?: CubeFormInstance<any>;
  };
  const modernContext = useContext(ModernControllerContext);
  const insideLegacyField = useInsideLegacyField();

  const {
    name,
    form: explicitForm,
    controller: explicitController,
    rules,
    defaultValue,
    validationDelay,
    validateTrigger = params.defaultValidationTrigger ?? 'onBlur',
  } = props;

  const hasName = name != null && name !== '';
  const source: object | null =
    hasName && !insideLegacyField
      ? explicitController ??
        explicitForm ??
        modernContext ??
        legacyContext?.form ??
        null
      : null;

  const backend = useMemo(
    () => (source ? backendFor(source) : NONE_BACKEND),
    [source],
  );
  const handle = useMemo(() => backend.field(name ?? ''), [backend, name]);

  const snapshot = useSyncExternalStore(
    handle.subscribe,
    handle.getSnapshot,
    handle.getSnapshot,
  );

  const registrationRef = useRef<BackendRegistration | null>(null);

  useLayoutEffect(() => {
    const registration = handle.register();
    registrationRef.current = registration;
    return () => {
      registration?.release();
      if (registrationRef.current === registration)
        registrationRef.current = null;
    };
  }, [handle]);

  useLayoutEffect(() => {
    registrationRef.current?.update({
      rules,
      defaultValue,
      validationDelay,
      validateTrigger,
    });
  });

  const onChange = useEvent((value: unknown, dontTouch?: boolean) => {
    handle.change(value, { touch: !dontTouch, trigger: validateTrigger });
  });

  const onBlur = useEvent(() => {
    handle.blur(validateTrigger);
  });

  // Unbound (standalone, or inside the deprecated <Field>): props untouched.
  if (!snapshot) return props;

  const rest: Record<string, unknown> = { ...props };
  for (const key of BINDING_PROP_NAMES) delete rest[key];

  const mapper =
    params.mapper ?? ((value, change) => ({ value, onChange: change }));
  const errorMessage =
    props.errorMessage !== undefined
      ? props.errorMessage
      : snapshot.status === 'invalid'
        ? snapshot.errors[0]
        : undefined;

  return mergeProps(rest, mapper(snapshot.value, onChange), {
    // Legacy ids equal the field name (Cloud e2e selectors rely on `#name`).
    id: props.id ?? name,
    onBlur,
    errorMessage,
    isInvalid: props.isInvalid ?? snapshot.status === 'invalid',
  }) as P;
}
