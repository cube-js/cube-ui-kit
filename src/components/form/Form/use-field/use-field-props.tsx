import { useDebugValue, useRef } from 'react';

import { useChainedCallback, useEvent } from '../../../../_internal/index';
import { mergeProps } from '../../../../utils/react/index';
import { warn } from '../../../../utils/warnings';
import { useInsideLegacyField } from '../Field';

import { useField } from './use-field';

import type {
  ValidateTrigger,
  ValidationResult,
} from '../../../../shared/index';
import type { FieldTypes } from '../types';
import type { CubeFieldProps } from './types';

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
  Props extends CubeFieldProps<T>,
>(props: Props, params: UseFieldPropsParams = {}): Props {
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

  if (
    isInsideLegacyField ||
    isDisabledRef.current === true ||
    props.name == null
  ) {
    return props;
  }

  const field = useField<T, Props>(props, {
    defaultValidationTrigger: params.defaultValidationTrigger,
  });

  const isOutsideOfForm = field?.form == null;

  if (props.rules && isOutsideOfForm) {
    warn(
      `The "rules" prop is not supported for fields that are not part of a form. The "${props.name}" field is placed outside the form.`,
    );
  }

  const onBlurChained = useChainedCallback(
    field?.onBlur,
    'onBlur' in props ? (props as any).onBlur : undefined,
  );

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

  // Handle errorMessage compilation if it's a function
  let compiledErrorMessage;
  if (typeof props.errorMessage === 'function') {
    // Create ValidationResult object from current field state
    const validationResult: ValidationResult = {
      isInvalid: field?.field?.status === 'invalid' || false,
      validationErrors:
        field?.field?.errors
          ?.map((error) =>
            typeof error === 'string' ? error : error?.toString() || '',
          )
          .filter(Boolean) || [],
      validationDetails:
        field?.field?.validationDetails || ({} as ValidityState),
    };

    compiledErrorMessage = props.errorMessage(validationResult);
  } else if (props.errorMessage !== undefined) {
    compiledErrorMessage = props.errorMessage;
  } else {
    // Use the default errorMessage from useField (validation errors or undefined)
    compiledErrorMessage =
      field?.field?.status === 'invalid' && field?.field?.errors?.length
        ? field.field.errors[0]
        : undefined;
  }

  const result: Props = isOutsideOfForm
    ? props
    : mergeProps(props, field, valueProps, {
        validateTrigger: field.validateTrigger ?? defaultValidationTrigger,
        onBlur: onBlurChained,
        errorMessage: compiledErrorMessage,
      });

  if (result.id) {
    if (!result.labelProps) {
      result.labelProps = {};
    }

    result.labelProps.for = result.id;
  }

  if (process.env.NODE_ENV === 'development') {
    useDebugValue(result);
  }

  return result;
}
