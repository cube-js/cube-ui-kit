import { DOMRef, FocusableRef } from '@react-types/shared';
import { ReactElement, RefObject } from 'react';

import { FieldBaseProps, FormBaseProps } from '../../shared/index';
import { BaseProps } from '../../tasty/index';
import { mergeProps } from '../../utils/react/index';

import { FieldWrapper } from './FieldWrapper/index';

interface WrapWithFieldProps extends FieldBaseProps, BaseProps, FormBaseProps {}

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
    fieldStyles,
    requiredMark = true,
    tooltip,
    isHidden,
    labelSuffix,
    children,
  } = props;

  if (!label && !forceField) {
    return component;
  }

  // Merge fieldStyles as shorthand for fieldProps.styles (fieldStyles takes priority)
  const mergedFieldProps = fieldStyles
    ? mergeProps(fieldProps, { styles: fieldStyles })
    : fieldProps;

  // Merge labelStyles as shorthand for labelProps.styles (labelStyles takes priority)
  const mergedLabelProps = labelStyles
    ? mergeProps(labelProps, { styles: labelStyles })
    : labelProps;

  // Remove id from fieldProps to avoid duplication (id should be on the input element, not the field wrapper)
  const { id: _id, ...fieldPropsWithoutId } = (mergedFieldProps as any) || {};

  return (
    <FieldWrapper
      {...{
        label,
        extra,
        labelPosition,
        isRequired,
        isDisabled,
        necessityIndicator,
        labelProps: mergedLabelProps,
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
        children,
        Component: component,
        ref,
      }}
    />
  );
}
