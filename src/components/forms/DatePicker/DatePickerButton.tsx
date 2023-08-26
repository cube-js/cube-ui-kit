import { CalendarOutlined } from '@ant-design/icons';

import { tasty } from '../../../tasty';
import { Button } from '../../actions';

export const DatePickerButton = tasty(Button, {
  icon: <CalendarOutlined />,
  styles: {
    radius: '1r right',
    border: 'top right bottom',
    backgroundClip: 'content-box',
  },
});
