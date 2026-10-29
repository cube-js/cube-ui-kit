import { FocusableRef } from '@react-types/shared';
import { BaseProps, Styles } from '@tenphi/tasty';
import { forwardRef, useRef } from 'react';
import {
  AriaTimeFieldProps,
  DateValue,
  TimeValue,
  useTimeField,
} from 'react-aria';
import { useTimeFieldState } from 'react-stately';

import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFieldProps, wrapWithField } from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';

import { DateInputBase } from './DateInputBase';
import { DatePickerSegment } from './DatePickerSegment';
import { DEFAULT_TIME_PROPS } from './props';
import { Granularity } from './types';
import { useFocusManagerRef } from './utils';

export interface CubeTimeInputProps<T extends TimeValue = TimeValue>
  extends
    Omit<
      AriaTimeFieldProps<TimeValue>,
      'errorMessage' | 'form' | 'name' | 'value' | 'onChange' | 'granularity'
    >,
    BaseProps,
    FieldLayoutStyleProps,
    FieldBaseProps<TimeValue | null | undefined> {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  value?: TimeValue | null;
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
  rawProps: CubeTimeInputProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  let props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onBlur',
  });
  props = Object.assign({}, DEFAULT_TIME_PROPS, props);

  // `wrapperStyles` styles the same box as `styles` and wins over it.
  const { styles, field } = splitFieldLayout(props, {
    overStyles: props.wrapperStyles,
  });

  let {
    qa,
    inputStyles,
    autoFocus,
    isDisabled,
    isReadOnly,
    isRequired,
    isInvalid,
    isValid,
    size = 'medium',
    labelProps: userLabelProps,
  } = props;

  let domRef = useRef<HTMLDivElement>(null);

  useFocusManagerRef(ref, domRef);
  let timeProps = {
    ...props,
    granularity: props.granularity === 'day' ? undefined : props.granularity,
    // Aria clears with null; retain the kit's legacy nonnullable callback
    // declaration while forwarding exactly the same values as before.
    onChange: props.onChange as AriaTimeFieldProps<TimeValue>['onChange'],
  };
  let state = useTimeFieldState({ ...timeProps, locale: 'en-US' });

  let fieldRef = useRef(null);
  let { labelProps, fieldProps } = useTimeField(timeProps, state, fieldRef);

  const timeInput = (
    <DateInputBase
      ref={fieldRef}
      wrapperRef={domRef}
      qa={qa || 'TimeInput'}
      inputType="timeinput"
      size={size}
      fieldProps={fieldProps}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      autoFocus={autoFocus}
      inputStyles={inputStyles}
      styles={styles}
      isInvalid={isInvalid}
      isValid={isValid}
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

  return wrapWithField(timeInput, {
    ...props,
    ...field,
    labelProps: mergeProps(labelProps, userLabelProps),
  });
}

/**
 * TimeFields allow users to enter and edit time values using a keyboard.
 * Each part of the time is displayed in an individually editable segment.
 */
const _TimeInput = forwardRef(TimeInput);

_TimeInput.displayName = 'TimeInput';

export { _TimeInput as TimeInput };
