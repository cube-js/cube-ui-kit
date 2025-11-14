import { ReactNode } from 'react';

import {
  FieldCoreProps,
  ValidateTrigger,
  ValidationState,
} from '../../../../shared/index';
import { CubeFieldData, FieldTypes } from '../types';
import { CubeFormInstance } from '../use-form';

export interface UseFieldProps<T extends FieldTypes> extends FieldCoreProps {
  /** The initial value of the input. */
  defaultValue?: any;
  /** The form instance */
  form?: CubeFormInstance<T>;
  /** The validation state of the field */
  validationState?: ValidationState;
  /** Whether to show valid state */
  showValid?: boolean;
  /** On which event perform the validation for the field */
  validateTrigger?: ValidateTrigger;
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
  /**
   * @deprecated Use `errorMessage` for error messages and `description` for field descriptions instead.
   * Message for the field. Some additional information or error notice
   */
  message?: ReactNode;
  /** Description for the field. Will be placed below the label */
  description?: ReactNode;
  /** Error message for the field. Always displayed in danger state regardless of validation state */
  errorMessage?: ReactNode;
  isRequired?: boolean;
  onBlur: () => void;
  nonInput: boolean;
  field?: CubeFieldData<keyof FieldTypes & string, T[keyof FieldTypes]>;
};
