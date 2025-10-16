import { useEffect, useMemo, useState } from 'react';

import { useEvent, useIsFirstRender } from '../../../../_internal/index';
import { ValidateTrigger } from '../../../../shared/index';
import { useFormProps } from '../Form';
import { FieldTypes } from '../types';
import { delayValidationRule } from '../validation';

import { CubeFieldProps, FieldReturnValue } from './types';

const ID_MAP = {};
let STANDALONE_FIELD_COUNTER = 0;

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
    message,
    description,
    errorMessage,
    validateTrigger = params.defaultValidationTrigger,
    validationState,
    validationDelay,
    showValid,
    shouldUpdate,
  } = props;

  if (rules && rules.length && validationDelay) {
    rules.unshift(delayValidationRule(validationDelay));
  }

  const nonInput = !name;
  const fieldName: string = name != null ? name : '';

  const isFirstRender = useIsFirstRender();

  // Generate a base ID for standalone fields (no name)
  const baseId = useMemo(() => {
    if (id) return id;
    if (fieldName) return idPrefix ? `${idPrefix}_${fieldName}` : fieldName;
    // For standalone fields without a name, use a counter-based ID
    return `field_${++STANDALONE_FIELD_COUNTER}`;
  }, [id, fieldName, idPrefix]);

  let [fieldId, setFieldId] = useState(baseId);

  useEffect(() => {
    let newId;

    if (!id) {
      // Generate unique ID for both form-connected and standalone fields
      const idBase = fieldName || baseId;
      newId = createId(idBase);

      setFieldId(newId);
    }

    return () => {
      if (!id) {
        const idBase = fieldName || baseId;
        removeId(idBase, newId);
      }

      if (fieldName && form) {
        form.removeField(fieldName);
      }
    };
  }, [fieldName, baseId]);

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
      field = form.createField(fieldName);
    }
  }, [field]);

  if (form) {
    if (isFirstRender) {
      if (!field) {
        field = form.createField(fieldName, true);
      }

      if (field?.value == null && defaultValue != null) {
        form.setFieldValue(fieldName, defaultValue, false, true);
        form.updateInitialFieldsValue({ [fieldName]: defaultValue });

        field = form?.getFieldInstance(fieldName);
      }
    }

    if (!field?.touched && defaultValue != null) {
      form.setFieldValue(fieldName, defaultValue, false, true);
    }
  }

  const onChangeHandler = useEvent((val: any, dontTouch: boolean) => {
    if (!form) return;

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

    form.setFieldValue(fieldName, val, !dontTouch);

    if (
      !dontTouch &&
      (validateTrigger === 'onChange' ||
        (field && field.errors && field.errors.length))
    ) {
      form.validateField(fieldName).catch(() => {}); // do nothing on fail
    }
  });

  const onBlurHandler = useEvent(() => {
    if (validateTrigger === 'onBlur') {
      // We need a timeout so the change event can be done.
      setTimeout(() => {
        form?.validateField(fieldName).catch(() => {}); // do nothing on fail
      });
    }
  });

  let value = field?.value;

  return useMemo(
    () => ({
      id: fieldId,
      name: fieldName,
      value,
      validateTrigger,
      form,
      field,
      nonInput,

      validationState:
        validationState ??
        (field?.errors?.length
          ? 'invalid'
          : showValid && field?.status === 'valid'
            ? 'valid'
            : undefined),
      ...(isRequired && { isRequired }),
      message:
        message !== undefined
          ? message
          : field?.status === 'invalid' && field?.errors?.[0],
      description,
      errorMessage:
        errorMessage !== undefined
          ? errorMessage
          : field?.status === 'invalid' && field?.errors?.length
            ? field.errors[0]
            : undefined,
      onBlur: onBlurHandler,
      onChange: onChangeHandler,
    }),
    [
      form,
      field,
      field?.value,
      field?.errors?.length,
      field?.status,
      fieldId,
      fieldName,
      isRequired,
      message,
      description,
      errorMessage,
      onBlurHandler,
      onChangeHandler,
      validateTrigger,
      validationState,
      showValid,
      nonInput,
    ],
  );
}
