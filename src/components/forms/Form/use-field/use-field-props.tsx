import { useRef } from 'react';
import { useDebugValue } from 'react';

import { useChainedCallback, useEvent } from '../../../../_internal';
import { useInsideLegacyField } from '../Field';
import { mergeProps } from '../../../../utils/react';
import { warn } from '../../../../utils/warnings';

import { useField } from './use-field';

import type { CubeFieldProps } from './types';
import type { FieldTypes } from '../types';
import type { ValidateTrigger } from '../../../../shared';

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

const VALUE_PROPERTIES = [
  'value',
  'isSelected',
  'isIndeterminate',
  'selectedKey',
  'selectedKeys',
];

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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const field = useField<T, Props>(props, {
    defaultValidationTrigger: params.defaultValidationTrigger,
  });

  const isOutsideOfForm = field?.form == null;

  if (props.rules && isOutsideOfForm) {
    warn(
      `The "rules" prop is not suitable for fields that are not part of a form. The "${props.name}" field is placed outside the form.`,
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const onBlurChained = useChainedCallback(
    field?.onBlur,
    // TODO: remove type casting after updating to typescipt@4.9
    'onBlur' in props ? (props as any).onBlur : undefined,
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const onChangeEvent = useEvent(
    (value, dontTouch: boolean) =>
      field?.onChange?.(
        value,
        dontTouch,
        field?.validateTrigger ?? defaultValidationTrigger,
      ),
  );

  if (!isOutsideOfForm) {
    for (const valuePropName of VALUE_PROPERTIES) {
      if (valuePropName in props) {
        warn(
          `The "${valuePropName}" property is not suitable for the "${props.name}" field that is linked to a form. To unlink the field from the form, remove the "name" property from the field.`,
        );
      }
    }
  }

  const valueProps = !isOutsideOfForm
    ? valuePropsMapper({ value: field.value, onChange: onChangeEvent })
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

  const result: Props = isOutsideOfForm
    ? props
    : mergeProps(props, field, valueProps, {
        validateTrigger: field.validateTrigger ?? defaultValidationTrigger,
        onBlur: onBlurChained,
      });

  if (result.id) {
    if (!result.labelProps) {
      result.labelProps = {};
    }

    if (result.labelProps) {
      result.labelProps.for = result.id;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDebugValue(result);
  }

  return result;
}
