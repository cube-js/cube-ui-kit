import { ReactNode } from 'react';

import { Props, Styles } from '../tasty';

/** ValidationResult type for error message functions */
export interface ValidationResult {
  /** Whether the value is invalid */
  isInvalid: boolean;
  /** List of validation error messages */
  validationErrors: string[];
  /** Native browser validation details */
  validationDetails: ValidityState;
}

/** Where to place label relative to input */
export type LabelPosition = 'side' | 'top' | 'split';
/** The type of necessity indicator */
export type NecessityIndicator = 'icon' | 'label';

/** The validation state of the field */
export type ValidationState = 'invalid' | 'valid';

/** On which event perform the validation for the field */
export type ValidateTrigger = 'onBlur' | 'onChange' | 'onSubmit';

/** Core field identity and validation props */
export interface FieldCoreProps {
  /** The unique ID of the field */
  id?: string;
  /** The id prefix for the field to avoid collisions between forms */
  idPrefix?: string;
  /** The field name */
  name?: string;
  /** The form instance */
  form?: any;
  /** Function that checks whether to perform update of the form state. */
  shouldUpdate?: boolean | ((prevValues, nextValues) => boolean);
  /** Validation rules */
  rules?: ValidationRule[];
  /** Debounce in milliseconds for validation */
  validationDelay?: number;
  /**
   * @deprecated Use `errorMessage` for error messages and `description` for field descriptions instead.
   * Message for the field. Some additional information or error notice
   */
  message?: ReactNode;
  /** Description for the field. Will be placed below the label */
  description?: ReactNode;
  /** Error message for the field. Always displayed in danger state regardless of validation state */
  errorMessage?: ReactNode;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Custom label props */
  labelProps?: Props;
}

export interface FieldBaseProps extends FormBaseProps, FieldCoreProps {
  /** The label of the field */
  label?: ReactNode;
  /** An additional content next to the label */
  extra?: ReactNode;
  necessityIndicator?: NecessityIndicator;
  necessityLabel?: ReactNode;
  labelSuffix?: ReactNode;
  /** A tooltip that is shown inside the label */
  tooltip?: ReactNode;
  /** Whether the element should receive focus on render */
  autoFocus?: boolean;
  /** Whether the field is hidden. */
  isHidden?: boolean;
  /** Whether the field is disabled. */
  isDisabled?: boolean;
  /** Whether the field is loading. */
  isLoading?: boolean;
  labelPosition?: LabelPosition;
  labelStyles?: Styles;
  /** Whether the field is inside the form. Private field. */
  insideForm?: boolean;
  fieldProps?: Props;
  fieldStyles?: Styles;
  messageStyles?: Styles;
  /** If true, the input component will be wrapped in a field wrapper even if it doesn't have a label. */
  forceField?: boolean;
}

export interface FormBaseProps {
  /** Styles of the label */
  labelStyles?: Styles;
  /** Where to place label relative to input */
  labelPosition?: LabelPosition;
  /** Whether the field presents required mark */
  requiredMark?: boolean;
  /** The type of necessity indicator */
  necessityIndicator?: NecessityIndicator;
  /** That can replace the necessity label */
  necessityLabel?: ReactNode;
  /** Whether the field is read only */
  isReadOnly?: boolean;
  /** The validation state of the field */
  validationState?: ValidationState;
  /** On which event perform validation for the field */
  validateTrigger?: ValidateTrigger;
  /** Whether to show valid state */
  showValid?: boolean;
}

export type ValidationRuleBase = { [key: string]: any } & {
  required?: boolean;
  message?: string;
};

export type ValidationRule = ValidationRuleBase & {
  validator?: (ValidationRule, any) => Promise<string | void>;
};
