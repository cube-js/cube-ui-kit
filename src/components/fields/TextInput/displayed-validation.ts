import { useState } from 'react';

import { chain } from '../../../utils/react/chain';

import type { ValidationResult } from '@react-types/shared';
import type { ReactNode } from 'react';

interface ValidationTriggers {
  onChange?: (...args: any[]) => void;
  onBlur?: (...args: any[]) => void;
}

/**
 * The validation the field chrome shows. React Aria runs `validate` from the first render and sets
 * `aria-invalid` from it, so an untouched field would open with the invalid style and the message
 * for its empty value. Both wait until the user has changed the value or left the field. An explicit
 * `isInvalid`, which a form's validation also sets, shows at once, and a caller's `errorMessage`
 * still wins over the errors `validate` returns.
 */
export function useDisplayedValidation() {
  let [isTouched, setIsTouched] = useState(false);
  let touch = () => setIsTouched(true);

  return {
    /** Wraps the React Aria hook's props so its first `onChange` or `onBlur` marks the field touched. */
    trackTouched<P extends ValidationTriggers>(props: P): P {
      return {
        ...props,
        onChange: chain(props.onChange, touch),
        onBlur: chain(props.onBlur, touch),
      };
    },
    getDisplayedValidation(
      {
        isInvalid,
        errorMessage,
      }: { isInvalid?: boolean; errorMessage?: ReactNode },
      validation: ValidationResult,
    ) {
      let isShown = isTouched || isInvalid !== undefined;

      return {
        isInvalid: isShown && validation.isInvalid,
        errorMessage:
          errorMessage === undefined &&
          isShown &&
          validation.validationErrors.length
            ? validation.validationErrors.join(' ')
            : errorMessage,
      };
    },
  };
}
