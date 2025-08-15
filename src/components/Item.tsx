import { ReactElement, ReactNode } from 'react';
import { Item, ItemProps } from 'react-stately';

import { Styles } from '../tasty';

export interface CubeItemProps<T> extends ItemProps<T> {
  qa?: string;
  description?: ReactNode;
  descriptionPlacement?: 'inline' | 'block' | 'auto';
  icon?: ReactNode | 'checkbox';
  prefix?: ReactNode;
  suffix?: ReactNode;
  rightIcon?: ReactNode;
  styles?: Styles;
  onAction?: () => void;
  wrapper?: (item: ReactElement) => ReactElement;
  [key: string]: any;
}

const _Item = Item as unknown as <T>(props: CubeItemProps<T>) => ReactElement;

export { _Item as Item };
