import { CalendarIcon } from '../../../icons';
import { tasty } from '../../../tasty';
import { ItemAction } from '../../actions';

export const DatePickerButton = tasty(ItemAction, {
  icon: <CalendarIcon />,
});
