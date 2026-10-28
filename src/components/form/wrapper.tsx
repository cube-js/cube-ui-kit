import { DOMRef, FocusableRef } from '@react-types/shared';
import { BaseProps, Styles } from '@tenphi/tasty';
import { ReactElement, RefObject } from 'react';

import { FieldBaseProps, FormBaseProps } from '../../shared/index';
import { mergeProps } from '../../utils/react/index';
import { mergeStyleLayers } from '../../utils/styles';

import { hasFieldContent, warnAboutForceField } from './field-chrome';
import { FieldWrapper } from './FieldWrapper/index';
import { warnAboutLegacyTooltip } from './legacy-tooltip';

// The input is passed as `component`, never through props.children.
interface WrapWithFieldProps
  extends FieldBaseProps, Omit<BaseProps, 'children'>, FormBaseProps {}

/**
 * Whether `wrapWithField` renders the field chrome for these props. An
 * explicit `isBare` decides; `useFieldProps` sets `isBare={false}` on a bound
 * field, one passed a chrome prop, or one with a `validate` whose errors the
 * control shows (`withFieldChrome`).
 * Otherwise a non-empty `label` renders it, as does the deprecated
 * `forceField`.
 */
export function rendersFieldChrome(props: object) {
  const { isBare, label, forceField } = props as WrapWithFieldProps;

  if (isBare != null) return !isBare;

  return hasFieldContent(label) || !!forceField;
}

type LegacyFieldRef =
  | RefObject<unknown>
  | FocusableRef<HTMLElement>
  | DOMRef<HTMLElement>
  | null
  | undefined;

/**
 * Wraps a control in its field chrome when it has one, and forwards its chrome
 * props. The chrome takes no ref: the control attaches the field's `ref` to
 * its own root, so the ref is the same element with or without the chrome, and
 * `labelRef` reaches the label.
 */
export function wrapWithField<T extends WrapWithFieldProps>(
  component: ReactElement,
  props: T,
): ReactElement;
/**
 * @deprecated Attach the field's ref to the control's root and call
 * `wrapWithField(component, props)`. The `ref` passed here is ignored.
 */
export function wrapWithField<T extends WrapWithFieldProps>(
  component: ReactElement,
  ref: LegacyFieldRef,
  props: T,
): ReactElement;
export function wrapWithField<T extends WrapWithFieldProps>(
  component: ReactElement,
  ...args: [props: T] | [ref: LegacyFieldRef, props: T]
) {
  const props = args[args.length - 1] as T;
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
    labelRef,
    fieldProps,
    fieldStyles,
    requiredMark = true,
    labelTooltip,
    isHidden,
    labelSuffix,
  } = props;

  warnAboutForceField(props);

  warnAboutLegacyTooltip(props);

  // `fieldStyles` is the shorthand for `fieldProps.styles` and wins over it.
  // Merged as layers, so a `null` reset in either survives to the wrapper.
  const mergedFieldProps = fieldStyles
    ? {
        ...fieldProps,
        styles: mergeStyleLayers(
          (fieldProps as { styles?: Styles } | undefined)?.styles,
          fieldStyles,
        ),
      }
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
        labelRef,
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
      }}
    />
  );
}
