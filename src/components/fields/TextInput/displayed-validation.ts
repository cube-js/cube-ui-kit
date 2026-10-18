import type { ValidationResult } from '@react-types/shared';
import type { ReactNode } from 'react';

/**
 * The validation React Aria displays, for the field chrome. The hook sets `aria-invalid` from the
 * same result, so the invalid style and the message follow `validate` as well as `isInvalid`. A
 * caller's `errorMessage` still wins over the errors `validate` returns.
 */
export function getDisplayedValidation(
  { errorMessage }: { errorMessage?: ReactNode },
  { isInvalid, validationErrors }: ValidationResult,
) {
  return {
    isInvalid,
    errorMessage:
      errorMessage === undefined && validationErrors.length
        ? validationErrors.join(' ')
        : errorMessage,
  };
}
