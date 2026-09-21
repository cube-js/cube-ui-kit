import { useDebugValue, useId, useState } from 'react';

import { useEvent } from '../../../../_internal/index';
import { useProviderProps } from '../../../../provider';
import { mergeProps } from '../../../../utils/react/index';
import { warn } from '../../../../utils/warnings';
import { useValidationProps } from '../../validation/index';
import { isModernFormController } from '../backend';
import { useInsideLegacyField } from '../Field';
import { useFormProps } from '../Form';
import { getFieldKey } from '../modern/values';

import { useFieldBinding } from './use-field-binding';

import type { ValidateTrigger } from '../../../../shared/index';
import type { FieldTypes } from '../types';
import type { UseFieldProps } from './types';

export type UseFieldPropsParams = {
  valuePropsMapper?: ({ value, onChange }) => any;
  /**
   * @default 'onBlur'
   */
  defaultValidationTrigger?: ValidateTrigger;
  /**
   * prop helps to prevent calling hook conditionally, but changing this prop during render is unsafe and forbidden
   * If you want to change this prop after mount, remount the component with a new value.
   */
  unsafe__isDisabled?: boolean;
};

const defaultValuePropsMapper = ({ value, onChange }) => ({
  value: value ?? null,
  onChange,
});

/** Preserve the input's prop shape while exposing a DOM-safe name. */
type ResolvedFieldProps<Props> = {
  [Key in keyof Props]: Key extends 'name' ? string | undefined : Props[Key];
};

/**
 * The single entry point for input components (see
 * `docs/rules/input-components.md`).
 *
 * Every hook below runs on every render, whatever the mode: standalone (no
 * `name`), inside the deprecated `<Field>`, disabled through
 * `unsafe__isDisabled`, or bound to a form. The mode only decides which props
 * come back, so an input can gain or lose a `name`, or move between forms,
 * without changing its hook order. The legacy binding (`useField`) is the
 * legacy backend's adapter and is inert when the field is not bound to it.
 */
export function useFieldProps<
  T extends FieldTypes,
  Props extends UseFieldProps<T>,
>(
  inputProps: Props,
  params: UseFieldPropsParams = {},
): ResolvedFieldProps<Props> {
  // Provider defaults, then form context, then the normalization of the
  // deprecated `validationState` prop into `isInvalid`/`isValid`.
  const provided = useProviderProps(inputProps);
  const props: Props = useValidationProps(
    useFormProps(
      provided.field
        ? {
            ...provided,
            ...provided.field.options,
            form: provided.field.form,
            name:
              typeof provided.field.path === 'string'
                ? provided.field.path
                : getFieldKey(provided.field.path),
          }
        : provided,
    ),
  );

  // The initial value is what counts: changing it after mount is unsupported.
  const [isDisabled] = useState(params.unsafe__isDisabled ?? false);

  const {
    valuePropsMapper = defaultValuePropsMapper,
    defaultValidationTrigger = 'onBlur',
  } = params;

  const isInsideLegacyField = useInsideLegacyField();

  if (props.rules && !props.name) {
    warn(
      `The "rules" prop is not suitable for fields that are not part of a form. Use "name" prop to link the field to a form.`,
    );
  }

  const hasName = props.name != null;
  const generatedId = useId();
  const isBound = hasName && !isInsideLegacyField && !isDisabled;

  const field = useFieldBinding<T, Props>(
    props,
    {
      defaultValidationTrigger: params.defaultValidationTrigger,
      unbound: !isBound,
    },
    generatedId,
  );

  const isOutsideOfForm = field?.form == null;

  const onChangeEvent = useEvent((value, dontTouch: boolean) => {
    field?.onChange?.(
      value,
      dontTouch,
      field?.validateTrigger ?? defaultValidationTrigger,
    );
  });

  function resolveResult(): Props {
    if (isInsideLegacyField || isDisabled) {
      return props;
    }

    if (!hasName) {
      // Standalone field - just add generated ID if not provided
      if (!props.id) {
        const result = { ...props, id: generatedId };

        if (result.id && !result.labelProps) {
          result.labelProps = { for: result.id };
        } else if (result.id && result.labelProps && !result.labelProps.for) {
          result.labelProps = { ...result.labelProps, for: result.id };
        }

        return result as Props;
      }
      return props;
    }

    if (props.rules && isOutsideOfForm) {
      warn(
        `The "rules" prop is not supported for fields that are not part of a form. The "${props.name}" field is placed outside the form.`,
      );
    }

    const valueProps = !isOutsideOfForm
      ? valuePropsMapper({
          value: field.value,
          onChange: onChangeEvent,
        })
      : {};

    // Exclude `form` (it must never reach a DOM node) and the field's own
    // handlers: `valueProps` already routes the component's change event into
    // `field.onChange` under the name the component listens to, and `onBlur` is
    // added once below. `mergeProps` chains same-named handlers, so merging them
    // here as well made every user change and every blur run the field handler
    // twice — and onChange/onBlur-triggered validation validate twice.
    const {
      form: _form,
      onChange: _fieldOnChange,
      onBlur: _fieldOnBlur,
      ...fieldRest
    } = field ?? {};

    const result: Props = isOutsideOfForm
      ? props
      : mergeProps(props, fieldRest, valueProps, {
          validateTrigger: field.validateTrigger ?? defaultValidationTrigger,
          // Chained after the caller's own `onBlur` by `mergeProps`.
          onBlur: field.onBlur,
        });

    return result.id
      ? { ...result, labelProps: { ...result.labelProps, for: result.id } }
      : result;
  }

  const resolved = resolveResult();
  // React Aria forwards `form` to native inputs. A modern controller is a
  // binding source, never an HTML form id, including in standalone/group mode.
  const result = isModernFormController(resolved.form)
    ? { ...resolved, form: undefined }
    : resolved;

  const {
    field: _descriptor,
    dependsOn: _dependsOn,
    deps: _deps,
    ...domProps
  } = result;
  // Standalone and group-scoped inputs do not merge a bound field's props.
  // Their tuple must still become a string before React Aria or DOM forwarding.
  const namedProps =
    domProps.name != null && typeof domProps.name !== 'string'
      ? { ...domProps, name: getFieldKey(domProps.name) }
      : domProps;
  useDebugValue(namedProps);

  return namedProps as ResolvedFieldProps<Props>;
}
