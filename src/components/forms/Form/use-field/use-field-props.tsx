import { useRef } from 'react';
import { useDebugValue } from 'react';

import { useChainedCallback, useEvent } from '../../../../_internal';
import { useInsideLegacyField } from '../Field';
import { mergeProps } from '../../../../utils/react';

import { useField } from './use-field';

import type { ValidateTrigger } from '../../../../shared';
import type { CubeFieldProps } from './types';
import type { FieldTypes } from '../types';

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
    valuePropsMapper = ({ value, onChange }) => ({
      value: value ?? null,
      onChange,
    }),
    defaultValidationTrigger = 'onBlur',
  } = params;

  const isInsideLegacyField = useInsideLegacyField();

  // useWarn(isInsideLegacyField, {
  //   key: 'use-field-props',
  //   args: ['<Field /> is deprecated, use component without <Field /> instead.'],
  // });

  if (
    isInsideLegacyField === true ||
    isDisabledRef.current === true ||
    props.name == null
  ) {
    return props;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const field = useField<T, Props>(props, {
    defaultValidationTrigger: params.defaultValidationTrigger,
  });

  const isOutsideOfForm = field?.form == null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const onBlurChained = useChainedCallback(
    field?.onBlur,
    // TODO: remove type casting after updating to typescipt@4.9
    'onBlur' in props ? (props as any).onBlur : undefined,
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const onChangeEvent = useEvent((value, dontTouch: boolean) =>
    field?.onChange?.(
      value,
      dontTouch,
      field?.validateTrigger ?? defaultValidationTrigger,
    ),
  );

  const result = isOutsideOfForm
    ? props
    : mergeProps(
        props,
        field,
        valuePropsMapper({ value: field.value, onChange: onChangeEvent }),
        {
          validateTrigger: field.validateTrigger ?? defaultValidationTrigger,
          onBlur: onBlurChained,
        },
      );

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDebugValue(result);
  }

  return result;
}
