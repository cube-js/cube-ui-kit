import { Children, useEffect, useMemo, useState } from 'react';

import { useFormProps } from '../Form';
import { FieldTypes } from '../types';
import { useEvent, useIsFirstRender, useWarn } from '../../../../_internal';

import { FieldContextValue, FieldProvider } from './FieldContext';
import { CubeFieldProps, CubeFullFieldProps } from './types';

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

// function getDefaultValidateTrigger(type) {
//   type = type || '';
//
//   return type === 'Number' || type.includes('Text') ? 'onBlur' : 'onChange';
// }

export function Field<T extends FieldTypes>(props: CubeFieldProps<T>) {
  const finalProps: CubeFullFieldProps<T> = useFormProps(props);

  let {
    defaultValue,
    id,
    idPrefix,
    children,
    name,
    form,
    rules,
    validateTrigger,
    validationState,
    shouldUpdate,
  } = finalProps;

  const nonInput = !name;
  const fieldName: string =
    name != null ? (Array.isArray(name) ? name.join('.') : name) : '';

  const isFirstRender = useIsFirstRender();
  const [fieldId, setFieldId] = useState(
    id ?? (idPrefix ? `${idPrefix}_${fieldName}` : fieldName),
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

  const onBlurHandler = useEvent(() => {
    if (validateTrigger === 'onBlur') {
      // We need a timeout so the change event can be done.
      setTimeout(() => {
        form.validateField(fieldName).catch(() => {}); // do nothing on fail
      });
    }
  });

  const onChangeHandler = useEvent((val: any, dontTouch: boolean) => {
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
      (validateTrigger === 'onChange' || field?.errors?.length)
    ) {
      form.validateField(fieldName).catch(() => {}); // do nothing on fail
    }
  });

  const contextValue: FieldContextValue = useMemo(
    () => ({
      id: fieldId,
      name: fieldName,
      value: field?.inputValue ?? null,
      validateTrigger,
      shouldUpdate,
      validationState:
        validationState ?? (field?.errors?.length ? 'invalid' : undefined),
      ...(isRequired && { isRequired }),
      ...(field?.errors?.length && { message: field.errors[0] }),
      onBlur: onBlurHandler,
      onChange: onChangeHandler,
    }),
    [
      isRequired,
      shouldUpdate,
      validateTrigger,
      validationState,

      fieldId,
      fieldName,
      field?.errors,
      field?.inputValue,

      onBlurHandler,
      onChangeHandler,
    ],
  );

  const child = Children.only(
    typeof children === 'function' ? children(form) : children,
  );

  if (!form || !child) {
    return null;
  }

  if (isFirstRender && defaultValue != null) {
    if (!field) {
      form.createField(fieldName, true);
    }

    if (field?.value == null) {
      form.setFieldValue(fieldName, defaultValue, false, true);

      field = form?.getFieldInstance(fieldName);
    }
  }

  return <FieldProvider value={contextValue}>{child}</FieldProvider>;
}
