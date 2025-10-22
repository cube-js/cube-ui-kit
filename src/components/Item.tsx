import { ReactElement } from 'react';
import { Item, ItemProps } from 'react-stately';

import { ItemAction } from './actions/ItemAction';
import { CubeItemBaseProps } from './content/ItemBase/ItemBase';

export interface CubeItemProps<T>
  extends ItemProps<T>,
    Omit<CubeItemBaseProps, 'children'> {
  onAction?: () => void;
  wrapper?: (item: ReactElement) => ReactElement;
  [key: string]: any;
}

const _Item = Object.assign(
  Item as <T>(props: CubeItemProps<T>) => ReactElement,
  {
    Action: ItemAction,
  },
);

export { _Item as Item };
