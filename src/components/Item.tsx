import { ReactElement } from 'react';
import { Item, ItemProps } from 'react-stately';

import { CubeItemBaseProps } from './content/ItemBase/ItemBase';

export interface CubeItemProps<T>
  extends ItemProps<T>,
    Omit<CubeItemBaseProps, 'children'> {
  onAction?: () => void;
  wrapper?: (item: ReactElement) => ReactElement;
  [key: string]: any;
}

const _Item = Item as <T>(props: CubeItemProps<T>) => ReactElement;

export { _Item as Item };
