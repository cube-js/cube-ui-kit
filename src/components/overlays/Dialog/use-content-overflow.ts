import { RefObject, useState } from 'react';

import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';

// Same slack as `useTinyScrollbar`: sub-pixel rounding can leave a body that
// fits reporting a `scrollHeight` a pixel or two over its `clientHeight`.
const OVERFLOW_THRESHOLD = 2;

// The body is the `Content` the dialog itself lays out: a direct child, or the
// direct child of a direct-child `<form>` (a `Form` placed there lays itself
// out as the dialog's column; see `FormElement`). Those are the two shapes in
// which `Content` is the thing that scrolls. A `Content` nested anywhere else is
// part of the body, not the body.
const BODY_SELECTOR =
  ':scope > [data-id="Content"], :scope > form > [data-id="Content"]';

/**
 * Whether the dialog's body is taller than the room it has, i.e. whether it
 * scrolls. The footer draws its top line on this (see `Dialog`).
 *
 * The body's own box is not enough to watch. Once the dialog reaches its max
 * height the box stops growing, and in a fixed-height dialog (`fullscreen`,
 * `panel`) it never changes at all — there, content growing past the fold is
 * visible only on the body's children. So both the body and its children are
 * observed, and the set is re-synced whenever the body or its child list is
 * replaced.
 */
export function useContentOverflow(dialogRef: RefObject<HTMLElement | null>) {
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || typeof ResizeObserver === 'undefined') return;

    let body: HTMLElement | null = null;

    const measure = () => {
      setOverflows(
        !!body && body.scrollHeight > body.clientHeight + OVERFLOW_THRESHOLD,
      );
    };

    const resizeObserver = new ResizeObserver(measure);

    // Only the child lists of the dialog, a direct-child form and the body can
    // move the body or change which children to watch, so those three are all
    // it observes — never the subtree. A picker's popover is a dialog too, and
    // a virtualized list scrolling inside it mutates on every frame. Deeper
    // mutations that matter resize a child, which the resize observer sees.
    const mutationObserver = new MutationObserver(() => sync());

    const sync = () => {
      body = dialog.querySelector<HTMLElement>(BODY_SELECTOR);

      mutationObserver.disconnect();
      resizeObserver.disconnect();

      mutationObserver.observe(dialog, { childList: true });

      for (const form of Array.from(dialog.querySelectorAll(':scope > form'))) {
        mutationObserver.observe(form, { childList: true });
      }

      if (body) {
        mutationObserver.observe(body, { childList: true });
        resizeObserver.observe(body);

        for (const child of Array.from(body.children)) {
          resizeObserver.observe(child);
        }
      }

      measure();
    };

    sync();

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [dialogRef]);

  return overflows;
}
