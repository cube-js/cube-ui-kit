import { Props } from '../components/types';
import { NuStyles } from '../styles/types';
import { ReactNode } from 'react';

export type LabelPosition = 'side' | 'top';
export type NecessityIndicator = 'icon' | 'label';

/** The validation state of the field */
export type ValidationState = 'invalid' | 'valid';

/** On which event perform validation for the field */
export type ValidateTrigger = 'onBlur' | 'onChange' | 'onSubmit';

export interface FieldBaseProps {
  /** The field name */
  name: string;
  /** The label of the field */
  label?: string;
  /** The validation state of the field */
  validationState?: ValidationState;
  /** On which event perform validation for the field */
  validateTrigger?: ValidateTrigger;
}

export interface FormBaseProps {
  labelStyles?: NuStyles;
  labelPosition?: LabelPosition;
  /** Whether the field presents required mark */
  requiredMark?: boolean;
  /** Whether the field is required */
  isRequired?: boolean;
  necessityIndicator?: NecessityIndicator;
  /** Whether the field is read only */
  isReadOnly?: boolean;
  /** The validation state of the field */
  validationState?: ValidationState;
  /** On which event perform validation for the field */
  validateTrigger?: ValidateTrigger;
}

export interface FormFieldProps extends FormBaseProps {
  insideForm?: boolean;
  label?: ReactNode;
  labelProps?: Props;
  message?: ReactNode;
}

export type ValidationRuleBase = { [key: string]: any } & {
  required?: boolean;
  message?: string;
};

export type ValidationRule = ValidationRuleBase & {
  validator?: (ValidationRule, any) => Promise<string | void>;
};
