import { ForwardedRef, forwardRef, ReactNode } from 'react';

import { mergeStyleLayers } from '../../../utils/styles';
import { ItemAction } from '../../actions/ItemAction/ItemAction';
import { CubeItemProps, Item } from '../Item/Item';

export interface CubeItemCardProps
  extends Omit<CubeItemProps, 'type' | 'children' | 'description'> {
  /** Card heading, mapped to Item's `children`. */
  title?: ReactNode;
  /** Card body content, mapped to Item's `description`. */
  children?: ReactNode;
}

const DEFAULT_STYLES = {
  fill: { 'theme=default': '#surface' },
  border: { 'theme=default': '#border' },
};

const _ItemCard = forwardRef(function ItemCard(
  { title, children, ...props }: CubeItemCardProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const styles = mergeStyleLayers(
    props.variant ? undefined : DEFAULT_STYLES,
    props.styles,
  );

  return (
    <Item
      ref={ref}
      {...props}
      styles={styles}
      type="card"
      description={children}
    >
      {title}
    </Item>
  );
});

const ItemCard = Object.assign(_ItemCard, {
  Action: ItemAction,
});

export { ItemCard };
