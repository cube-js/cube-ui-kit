import { tasty } from '@tenphi/tasty';

import { CalendarIcon } from '../../../icons';
import {
  CubeItemActionProps,
  ItemAction,
  ItemActionProvider,
} from '../../actions';

const StyledDatePickerButton = tasty(ItemAction, {
  icon: <CalendarIcon />,
});

/**
 * The calendar button every date field renders in its suffix.
 *
 * `isDisabled` is re-routed through `ItemActionProvider` instead of reaching the
 * action as a prop. Both disable it, but the provider marks the state as
 * INHERITED, and the action's default `current` type paints from the colour it
 * inherits — which a disabled field has already faded to a translucent
 * `#dark.30`. Fading that again multiplied the two down to `.12`, all but
 * invisible. Doing it here rather than at the five call sites keeps their API
 * unchanged and cannot be forgotten by the next one.
 *
 * No `type` is passed to the provider, so the `context` mod stays off and the
 * button keeps its margins.
 */
export function DatePickerButton({
  isDisabled,
  ...props
}: CubeItemActionProps) {
  return (
    <ItemActionProvider isDisabled={isDisabled}>
      <StyledDatePickerButton {...props} />
    </ItemActionProvider>
  );
}
