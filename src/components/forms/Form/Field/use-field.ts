import { useEffect, useMemo, useState } from 'react';

import { ValidateTrigger } from '../../../../shared';
import { useEvent, useWarn } from '../../../../_internal';
import { useFormProps } from '../Form';
import { FieldTypes } from '../types';

import { CubeFieldProps, FieldReturnValue } from './types';

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

export type UseFieldParams = {
  defaultValidationTrigger?: ValidateTrigger;
};

export function useField<T extends FieldTypes, Props extends CubeFieldProps<T>>(
  props: Props,
  params: UseFieldParams,
): FieldReturnValue<T> {
  props = useFormProps(props);

  let {
    defaultValue,
    id,
    idPrefix,
    name,
    form,
    rules,
    validateTrigger = params.defaultValidationTrigger,
    validationState,
    shouldUpdate,
  } = props;

  const nonInput = !name;
  const fieldName: string = name ?? '';

  const [fieldId, setFieldId] = useState(
    id ?? (idPrefix ? `${idPrefix}_${fieldName}` : fieldName),
  );

  let field = form?.getFieldInstance(fieldName);

  if (!field) {
    field = form?.createField(fieldName, true);
  }

  useWarn(
    !form && name !== undefined,
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

  if (field) {
    field.rules = rules;

    if (defaultValue != null && !field.touched) {
      form?.setFieldValue(fieldName, defaultValue, false, true);
    }
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
        form?.validateField(fieldName).catch(() => {}); // do nothing on fail
      });
    }
  });

  const onChangeHandler = useEvent((value: any, dontTouch: boolean) => {
    const field = form?.getFieldInstance(fieldName);

    if (shouldUpdate) {
      const fieldsValue = form?.getFieldsValue();

      // check if we should update the value of the field
      const shouldNotBeUpdated =
        typeof shouldUpdate === 'boolean'
          ? !shouldUpdate
          : !shouldUpdate(fieldsValue, {
              ...fieldsValue,
              [fieldName]: value,
            });

      if (shouldNotBeUpdated) {
        return;
      }
    }

    form?.setFieldValue(fieldName, value, !dontTouch, false, dontTouch);

    if (
      !dontTouch &&
      (validateTrigger === 'onChange' || field?.errors?.length)
    ) {
      form?.validateField(fieldName).catch(() => {}); // do nothing on fail
    }
  });

  return useMemo(
    () => ({
      id: fieldId,
      name: fieldName,
      value: field?.inputValue,
      validateTrigger,
      form,

      validationState:
        validationState ?? (field?.errors?.length ? 'invalid' : undefined),
      ...(isRequired && { isRequired }),
      ...(field?.errors?.length && { message: field.errors[0] }),
      onBlur: onBlurHandler,
      onChange: onChangeHandler,
    }),
    [
      form,
      field?.errors,
      field?.inputValue,
      fieldId,
      fieldName,
      isRequired,
      onBlurHandler,
      onChangeHandler,
      validateTrigger,
      validationState,
    ],
  );
}
