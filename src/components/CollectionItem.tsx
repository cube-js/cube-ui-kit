import { ReactElement } from 'react';
import { Item, ItemProps } from 'react-stately';

import { ItemAction } from './actions/ItemAction';
import { CubeItemProps } from './content/Item/Item';
import { ItemBadge } from './content/ItemBadge';

export interface CubeCollectionItemProps<T>
  extends ItemProps<T>,
    Omit<CubeItemProps, 'children'> {
  onAction?: () => void;
  wrapper?: (item: ReactElement) => ReactElement;
  [key: string]: any;
}

const _CollectionItem = Object.assign(
  Item as <T>(props: CubeCollectionItemProps<T>) => ReactElement,
  {
    Action: ItemAction,
    Badge: ItemBadge,
  },
);

export { _CollectionItem as CollectionItem };
