/**
 * Nominal branding for the two Form backends (modernization plan §5.1).
 *
 * The legacy engine (`CubeFormInstance`) and the modern controller are not
 * structurally interchangeable: each carries this symbol with its backend
 * kind, the `<Form>` facade dispatches on it before any backend hook runs, and
 * the legacy field adapter refuses a controller it cannot bind.
 *
 * Phase 3 ships the shell only. No modern creator is exported, so a modern
 * controller cannot be constructed by consumers yet; every modern branch ends
 * in `modernBackendUnavailableError` until the modern backend lands.
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

/**
 * The modern controller as the shell knows it: the brand and nothing else.
 * The store, selectors, commands and the values type parameter arrive with
 * the modern backend.
 */
export type FormController = ModernFormBrand;

/**
 * Only a modern brand is ever checked. Anything else — a branded legacy
 * instance, but also an unbranded object — counts as legacy on purpose: Cloud
 * narrows form props to structural types and its tests pass plain mocks, and
 * the legacy engine has always accepted them.
 */
export function isModernFormController(
  value: unknown,
): value is FormController {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<PropertyKey, unknown>)[FORM_BACKEND] === 'modern'
  );
}

export function modernBackendUnavailableError(receiver: string): Error {
  return new Error(
    `${receiver} received a modern form controller, but the modern Form backend is not available in this version of @cube-dev/ui-kit. Create forms with Form.useForm() for now.`,
  );
}
