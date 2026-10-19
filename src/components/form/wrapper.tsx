import { DOMRef, FocusableRef } from '@react-types/shared';
import { BaseProps } from '@tenphi/tasty';
import { ReactElement, RefObject } from 'react';

import { FieldBaseProps, FormBaseProps } from '../../shared/index';
import { mergeProps } from '../../utils/react/index';

import { hasFieldContent, warnAboutForceField } from './field-chrome';
import { FieldWrapper } from './FieldWrapper/index';
import { warnAboutLegacyTooltip } from './legacy-tooltip';

// The input is passed as `component`, never through props.children.
interface WrapWithFieldProps
  extends FieldBaseProps,
    Omit<BaseProps, 'children'>,
    FormBaseProps {
  /**
   * Set by `useFieldProps`, or by a control that skips it, for a field without
   * a `label` that still needs the field chrome — see `asksForFieldChrome`.
   * Not a prop of any input.
   */
  hasFieldChrome?: boolean;
}

/**
 * Whether `wrapWithField` renders the field chrome for these props. An
 * explicit `isBare` decides. Otherwise a field renders it when there is
 * something to show: a `label`, or the chrome `useFieldProps` asked for
 * (`hasFieldChrome`), or the deprecated `forceField`.
 */
export function rendersFieldChrome(props: object) {
  const { isBare, label, hasFieldChrome, forceField } =
    props as WrapWithFieldProps;

  if (isBare != null) return !isBare;

  return hasFieldContent(label) || !!hasFieldChrome || !!forceField;
}

/** Wraps a control in its field chrome when it has one, and forwards its chrome props. */
export function wrapWithField<T extends WrapWithFieldProps>(
  component: ReactElement,
  ref: RefObject<unknown> | FocusableRef<HTMLElement> | DOMRef<HTMLElement>,
  props: T,
) {
  const isBare = !rendersFieldChrome(props);
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
        isBare,
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
