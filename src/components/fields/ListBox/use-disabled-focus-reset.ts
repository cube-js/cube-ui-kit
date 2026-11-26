import { useEffect, useRef } from 'react';

import { isItemDisabled } from '../../shared/disabled-behavior';

import type { Key } from '@react-types/shared';
import type { ListState } from 'react-stately';

/**
 * Keeps the highlight off a disabled option when the collection drops the
 * highlighted one, as a filter narrowing does.
 *
 * React Stately then moves the highlight to the next option, but under
 * `disabledBehavior: 'selection'` its check (`selectionManager.isDisabled`)
 * no longer sees a disabled one, so it can land there, where Enter does
 * nothing. This runs after it (call it after `useListState`) and moves the
 * highlight on to the next option the user can pick, or clears it. A field
 * that picks the highlight itself before then, as most do in a layout effect,
 * leaves nothing to correct.
 */
export function useDisabledFocusReset<T>(state: ListState<T>) {
  const { collection, selectionManager, disabledKeys } = state;
  const lastRef = useRef({
    collection,
    focusedKey: selectionManager.focusedKey,
  });

  useEffect(() => {
    const last = lastRef.current;
    const { focusedKey } = selectionManager;

    lastRef.current = { collection, focusedKey };

    const isUsable = (key: Key) =>
      collection.getItem(key)?.type === 'item' &&
      !isItemDisabled({ collection, disabledKeys }, key);

    if (
      last.collection === collection ||
      last.focusedKey == null ||
      collection.getItem(last.focusedKey) != null ||
      focusedKey == null ||
      isUsable(focusedKey)
    ) {
      return;
    }

    let next: Key | null = null;

    for (
      let key = last.collection.getKeyAfter(last.focusedKey);
      key != null && next == null;
      key = last.collection.getKeyAfter(key)
    ) {
      if (isUsable(key)) next = key;
    }

    for (
      let key = last.collection.getKeyBefore(last.focusedKey);
      key != null && next == null;
      key = last.collection.getKeyBefore(key)
    ) {
      if (isUsable(key)) next = key;
    }

    selectionManager.setFocusedKey(next);
    lastRef.current = { collection, focusedKey: next };
  });
}
