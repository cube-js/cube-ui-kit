import { Styles } from '@tenphi/tasty';
import { AriaSliderProps } from 'react-aria';

import { FieldBaseProps } from '../../../shared/form';
import { FieldLayoutStyleProps } from '../../form/field-layout';

import type { ComponentBasePropsWithoutChildren } from '../../../utils/react/componentBaseProps';

export interface CubeSliderBaseProps<T>
  extends
    Omit<AriaSliderProps<T>, 'label' | 'form' | 'name'>,
    ComponentBasePropsWithoutChildren,
    FieldLayoutStyleProps,
    FieldBaseProps<T | null | undefined> {
  inputStyles?: Styles;
  gradation?: string[];
  // onChange?: (range: T) => void;
  // onChangeEnd?: (range: T) => void;
  /**
   * The display format of the value label.
   */
  formatOptions?: Intl.NumberFormatOptions;
  /** Whether the value's label is displayed. True by default if there's a `label`, false by default if not. */
  showValueLabel?: boolean;
  /** A function that returns the content to display as the value's label. Overrides default formatted number. */
  getValueLabel?: (value: T) => string;
}

export type { AriaSliderProps };
