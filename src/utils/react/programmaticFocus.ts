/**
 * Telling focus the user moved from focus a component moved for them.
 *
 * Handing focus back to a trigger after its overlay closes is not the same
 * event as a user tabbing onto that trigger, but the DOM cannot tell them
 * apart: `.focus()` produces an ordinary focus event, and the modality is
 * still "keyboard" from whatever the user just did, so anything keyed off
 * focus-visible treats it as a deliberate arrival. A trigger's tooltip pops up
 * unasked — and then absorbs the user's next `Escape` from its own
 * document-level listener (CUB-4839).
 *
 * Two mechanisms, because restoration reaches us two ways:
 *
 * - `focusProgrammatically` for restores WE perform. `focus()` dispatches
 *   `focus`/`focusin` synchronously, so a flag set around the call is readable
 *   by every handler that runs for it and gone immediately afterwards. Exact,
 *   with no window to tune.
 *
 * - `markFocusRestoreWindow` for restores React Aria performs. A `FocusScope`
 *   restores on unmount, from inside React's own commit, and offers no hook to
 *   wrap — so an overlay that is closing declares the window instead. Coarser
 *   on purpose: it can only make a tooltip skip one arrival that lands while
 *   an overlay is going away, which is the case it exists for.
 */
let depth = 0;
let restoreWindowEndsAt = 0;

/**
 * Focus `element` without the UI reading it as the user arriving there.
 */
export function focusProgrammatically(
  element: HTMLElement | null | undefined,
  options?: FocusOptions,
) {
  if (!element) return;

  depth++;

  try {
    element.focus(options);
  } finally {
    depth--;
  }
}

/**
 * Declare that focus is about to be restored by machinery we cannot wrap, for
 * roughly `duration` ms. Called by a closing overlay.
 */
export function markFocusRestoreWindow(duration: number) {
  restoreWindowEndsAt = Math.max(restoreWindowEndsAt, Date.now() + duration);
}

/**
 * Whether the focus being handled right now is a restoration rather than the
 * user arriving. Only meaningful inside a focus handler.
 */
export function isFocusRestoration() {
  return depth > 0 || Date.now() < restoreWindowEndsAt;
}
