import { ReactElement, ReactNode } from 'react';

import { Styles } from '../../../../tasty';
import { CubeFieldData, FieldTypes } from '../types';
import {
  LabelPosition,
  OptionalFieldBaseProps,
  ValidateTrigger,
  ValidationRule,
  ValidationState,
} from '../../../../shared';
import { CubeFormInstance } from '../useForm';

export interface LegacyCubeFieldProps<T extends FieldTypes>
  extends OptionalFieldBaseProps {
  /** The initial value of the input. */
  defaultValue?: any;
  /** The type of the input. `Input`, `Checkbox`, RadioGroup`, `Select`, `ComboBox` etc... */
  type?: string;
  /** The unique ID of the field */
  id?: string;
  /** The id prefix for the field to avoid collisions between forms */
  idPrefix?: string;
  children?: ReactElement | ((CubeFormInstance) => ReactElement);
  /** Function that checks whether to perform update of the form state. */
  shouldUpdate?: boolean | ((prevValues, nextValues) => boolean);
  /** Validation rules */
  rules?: ValidationRule[];
  /** The form instance */
  form?: CubeFormInstance<T>;
  /** The message for the field or text for the error */
  message?: ReactNode;
  /** The description for the field */
  description?: ReactNode;
  /** Tooltip for the label that explains something. */
  tooltip?: ReactNode;
  /** Field name. It's used as a key the form data. */
  name?: string[] | string;
  /** Whether the field is hidden. */
  isHidden?: boolean;
  /** Whether the field is disabled. */
  isDisabled?: boolean;
  /** Whether the field is loading. */
  isLoading?: boolean;
  styles?: Styles;
  labelPosition?: LabelPosition;
  labelStyles?: Styles;
  labelSuffix?: ReactNode;
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
  name?: string;
  /** The validation state of the field */
  validationState?: ValidationState;
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
  message?: React.ReactNode;
  isRequired?: boolean;
  onBlur: () => void;
  nonInput: boolean;
  field?: CubeFieldData<keyof FieldTypes, T[keyof FieldTypes]>;
};
