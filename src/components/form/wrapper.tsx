import { DOMRef, FocusableRef } from '@react-types/shared';
import { BaseProps } from '@tenphi/tasty';
import { ReactElement, RefObject } from 'react';

import { FieldBaseProps, FormBaseProps } from '../../shared/index';
import { mergeProps } from '../../utils/react/index';

import { warnAboutForceField } from './field-chrome';
import { FieldWrapper } from './FieldWrapper/index';
import { warnAboutLegacyTooltip } from './legacy-tooltip';

// `children` is intentionally omitted: the input is passed as `component`, never through props.
interface WrapWithFieldProps
  extends FieldBaseProps,
    Omit<BaseProps, 'children'>,
    FormBaseProps {
  /**
   * Set by `useFieldProps` for a field without a `label` that still renders
   * the field chrome — see `asksForFieldChrome`. Not a prop of any input.
   */
  hasFieldChrome?: boolean;
}

/**
 * Whether `wrapWithField` renders the field chrome for these props: a `label`,
 * the chrome `useFieldProps` asked for, or the deprecated `forceField`.
 */
export function rendersFieldChrome(props: object) {
  const { label, hasFieldChrome, forceField } = props as WrapWithFieldProps;

  return !!label || !!hasFieldChrome || !!forceField;
}

/**
 * Wraps an input with the field chrome (label, description, message) when it has a `label`, or when `useFieldProps` asks
 * for it on a field without one (`hasFieldChrome`): one bound to a form, or passed a description or a message, and not `isBare`.
 * Only the field wrapper props are forwarded, so callers can pass their whole props object as is.
 */
export function wrapWithField<T extends WrapWithFieldProps>(
  component: ReactElement,
  ref: RefObject<unknown> | FocusableRef<HTMLElement> | DOMRef<HTMLElement>,
  props: T,
) {
  let {
    label,
    extra,
    labelPosition = 'top',
    labelStyles,
    isRequired,
    isOptional,
    isDisabled,
    necessityIndicator,
    message,
    messageStyles,
    description,
    errorMessage,
    isInvalid,
    isValid,
    labelProps,
    fieldProps,
    fieldStyles,
    requiredMark = true,
    labelTooltip,
    isHidden,
    labelSuffix,
  } = props;

  warnAboutForceField(props);

  if (!rendersFieldChrome(props)) {
    return component;
  }

  warnAboutLegacyTooltip(props);

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
        isOptional,
        isDisabled,
        necessityIndicator,
        labelProps: mergedLabelProps,
        fieldProps: fieldPropsWithoutId,
        message,
        messageStyles,
        description,
        errorMessage,
        isInvalid,
        isValid,
        requiredMark,
        labelTooltip,
        isHidden,
        labelSuffix,
        Component: component,
        // Where the description and message ids come from; see
        // `useFieldDescribedBy`, which points the control at them.
        controlId: props.id,
        ref,
      }}
    />
  );
}
