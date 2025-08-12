import { ReactElement, ReactNode } from 'react';
import { Item } from 'react-stately';

import { Styles } from '../tasty';

const _Item = Item as unknown as (props: {
  description?: ReactNode;
  icon?: ReactElement;
  prefix?: ReactNode;
  suffix?: ReactNode;
  rightIcon?: ReactElement;
  styles?: Styles;
  onAction?: () => void;
  wrapper?: (item: ReactElement) => ReactElement;
  [key: string]: any;
}) => ReactElement;

export { _Item as Item };
