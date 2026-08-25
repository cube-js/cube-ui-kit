import { tasty } from '@tenphi/tasty';

import { CalendarIcon } from '../../../icons/CalendarIcon';
import {
  CubeItemActionProps,
  ItemAction,
  ItemActionProvider,
} from '../../actions';

const StyledDatePickerButton = tasty(ItemAction, {
  icon: <CalendarIcon />,
});

export interface CubeDatePickerButtonProps extends CubeItemActionProps {
  /** Whether the surrounding field is read-only. Disables the button on its own. */
  isReadOnly?: boolean;
}

/**
 * The calendar button every date field renders in its suffix.
 *
 * The two reasons it can be disabled travel through different channels, and the
 * split matters because the default `current` type paints from the colour it
 * inherits:
 *
 * - A disabled FIELD goes through `ItemActionProvider`, which marks the state
 *   inherited. The field has already faded its text to a translucent `#dark.30`,
 *   so the button must NOT fade again — doing both multiplied down to `.12`, all
 *   but invisible.
 * - READ-ONLY leaves the field's text fully opaque, so nothing has faded yet and
 *   the button really is disabled on its own. It stays a prop and fades itself;
 *   routed as inherited it would render at full strength and look enabled while
 *   no longer responding.
 *
 * Handled here rather than at the five call sites so the distinction cannot be
 * dropped by the next one. No `type` is passed to the provider, so the `context`
 * mod stays off and the button keeps its margins.
 */
export function DatePickerButton({
  isDisabled,
  isReadOnly,
  ...props
}: CubeDatePickerButtonProps) {
  return (
    <ItemActionProvider isDisabled={isDisabled}>
      <StyledDatePickerButton
        {...props}
        isDisabled={isReadOnly && !isDisabled ? true : undefined}
      />
    </ItemActionProvider>
  );
}
