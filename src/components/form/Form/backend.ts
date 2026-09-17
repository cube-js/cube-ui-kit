/**
 * Nominal branding for the two Form backends (modernization plan §5.1).
 *
 * The legacy engine (`CubeFormInstance`) and the modern controller are not
 * structurally interchangeable: each carries this symbol with its backend
 * kind, the `<Form>` facade dispatches on it before any backend hook runs, and
 * the legacy field adapter refuses a controller it cannot bind.
 *
 * Modern controllers support creation, selectors, fields, validation, and submission.
 * Legacy-only APIs reject them explicitly.
 */
export const FORM_BACKEND: unique symbol = Symbol.for(
  '@cube-dev/ui-kit/form-backend',
);

export interface LegacyFormBrand {
  readonly [FORM_BACKEND]: 'legacy';
}

export interface ModernFormBrand {
  readonly [FORM_BACKEND]: 'modern';
}

export type { FormController } from './modern/controller';

/**
 * Only a modern brand is ever checked. Anything else — a branded legacy
 * instance, but also an unbranded object — counts as legacy on purpose: Cloud
 * narrows form props to structural types and its tests pass plain mocks, and
 * the legacy engine has always accepted them.
 */
export function isModernFormController(
  value: unknown,
): value is ModernFormBrand {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<PropertyKey, unknown>)[FORM_BACKEND] === 'modern'
  );
}

export function modernBackendUnavailableError(receiver: string): Error {
  return new Error(
    `${receiver} received a modern form controller, but this legacy API does not support modern controllers. Use named inputs or useFieldProps with a modern controller; Form.Item and Form.useForm() remain legacy-only.`,
  );
}
