import { FocusableRef } from '@react-types/shared';
import { forwardRef, ReactElement, useRef } from 'react';
import {
  AriaDateRangePickerProps,
  DateValue,
  useDatePicker,
  useDateRangePicker,
  useFocusRing,
} from 'react-aria';
import { useDatePickerState, useDateRangePickerState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps, ValidationState } from '../../../shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { Calendar } from '../../other/Calendar/Calendar';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';

import { DateInputBase } from './DateInputBase';
import { DatePickerButton } from './DatePickerButton';
import { DatePickerElement } from './DatePickerElement';
import { DatePickerInput } from './DatePickerInput';
import { dateMessages } from './intl';
import { DEFAULT_DATE_PROPS } from './props';
import { TimeInput } from './TimeInput';
import { DateFieldBase } from './types';
import { useFocusManagerRef } from './utils';

const DateRangeDash = tasty({
  'aria-hidden': 'true',
  'data-qa': 'DateRangeDash',
  children: '–',
  styles: {
    padding: '0 .5x',
    color: '#dark-03',
  },
});

export interface CubeDateRangeSeparatedPickerProps<
  T extends DateValue = DateValue,
> extends Omit<AriaDateRangePickerProps<T>, 'errorMessage'>,
    BaseProps,
    ContainerStyleProps,
    DateFieldBase<T>,
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
    qa,
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

  let startFocusRingProps = useFocusRing({
    within: true,
    isTextInput: true,
    autoFocus,
  });
  let startFocusProps = useFocusRing({
    within: false,
    isTextInput: false,
    autoFocus,
  });
  let endFocusRingProps = useFocusRing({
    within: true,
    isTextInput: true,
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
    <DatePickerElement
      ref={targetRef}
      {...groupProps}
      styles={props.wrapperStyles}
      qa={qa || 'DateRangeSeparatedPicker'}
      data-input-type="daterangeseparatedpicker"
    >
      <DateInputBase
        disableFocusRing={startFocusProps.isFocused}
        isDisabled={isDisabled}
        validationState={validationState}
        size={size}
        {...startFocusRingProps.focusProps}
        suffix={
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
              {...mergeProps(
                startProps.buttonProps,
                startFocusProps.focusProps,
              )}
              isDisabled={isDisabled}
            />
            <Dialog {...startProps.dialogProps} width="max-content">
              <Calendar
                {...startProps.calendarProps}
                defaultFocusedValue={
                  state.value?.start || state.value?.end || undefined
                }
                selectedRange={
                  state.value?.start && state.value?.end
                    ? state.value
                    : undefined
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
        }
      >
        <DatePickerInput useLocale={useLocaleProp} {...startFieldProps} />
      </DateInputBase>
      <DateRangeDash />
      <DateInputBase
        disableFocusRing={endFocusProps.isFocused}
        isDisabled={isDisabled}
        validationState={validationState}
        size={size}
        {...endFocusRingProps.focusProps}
        suffix={
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
                  state.value?.start && state.value?.end
                    ? state.value
                    : undefined
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
        }
      >
        <DatePickerInput useLocale={useLocaleProp} {...endFieldProps} />
      </DateInputBase>
    </DatePickerElement>
  );

  return wrapWithField(component, domRef, {
    ...props,
    labelProps: mergeProps(props.labelProps, labelProps),
  });
}

const _DateRangeSeparatedPicker = forwardRef(DateRangeSeparatedPicker) as <
  T extends DateValue,
>(
  props: CubeDateRangeSeparatedPickerProps<T> & {
    ref?: FocusableRef<HTMLElement>;
  },
) => ReactElement;

(_DateRangeSeparatedPicker as any).displayName = 'DateRangeSeparatedPicker';

export { _DateRangeSeparatedPicker as DateRangeSeparatedPicker };
