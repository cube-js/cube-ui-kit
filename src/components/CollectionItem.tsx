import { ReactElement } from 'react';
import { Item, ItemProps } from 'react-stately';
import { ListCollection } from 'react-stately/private/list/ListCollection';

import { ItemAction } from './actions/ItemAction';
import { CubeItemProps } from './content/Item/Item';
import { ItemBadge } from './content/ItemBadge';

import type { LinkDOMProps, Node } from '@react-types/shared';
import type { ListState } from 'react-stately';

export interface CubeCollectionItemBaseProps<T>
  extends Omit<ItemProps<T>, keyof LinkDOMProps>,
    Omit<CubeItemProps, 'children' | keyof LinkDOMProps> {
  onAction?: () => void;
  wrapper?: (item: ReactElement) => ReactElement;
}

/** Value-selection options cannot navigate. Menu owns navigation items. */
export interface CubeCollectionItemProps<T>
  extends CubeCollectionItemBaseProps<T> {
  href?: never;
  to?: never;
  navigationOptions?: never;
  routerOptions?: never;
  hrefLang?: never;
  target?: never;
  rel?: never;
  download?: never;
  ping?: never;
  referrerPolicy?: never;
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

const NAVIGATION_PROPS = [
  'href',
  'to',
  'navigationOptions',
  'routerOptions',
  'hrefLang',
  'target',
  'rel',
  'download',
  'ping',
  'referrerPolicy',
  'data-href',
  'data-target',
  'data-rel',
  'data-download',
  'data-ping',
  'data-referrer-policy',
];

/** Keeps options as value selections even when a different item factory is used. */
export function filterSelectionItemProps(
  itemProps: Record<string, any> | undefined,
): Record<string, any> {
  const filtered = { ...itemProps };

  for (const key of NAVIGATION_PROPS) {
    delete filtered[key];
  }

  return filtered;
}

function hasNavigationItem<T>(nodes: Iterable<Node<T>>): boolean {
  for (const node of nodes) {
    if (
      node.props?.href != null ||
      node.props?.to != null ||
      node.props?.['data-href'] != null ||
      (node.type === 'section' && hasNavigationItem(node.childNodes))
    ) {
      return true;
    }
  }

  return false;
}

function selectionNodes<T>(nodes: Iterable<Node<T>>): Node<T>[] {
  return Array.from(nodes, (node) => ({
    ...node,
    props: filterSelectionItemProps(node.props),
    childNodes: selectionNodes(node.childNodes),
  }));
}

/** Bound selection semantics at the control, including foreign item factories. */
export function getValueSelectionState<S extends ListState<any>>(state: S): S {
  if (!hasNavigationItem(state.collection)) {
    return state;
  }

  // ListCollection owns its nodes, so give it copies instead of changing the input.
  const collection = new ListCollection(selectionNodes(state.collection));

  return {
    ...state,
    collection,
    selectionManager: state.selectionManager.withCollection(collection),
  };
}

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

function CollectionItem<T>(
  _props: CubeCollectionItemProps<T>,
): ReactElement | null {
  return null;
}

const _CollectionItem: typeof CollectionItem & {
  Action: typeof ItemAction;
  Badge: typeof ItemBadge;
} = Object.assign(CollectionItem, {
  Action: ItemAction,
  Badge: ItemBadge,
  getCollectionNode<T>(props: CubeCollectionItemProps<T>, context: unknown) {
    // Strip destinations before Aria builds selection state, including JS callers.
    return (Item as any).getCollectionNode(
      filterSelectionItemProps(props),
      context,
    );
  },
});

export { _CollectionItem as CollectionItem };
