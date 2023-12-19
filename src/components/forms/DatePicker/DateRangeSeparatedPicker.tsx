import { forwardRef, ReactElement, useRef } from 'react';
import { AriaDateRangePickerProps, DateValue } from '@react-types/datepicker';
import { FocusableRef } from '@react-types/shared';
import { useDatePicker, useDateRangePicker, useFocusRing } from 'react-aria';
import { useDatePickerState, useDateRangePickerState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import { wrapWithField } from '../wrapper';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
  tasty,
} from '../../../tasty';
import { FieldBaseProps, ValidationState } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFieldProps, useFormProps } from '../Form';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import { Calendar } from '../../other/Calendar/Calendar';

import { useFocusManagerRef } from './utils';
import { DateInputBase } from './DateInputBase';
import { DatePickerInput } from './DatePickerInput';
import { TimeInput } from './TimeInput';
import { DatePickerButton } from './DatePickerButton';
import { DEFAULT_DATE_PROPS } from './props';
import { dateMessages } from './intl';
import { DatePickerElement } from './DatePickerElement';

const DateRangeDash = tasty({
  'aria-hidden': 'true',
  'data-qa': 'DateRangeDash',
  children: '––',
  styles: {
    padding: '0 .5x',
  },
});

export interface CubeDateRangeSeparatedPickerProps<
  T extends DateValue = DateValue,
> extends AriaDateRangePickerProps<T>,
    BaseProps,
    ContainerStyleProps,
    FieldBaseProps {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  validationState?: ValidationState;
  maxVisibleMonths?: number;
  shouldFlip?: boolean;
  useLocale?: boolean;
}

