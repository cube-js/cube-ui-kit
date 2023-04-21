/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Children,
  cloneElement,
  createContext,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

import { mergeProps } from '../../../utils/react';
import {
  LabelPosition,
  OptionalFieldBaseProps,
  ValidationRule,
} from '../../../shared';
import { FieldWrapper } from '../FieldWrapper';
import { warn } from '../../../utils/warnings';
import { Styles } from '../../../tasty';

import { CubeFormInstance } from './useForm';
import { useFormProps } from './Form';
import { FieldTypes } from './types';
import { useField } from './use-field';

function getDefaultValidateTrigger(type) {
  type = type || '';

  return type === 'Number' || type.includes('Text') ? 'onBlur' : 'onChange';
}

function getValueProps(
  type?: string,
  value?,
  onChange?,
  allowsCustomValue?: boolean,
) {
  type = type || '';

  if (type === 'Number') {
    return {
      value: value != null ? value : null,
      onChange: onChange,
    };
  } else if (type === 'Text') {
    return {
      value:
        typeof value === 'string' || typeof value === 'number'
          ? String(value)
          : '',
      onChange: onChange,
    };
  } else if (type === 'Checkbox') {
    return {
      isSelected: value != null ? value : false,
      isIndeterminate: false,
      onChange: onChange,
    };
  } else if (type === 'CheckboxGroup') {
    return {
      value: value != null ? value : [],
      onChange: onChange,
    };
  } else if (type === 'RangeSlider') {
    return {
      value: value != null ? value : undefined,
      onChange: onChange,
    };
  } else if (type === 'ComboBox') {
    return {
      inputValue: value != null ? value : '',
      onInputChange: (val) => onChange(val, !allowsCustomValue),
      onSelectionChange: onChange,
    };
  } else if (type === 'Select') {
    return {
      selectedKey: value != null ? value : null,
      onSelectionChange: onChange,
    };
  }

  return {
    value: value != null ? value : null,
    onChange,
  };
}

export interface CubeFieldProps<T extends FieldTypes>
  extends OptionalFieldBaseProps {
  /** The initial value of the input. */
  defaultValue?: any;
  /** The type of the input. `Input`, `Checkbox`, RadioGroup`, `Select`, `ComboBox` etc... */
  type?: string;
  /** The unique ID of the field */
  id?: string;
  /** The id prefix for the field to avoid collisions between forms */
  idPrefix?: string;
  children?: ReactElement | ((CubeFormInstance) => ReactElement);
  /** Function that checks whether to perform update of the form state. */
  shouldUpdate?: boolean | ((prevValues, nextValues) => boolean);
  /** Validation rules */
  rules?: ValidationRule[];
  /** The form instance */
  form?: CubeFormInstance<T>;
  /** The message for the field or text for the error */
  message?: ReactNode;
  /** The description for the field */
  description?: ReactNode;
  /** Tooltip for the label that explains something. */
  tooltip?: ReactNode;
  /** Field name. It's used as a key the form data. */
  name?: string | string[];
  /** Whether the field is hidden. */
  isHidden?: boolean;
  /** Whether the field is disabled. */
  isDisabled?: boolean;
  /** Whether the field is loading. */
  isLoading?: boolean;
  styles?: Styles;
  labelPosition?: LabelPosition;
  labelStyles?: Styles;
  labelSuffix?: ReactNode;
}

interface CubeFullFieldProps<T extends FieldTypes> extends CubeFieldProps<T> {
  form: CubeFormInstance<T>;
}

interface CubeReplaceFieldProps<T extends FieldTypes>
  extends CubeFieldProps<T> {
  isRequired?: boolean;
  onChange?: (any) => void;
  onSelectionChange?: (any) => void;
  onBlur: () => void;
  onInputChange?: (any) => void;
  labelPosition?: LabelPosition;
}

