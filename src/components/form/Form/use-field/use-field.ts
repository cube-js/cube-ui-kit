import { useEffect, useMemo, useState } from 'react';

import { useEvent, useIsFirstRender } from '../../../../_internal/index';
import { ValidateTrigger } from '../../../../shared/index';
import { resolveValidationProps } from '../../validation/index';
import {
  isModernFormController,
  modernBackendUnavailableError,
} from '../backend';
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
  /**
   * Run without a binding: `useFieldProps` sets this for an input that is
   * standalone, inside the deprecated `<Field>` or disabled, so that this hook
   * is still called (stable hook order) but registers nothing.
   */
  unbound?: boolean;
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

  if (params.unbound) {
    name = undefined;
    form = undefined;
  }

  if (!params.unbound && isModernFormController(form)) {
    throw modernBackendUnavailableError(
      name != null ? `The "${name}" field` : 'A field without a name',
    );
  }

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
  const baseId = id || (idPrefix ? `${idPrefix}_${fieldName}` : fieldName);
  let [fieldId, setFieldId] = useState(baseId);

  // `fieldId` is seeded from the mount-time base and corrected by the effect
  // below, so after a binding change it lags one commit. Until it catches up,
  // hand out the current base: a label and its input must never disagree.
  const isFieldIdCurrent =
    fieldId === baseId || fieldId.startsWith(`${baseId}_`);
  const currentId = isFieldIdCurrent ? fieldId : baseId;

  // `fieldName` may change after mount: the dual-backend shell keeps this hook
  // mounted for standalone inputs, so a name may arrive later or go away.
  // Derive the id from the current base (not the seed) and release the
  // previous name. The effect deliberately does not depend on `form`: an
  // instance whose identity changes on every render (a copy, an inline mock)
  // would otherwise remove and re-create the field on every render.
  useEffect(() => {
    let newId;

    if (!id && !nonInput) {
      newId = createId(baseId);

      setFieldId(newId);
    }

    return () => {
      if (!id) {
        removeId(baseId, newId);
      }

      if (fieldName && form) {
        form.removeField(fieldName);
      }
    };
  }, [fieldName]);

  let field = form?.getFieldInstance(fieldName);

  if (form) {
    // First render of this binding: the hook's first render, or a named field
    // that is not registered yet because the name or the form changed after
    // mount. A previous form keeps the field (legacy contract, row 4). Without
    // a name the engine returns an unstored placeholder, so it is only created
    // on the first render, as before: creating it again on every render would
    // give the effect below a new object each time.
    if (isFirstRender || (!field && fieldName)) {
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

  if (field) {
    field.rules = processedRules;
  }

  let isRequired = !!processedRules?.find(
    (rule) => 'required' in rule && rule.required === true,
  );

  // `isRequired` has two sources with different intent. A `required` rule states
  // how the field behaves: it is what validation runs, and `aria-required` is
  // its programmatic mirror, so the flag has to reach the input either way. The
  // `isRequired` prop additionally states what the label should say. So unless
  // the prop itself asked for the marker, suppress it — an absent prop and an
  // explicit `isRequired={false}` both mean "do not mark this", the latter
  // rather more loudly. An explicit `necessityIndicator` overrides either way,
  // being a request for the marker in its own right.
  const suppressNecessityIndicator =
    isRequired && !isRequiredProp && necessityIndicatorProp === undefined;

  // Registration happens during render; once it is committed, re-render the
  // form's owner so its render-time reads see the new field.
  useEffect(() => {
    if (form && field) {
      form.forceReRender();
    }
  }, [field]);

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
      id: currentId,
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
      currentId,
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
