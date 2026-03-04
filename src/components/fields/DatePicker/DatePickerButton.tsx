import { tasty } from '@tenphi/tasty';

import { CalendarIcon } from '../../../icons';
import { ItemAction } from '../../actions';

export const DatePickerButton = tasty(ItemAction, {
  icon: <CalendarIcon />,
});
