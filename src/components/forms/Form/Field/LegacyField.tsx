import {
  Children,
  cloneElement,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useWarn } from '../../../../_internal';
import { mergeProps } from '../../../../utils/react';
import { LabelPosition } from '../../../../shared';
import { FieldWrapper } from '../../FieldWrapper';
import { CubeFormInstance } from '../useForm';
import { useFormProps } from '../Form';
import { FieldTypes } from '../types';

import { LegacyCubeFieldProps } from './types';

const ID_MAP = {};

function createId(name) {
  if (!name) return;

  if (!ID_MAP[name]) {
    ID_MAP[name] = [];
  }

  let i = 0;
  let id;

  do {
    id = i ? `${name}_${i}` : name;
    i++;
  } while (ID_MAP[name].includes(id));

  ID_MAP[name].push(id);

  return id;
}

function removeId(name, id) {
  if (!ID_MAP[name]) return;

  ID_MAP[name] = ID_MAP[name].filter((_id) => _id !== id);
}

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

interface CubeFullFieldProps<T extends FieldTypes>
  extends LegacyCubeFieldProps<T> {
  form: CubeFormInstance<T>;
}

interface CubeReplaceFieldProps<T extends FieldTypes>
  extends LegacyCubeFieldProps<T> {
  isRequired?: boolean;
  onChange?: (any) => void;
  onSelectionChange?: (any) => void;
  onBlur: () => void;
  onInputChange?: (any) => void;
  labelPosition?: LabelPosition;
}

/**
 * @deprecated Use component without `Field`
 *
 * ```tsx
    <Form>
        <Checkbox />
    </Form>
 *```
 */
export function Field<T extends FieldTypes>(props: LegacyCubeFieldProps<T>) {
  const fullProps: CubeFullFieldProps<T> = useFormProps(props);

  let {
    defaultValue,
    type: inputType,
    id,
    idPrefix,
    children,
    name,
    form,
    rules,
    label,
    extra,
    validateTrigger,
    validationState,
    necessityLabel,
    necessityIndicator,
    shouldUpdate,
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
  } = fullProps;

  const nonInput = !name;
  const fieldName: string =
    name != null ? (Array.isArray(name) ? name.join('.') : name) : '';

  let [fieldId, setFieldId] = useState(
    id || (idPrefix ? `${idPrefix}_${fieldName}` : fieldName),
  );

  useWarn(
    !form,
    'Form Field requires declared form instance if field name is specified',
  );

  useEffect(() => {
    let newId;

    if (!id && !nonInput) {
      newId = createId(fieldId);

      setFieldId(newId);
    }

    return () => {
      if (!id) {
        removeId(idPrefix ? `${idPrefix}_${fieldName}` : fieldName, newId);
      }

      if (fieldName && form) {
        form.removeField(fieldName);
      }
    };
  }, []);

  let field = form?.getFieldInstance(fieldName);

  if (field) {
    field.rules = rules;
  }

  let isRequired = rules && !!rules.find((rule) => rule.required);

  useEffect(() => {
    if (!form) return;

    if (field) {
      form.forceReRender();
    } else {
      form.createField(fieldName);
    }
  }, [field]);

  if (typeof children === 'function') {
    children = children(form);
  }

  if (!children) return null;

  let child = Children.only(children);

  if (nonInput) {
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
    return null;
  }

  inputType =
    inputType || ((child.type as any).cubeInputType as string) || 'Text';

  const defaultValidateTrigger = getDefaultValidateTrigger(inputType);

  if (field) {
    field.rules = rules;

    if (defaultValue != null && !field.touched) {
      form?.setFieldValue(fieldName, defaultValue, false, true);
    }
  }

  if (!field) {
    return (
      <LegacyFieldProvider>
        {cloneElement(
          child,
          mergeProps(child.props, {
            ...getValueProps(inputType),
            label: fieldName,
            name: fieldName,
            id: fieldId,
          }),
        )}
      </LegacyFieldProvider>
    );
  }

  if (!validateTrigger) {
    validateTrigger = defaultValidateTrigger;
  }

  function onChangeHandler(val, dontTouch) {
    const field = form.getFieldInstance(fieldName);

    if (shouldUpdate) {
      const fieldsValue = form.getFieldsValue();

      // check if we should update the value of the field
      const shouldNotBeUpdated =
        typeof shouldUpdate === 'boolean'
          ? !shouldUpdate
          : !shouldUpdate(fieldsValue, {
              ...fieldsValue,
              [fieldName]: val,
            });

      if (shouldNotBeUpdated) {
        return;
      }
    }

    form.setFieldValue(fieldName, val, !dontTouch, false, dontTouch);

    if (
      !dontTouch &&
      (validateTrigger === 'onChange' ||
        (field && field.errors && field.errors.length))
    ) {
      form.validateField(fieldName).catch(() => {}); // do nothing on fail
    }
  }

  const newProps: CubeReplaceFieldProps<T> = {
    id: fieldId,
    name: fieldName,
    onBlur() {
      if (validateTrigger === 'onBlur') {
        // We need a timeout so the change event can be done.
        setTimeout(() => {
          form.validateField(fieldName).catch(() => {}); // do nothing on fail
        });
      }
    },
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

  if (field && field.errors && field.errors.length) {
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
      field?.inputValue,
      onChangeHandler,
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
          onChange ? { onChange } : {},
          onSelectionChange ? { onSelectionChange } : {},
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

function LegacyFieldProvider({ children }: { children: ReactNode }) {
  return (
    <LegacyFieldContext.Provider value={{ insideLegacyField: true }}>
      {children}
    </LegacyFieldContext.Provider>
  );
}

export function useInsideLegacyField() {
  const { insideLegacyField } = useContext(LegacyFieldContext);

  return insideLegacyField;
}
