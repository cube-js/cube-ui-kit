import { ReactElement } from 'react';

import { NavigateOptions, To } from '../../../providers/navigation.types';
import { CollectionItem, CubeCollectionItemProps } from '../../CollectionItem';
import { parseTo } from '../use-action';

export interface CubeMenuItemProps<T> extends CubeCollectionItemProps<T> {
  /** Application destination. Takes precedence over href. */
  to?: To;
  navigationOptions?: NavigateOptions;
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
      const { cleanTo, newTab } = parseTo(props.to);

      // SelectionManager must recognize destinations before rendering the row.
      // Path objects stay intact; the row's navigation adapter resolves the URL.
      return (CollectionItem as any).getCollectionNode(
        {
          ...props,
          href: cleanTo ?? props.href,
          target: newTab ? '_blank' : props.target,
          rel: newTab ? props.rel ?? 'noopener noreferrer' : props.rel,
        },
        context,
      );
    },
  },
);

export { _MenuCollectionItem as MenuCollectionItem };
