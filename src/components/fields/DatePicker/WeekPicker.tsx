import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';
import { DateValue } from 'react-aria';

import { CubePeriodPickerProps, PeriodPicker } from './PeriodPicker';

export interface CubeWeekPickerProps<T extends DateValue = DateValue>
  extends Omit<CubePeriodPickerProps<T>, 'picker'> {}

function WeekPicker<T extends DateValue>(
  props: CubeWeekPickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  return <PeriodPicker ref={ref} picker="week" {...props} />;
}

const _WeekPicker = forwardRef(WeekPicker);

_WeekPicker.displayName = 'WeekPicker';

export { _WeekPicker as WeekPicker };