export function Field<T extends FieldTypes>(props: CubeFieldProps<T>) {
  const allProps: CubeFullFieldProps<T> = useFormProps(props);

  let {
    type: inputType,
    children,
    form,
    label,
    extra,
    validationState,
    necessityLabel,
    necessityIndicator,
    message,
    description,
    tooltip,
    isHidden,
    isDisabled,
    isLoading,
    styles,
    labelPosition = 'top',
    labelStyles,
    labelSuffix,
  } = allProps;

  if (typeof children === 'function') {
    children = children(form);
  }

  let child = children == null ? null : Children.only(children);

  inputType = inputType ?? (child?.type as any)?.cubeInputType ?? 'Text';

  const __props = useField<T, CubeFullFieldProps<T>>(allProps, {
    defaultValidationTrigger: getDefaultValidateTrigger(inputType),
  });

  const { field, isRequired, name, id } = __props;

  if (!child) return null;

  if (__props.nonInput) {
    return (
      <LegacyFieldProvider>
        <FieldWrapper
          isHidden={isHidden}
          isDisabled={isDisabled}
          validationState={validationState}
          necessityIndicator={necessityIndicator}
          necessityLabel={necessityLabel}
          isRequired={isRequired}
          label={label}
          extra={extra}
          tooltip={tooltip}
          message={message}
          description={description}
          Component={child}
          styles={styles}
          labelPosition={labelPosition}
          labelStyles={labelStyles}
          labelSuffix={labelSuffix}
        />
      </LegacyFieldProvider>
    );
  }

  if (!form) {
    warn(
      'Form Field requires declared form instance if field name is specified',
    );

    return null;
  }

  if (!__props.field) {
    return (
      <LegacyFieldProvider>
        {cloneElement(
          child,
          mergeProps(child.props, {
            ...getValueProps(inputType),
            label: name,
            name,
            id,
          }),
        )}
      </LegacyFieldProvider>
    );
  }

  const newProps: CubeReplaceFieldProps<T> = {
    id,
    name,
    onBlur: __props.onBlur,
  };

  if (necessityIndicator != null) {
    newProps.necessityIndicator = necessityIndicator;
  }

  if (necessityLabel) {
    newProps.necessityLabel = necessityLabel;
  }

  if (validationState) {
    newProps.validationState = validationState;
  }

  if (isRequired) {
    newProps.isRequired = isRequired;
  }

  if (label) {
    newProps.label = label;
  }

  if (extra) {
    newProps.extra = extra;
  }

  if (tooltip) {
    newProps.tooltip = tooltip;
  }

  if (message) {
    newProps.message = message;
  }

  if (isHidden != null) {
    newProps.isHidden = isHidden;
  }

  if (isDisabled != null) {
    newProps.isDisabled = isDisabled;
  }

  if (isLoading != null) {
    newProps.isLoading = isLoading;
  }

  if (field?.errors?.length) {
    if (!validationState) {
      newProps.validationState = 'invalid';
    }

    if (!message) {
      newProps.message = field.errors[0];
    }
  }

  Object.assign(
    newProps,
    getValueProps(
      inputType,
      __props.field?.inputValue,
      __props.onChange,
      child.props.allowsCustomValue,
    ),
  );

  const { onChange, onSelectionChange, ...childProps } = child.props;

  // onChange event passed to the child should be executed after Form onChange logic
  return (
    <LegacyFieldProvider>
      {cloneElement(
        child,
        mergeProps(
          childProps,
          newProps,
          onChange ? { onChange: __props.onChange } : {},
          onSelectionChange ? { onSelectionChange: __props.onChange } : {},
        ),
      )}
    </LegacyFieldProvider>
  );
}

type LegacyFieldContextValue = {
  insideLegacyField: boolean;
};

const LegacyFieldContext = createContext<LegacyFieldContextValue>({
  insideLegacyField: false,
});

function LegacyFieldProvider(props: PropsWithChildren<unknown>) {
  const value = useMemo(() => ({ insideLegacyField: true }), []);
  return (
    <LegacyFieldContext.Provider value={value}>
      {props.children}
    </LegacyFieldContext.Provider>
  );
}

export function useInsideLegacyField() {
  const { insideLegacyField } = useContext(LegacyFieldContext);

  return insideLegacyField;
}
