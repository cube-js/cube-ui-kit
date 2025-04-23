import {
  Children,
  cloneElement,
  createContext,
  PropsWithChildren,
  ReactElement,
  useContext,
  useMemo,
} from 'react';

import { FieldBaseProps, LabelPosition } from '../../../shared/index';
import { Styles } from '../../../tasty/index';
import { mergeProps } from '../../../utils/react/index';
import { warn } from '../../../utils/warnings';
import { FieldWrapper } from '../FieldWrapper/index';

import { useFormProps } from './Form';
import { FieldTypes } from './types';
import { useField } from './use-field/index';
import { CubeFormInstance } from './use-form';

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
      selectedKey: !allowsCustomValue ? value ?? null : undefined,
      inputValue: allowsCustomValue ? value ?? '' : undefined,
      onInputChange(val) {
        if (!allowsCustomValue) {
          return;
        }

        onChange(val);
      },
      onSelectionChange(val: string) {
        if (val == null && allowsCustomValue) {
          return;
        }

        onChange(val);
      },
    };
  } else if (type === 'Select') {
    return {
      selectedKey: value ?? null,
      onSelectionChange: onChange,
    };
  }

  return {
    value: value != null ? value : null,
    onChange,
  };
}

export interface CubeFieldProps<T extends FieldTypes> extends FieldBaseProps {
  /** The initial value of the input. */
  defaultValue?: any;
  styles?: Styles;
  children?: ReactElement | ((CubeFormInstance) => ReactElement);
  /** The form instance */
  form?: CubeFormInstance<T>;
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
  labelPosition?: LabelPosition;
}

export function Field<T extends FieldTypes>(props: CubeFieldProps<T>) {
  const allProps: CubeFullFieldProps<T> = useFormProps(props);

  let {
    children,
    form,
    label,
    extra,
    necessityLabel,
    necessityIndicator,
    description,
    tooltip,
    isHidden,
    isDisabled,
    isLoading,
    styles,
    labelProps,
    labelPosition = 'top',
    labelStyles,
    labelSuffix,
  } = allProps;

  if (typeof children === 'function') {
    children = children(form);
  }

  let child = children == null ? null : Children.only(children);

  const inputType = (child?.type as any)?.cubeInputType ?? 'Text';

  const __props = useField<T, CubeFullFieldProps<T>>(allProps, {
    defaultValidationTrigger: getDefaultValidateTrigger(inputType),
  });

  const { validationState, message, isRequired, name, id } = __props;

  if (!child) return null;

  if (id) {
    if (!labelProps) {
      labelProps = {};
    }

    labelProps.for = id;
  }

  if (__props.nonInput) {
    return (
      <LegacyFieldProvider>
        <FieldWrapper
          isHidden={isHidden}
          isDisabled={isDisabled}
          validationState={__props.validationState}
          necessityIndicator={necessityIndicator}
          necessityLabel={necessityLabel}
          isRequired={isRequired}
          label={label}
          labelProps={labelProps}
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

  if (message !== undefined) {
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

  Object.assign(
    newProps,
    getValueProps(
      inputType,
      __props.field?.value,
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
  const { insideLegacyField = false } = useContext(LegacyFieldContext);

  return insideLegacyField;
}
