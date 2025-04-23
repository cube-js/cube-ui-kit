import { ReactElement, ReactNode } from 'react';

import {
  LabelPosition,
  NecessityIndicator,
  ValidationState,
} from '../../../shared/index';
import { Props, Styles } from '../../../tasty/index';
import { CubeLabelProps } from '../Label';

// ADDING NEW PROPS TO THIS INTERFACE REQUIRES ADDING THEM TO createFieldWrapperPropsKeys FUNCTION

export type CubeFieldWrapperProps = {
  as?: string;
  validationState?: ValidationState;
  styles?: Styles;
  /** Whether the input is required */
  isRequired?: boolean;
  /** Whether the input is disabled */
  isDisabled?: boolean;
  fieldProps?: Props;
  isHidden?: boolean;

  label?: ReactNode;
  labelPosition?: LabelPosition;
  labelSuffix?: ReactNode;
  labelStyles?: Styles;
  labelProps?: CubeLabelProps;
  /** The description for the field. It will be placed below the label */
  description?: ReactNode;
   
  requiredMark?: boolean;
  tooltip?: ReactNode;
  extra?: ReactNode;
  necessityLabel?: ReactNode;
  necessityIndicator?: NecessityIndicator;

  /** Custom message for the field. It will be placed below the label and the input */
  message?: string | ReactNode;
  /** Styles for the message */
  messageStyles?: Styles;

  Component?: ReactElement;
  /** Custom components that should go outside the field and should not be visible by default. For example: Dialogs */
  children?: ReactNode;
};
