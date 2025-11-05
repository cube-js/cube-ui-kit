import THEMES from '../../../data/themes';
import { BaseProps, ContainerStyleProps, TextStyleProps } from '../../../tasty';

export interface CubeAlertProps
  extends Omit<BaseProps, 'theme'>,
    ContainerStyleProps,
    TextStyleProps {
  /**
   * ***Deprecated***
   *
   * @deprecated use `theme` prop instead
   * @default note
   */
  type?: keyof typeof THEMES;
  /**
   * Changes the appearance of the Alert component
   *
   * @default note
   */
  theme?: keyof typeof THEMES;
  /**
   * Shape of the alert's border radius and border.
   * - `card` - Card shape with border radius (`1cr`) and border
   * - `sharp` - Sharp corners with no border radius or border (`0`)
   * @default "card"
   */
  shape?: 'card' | 'sharp';
}
