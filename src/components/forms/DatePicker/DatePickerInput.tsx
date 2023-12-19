import { useRef } from 'react';
import { createCalendar } from '@internationalized/date';
import { DateValue, SpectrumDatePickerProps } from '@react-types/datepicker';
import { useDateField, useFocusWithin, useLocale } from 'react-aria';
import { DateSegment, useDateFieldState } from 'react-stately';

import { tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';

import { DatePickerSegment } from './DatePickerSegment';
import { formatSegments } from './utils';

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
  useLocale?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function DatePickerInput<T extends DateValue>(
  props: CubeDatePickerInputProps<T>,
) {
  let { isDisabled, isReadOnly, isRequired, useLocale: useLocaleProp } = props;
  let ref = useRef(null);
  let { locale } = useLocale();
  let state = useDateFieldState({
    ...props,
    locale,
    createCalendar,
  });

  if (!useLocaleProp) {
    state.segments = formatSegments(state.segments);
  }

  const focusWithinProps = useFocusWithin({
    onFocusWithinChange: (isFocused) => {
      if (isFocused) {
        props.onFocus?.();
      } else {
        props.onBlur?.();
      }
    },
  });

  let { fieldProps } = useDateField(props, state, ref);

  return (
    <DateInputElement ref={ref} {...mergeProps(fieldProps, focusWithinProps)}>
      {state.segments.map((segment: DateSegment, i: number) => (
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
