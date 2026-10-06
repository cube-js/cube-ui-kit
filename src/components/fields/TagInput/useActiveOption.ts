import { Key } from '@react-types/shared';
import { RefObject, useLayoutEffect, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { markKeyboardFocus } from '../ListBoxPopover/listNavigation';

import type { ListStateLike } from '../ListBoxPopover/listNavigation';

export interface ActiveOption {
  key: Key;
  /** The text it was chosen for. */
  term: string;
  /**
   * A user's own pick (arrows, a click), or focus the component placed while
   * the text changed.
   */
  source: 'auto' | 'user';
}

export interface UseActiveOptionProps {
  /** The popover list's state, once the list has mounted. */
  listStateRef: RefObject<ListStateLike | null>;
  /** The input box, which the popover is at least as wide as. */
  wrapperRef: RefObject<HTMLDivElement>;
  /** Whether the popover shows. */
  isOpen: boolean;
  /** The keys of the visible option and custom value rows, `\u0000`-joined. */
  visibleOptionsSignature: string;
  /** The typed text's own row, listed after them. */
  customTerm: string | null;
  term: string;
  /** The row the focus pass lands on when the focused one does not stay. */
  preferredOptionKey: Key | null;
}

/**
 * The option under virtual focus in the popover, mirrored in state for the
 * input's `aria-activedescendant`: the listbox's own state update does not
 * re-render the field. It is also what Enter acts on, so Enter only ever picks
 * the option a screen reader was told about.
 *
 * Also runs the pass that places it as the popover shows or its rows change,
 * which sizes the popover to the input box on the way.
 */
export function useActiveOption({
  listStateRef,
  wrapperRef,
  isOpen,
  visibleOptionsSignature,
  customTerm,
  term,
  preferredOptionKey,
}: UseActiveOptionProps) {
  const [activeOption, setActiveOption] = useState<ActiveOption | null>(null);

  const moveVirtualFocus = useEvent(
    (key: Key | null, source: 'auto' | 'user', forTerm: string) => {
      const listState = listStateRef.current;

      if (!listState || key == null) return;

      markKeyboardFocus(listState);
      listState.selectionManager.setFocusedKey(key);
      setActiveOption({ key, term: forTerm, source });
    },
  );

  // The popover is at least as wide as the input box.
  const [popoverMinWidth, setPopoverMinWidth] = useState<number>();

  const focusTermRef = useRef<string | null>(null);

  // Focus the best match when the popover opens or the text changes, and
  // whenever the focused option is filtered out, so Enter always acts on a
  // visible row. The keys come from this render's own filter: the listbox's
  // collection can lag a render behind right after the text narrows.
  useLayoutEffect(() => {
    // `aria-activedescendant` is only set while the popover shows, so a stale
    // active option needs no reset here; the next pass re-syncs it.
    if (!isOpen) {
      focusTermRef.current = null;

      return;
    }

    setPopoverMinWidth(wrapperRef.current?.offsetWidth);

    // Rebuilt from the signature: the key arrays themselves are new on every
    // render when options come from `items`. Collection keys are strings.
    const visibleKeys: Key[] = visibleOptionsSignature
      ? visibleOptionsSignature.split('\u0000')
      : [];

    if (customTerm) visibleKeys.push(customTerm);

    const isNewTerm = !!term && focusTermRef.current !== term;

    focusTermRef.current = term;

    let attempts = 0;
    let isCancelled = false;

    const tick = () => {
      if (isCancelled) return;

      const listState = listStateRef.current;

      if (!listState) {
        attempts += 1;

        if (attempts < 8) requestAnimationFrame(tick);

        return;
      }

      const focused = listState.selectionManager.focusedKey;
      const keepsFocus =
        focused != null && visibleKeys.includes(focused) && !isNewTerm;

      // Re-announced even when focus stays: after a close and reopen the list
      // still has it, but the input no longer points at it.
      if (keepsFocus) {
        setActiveOption((prev) =>
          prev?.key === focused
            ? { ...prev, term }
            : { key: focused, term, source: 'auto' },
        );
      } else {
        moveVirtualFocus(preferredOptionKey, 'auto', term);
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(tick));

    // Text typed after this pass was scheduled owns the focus now.
    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    visibleOptionsSignature,
    customTerm,
    term,
    preferredOptionKey,
    moveVirtualFocus,
    wrapperRef,
  ]);

  return { activeOption, setActiveOption, moveVirtualFocus, popoverMinWidth };
}
