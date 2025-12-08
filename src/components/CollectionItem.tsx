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

/**
 * Service props that are used by react-stately or parent components
 * and should not be passed to the Item component.
 */
const SERVICE_PROPS = new Set([
  // React Stately props
  'textValue',
  'hasChildItems',
  'childItems',
  'title',
  // Custom service props
  'onAction',
  'wrapper',
  'keywords', // CommandMenu-specific
  'forceMount', // CommandMenu-specific
]);

/**
 * Filters out service props from collection item props, returning only
 * props that should be passed to the Item component.
 *
 * This eliminates the need to manually extract and pass Item props
 * in components like MenuItem, ListBox Option, and Select Option.
 *
 * @param itemProps - The props from a collection item (node.props)
 * @returns Filtered props safe to spread onto Item component
 *
 * @example
 * ```tsx
 * const itemProps = filterCollectionItemProps(item.props);
 * return <Item {...itemProps} />;
 * ```
 */
export function filterCollectionItemProps(
  itemProps: Record<string, any> | undefined,
): Record<string, any> {
  if (!itemProps) {
    return {};
  }

  const filtered: Record<string, any> = {};

  for (const key in itemProps) {
    if (
      Object.prototype.hasOwnProperty.call(itemProps, key) &&
      !SERVICE_PROPS.has(key)
    ) {
      filtered[key] = itemProps[key];
    }
  }

  return filtered;
}

const _CollectionItem = Object.assign(
  Item as <T>(props: CubeCollectionItemProps<T>) => ReactElement,
  {
    Action: ItemAction,
    Badge: ItemBadge,
  },
);

export { _CollectionItem as CollectionItem };
