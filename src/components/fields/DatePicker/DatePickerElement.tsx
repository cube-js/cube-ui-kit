import { tasty } from '@tenphi/tasty';

import { Space } from '../../layout/Space';

export const DatePickerElement = tasty(Space, {
  styles: {
    // Too narrow for one row, the end date wraps under the start date, and the
    // picker is never narrower than its widest row.
    flow: 'row wrap',
    gap: '.5x 0',
    width: 'min min-content',
    outline: {
      '': '#purple-03.0',
      focused: '#purple-03',
    },
    radius: true,
  },
});
