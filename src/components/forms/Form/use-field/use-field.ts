import { useEffect, useMemo, useState } from 'react';

import { ValidateTrigger } from '../../../../shared';
import { useEvent, useIsFirstRender } from '../../../../_internal';
import { useFormProps } from '../Form';
import { FieldTypes } from '../types';
import { delayValidationRule } from '../validation';

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
    message,
    validateTrigger = params.defaultValidationTrigger,
    validationState,
    validationDelay,
    showValid,
    shouldUpdate,
    casting,
  } = props;

  if (casting === 'number') {
    casting = [
      (inputValue: unknown) => String(inputValue) ?? null,
      (outputValue: string) => Number(outputValue) ?? null,
    ];
  }

  if (rules && rules.length && validationDelay) {
    rules.unshift(delayValidationRule(validationDelay));
  }

  const nonInput = !name;
  const fieldName: string = name != null ? name : '';

  const isFirstRender = useIsFirstRender();
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

    if (
      casting?.[1] &&
      typeof val === 'string' &&
      typeof casting?.[1] === 'function'
    ) {
      val = casting[1](val);
    }

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
  });

  const onBlurHandler = useEvent(() => {
    if (validateTrigger === 'onBlur') {
      // We need a timeout so the change event can be done.
      setTimeout(() => {
        form?.validateField(fieldName).catch(() => {}); // do nothing on fail
      });
    }
  });

  let inputValue = field?.inputValue;

  if (casting?.[0] && inputValue) {
    inputValue = casting[0](inputValue);
  }

  return useMemo(
    () => ({
      id: fieldId,
      name: fieldName,
      value: inputValue,
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
      message: message ?? (field?.status === 'invalid' && field?.errors?.[0]),
      onBlur: onBlurHandler,
      onChange: onChangeHandler,
    }),
    [
      form,
      field,
      field?.errors?.length,
      field?.status,
      field?.inputValue,
      fieldId,
      fieldName,
      isRequired,
      onBlurHandler,
      onChangeHandler,
      validateTrigger,
      validationState,
      showValid,
      nonInput,
    ],
  );
}
