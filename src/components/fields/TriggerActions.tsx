import { ItemActionIcon } from '../actions/ItemActionsWrapper';

import type { ReactNode } from 'react';

/**
 * The trailing run of a `Select` / `Picker` / `FilterPicker` trigger: the
 * caller's custom `actions`, then the built-in control — a loading spinner, the
 * clear button, or the dropdown caret.
 *
 * It renders into `ItemActionsWrapper`'s run, which lies over the trigger's
 * trailing end as a SIBLING of the `<button>` rather than inside it. That is
 * what keeps the clear button from being a `<button>` nested in a `<button>`,
 * and it is why the caret is an `ItemActionIcon`: the run is transparent to the
 * pointer except where a child opts in, so a press on the caret lands on the
 * trigger underneath and opens the popover exactly as it did when the caret
 * lived in the `rightIcon` slot.
 *
 * The run isolates its children's presses from the trigger and identifies them
 * to the overlay as the trigger's own — both in `ItemActionsWrapper`, so every
 * row that has actions gets them and not only these three.
 */
export interface TriggerActionsProps {
  /** The caller's custom actions. They come first — leftmost in LTR. */
  actions?: ReactNode;
  /** The built-in control: spinner, clear button, or caret. */
  builtIn?: ReactNode;
}

export function TriggerActions(props: TriggerActionsProps) {
  const { actions, builtIn } = props;

  return (
    <>
      {actions}
      {builtIn}
    </>
  );
}

export { ItemActionIcon as TriggerIcon };
