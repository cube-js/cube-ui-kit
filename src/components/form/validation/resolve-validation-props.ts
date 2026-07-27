import { ValidationProps, ValidationState } from '../../../shared/index';

export interface ResolvableValidationProps extends ValidationProps {
  /** @deprecated Use `isInvalid` / `isValid` instead. */
  validationState?: ValidationState;
}

export interface ResolvedValidationProps {
  isInvalid: boolean | undefined;
  isValid: boolean | undefined;
}

/**
 * Normalizes the validation props of a field into a pair of booleans.
 *
 * When none of `isInvalid`, `isValid` and the deprecated `validationState` is provided, both flags stay
 * `undefined` so the caller can fall back to a derived state (form errors, `showValid`, …). As soon as any
 * of them is provided, both flags become definite booleans and no fallback applies.
 *
 * `isInvalid` always wins over `isValid`.
 */
export function resolveValidationProps(
  props: ResolvableValidationProps,
): ResolvedValidationProps {
  const { isInvalid, isValid, validationState } = props;

  if (
    isInvalid === undefined &&
    isValid === undefined &&
    validationState === undefined
  ) {
    return { isInvalid: undefined, isValid: undefined };
  }

  const resolvedIsInvalid = isInvalid ?? validationState === 'invalid';

  return {
    isInvalid: resolvedIsInvalid,
    isValid: resolvedIsInvalid ? false : isValid ?? validationState === 'valid',
  };
}

/** Whether the field has a validation state worth rendering an indicator for */
export function hasValidationState({
  isInvalid,
  isValid,
}: ValidationProps): boolean {
  return !!isInvalid || !!isValid;
}

/** Tasty modifiers for the validation state. Use instead of hand-writing `invalid`/`valid` mods. */
export function getValidationMods({ isInvalid, isValid }: ValidationProps) {
  return {
    invalid: !!isInvalid,
    valid: !!isValid && !isInvalid,
  };
}

/**
 * Maps the validation state onto a theme name for triggers and items.
 *
 * By default only the invalid state is mapped, which keeps neutral triggers neutral while the suffix icon
 * communicates the valid state. Pass `includeValid` to also map the valid state onto `success`.
 */
export function getValidationTheme<T extends string | undefined>(
  theme: T,
  { isInvalid, isValid }: ValidationProps,
  options: { includeValid?: boolean } = {},
): T | 'danger' | 'success' {
  if (isInvalid) return 'danger';
  if (options.includeValid && isValid) return 'success';

  return theme;
}
