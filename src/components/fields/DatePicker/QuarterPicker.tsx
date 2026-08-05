import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';
import { DateValue } from 'react-aria';

import { CubePeriodPickerProps, PeriodPicker } from './PeriodPicker';

export interface CubeQuarterPickerProps<T extends DateValue = DateValue>
  extends Omit<CubePeriodPickerProps<T>, 'picker'> {}

function QuarterPicker<T extends DateValue>(
  props: CubeQuarterPickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  return <PeriodPicker ref={ref} picker="quarter" {...props} />;
}

const _QuarterPicker = forwardRef(QuarterPicker);

_QuarterPicker.displayName = 'QuarterPicker';

export { _QuarterPicker as QuarterPicker };
