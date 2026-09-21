/**
 * Moving focus as bookkeeping, rather than as the user arriving somewhere.
 *
 * Handing focus back to a trigger after its popup closes is not the same event
 * as a user tabbing onto that trigger, but the DOM cannot tell them apart:
 * `.focus()` produces an ordinary focus event, and because the modality is
 * still "keyboard" from whatever the user just did, anything keyed off
 * focus-visible treats it as a deliberate arrival. A trigger's tooltip would
 * pop up unasked — and then absorb the next `Escape` from its own
 * document-level listener (CUB-4839).
 *
 * `focus()` dispatches `focus`/`focusin` SYNCHRONOUSLY, so a flag set around
 * the call is reliably readable by every handler that runs for it and is gone
 * immediately afterwards. That is what makes this safe where a timing window
 * would not be.
 */
let depth = 0;

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
 * Whether the focus event being handled right now came from
 * `focusProgrammatically`. Only meaningful inside a focus handler.
 */
export function isProgrammaticFocus() {
  return depth > 0;
}
