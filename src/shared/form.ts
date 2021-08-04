import { ChildrenProp, Props } from '../components/types';
import { NuStyles } from '../styles/types';
import { LabelPosition, NecessityIndicator } from './labelable';

export type ValidationState = 'invalid' | 'valid';

export interface FormFieldProps {
  insideForm?: boolean;
  label?: string | ChildrenProp;
  labelProps?: Props;
  labelStyles?: NuStyles;
  labelPosition?: LabelPosition;
  message?: string | ChildrenProp;
  requiredMark?: boolean;
  isRequired?: boolean;
  necessityIndicator?: NecessityIndicator;
  validationState?: ValidationState;
}
