import { useEffect, useMemo, useState } from 'react';

import { useEvent, useIsFirstRender } from '../../../../_internal/index';
import { ValidateTrigger } from '../../../../shared/index';
import { resolveValidationProps } from '../../validation/index';
import { useFormProps } from '../Form';
import { FieldTypes } from '../types';
import { delayValidationRule } from '../validation';

import { FieldReturnValue, UseFieldProps } from './types';

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

export function useField<T extends FieldTypes, Props extends UseFieldProps<T>>(
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
    validationDelay,
    showValid,
    shouldUpdate,
    isRequired: isRequiredProp,
    necessityIndicator: necessityIndicatorProp,
  } = props;

  const { isInvalid: isInvalidProp, isValid: isValidProp } =
    resolveValidationProps(props);

  const processedRules = useMemo(() => {
    let finalRules = rules;

    // If isRequired prop is set, ensure there's a required rule
    if (isRequiredProp) {
      const hasRequiredRule = finalRules?.some(
        (rule) => 'required' in rule && rule.required === true,
      );

      if (!hasRequiredRule) {
        finalRules = finalRules
          ? [{ required: true }, ...finalRules]
          : [{ required: true }];
      }
    }

    // Add delay rule if needed
    if (finalRules && finalRules.length && validationDelay) {
      return [delayValidationRule(validationDelay), ...finalRules];
    }

    return finalRules;
  }, [rules, validationDelay, isRequiredProp]);

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
  }, [fieldName]);

  let field = form?.getFieldInstance(fieldName);

  if (field) {
    field.rules = processedRules;
  }

  let isRequired = !!processedRules?.find(
    (rule) => 'required' in rule && rule.required === true,
  );

  // `isRequired` has two sources with different intent. A `required` rule states
  // how the field behaves: it is what validation runs, and `aria-required` is
  // its programmatic mirror, so the flag has to reach the input either way. The
  // `isRequired` prop additionally states what the label should say. So when the
  // flag came from the rules alone, suppress the label marker — unless the call
  // site asked for an indicator explicitly, which is a request in its own right.
  const suppressNecessityIndicator =
    isRequired &&
    isRequiredProp == null &&
    necessityIndicatorProp === undefined;

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

      // Explicit validation props always win over the state derived from the form
      isInvalid: isInvalidProp ?? !!field?.errors?.length,
      isValid: isValidProp ?? !!(showValid && field?.status === 'valid'),
      ...(isRequired && { isRequired }),
      ...(suppressNecessityIndicator && { necessityIndicator: null }),
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
      suppressNecessityIndicator,
      message,
      description,
      errorMessage,
      onBlurHandler,
      onChangeHandler,
      validateTrigger,
      isInvalidProp,
      isValidProp,
      showValid,
      nonInput,
    ],
  );
}
