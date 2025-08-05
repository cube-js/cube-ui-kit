import { createCalendar } from '@internationalized/date';
import { useRef } from 'react';
import {
  AriaDatePickerProps,
  DateValue,
  useDateField,
  useFocusWithin,
  useLocale,
} from 'react-aria';
import { DateSegment, useDateFieldState } from 'react-stately';

import { tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';

import { DatePickerSegment } from './DatePickerSegment';
import { DateFieldBase, Granularity } from './types';
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
  extends Omit<AriaDatePickerProps<T>, 'errorMessage'>,
    DateFieldBase<T> {
  hideValidationIcon?: boolean;
  maxGranularity?: Granularity;
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
    locale: useLocaleProp ? locale : 'en-US',
    createCalendar,
  });

  if (useLocaleProp == null) {
    state.segments = formatSegments(state.segments);
  }

  const { focusWithinProps } = useFocusWithin({
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
