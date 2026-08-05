import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';
import { DateValue } from 'react-aria';

import { CubePeriodPickerProps, PeriodPicker } from './PeriodPicker';

export interface CubeYearPickerProps<T extends DateValue = DateValue>
  extends Omit<CubePeriodPickerProps<T>, 'picker'> {}

function YearPicker<T extends DateValue>(
  props: CubeYearPickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  return <PeriodPicker ref={ref} picker="year" {...props} />;
}

const _YearPicker = forwardRef(YearPicker);

_YearPicker.displayName = 'YearPicker';

export { _YearPicker as YearPicker };
