import {
  Children,
  cloneElement,
  ReactElement,
  useEffect,
  useState,
} from 'react';
import { useFormProps } from './Form';
import { mergeProps } from '../../utils/react';
import { FieldBaseProps, ValidationRule } from '../../shared';
import { FormStore } from './useForm';

const ID_MAP = {};

function createId(name) {
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
  ID_MAP[name] = ID_MAP[name].filter((_id) => _id !== id);
}

function getDefaultValidateTrigger(type) {
  type = type || '';

  return (
    type === 'NumberInput'
    || type.includes('Input')
    || (type.includes('TextArea') ? 'onBlur' : 'onChange')
  );
}

function getValueProps(type, value?) {
  type = type || '';

  if (type === 'NumberInput') {
    return {
      value: value != null ? value : null,
    };
  } else if (type.includes('Input') || type.includes('TextArea')) {
    return {
      value: (typeof value === 'string' || typeof value === 'number') ? String(value) : '',
    };
  } else if (type === 'Checkbox' || type === 'Switch') {
    return {
      isSelected: value != null ? value : false,
      isIndeterminate: false,
    };
  } else if (type === 'CheckboxGroup') {
    return {
      value: value != null ? value : [],
    };
  } else if (type === 'ComboBox' || type === 'Select') {
    return {
      selectedKey: value != null ? value : null,
    };
  }

  return {
    value: value != null ? value : null,
  };
}

export interface CubeFieldProps extends FieldBaseProps {
  /** The unique ID of the field */
  id?: string;
  /** The id prefix for the field to avoid collisions between forms */
  idPrefix?: string;
  children?: ReactElement | ((FormStore) => ReactElement);
  /** Validation rules */
  rules?: ValidationRule[];
  /** The form instance */
  form?: FormStore;
  /** The message for the field or text for the error */
  message?: string;
}

interface CubeFullFieldProps extends CubeFieldProps {
  form: FormStore;
}

interface CubeReplaceFieldProps extends CubeFieldProps {
  isRequired?: boolean;
  onChange: (any) => void;
  onSelectionChange: (any) => void;
  onBlur: () => void;
}

export function Field(allProps: CubeFieldProps) {
  const props: CubeFullFieldProps = useFormProps(allProps);

  let {
    id,
    idPrefix,
    children,
    name,
    form,
    rules,
    label,
    validateTrigger,
    validationState,
    message,
  } = props;

  let [fieldId] = useState(() => {
    return id || createId(idPrefix ? `${idPrefix}_${name}` : name);
  });

  useEffect(() => {
    return () => {
      id || removeId(idPrefix ? `${idPrefix}_${name}` : name, fieldId);
    };
  }, []);

  let field = form?.getFieldInstance(name);
  let isRequired = rules && rules.find((rule) => rule.required);

  useEffect(() => {
    if (field) {
      field.rules = rules;
      form.forceReRender();
    } else {
      form.createField(name);
    }
  }, [field]);

  if (!name) {
    console.error('invalid form name:', name);

    return null;
  }

  if (!form) {
    console.error('form field requires declared form instance');

    return null;
  }

  if (typeof children === 'function') {
    children = children(form);
  }

  if (!children) return null;

  let child = Children.only(children);

  // @ts-ignore
  const typeName = child.type.render.displayName;

  const defaultValidateTrigger = getDefaultValidateTrigger(typeName);

  if (!field) {
    return cloneElement(
      child,
      mergeProps(child.props, {
        ...getValueProps(typeName),
        name,
        id: fieldId,
      }),
    );
  }

  if (!validateTrigger) {
    validateTrigger = defaultValidateTrigger;
  }

  function onChangeHandler(val) {
    form.setFieldValue(name, val, true);

    const field = form.getFieldInstance(name);

    if (
      validateTrigger === 'onChange'
      || (field && field.errors && field.errors.length)
    ) {
      form.validateField(name).catch(() => {}); // do nothing on fail
    }
  }

  const newProps: CubeReplaceFieldProps = {
    id: fieldId,
    name,
    onChange: onChangeHandler,
    onSelectionChange: onChangeHandler,
    onBlur() {
      if (validateTrigger === 'onBlur') {
        // We need timeout so the change event can be done.
        setTimeout(() => {
          form.validateField(name).catch(() => {}); // do nothing on fail
        });
      }
    },
  };

  if (validationState) {
    newProps.validationState = validationState;
  }

  if (isRequired) {
    newProps.isRequired = true;
  }

  if (label) {
    newProps.label = label;
  }

  if (message) {
    newProps.message = message;
  }

  if (field && field.errors && field.errors.length) {
    if (!validationState) {
      newProps.validationState = 'invalid';
    }

    if (!message) {
      newProps.message = field.errors[0];
    }
  }

  Object.assign(newProps, getValueProps(typeName, field?.value));

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