function DateRangeSeparatedPicker<T extends DateValue>(
  props: CubeDateRangeSeparatedPickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
  });
  props = Object.assign({}, DEFAULT_DATE_PROPS, props);

  let styles = extractStyles(props, CONTAINER_STYLES);

  let {
    size,
    placeholderValue,
    isDisabled,
    validationState,
    useLocale: useLocaleProp,
    autoFocus,
  } = props;
  let targetRef = useRef<HTMLDivElement>(null);

  let state = useDateRangePickerState({
    ...props,
  });

  let startState = useDatePickerState({
    ...props,
    onChange: null,
    value: state.value?.start,
  });

  let endState = useDatePickerState({
    ...props,
    onChange: null,
    value: state.value?.end,
  });

  let startFocusProps = useFocusRing({
    within: false,
    isTextInput: false,
    autoFocus,
  });
  let endFocusProps = useFocusRing({
    within: false,
    isTextInput: false,
    autoFocus,
  });

  let domRef = useFocusManagerRef(ref);

  let { groupProps, labelProps, startFieldProps, endFieldProps } =
    useDateRangePicker(props, state, targetRef);

  let startProps = useDatePicker(props, startState, targetRef);
  let endProps = useDatePicker(props, endState, targetRef);

  let placeholder: DateValue | undefined = placeholderValue;
  let timePlaceholder =
    placeholder && 'hour' in placeholder ? placeholder : undefined;
  let timeMinValue =
    props.minValue && 'hour' in props.minValue ? props.minValue : undefined;
  let timeMaxValue =
    props.maxValue && 'hour' in props.maxValue ? props.maxValue : undefined;
  let timeGranularity =
    state.granularity === 'hour' ||
    state.granularity === 'minute' ||
    state.granularity === 'second'
      ? state.granularity
      : null;
  let showTimeField = !!timeGranularity;

  // let visibleMonths = useVisibleMonths(maxVisibleMonths);

  function onChange(value: DateValue, type: 'start' | 'end') {
    if (type === 'start') {
      const newRange = { ...state.value, start: value };

      if (
        newRange.start &&
        newRange.end &&
        newRange.end.compare(newRange.start) < 0
      ) {
        newRange.end = newRange.start;
      }

      state.setValue(newRange);
      startProps.calendarProps.onChange(value);
      startState.setOpen(false);
    } else {
      const newRange = { ...state.value, end: value };

      if (
        newRange.start &&
        newRange.end &&
        newRange.end.compare(newRange.start) < 0
      ) {
        newRange.start = newRange.end;
      }

      state.setValue(newRange);
      endProps.calendarProps.onChange(value);
      endState.setOpen(false);
    }
  }

  const component = (
    <DatePickerElement ref={targetRef} styles={props.wrapperStyles}>
      <DateInputBase
        isDisabled={isDisabled}
        validationState={validationState}
        size={size}
        styles={{ radius: 'left', border: 'top left bottom' }}
      >
        <DatePickerInput useLocale={useLocaleProp} {...startFieldProps} />
      </DateInputBase>
      <DialogTrigger
        hideArrow
        type="popover"
        mobileType="tray"
        placement="bottom right"
        targetRef={targetRef}
        isOpen={startState.isOpen}
        shouldFlip={props.shouldFlip}
        onOpenChange={startState.setOpen}
      >
        <DatePickerButton
          size={size}
          {...mergeProps(startProps.buttonProps, startFocusProps.focusProps)}
          isDisabled={isDisabled}
        />
        <Dialog {...startProps.dialogProps} width="max-content">
          <Calendar
            {...startProps.calendarProps}
            defaultFocusedValue={
              state.value?.start || state.value?.end || undefined
            }
            selectedRange={
              state.value?.start && state.value?.end ? state.value : undefined
            }
            onChange={(value: DateValue) => onChange(value, 'start')}
          />
          {showTimeField && (
            <TimeInput
              padding="1x"
              label={dateMessages['time']}
              value={startState.timeValue}
              placeholderValue={timePlaceholder}
              granularity={timeGranularity}
              minValue={timeMinValue}
              maxValue={timeMaxValue}
              hourCycle={props.hourCycle}
              hideTimeZone={props.hideTimeZone}
              onChange={startState.setTimeValue}
            />
          )}
        </Dialog>
      </DialogTrigger>
      <DateRangeDash />
      <DateInputBase
        disableFocusRing
        isDisabled={isDisabled}
        validationState={validationState}
        size={size}
        radius="left"
        border="top left bottom"
      >
        <DatePickerInput useLocale={useLocaleProp} {...endFieldProps} />
      </DateInputBase>
      <DialogTrigger
        hideArrow
        type="popover"
        mobileType="tray"
        placement="bottom right"
        targetRef={targetRef}
        isOpen={endState.isOpen}
        shouldFlip={props.shouldFlip}
        onOpenChange={endState.setOpen}
      >
        <DatePickerButton
          aria-label="Show calendar for the end date"
          size={size}
          {...mergeProps(endFocusProps.focusProps, endProps.buttonProps)}
          isDisabled={isDisabled}
        />
        <Dialog {...endProps.dialogProps} width="max-content">
          <Calendar
            {...endProps.calendarProps}
            defaultFocusedValue={
              state.value?.end || state.value?.start || undefined
            }
            selectedRange={
              state.value?.start && state.value?.end ? state.value : undefined
            }
            onChange={(value: DateValue) => {
              onChange(value, 'end');
            }}
          />
          {showTimeField && (
            <TimeInput
              padding="1x"
              label={dateMessages['time']}
              value={endState.timeValue}
              placeholderValue={timePlaceholder}
              granularity={timeGranularity}
              minValue={timeMinValue}
              maxValue={timeMaxValue}
              hourCycle={props.hourCycle}
              hideTimeZone={props.hideTimeZone}
              onChange={endState.setTimeValue}
            />
          )}
        </Dialog>
      </DialogTrigger>
    </DatePickerElement>
  );

  return wrapWithField(component, domRef, {
    ...props,
    styles,
    labelProps: mergeProps(props.labelProps, labelProps),
    fieldProps: groupProps,
  });
}

const _DateRangeSeparatedPicker = forwardRef(DateRangeSeparatedPicker) as <
  T extends DateValue,
>(
  props: CubeDateRangeSeparatedPickerProps<T> & {
    ref?: FocusableRef<HTMLElement>;
  },
) => ReactElement;
export { _DateRangeSeparatedPicker as DateRangeSeparatedPicker };
