import { useDebugValue, useId, useRef } from 'react';

import { useEvent } from '../../../../_internal/index';
import { useProviderProps } from '../../../../provider';
import { mergeProps } from '../../../../utils/react/index';
import { warn } from '../../../../utils/warnings';
import { useValidationProps } from '../../validation/index';
import { useInsideLegacyField } from '../Field';
import { useFormProps } from '../Form';

import { useField } from './use-field';

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

export function useFieldProps<
  T extends FieldTypes,
  Props extends UseFieldProps<T>,
>(props: Props, params: UseFieldPropsParams = {}): Props {
  // The single entry point for input components: provider defaults, then form context, then the
  // normalization of the deprecated `validationState` prop into `isInvalid`/`isValid`.
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useValidationProps(props);

  // We use ref here to "memoize" initial value
  const isDisabledRef = useRef(params.unsafe__isDisabled ?? false);

  const {
    valuePropsMapper = ({ value, onChange }) => {
      return {
        value: value ?? null,
        onChange,
      };
    },
    defaultValidationTrigger = 'onBlur',
  } = params;

  const isInsideLegacyField = useInsideLegacyField();

  // useWarn(isInsideLegacyField, {
  //   key: 'use-field-props',
  //   args: ['<Field /> is deprecated, use component without <Field /> instead.'],
  // });

  if (props.rules && !props.name) {
    warn(
      `The "rules" prop is not suitable for fields that are not part of a form. Use "name" prop to link the field to a form.`,
    );
  }

  if (isInsideLegacyField || isDisabledRef.current === true) {
    return props;
  }

  // For standalone fields (no name), just generate an ID without calling useField
  const hasName = props.name != null;
  const generatedId = useId();

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

  // Form-connected field - use full useField logic
  const field = useField<T, Props>(props, {
    defaultValidationTrigger: params.defaultValidationTrigger,
  });

  const isOutsideOfForm = field?.form == null;

  if (props.rules && isOutsideOfForm) {
    warn(
      `The "rules" prop is not supported for fields that are not part of a form. The "${props.name}" field is placed outside the form.`,
    );
  }

  const onChangeEvent = useEvent((value, dontTouch: boolean) => {
    field?.onChange?.(
      value,
      dontTouch,
      field?.validateTrigger ?? defaultValidationTrigger,
    );
  });

  const valueProps = !isOutsideOfForm
    ? valuePropsMapper({
        value: field.value,
        onChange: onChangeEvent,
      })
    : {};

  if (isInsideLegacyField && !isOutsideOfForm) {
    const valuePropEventNames = !isOutsideOfForm
      ? Object.keys(valueProps).filter((name) => name.startsWith('on'))
      : [];

    for (const valuePropName of valuePropEventNames) {
      if (valuePropName in props) {
        warn(
          `The "${valuePropName}" listener is not supported for input "${props.name}" that is linked to a form via a <Field> component. Remove the <Field> component and move its properties to the input itself.`,
        );
      }
    }
  }

  // Use errorMessage directly or fall back to validation errors
  const compiledErrorMessage =
    props.errorMessage !== undefined
      ? props.errorMessage
      : field?.field?.status === 'invalid' && field?.field?.errors?.length
        ? field.field.errors[0]
        : undefined;

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
        errorMessage: compiledErrorMessage,
      });

  if (result.id) {
    if (!result.labelProps) {
      result.labelProps = {};
    }

    result.labelProps.for = result.id;
  }

  // Unconditional on purpose: React makes `useDebugValue` a no-op outside its
  // development build, and gating a hook on `isDevEnv()` would let hook order
  // change between renders when `UIKIT_DEBUG` is toggled.
  useDebugValue(result);

  return result;
}
