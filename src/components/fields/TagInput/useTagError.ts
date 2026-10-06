import { useEffect, useRef, useState } from 'react';

import { useEvent } from '../../../_internal';

export interface TagError {
  /** New for every rejection, so a repeated one is announced again. */
  id: number;
  text: string;
}

/**
 * The message a refused entry shows in place of the field's own, and when it
 * goes away: at once, or after the press that took focus away.
 */
export function useTagError() {
  const [tagError, setTagErrorState] = useState<TagError | null>(null);
  // Only ever grows: a clear and a new rejection can land in one batch.
  const tagErrorIdRef = useRef(0);
  const setTagError = useEvent((text: string | null) => {
    if (text == null) {
      setTagErrorState(null);

      return;
    }

    tagErrorIdRef.current += 1;
    setTagErrorState({ id: tagErrorIdRef.current, text });
  });

  // Clearing a message moves what is below the field up by its line. When a
  // press took focus away, that waits for the press to end, or the control
  // pressed would move out from under the pointer and miss it.
  const pendingClearRef = useRef<(() => void) | null>(null);

  const cancelPendingClear = () => {
    pendingClearRef.current?.();
    pendingClearRef.current = null;
  };

  const clearTagErrorAfterPress = () => {
    cancelPendingClear();

    let timer: ReturnType<typeof setTimeout> | undefined;
    // A task after mouseup, so after the click the browser sends with it.
    const handleMouseUp = () => {
      timer = setTimeout(() => {
        pendingClearRef.current = null;
        setTagError(null);
      }, 0);
    };

    document.addEventListener('mouseup', handleMouseUp, {
      capture: true,
      once: true,
    });
    pendingClearRef.current = () => {
      document.removeEventListener('mouseup', handleMouseUp, true);
      clearTimeout(timer);
    };
  };

  useEffect(() => () => pendingClearRef.current?.(), []);

  return { tagError, setTagError, clearTagErrorAfterPress, cancelPendingClear };
}
