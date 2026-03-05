import { ForwardedRef, forwardRef, ReactNode } from 'react';

import { ItemAction } from '../../actions/ItemAction';
import { CubeItemProps, Item } from '../Item/Item';

export interface CubeItemCardProps
  extends Omit<CubeItemProps, 'type' | 'children' | 'description'> {
  /** Card heading, mapped to Item's `children`. */
  title?: ReactNode;
  /** Card body content, mapped to Item's `description`. */
  children?: ReactNode;
}

const _ItemCard = forwardRef(function ItemCard(
  { title, children, ...props }: CubeItemCardProps,
  ref: ForwardedRef<HTMLElement>,
) {
  return (
    <Item ref={ref} {...props} type="card" description={children}>
      {title}
    </Item>
  );
});

const ItemCard = Object.assign(_ItemCard, {
  Action: ItemAction,
});

export { ItemCard };
