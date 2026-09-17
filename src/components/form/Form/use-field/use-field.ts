import { useEffect, useMemo, useState } from 'react';

import { useEvent, useIsFirstRender } from '../../../../_internal/index';
import { ValidateTrigger } from '../../../../shared/index';
import { useLayoutEffect } from '../../../../utils/react/useLayoutEffect';
import { resolveValidationProps } from '../../validation/index';
import {
  isModernFormController,
  modernBackendUnavailableError,
} from '../backend';
import { useFormProps } from '../Form';
import { FieldTypes } from '../types';
import { delayValidationRule } from '../validation';

import { FieldReturnValue, UseFieldProps } from './types';

import type { CubeFormInstance } from '../use-form';

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
    form: sourceForm,
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
    sourceForm = undefined;
  }

  if (!params.unbound && isModernFormController(sourceForm)) {
    throw modernBackendUnavailableError(
      name != null ? `The "${name}" field` : 'A field without a name',
    );
  }

  // A modern source is rejected above (or cleared when this adapter is inert).
  // Keep unbranded structural legacy instances supported as before.
  const form = sourceForm as CubeFormInstance<T> | undefined;

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

  // The id the effect below registered, with the base it was registered for.
  // Between a base change and that effect's next run the state is stale, and
  // handing it out would let the element carry the previous binding's id for
  // one commit — which can duplicate a sibling's live id — so the current base
  // is used until the effect catches up. An explicit `id` is used as it is.
  const [assignedId, setAssignedId] = useState({ base: baseId, id: baseId });
  const currentId = id || (assignedId.base === baseId ? assignedId.id : baseId);

  // Ids are registered per base (form name prefix plus field name), so that
  // duplicates get a suffix and the base is released when it changes or the
  // input unmounts. `id` and `nonInput` cannot change without the base. A
  // layout effect: when the base changes, the commit that carries the
  // unsuffixed base is corrected before the browser paints, so a duplicate
  // never shows a colliding id.
  useLayoutEffect(() => {
    if (id || nonInput) return;

    const newId = createId(baseId);

    setAssignedId((previous) =>
      previous.base === baseId && previous.id === newId
        ? previous
        : { base: baseId, id: newId },
    );

    return () => {
      removeId(baseId, newId);
    };
  }, [baseId, id, nonInput]);

  // Every form this hook registered the current name with. The dual-backend
  // shell keeps the hook mounted for standalone inputs, so a form may arrive
  // later or change, and the name may change; the name is released from all
  // of them, not from whichever form a closure happened to capture. This is
  // state rather than a ref only to keep render free of ref access.
  const [boundForms] = useState(() => new Set<CubeFormInstance<any>>());

  useEffect(() => {
    return () => {
      if (fieldName) {
        boundForms.forEach((boundForm) => boundForm.removeField(fieldName));
      }

      boundForms.clear();
    };
  }, [fieldName, boundForms]);

  let field = form?.getFieldInstance(fieldName);

  if (form) {
    // First render of this binding: the hook's first render, or a named field
    // that is not registered yet because the name or the form changed after
    // mount. Without a name the engine returns an unstored placeholder, so it
    // is only created on the first render, as before: creating it again on
    // every render would give the effect below a new object each time.
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

  // Registration happens during render. Once it is committed, remember the
  // form for the release above and re-render the form's owner so its
  // render-time reads see the new field. `form` is deliberately not a
  // dependency: a form whose identity changes on every render (a copy, an
  // inline mock) shares its store, and re-running here would loop.
  useEffect(() => {
    if (form && field) {
      boundForms.add(form);
      form.forceReRender();
    }
  }, [field, boundForms]);

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
