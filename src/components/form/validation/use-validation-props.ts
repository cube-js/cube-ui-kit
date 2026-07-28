import { useWarn } from '../../../_internal/index';

import {
  ResolvableValidationProps,
  resolveValidationProps,
} from './resolve-validation-props';

/**
 * Resolves `isInvalid` / `isValid` from the props and removes the deprecated `validationState` prop, so
 * component bodies only ever deal with booleans.
 *
 * The validation props are intersected into the parameter instead of constraining `T`, because prop types
 * built with `Omit` over a `Props` index signature expose no named properties and would fail the weak type
 * check of an all-optional constraint.
 */
export function useValidationProps<T>(props: T & ResolvableValidationProps): T {
  useWarn(props.validationState !== undefined, {
    key: 'validation-state-deprecated',
    args: [
      'The "validationState" property is deprecated. Use "isInvalid" and "isValid" instead.',
    ],
  });

  if (
    props.validationState === undefined &&
    props.isInvalid === undefined &&
    props.isValid === undefined
  ) {
    return props;
  }

  const { validationState: _validationState, ...rest } = props;

  return { ...rest, ...resolveValidationProps(props) } as T;
}
