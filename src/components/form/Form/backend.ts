/**
 * Nominal branding for the two Form backends (modernization plan §5.1).
 *
 * The legacy engine (`CubeFormInstance`) and the modern controller are not
 * structurally interchangeable: each carries this symbol with its backend
 * kind, the `<Form>` facade dispatches on it before any backend hook runs, and
 * the shared field hook refuses a backend that does not match its root.
 *
 * Phase 3 ships the shell only. No modern creator is exported, so a modern
 * controller cannot be constructed by consumers yet; every modern branch ends
 * in `modernBackendUnavailableError` until the modern backend lands.
 */
import type { CubeFormInstance } from './use-form';

export const FORM_BACKEND: unique symbol = Symbol.for(
  '@cube-dev/ui-kit/form-backend',
);

export type FormBackendKind = 'legacy' | 'modern';

export interface LegacyFormBrand {
  readonly [FORM_BACKEND]: 'legacy';
}

export interface ModernFormBrand {
  readonly [FORM_BACKEND]: 'modern';
}

/**
 * The modern controller as the shell knows it: the brand and nothing else.
 * The store, selectors and commands arrive with the modern backend; `T` is
 * carried so consumers can already be typed against it.
 */
export interface FormController<T extends object = Record<string, unknown>>
  extends ModernFormBrand {
  readonly '~values'?: (values: T) => void;
}

export function isLegacyFormInstance(
  value: unknown,
): value is CubeFormInstance<any> {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<PropertyKey, unknown>)[FORM_BACKEND] === 'legacy'
  );
}

export function isModernFormController(
  value: unknown,
): value is FormController<any> {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<PropertyKey, unknown>)[FORM_BACKEND] === 'modern'
  );
}

export type ResolvedFormBackend =
  | { kind: 'none' }
  | { kind: 'legacy'; instance: CubeFormInstance<any> }
  | { kind: 'modern'; controller: FormController<any> };

const NONE: ResolvedFormBackend = { kind: 'none' };

/**
 * Classify whatever arrived through a `form` prop or the form context.
 *
 * An unbranded object counts as legacy on purpose: Cloud narrows form props to
 * structural types and its tests pass plain mocks, and the legacy engine has
 * always accepted them.
 */
export function resolveFormBackend(candidate: unknown): ResolvedFormBackend {
  if (candidate == null) return NONE;

  if (isModernFormController(candidate)) {
    return { kind: 'modern', controller: candidate };
  }

  return { kind: 'legacy', instance: candidate as CubeFormInstance<any> };
}

export function modernBackendUnavailableError(receiver: string): Error {
  return new Error(
    `${receiver} received a modern form controller, but the modern Form backend is not available in this version of @cube-dev/ui-kit. Create forms with Form.useForm() for now.`,
  );
}
