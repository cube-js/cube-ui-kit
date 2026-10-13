import { ReactElement } from 'react';

import { NavigateOptions, To } from '../../../providers/navigation.types';
import { CollectionItem, CubeCollectionItemProps } from '../../CollectionItem';
import { parseTo } from '../use-action';

export interface CubeMenuItemProps<T> extends CubeCollectionItemProps<T> {
  /** Application destination. Takes precedence over href. */
  to?: To;
  navigationOptions?: NavigateOptions;
}

// Aria recognizes links by a truthy collection href; preserve the native empty URL.
export const CURRENT_DOCUMENT_LINK = Symbol('Menu.Item current document');
export const MENU_LINK_CLICK = Symbol('Menu.Item link click');

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
      const isCurrentDocument = props.to == null && props.href === '';
      const isLink =
        props.to !== '' && (props.to != null || props.href != null);

      // A private href marks links for Aria; the row resolves the actual `to`.
      return (CollectionItem as any).getCollectionNode(
        {
          ...props,
          href:
            props.to === ''
              ? undefined
              : props.to != null
                ? '.'
                : isCurrentDocument
                  ? '.'
                  : props.href,
          [CURRENT_DOCUMENT_LINK]: isCurrentDocument,
          // Selectable items also consume collection onClick; let Menu own it once.
          onClick: isLink ? undefined : props.onClick,
          [MENU_LINK_CLICK]: isLink ? props.onClick : undefined,
          target: newTab ? '_blank' : props.target,
          rel: newTab ? props.rel ?? 'noopener noreferrer' : props.rel,
        },
        context,
      );
    },
  },
);

export { _MenuCollectionItem as MenuCollectionItem };
