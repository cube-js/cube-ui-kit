import { ReactElement } from 'react';

import { FieldTypes } from '../types';
import {
  ValidateTrigger,
  ValidationRule,
  ValidationState,
} from '../../../../shared';
import { CubeFormInstance } from '../useForm';

export interface LegacyCubeFieldProps<T extends FieldTypes> {
  /** The initial value of the input. */
  defaultValue?: any;
  /** The unique ID of the field */
  id?: string;
  /** The id prefix for the field to avoid collisions between forms */
  idPrefix?: string;
  children?: ReactElement | ((form: CubeFormInstance<T>) => ReactElement);
  /** Function that checks whether to perform update of the form state. */
  shouldUpdate?: boolean | ((prevValues, nextValues) => boolean);
  /** Validation rules */
  rules?: ValidationRule[];
  /** The form instance */
  form?: CubeFormInstance<T>;
  /** Field name. It's used as a key the form data. */
  name?: string[] | string;
  /** The validation state of the field */
  validationState?: ValidationState;
  /** On which event perform the validation for the field */
  validateTrigger?: ValidateTrigger;
}

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
  name?: string[] | string;
  /** The validation state of the field */
  validationState?: ValidationState;
  /** On which event perform the validation for the field */
  validateTrigger?: ValidateTrigger;
}
