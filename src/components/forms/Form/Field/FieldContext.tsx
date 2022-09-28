import * as React from 'react';

import { ValidateTrigger, ValidationState } from '../../../../shared';
import { useChainedCallback, useEvent } from '../../../../_internal';
import { useFormProps } from '../Form';

export type FieldContextValue = {
  id: string;
  name: string;
  value: any;
  validateTrigger?: ValidateTrigger;
  validationState?: ValidationState;
  onChange?: (
    value: any,
    dontTouch: boolean,
    validateTrigger: ValidateTrigger,
  ) => void;
  message?: React.ReactNode;
  isRequired?: boolean;
  onBlur: () => void;
};

const FieldContext = React.createContext<FieldContextValue | null>(null);

export function FieldProvider(
  props: React.PropsWithChildren<{ value: FieldContextValue }>,
) {
  const { children, value } = props;

  return (
    <FieldContext.Provider value={value}>{children}</FieldContext.Provider>
  );
}

export type UseFieldPropsParams = {
  valuePropsMapper?: ({ value, onChange }) => any;
  /**
   * @default 'onBlur'
   */
  defaultValidationTrigger?: ValidateTrigger;
  /**
   * prop helps to prevent calling hook conditionally
   */
  isDisabled?: boolean;
};

export function useFieldProps<Props>(
  props: Props,
  params: UseFieldPropsParams = {},
): Props {
  const {
    valuePropsMapper,
    defaultValidationTrigger = 'onBlur',
    isDisabled,
  } = params;

  props = useFormProps(props);
  const fieldContext = React.useContext(FieldContext);

  const onBlurChained = useChainedCallback(
    fieldContext?.onBlur,
    // TODO: remove type casting after updating to typescipt@4.9
    'onBlur' in props ? (props as any).onBlur : undefined,
  );
  const onChangeEvent = useEvent((value, dontTouch: boolean) => {
    return fieldContext?.onChange?.(
      value,
      dontTouch,
      fieldContext?.validateTrigger ?? defaultValidationTrigger,
    );
  });

  if (fieldContext === null || isDisabled) {
    return props;
  }

  const {
    validateTrigger = defaultValidationTrigger,
    value,
    onChange,
    ...rest
  } = fieldContext;

  return {
    ...props,
    ...(valuePropsMapper?.({
      value: fieldContext.value,
      onChange: onChangeEvent,
    }) ?? {
      value: fieldContext.value ?? null,
      onChange,
    }),
    ...rest,
    validateTrigger,
    onBlur: onBlurChained,
  };
}
