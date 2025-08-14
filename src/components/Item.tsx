import { ReactElement, ReactNode } from 'react';
import { Item } from 'react-stately';

import { Styles } from '../tasty';

const _Item = Item as unknown as (props: {
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
}) => ReactElement;

export { _Item as Item };
