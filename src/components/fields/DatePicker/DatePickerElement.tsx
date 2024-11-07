import { tasty } from '../../../tasty';
import { Space } from '../../layout/Space';

export const DatePickerElement = tasty(Space, {
  styles: {
    gap: 0,
    outline: {
      '': '#purple-03.0',
      focused: '#purple-03',
    },
    radius: true,
  },
});
