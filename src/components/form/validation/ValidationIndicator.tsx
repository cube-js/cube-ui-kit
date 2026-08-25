import { ReactElement } from 'react';

import { LoadingIcon } from '../../../icons/LoadingIcon';
import { ValidationProps } from '../../../shared/index';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';

import { hasValidationState } from './resolve-validation-props';

export interface ValidationIndicatorProps extends ValidationProps {
  isLoading?: boolean;
}

/** The validation icon for the current state, or `null` when there is nothing to show */
export function getValidationIcon({
  isInvalid,
  isValid,
}: ValidationProps): ReactElement | null {
  if (isInvalid) return InvalidIcon;
  if (isValid) return ValidIcon;

  return null;
}

/**
 * Whether an input needs to render the `data-element="State"` block. The loading indicator replaces the
 * validation icon while the input is loading.
 */
export function hasValidationIndicator(props: ValidationIndicatorProps) {
  return !!props.isLoading || hasValidationState(props);
}

/**
 * Renders the validation state of an input as a suffix: either the validation icon or, while loading, the
 * loading indicator.
 */
export function ValidationIndicator(props: ValidationIndicatorProps) {
  const { isLoading } = props;

  if (!hasValidationIndicator(props)) {
    return null;
  }

  return (
    <div data-element="State">
      {isLoading ? (
        <LoadingIcon data-element="InputIcon" />
      ) : (
        getValidationIcon(props)
      )}
    </div>
  );
}
