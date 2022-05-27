import { BaseProps, ContainerStyleProps, TextStyleProps } from '../../../tasty';
import THEMES from '../../../data/themes';

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
}
