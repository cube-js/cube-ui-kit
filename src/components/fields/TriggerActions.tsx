import { ClearPressResponder } from '@react-aria/interactions';
import { tasty } from '@tenphi/tasty';

import { ItemActionProvider } from '../actions/ItemActionContext';

import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';

/*
 * Why this file exists rather than `ItemButton`'s `actions` slot, which is the
 * kit's purpose-built home for exactly this: that slot renders its run as an
 * absolutely positioned SIBLING of the button, so a row action cannot activate
 * the row. A picker's built-ins have to be rightmost, so putting custom actions
 * to their left means the caret joins that run — and a caret outside the button
 * stops opening the popover, `pointer-events: none` included (the hit just
 * lands on the actions container, which is outside the button too). `Select` is
 * a second blocker: it builds its trigger from `Item as="button"`, not
 * `ItemButton`.
 *
 * Migrating the three triggers properly is tracked in
 * https://github.com/cube-js/cube-ui-kit/issues/1398, which carries the
 * measurements — a migrated `Picker` is pixel-identical to this one — and the
 * `Item` changes it needs. Until then the run is built here.
 */

/**
 * `Item`'s own `Actions` slot stops these so a press on an action never reaches
 * the row behind it. The custom actions of a picker trigger sit in the `suffix`
 * slot instead — left of the built-in clear button and caret, which live in
 * `rightIcon` — so they have to repeat the guard themselves. See
 * `ACTIONS_EVENT_HANDLERS` in `Item`.
 */
const STOP_PROPAGATION_HANDLERS = {
  onClick: (e: MouseEvent) => e.stopPropagation(),
  onPointerDown: (e: PointerEvent) => e.stopPropagation(),
  onPointerUp: (e: PointerEvent) => e.stopPropagation(),
  onMouseDown: (e: MouseEvent) => e.stopPropagation(),
  onMouseUp: (e: MouseEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
    }
  },
};

const TriggerActionsElement = tasty({
  qa: 'TriggerActions',
  styles: {
    display: 'grid',
    flow: 'column',
    placeItems: 'center',
    placeContent: 'center',
    // What separates two adjacent actions everywhere else in the kit — see
    // `ItemButton`'s `ActionsWrapper` and `Item`'s own `Actions` slot.
    gap: '1bw',

    // The built-in clear button / caret is NOT a sibling in this run: it lives
    // in the `RightIcon` slot, a `($size - 2bw)` square that centres a
    // `$action-size` control and so already puts `$side-padding` to its left.
    // Left alone that reads as a much wider gap before the built-in than
    // between two custom actions (`.5x` vs `1bw` at `medium`). Pull the run
    // right by the difference so the whole trailing cluster is evenly spaced,
    // and `$side-padding` survives only where it belongs — at the outer edge,
    // between the built-in and the trigger's border.
    //
    // This assumes the `RightIcon` slot is occupied, which it is for every
    // trigger state (loading, clear, caret). A caller who empties it with
    // `rightIcon={null}` gets the run sitting `$side-padding - 1bw` closer to
    // the border, inside the padding `Suffix` regains when `has-right-icon`
    // goes away.
    margin: '0 (1bw - $side-padding) 0 0',

    // `$size` is inherited from the trigger; these two are re-derived from it
    // the same way `Item`'s `Actions` slot does, because `ItemAction` defines
    // them on itself and a parent cannot read a child's custom property.
    '$action-size': 'min(max((2x + 2bw), ($size - 1x - 2bw)), (3x - 2bw))',
    '$side-padding': '(($size - $action-size - 2bw) / 2)',
  },
});

export interface TriggerActionsProps {
  /** The actions to render. */
  children: ReactNode;
  /** The `type` the host trigger is painted with. */
  type?: string;
  /**
   * The theme the host trigger is PAINTED with, which is not always its `theme`
   * prop — a validation state overrides it. Actions default to the `current`
   * theme and read this only to know which surface they sit on.
   */
  theme?: string;
  /** Whether the host trigger is disabled (or loading, which reads as disabled). */
  isDisabled?: boolean;
}

/**
 * Custom actions rendered inside a `Select` / `Picker` / `FilterPicker` trigger,
 * to the left of the built-in clear button and dropdown caret.
 *
 * `ClearPressResponder` is the point of this wrapper. These triggers open their
 * popover through a `PressResponder` that `DialogTrigger` puts in context, and
 * that context reaches *every* `usePress` below it — so without this, pressing a
 * custom action (or the built-in clear button) would also toggle the popover.
 */
export function TriggerActions(props: TriggerActionsProps) {
  const { children, type, theme, isDisabled } = props;

  return (
    <ClearPressResponder>
      <TriggerActionsElement
        data-element="TriggerActions"
        data-trigger-action=""
        {...STOP_PROPAGATION_HANDLERS}
      >
        <ItemActionProvider type={type} theme={theme} isDisabled={isDisabled}>
          {children}
        </ItemActionProvider>
      </TriggerActionsElement>
    </ClearPressResponder>
  );
}
