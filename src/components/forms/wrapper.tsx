import { ReactElement, RefObject } from 'react';

import { FieldBaseProps, FormBaseProps } from '../../shared';
import { BaseProps, Styles } from '../../tasty';

import { FieldWrapper } from './FieldWrapper';

interface WrapWithFieldProps extends FieldBaseProps, BaseProps, FormBaseProps {
  styles?: Styles;
}

export function wrapWithField<T extends WrapWithFieldProps>(
  component: ReactElement,
  ref: RefObject<unknown>,
  props: T,
) {
  let {
    label,
    extra,
    labelPosition = 'top',
    labelStyles,
    isRequired,
    necessityIndicator,
    necessityLabel,
    validationState,
    message,
    description,
    isDisabled,
    labelProps,
    requiredMark = true,
    tooltip,
    isHidden,
    labelSuffix,
    styles,
  } = props;

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        extra,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        necessityLabel,
        labelProps,
        isDisabled,
        validationState,
        message,
        description,
        requiredMark,
        tooltip,
        isHidden,
        labelSuffix,
        Component: component,
        ref,
      }}
    />
  );
}
