import { ClearPressResponder } from '@react-aria/interactions';
import { tasty } from '@tenphi/tasty';

import { ItemActionProvider } from '../actions/ItemActionContext';

import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';

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
    gap: '1bw',
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
        {...STOP_PROPAGATION_HANDLERS}
      >
        <ItemActionProvider type={type} theme={theme} isDisabled={isDisabled}>
          {children}
        </ItemActionProvider>
      </TriggerActionsElement>
    </ClearPressResponder>
  );
}
