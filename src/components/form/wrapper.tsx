import { ReactElement, RefObject } from 'react';
import { FocusableRef } from '@react-types/shared';

import { FieldBaseProps, FormBaseProps } from '../../shared/index';
import { BaseProps, Styles } from '../../tasty/index';

import { FieldWrapper } from './FieldWrapper/index';

interface WrapWithFieldProps extends FieldBaseProps, BaseProps, FormBaseProps {
  styles?: Styles;
}

export function wrapWithField<T extends WrapWithFieldProps>(
  component: ReactElement,
  ref: RefObject<unknown> | FocusableRef<HTMLElement>,
  props: T,
) {
  let {
    label,
    extra,
    labelPosition = 'top',
    labelStyles,
    isRequired,
    isDisabled,
    necessityIndicator,
    message,
    messageStyles,
    description,
    validationState,
    labelProps,
    fieldProps,
    requiredMark = true,
    tooltip,
    isHidden,
    labelSuffix,
    styles,
    children,
  } = props;

  return (
    <FieldWrapper
      {...{
        label,
        extra,
        labelPosition,
        labelStyles,
        isRequired,
        isDisabled,
        necessityIndicator,
        labelProps,
        fieldProps,
        message,
        messageStyles,
        description,
        validationState,
        requiredMark,
        tooltip,
        isHidden,
        labelSuffix,
        styles,
        children,
        Component: component,
        ref,
      }}
    />
  );
}
