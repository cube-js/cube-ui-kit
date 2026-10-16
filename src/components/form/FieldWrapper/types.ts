import { Styles } from '@tenphi/tasty';
import { ReactElement, ReactNode } from 'react';

import {
  LabelPosition,
  NecessityIndicator,
  ValidationProps,
} from '../../../shared/index';
import { CubeLabelProps } from '../Label';

import type { Props } from '../../../props';

export type CubeFieldWrapperProps = ValidationProps & {
  as?: keyof HTMLElementTagNameMap;
  styles?: Styles;
  /** Whether the input is required */
  isRequired?: boolean;
  /** Whether the input is optional. Marks the label with an `(optional)` note. */
  isOptional?: boolean;
  /** Whether the input is disabled */
  isDisabled?: boolean;
  fieldProps?: Props;
  isHidden?: boolean;
  /** Omit field layout and text slots while preserving the accessible label. */
  isBare?: boolean;

  label?: ReactNode;
  labelPosition?: LabelPosition;
  labelSuffix?: ReactNode;
  labelStyles?: Styles;
  labelProps?: CubeLabelProps;
  /** The description for the field. It will be placed below the label */
  description?: ReactNode;

  requiredMark?: boolean;
  labelTooltip?: ReactNode;
  extra?: ReactNode;
  necessityIndicator?: NecessityIndicator | null;

  /**
   * @deprecated Use `errorMessage` for error messages and `description` for field descriptions instead.
   * Fallback text used only when errorMessage is undefined.
   */
  message?: string | ReactNode;
  /** Styles for the message */
  messageStyles?: Styles;

  /** Error text. Explicit empty content suppresses the message fallback. */
  errorMessage?: string | ReactNode;

  Component?: ReactElement;
  /**
   * @internal The id of the control in `Component`, which its description and
   * message ids derive from. Set by `wrapWithField`.
   */
  controlId?: string;
  /** Custom components that should go outside the field and should not be visible by default. For example: Dialogs */
  children?: ReactNode;
};
