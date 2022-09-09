import * as React from 'react';

import { ValidateTrigger, ValidationState } from '../../../../shared';
import { useChainedCallback } from '../../../../_internal';

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
  message?: string;
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
  valuePropsMapper?: ({}) => any;
  /**
   * @default 'onBlur'
   */
  defaultValidationTrigger?: ValidateTrigger;
};

export function useFieldProps<
  Props extends { onBlur?: (e: React.FocusEvent) => void },
>(props: Props, params: UseFieldPropsParams = {}): Props {
  const { valuePropsMapper, defaultValidationTrigger = 'onBlur' } = params;

  const fieldContext = React.useContext(FieldContext);

  const onBlurChained = useChainedCallback(fieldContext?.onBlur, props.onBlur);

  if (fieldContext === null) {
    return props;
  }

  const {
    value,
    onChange,
    validateTrigger = defaultValidationTrigger,
    ...rest
  } = fieldContext;

  return {
    ...props,
    ...(valuePropsMapper
      ? valuePropsMapper({
          value,
          onChange: (value, dontTouch) =>
            onChange?.(value, dontTouch, validateTrigger),
        })
      : { value, onChange }),
    ...rest,
    validateTrigger,
    onBlur: onBlurChained,
  };
}
