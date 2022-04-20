import {
  Children,
  cloneElement,
  ReactElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useFormProps } from './Form';
import { mergeProps } from '../../../utils/react';
import { OptionalFieldBaseProps, ValidationRule } from '../../../shared';
import { CubeFormInstance } from './useForm';
import { FieldWrapper } from '../FieldWrapper';

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

function getValueProps(type, value?, onChange?) {
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
      onInputChange: onChange,
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

export interface CubeFieldProps extends OptionalFieldBaseProps {
  /** The initial value of the input. */
  defaultValue?: any;
  /** The type of the input. `Input`, `Checkbox`, RadioGroup`, `Select`, `ComboBox` etc... */
  type?: string;
  /** The unique ID of the field */
  id?: string;
  /** The id prefix for the field to avoid collisions between forms */
  idPrefix?: string;
  children?: ReactElement | ((CubeFormInstance) => ReactElement);
  /** Function that check whether to perform update of the form state. */
  shouldUpdate?: boolean | ((prevValues, nextValues) => boolean);
  /** Validation rules */
  rules?: ValidationRule[];
  /** The form instance */
  form?: CubeFormInstance;
  /** The message for the field or text for the error */
  message?: string;
  /** The description for the field */
  description?: ReactNode;
  /** Tooltip for the label that explains something. */
  tooltip?: ReactNode;
  /** Field name. It's used as a key the form data. */
  name?: string[] | string;
  /** Whether the field is hidden. */
  isHidden?: boolean;
}

interface CubeFullFieldProps extends CubeFieldProps {
  form: CubeFormInstance;
}

interface CubeReplaceFieldProps extends CubeFieldProps {
  isRequired?: boolean;
  onChange?: (any) => void;
  onSelectionChange?: (any) => void;
  onBlur: () => void;
  onInputChange?: (any) => void;
}

export function Field(allProps: CubeFieldProps) {
  const props: CubeFullFieldProps = useFormProps(allProps);

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
  } = props;
  const nonInput = !name;
  const fieldName: string =
    name != null ? (Array.isArray(name) ? name.join('.') : name) : '';

  let firstRunRef = useRef(true);
  let [fieldId, setFieldId] = useState(
    id || (idPrefix ? `${idPrefix}_${fieldName}` : fieldName),
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

  let isRequired = rules && !!rules.find((rule) => rule.required);

  useEffect(() => {
    if (!form) return;

    if (field) {
      field.rules = rules;
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
      <FieldWrapper
        isHidden={isHidden}
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
      />
    );
  }

  if (!fieldName) {
    console.error('invalid form name:', fieldName);

    return null;
  }

  if (!form) {
    console.error('form field requires declared form instance');

    return null;
  }

  inputType =
    inputType || ((child.type as any).cubeInputType as string) || 'Text';

  const defaultValidateTrigger = getDefaultValidateTrigger(inputType);

  if (firstRunRef.current && defaultValue != null) {
    if (!field) {
      form.createField(fieldName, true);
    }

    if (field?.value == null) {
      form.setFieldValue(fieldName, defaultValue, false, true);

      field = form?.getFieldInstance(fieldName);
    }
  }

  firstRunRef.current = false;

  if (!field) {
    return cloneElement(
      child,
      mergeProps(child.props, {
        ...getValueProps(inputType),
        name: fieldName,
        id: fieldId,
      }),
    );
  }

  if (!validateTrigger) {
    validateTrigger = defaultValidateTrigger;
  }

  function onChangeHandler(val) {
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

    form.setFieldValue(fieldName, val, true);

    if (
      validateTrigger === 'onChange' ||
      (field && field.errors && field.errors.length)
    ) {
      form.validateField(fieldName).catch(() => {}); // do nothing on fail
    }
  }

  const newProps: CubeReplaceFieldProps = {
    id: fieldId,
    name: fieldName,
    onBlur() {
      if (validateTrigger === 'onBlur') {
        // We need timeout so the change event can be done.
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
    getValueProps(inputType, field?.value, onChangeHandler),
  );

  const { onChange, onSelectionChange, ...childProps } = child.props;

  // onChange event passed to the child should be executed after Form onChange logic
  return cloneElement(
    child,
    mergeProps(
      childProps,
      newProps,
      onChange ? { onChange } : {},
      onSelectionChange ? { onSelectionChange } : {},
    ),
  );
}
