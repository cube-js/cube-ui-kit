import { useRef } from 'react';
import { createCalendar } from '@internationalized/date';
import { DateValue, SpectrumDatePickerProps } from '@react-types/datepicker';
import { useDateField } from '@react-aria/datepicker';
import { useDateFieldState } from '@react-stately/datepicker';
import { useLocale } from '@react-aria/i18n';

import { tasty } from '../../../tasty';

import { DatePickerSegment } from './DatePickerSegment';

const DateInputElement = tasty({
  role: 'presentation',
  styles: {
    display: 'flex',
    flow: 'row',
    placeItems: 'center start',
  },
});

interface CubeDatePickerInputProps<T extends DateValue>
  extends SpectrumDatePickerProps<T> {
  hideValidationIcon?: boolean;
  maxGranularity?: SpectrumDatePickerProps<T>['granularity'];
}

export function DatePickerInput<T extends DateValue>(
  props: CubeDatePickerInputProps<T>,
) {
  let { isDisabled, isReadOnly, isRequired } = props;
  let ref = useRef(null);
  let { locale } = useLocale();
  let state = useDateFieldState({
    ...props,
    locale,
    createCalendar,
  });

  let { fieldProps } = useDateField(props, state, ref);

  return (
    <DateInputElement ref={ref} {...fieldProps}>
      {state.segments.map((segment, i) => (
        <DatePickerSegment
          key={i}
          segment={segment}
          state={state}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired}
        />
      ))}
    </DateInputElement>
  );
}
