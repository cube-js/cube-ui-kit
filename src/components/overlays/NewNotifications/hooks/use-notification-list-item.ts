import { useSelectableItem, SelectableItemAria } from '@react-aria/selection';

import type { Key, MutableRefObject } from 'react';
import type { ListState } from '@react-stately/list';

export type UseNotificationListItemPropsType<T extends object> = {
  key: Key;
  ref: MutableRefObject<HTMLElement | null>;
  state: ListState<T>;
};

export function useNotificationListItem<T extends object>(
  props: UseNotificationListItemPropsType<T>,
): SelectableItemAria {
  const {
    ref,
    key,
    state: { selectionManager },
  } = props;

  return useSelectableItem({ ref, key, selectionManager });
}
