import { ReactNode } from 'react';

import { Styles } from '../../../tasty';

export type SpinSize = 'small' | 'default' | 'large';

export type CubeSpinProps = {
  /**
   * Size of the spin.
   * @default 'default'
   */
  size?: SpinSize;
  /**
   * Keep spinning while the flag is true, otherwise render it's children.
   * @default true
   */
  spinning?: boolean;
  children?: ReactNode;
  styles?: Styles;
};

export type SpinCubeProps = {
  position: 'top' | 'right' | 'bottom';
};

export type InternalSpinnerProps = {
  size: SpinSize;
};
