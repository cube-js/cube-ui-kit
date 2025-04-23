import { CalendarIcon } from '../../../icons';
import { tasty } from '../../../tasty';
import { Button } from '../../actions';

export const DatePickerButton = tasty(Button, {
  icon: <CalendarIcon />,
  styles: {
    radius: '1r right',
    border: 'top right bottom',
    backgroundClip: 'content-box',
  },
});
