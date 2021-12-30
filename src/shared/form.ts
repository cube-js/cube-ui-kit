import { Props } from '../components/types';
import { Styles } from '../styles/types';
import { ReactNode } from 'react';

/** Where to place label relative to input */
export type LabelPosition = 'side' | 'top';
/** The type of necessity indicator */
export type NecessityIndicator = 'icon' | 'label';

/** The validation state of the field */
export type ValidationState = 'invalid' | 'valid';

/** On which event perform validation for the field */
export type ValidateTrigger = 'onBlur' | 'onChange' | 'onSubmit';

export interface OptionalFieldBaseProps {
  /** The label of the field */
  label?: string;
  /** The validation state of the field */
  validationState?: ValidationState;
  /** On which event perform validation for the field */
  validateTrigger?: ValidateTrigger;
  necessityIndicator?: NecessityIndicator;
  necessityLabel?: ReactNode;
}

export interface FieldBaseProps extends OptionalFieldBaseProps {
  /** The field name */
  name: string[] | string;
}

export interface FormBaseProps {
  /** Styles of the label */
  labelStyles?: Styles;
  /** Where to place label relative to input */
  labelPosition?: LabelPosition;
  /** Whether the field presents required mark */
  requiredMark?: boolean;
  /** Whether the field is required */
  isRequired?: boolean;
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
}

export interface FormFieldProps extends FormBaseProps {
  /** Whether the field is inside the form. Private field. */
  insideForm?: boolean;
  /** A text label of the field */
  label?: ReactNode;
  /** Custom label props */
  labelProps?: Props;
  /** Message for the field. Some additional information or error notice. */
  message?: ReactNode;
  /** A tooltip that is shown inside the label */
  tooltip?: ReactNode;
  /** Whether the element should receive focus on render. */
  autoFocus?: boolean;
}

export type ValidationRuleBase = { [key: string]: any } & {
  required?: boolean;
  message?: string;
};

export type ValidationRule = ValidationRuleBase & {
  validator?: (ValidationRule, any) => Promise<string | void>;
};
