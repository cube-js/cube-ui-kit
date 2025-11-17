import { FocusableRef } from '@react-types/shared';
import { forwardRef, useRef } from 'react';
import {
  AriaTimeFieldProps,
  DateValue,
  TimeValue,
  useTimeField,
} from 'react-aria';
import { useTimeFieldState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps, ValidationState } from '../../../shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
} from '../../../tasty';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';

import { DateInputBase } from './DateInputBase';
import { DatePickerSegment } from './DatePickerSegment';
import { DEFAULT_TIME_PROPS } from './props';
import { Granularity } from './types';
import { useFocusManagerRef } from './utils';

export interface CubeTimeInputProps<T extends TimeValue = TimeValue>
  extends Omit<AriaTimeFieldProps<T>, 'errorMessage'>,
    BaseProps,
    ContainerStyleProps,
    FieldBaseProps {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  validationState?: ValidationState;
  value?: TimeValue;
  /** The minimum allowed date that a user may select. */
  minValue?: TimeValue;
  /** The maximum allowed date that a user may select. */
  maxValue?: TimeValue;
  /** Callback that is called for each date of the calendar. If it returns true, then the date is unavailable. */
  isDateUnavailable?: (date: DateValue) => boolean;
  /** A placeholder date that influences the format of the placeholder shown when no value is selected. Defaults to today's date at midnight. */
  placeholderValue?: TimeValue;
  /** Whether to display the time in 12 or 24 hour format. By default, this is determined by the user's locale. */
  hourCycle?: 12 | 24;
  /** Determines the smallest unit that is displayed in the date picker. By default, this is `"day"` for dates, and `"minute"` for times. */
  granularity?: Granularity;
  /**
   * Whether to hide the time zone abbreviation.
   * @default false
   */
  hideTimeZone?: boolean;
  onChange?: (value: TimeValue) => void;
}

function TimeInput<T extends TimeValue>(
  props: CubeTimeInputProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
  });
  props = Object.assign({}, DEFAULT_TIME_PROPS, props);

  let styles = extractStyles(props, CONTAINER_STYLES);

  let {
    qa,
    inputStyles,
    wrapperStyles,
    autoFocus,
    isDisabled,
    isReadOnly,
    isRequired,
    validationState,
    size = 'medium',
  } = props;

  let domRef = useFocusManagerRef(ref);
  // let { locale } = useLocale();
  let state = useTimeFieldState({
    ...props,
    locale: 'en-US',
  });

  let fieldRef = useRef(null);
  let { labelProps, fieldProps } = useTimeField(props, state, fieldRef);

  const timeInput = (
    <DateInputBase
      ref={fieldRef}
      qa={qa || 'TimeInput'}
      inputType="timeinput"
      size={size}
      fieldProps={fieldProps}
      isDisabled={isDisabled}
      autoFocus={autoFocus}
      inputStyles={inputStyles}
      styles={wrapperStyles}
      validationState={validationState}
    >
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
    </DateInputBase>
  );

  return wrapWithField(timeInput, domRef, {
    ...props,
    styles,
    labelProps,
  });
}

/**
 * TimeFields allow users to enter and edit time values using a keyboard.
 * Each part of the time is displayed in an individually editable segment.
 */
const _TimeInput = forwardRef(TimeInput);

_TimeInput.displayName = 'TimeInput';

export { _TimeInput as TimeInput };
