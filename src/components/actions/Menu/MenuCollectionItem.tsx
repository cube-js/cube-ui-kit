import { ReactElement } from 'react';
import { Item } from 'react-stately';

import { normalizeNavigationUrl } from '../../../providers/navigation-url';
import { NavigateOptions, To } from '../../../providers/navigation.types';
import {
  COLLECTION_ITEM_CLICK,
  CollectionItem,
  CubeCollectionItemBaseProps,
} from '../../CollectionItem';
import { parseTo } from '../use-action';

import type { Key, LinkDOMProps } from '@react-types/shared';

export interface CubeMenuItemProps<T>
  extends CubeCollectionItemBaseProps<T>, LinkDOMProps {
  /** Application destination. Takes precedence over href. */
  to?: To;
  navigationOptions?: NavigateOptions;
  [key: string]: any;
}

// Aria recognizes links by a truthy collection href; preserve the native empty URL.
export const CURRENT_DOCUMENT_LINK = Symbol('Menu.Item current document');

export function getMenuItemReactKey(key: Key): string {
  return `${typeof key}:${String(key)}`;
}

function MenuCollectionItem<T>(
  _props: CubeMenuItemProps<T>,
): ReactElement | null {
  return null;
}

const _MenuCollectionItem: typeof MenuCollectionItem &
  Pick<typeof CollectionItem, 'Action' | 'Badge'> = Object.assign(
  MenuCollectionItem,
  {
    Action: CollectionItem.Action,
    Badge: CollectionItem.Badge,
    getCollectionNode<T>(props: CubeMenuItemProps<T>, context: unknown) {
      const { newTab } = parseTo(props.to);
      // A blank destination counts as an empty one, as the URL parser reads it.
      const to =
        typeof props.to === 'string'
          ? normalizeNavigationUrl(props.to)
          : props.to;
      const href =
        typeof props.href === 'string'
          ? normalizeNavigationUrl(props.href)
          : props.href;
      const isCurrentDocument = to == null && href === '';
      const isLink = to !== '' && (to != null || href != null);

      // A private href marks links for Aria; the row resolves the actual `to`.
      return (Item as any).getCollectionNode(
        {
          ...props,
          isDisabled: props.isDisabled ?? (props.isLoading ? true : undefined),
          href:
            to === ''
              ? undefined
              : to != null
                ? '.'
                : isCurrentDocument
                  ? '.'
                  : href,
          [CURRENT_DOCUMENT_LINK]: isCurrentDocument,
          // Selectable items also consume collection onClick; let Menu own it once.
          onClick: isLink ? undefined : props.onClick,
          [COLLECTION_ITEM_CLICK]: isLink ? props.onClick : undefined,
          target: newTab ? '_blank' : props.target,
          rel: newTab ? (props.rel ?? 'noopener noreferrer') : props.rel,
        },
        context,
      );
    },
  },
);

export { _MenuCollectionItem as MenuCollectionItem };
