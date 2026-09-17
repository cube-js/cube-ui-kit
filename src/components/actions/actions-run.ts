/**
 * Whether `element` — the node react-aria hands an overlay's dismiss predicate
 * — sits in the actions run that belongs to `owner`, the overlay's trigger.
 *
 * A row's actions are rendered as a SIBLING of the row rather than inside it
 * (see `ItemActionsWrapper`), so an overlay whose trigger IS that row cannot
 * answer "is this press one of mine?" with `trigger.contains(element)`: the run
 * is outside the trigger element by construction. Every run marks itself with
 * `data-trigger-action` instead, and the row that owns a run is the run's
 * parent — so a run whose parent also holds the trigger is that trigger's own.
 *
 * Two things this deliberately does NOT match:
 *
 * - **Another row's run.** Every actions run in the document carries the
 *   marker, and only the trigger's own may keep an overlay open; a press on
 *   some other row's actions is an ordinary press outside, and dismisses.
 * - **A run the trigger is IN.** A menu trigger is often one of a row's actions
 *   itself — a tab's overflow menu, a row's `⋯`. The run around it is not that
 *   trigger's own actions, and the overlay's ordinary rules have to keep
 *   applying inside it: pressing the trigger again toggles the menu shut, and
 *   pressing a neighbouring action dismisses it.
 */
export function isOwnActionsPress(
  element: Element,
  owner: Element | null | undefined,
): boolean {
  if (!owner) return false;

  const run = element.closest('[data-trigger-action]');

  if (!run || run.contains(owner)) return false;

  return !!run.parentElement?.contains(owner);
}
