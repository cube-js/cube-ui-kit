import { ReactNode } from 'react';

import {
  ValidateTrigger,
  ValidationRule,
  ValidationState,
} from '../../../../shared/index';
import { Props } from '../../../../tasty/index';
import { CubeFieldData, FieldTypes } from '../types';
import { CubeFormInstance } from '../use-form';

export interface CubeFieldProps<T extends FieldTypes> {
  /** The initial value of the input. */
  defaultValue?: any;
  /** The unique ID of the field */
  id?: string;
  /** The id prefix for the field to avoid collisions between forms */
  idPrefix?: string;
  /** Function that checks whether to perform update of the form state. */
  shouldUpdate?: boolean | ((prevValues, nextValues) => boolean);
  /** Validation rules */
  rules?: ValidationRule[];
  /** The form instance */
  form?: CubeFormInstance<T>;
  /** Field name. It's used as a key the form data. */
  name?: string;
  /** The validation state of the field */
  validationState?: ValidationState;
  /** Debounce in milliseconds for validation */
  validationDelay?: number;
  /** Whether to show valid state */
  showValid?: boolean;
  /** On which event perform the validation for the field */
  validateTrigger?: ValidateTrigger;
  /** Message for the field. Some additional information or error notice */
  message?: ReactNode;
  labelProps?: Props;
}

export type FieldReturnValue<T extends FieldTypes> = {
  id: string;
  name: string;
  value: any;
  validateTrigger?: ValidateTrigger;
  validationState?: ValidationState;
  form?: CubeFormInstance<T>;
  onChange?: (
    value: any,
    dontTouch: boolean,
    validateTrigger: ValidateTrigger,
  ) => void;
  message?: ReactNode;
  isRequired?: boolean;
  onBlur: () => void;
  nonInput: boolean;
  field?: CubeFieldData<keyof FieldTypes & string, T[keyof FieldTypes]>;
};
