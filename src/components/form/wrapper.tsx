import { DOMRef, FocusableRef } from '@react-types/shared';
import { ReactElement, ReactNode, RefObject } from 'react';

import { FieldBaseProps, FormBaseProps } from '../../shared/index';
import { BaseProps, Styles } from '../../tasty/index';

import { FieldWrapper } from './FieldWrapper/index';

interface WrapWithFieldProps extends FieldBaseProps, BaseProps, FormBaseProps {
  styles?: Styles;
}

export function wrapWithField<T extends WrapWithFieldProps>(
  component: ReactElement,
  ref: RefObject<unknown> | FocusableRef<HTMLElement> | DOMRef<HTMLElement>,
  props: T,
) {
  let {
    forceField,
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
    errorMessage,
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

  if (!label && !forceField) {
    return component;
  }

  // Remove id from fieldProps to avoid duplication (id should be on the input element, not the field wrapper)
  const { id: _, ...fieldPropsWithoutId } = fieldProps || {};

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
        fieldProps: fieldPropsWithoutId,
        message,
        messageStyles,
        description,
        errorMessage,
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
