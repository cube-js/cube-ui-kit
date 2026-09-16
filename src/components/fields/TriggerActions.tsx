import { ClearPressResponder } from '@react-aria/interactions';

import { ItemActionIcon } from '../actions/ItemActionsWrapper';

import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Spread on the run's container. It marks every control in the run as belonging
 * to the trigger, which is what lets an overlay's dismiss predicate tell
 * "pressed one of this trigger's own actions" from "pressed outside" — without
 * it, running an action while the popover is open dismissed the popover and
 * swallowed the press. See `DialogTrigger`'s
 * `resolveShouldCloseOnInteractOutside` and `Select`'s `useOverlay` predicate.
 */
export const TRIGGER_ACTIONS_PROPS = {
  'data-trigger-action': '',
} as HTMLAttributes<HTMLDivElement>;

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
 */
export interface TriggerActionsProps {
  /** The caller's custom actions. They come first — leftmost in LTR. */
  actions?: ReactNode;
  /** The built-in control: spinner, clear button, or caret. */
  builtIn?: ReactNode;
}

export function TriggerActions(props: TriggerActionsProps) {
  const { actions, builtIn } = props;

  // `Picker` and `FilterPicker` open their popover through a `PressResponder`
  // that `DialogTrigger` puts in context, and that context reaches *every*
  // `usePress` below it — so without this, pressing a custom action (or the
  // built-in clear button) would also toggle the popover. `Select` drives its
  // own trigger and needs no such guard, but shares this run rather than keeping
  // a second one that differs by a wrapper with no DOM.
  return (
    <ClearPressResponder>
      {actions}
      {builtIn}
    </ClearPressResponder>
  );
}

export { ItemActionIcon as TriggerIcon };
