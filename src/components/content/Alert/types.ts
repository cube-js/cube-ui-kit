import { BaseProps, ContainerStyleProps, TextStyleProps } from '@tenphi/tasty';

import THEMES from '../../../data/themes';

export interface CubeAlertProps
  extends Omit<BaseProps, 'theme'>, ContainerStyleProps, TextStyleProps {
  /**
   * ***Deprecated***
   *
   * @deprecated use `theme` prop instead
   * @default note
   */
  type?: keyof typeof THEMES;
  /**
   * Changes the appearance of the Alert component. `neutral` is a gray card
   * with the regular text color, for a note that carries no status
   *
   * @default note
   */
  theme?: keyof typeof THEMES | 'neutral';
  /**
   * `small` sets `t4` text and `1x` padding, for an alert in a dense panel
   *
   * @default medium
   */
  size?: 'small' | 'medium';
  /**
   * Shape of the alert's border radius and border.
   * - `card` - Card shape with border radius (`1cr`) and border
   * - `sharp` - Sharp corners with no border radius or border (`0`)
   * @default "card"
   */
  shape?: 'card' | 'sharp';
  /**
   * Makes the alert the `alert` query container (`container: alert / inline-size`),
   * so its content can respond to its width: `@(alert, w < 400px)`, or
   * `collapseState` on a `Button`. Set it only on an alert whose width comes
   * from outside: a container ignores its content's width, so an alert sized
   * by its content shrinks to its padding.
   */
  isQueryContainer?: boolean;
}
