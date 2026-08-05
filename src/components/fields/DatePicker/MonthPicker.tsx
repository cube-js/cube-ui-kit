import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';
import { DateValue } from 'react-aria';

import { CubePeriodPickerProps, PeriodPicker } from './PeriodPicker';

export interface CubeMonthPickerProps<T extends DateValue = DateValue>
  extends Omit<CubePeriodPickerProps<T>, 'picker'> {}

function MonthPicker<T extends DateValue>(
  props: CubeMonthPickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  return <PeriodPicker ref={ref} picker="month" {...props} />;
}

const _MonthPicker = forwardRef(MonthPicker);

_MonthPicker.displayName = 'MonthPicker';

export { _MonthPicker as MonthPicker };
