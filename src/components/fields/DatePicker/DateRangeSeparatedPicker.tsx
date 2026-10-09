import { FocusableRef } from '@react-types/shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { forwardRef, ReactElement, RefObject, useRef } from 'react';
import {
  AriaDateRangePickerProps,
  DateValue,
  Placement,
  useDatePicker,
  useDateRangePicker,
  useFocusRing,
} from 'react-aria';
import { useDatePickerState, useDateRangePickerState } from 'react-stately';

import { useI18n } from '../../../i18n';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { extractStyles, mergeStyleLayers } from '../../../utils/styles';
import { useFieldProps, wrapWithField } from '../../form';
import { Calendar } from '../../other/Calendar/Calendar';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

import { DateInputBase } from './DateInputBase';
import { DatePickerButton } from './DatePickerButton';
import { DatePickerElement } from './DatePickerElement';
import { DatePickerInput } from './DatePickerInput';
import { DEFAULT_DATE_PROPS } from './props';
import { TimeInput } from './TimeInput';
import { DateFieldBase } from './types';
import { useFocusManagerRef } from './utils';

import type { CubeDialogTriggerProps } from '../../overlays/Dialog/DialogTrigger';

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
> extends Omit<
      AriaDateRangePickerProps<T>,
      'errorMessage' | 'form' | 'name' | keyof DateFieldBase<T>
    >,
    BaseProps,
    ContainerStyleProps,
    DateFieldBase<T>,
    FieldBaseProps<{ start: T; end: T } | null | undefined> {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  maxVisibleMonths?: number;
  shouldFlip?: boolean;
  /**
   * The ref of the element the popover should visually attach itself to.
   * Defaults to the field wrapper.
   *
   * Forwarded to `DialogTrigger`, so the anchor also becomes what outside-click
   * dismissal treats as the trigger.
   */
  targetRef?: RefObject<HTMLElement | null>;
  /** Overlay presentation, independent of the trigger's styling type. Defaults to popover. */
  dialogType?: CubeDialogTriggerProps['type'];
  /** Explicit mobile overlay override. When omitted, mobile inherits dialogType. */
  dialogMobileType?: CubeDialogTriggerProps['mobileType'];
  /**
   * Placement of the popover relative to the anchor.
   * Accepts React Aria's `Placement` strings (e.g. `'bottom start'`,
   * `'top start'`, `'right top'`, `'left top'`).
   * @default 'bottom right'
   */
  placement?: Placement;
  useLocale?: boolean;
}

function DateRangeSeparatedPicker<T extends DateValue>(
  rawProps: CubeDateRangeSeparatedPickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  const { t } = useI18n();

  const resolvedProps = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onBlur',
  });
  let { dialogType = 'popover', dialogMobileType, ...props } = resolvedProps;
  props = Object.assign({}, DEFAULT_DATE_PROPS, props);

  // The public type declares `ContainerStyleProps` and `styles`, so both have to
  // reach the root — before this they were extracted and dropped, which made
  // `width="100%"` type-check and do nothing. `extractStyles` already folds in
  // `props.styles` and lets the individual style props override it, which is the
  // precedence every other component uses; re-spreading `props.styles` here
  // would invert it. `wrapperStyles` stays the most specific and keeps winning.
  let styles = mergeStyleLayers(
    extractStyles(props, CONTAINER_STYLES),
    props.wrapperStyles,
  );

  let {
    qa,
    size,
    placeholderValue,
    isDisabled,
    isInvalid,
    isValid,
    useLocale: useLocaleProp,
    autoFocus,
  } = props;
  let targetRef = useRef<HTMLDivElement>(null);

  let state = useDateRangePickerState({
    ...props,
  });

  let startDateProps = {
    ...props,
    onChange: undefined,
    validate: undefined,
    value: state.value?.start,
    defaultValue: props.defaultValue?.start,
  };
  let endDateProps = {
    ...props,
    onChange: undefined,
    validate: undefined,
    value: state.value?.end,
    defaultValue: props.defaultValue?.end,
  };
  let startState = useDatePickerState(startDateProps);
  let endState = useDatePickerState(endDateProps);

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

  let startProps = useDatePicker(startDateProps, startState, targetRef);
  let endProps = useDatePicker(endDateProps, endState, targetRef);

  let placeholder: DateValue | undefined = placeholderValue ?? undefined;
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
      : undefined;
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

      if (newRange.end) {
        state.setValue({ start: newRange.start, end: newRange.end });
      } else {
        state.setDateTime('start', newRange.start);
      }
      startProps.calendarProps.onChange?.(value);
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

      if (newRange.start) {
        state.setValue({ start: newRange.start, end: newRange.end });
      } else {
        state.setDateTime('end', newRange.end);
      }
      endProps.calendarProps.onChange?.(value);
      endState.setOpen(false);
    }
  }

  const component = (
    <DatePickerElement
      ref={targetRef}
      {...groupProps}
      styles={styles}
      qa={qa || 'DateRangeSeparatedPicker'}
      data-input-type="daterangeseparatedpicker"
    >
      <DateInputBase
        disableFocusRing={startFocusProps.isFocused}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        isValid={isValid}
        size={size}
        {...startFocusRingProps.focusProps}
        suffix={
          <DialogTrigger
            hideArrow
            type={dialogType}
            mobileType={dialogMobileType}
            placement={props.placement ?? 'bottom right'}
            targetRef={props.targetRef ?? targetRef}
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
            <Dialog
              {...startProps.dialogProps}
              width={{ 'type=popover': 'max-content' }}
            >
              <Calendar
                {...startProps.calendarProps}
                defaultFocusedValue={
                  state.value?.start || state.value?.end || undefined
                }
                selectedRange={
                  state.value?.start && state.value?.end
                    ? { start: state.value.start, end: state.value.end }
                    : undefined
                }
                onChange={(value: DateValue) => onChange(value, 'start')}
              />
              {showTimeField && (
                <TimeInput
                  padding="1x"
                  label={t('datePicker.time', 'Time')}
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
        isInvalid={isInvalid}
        isValid={isValid}
        size={size}
        {...endFocusRingProps.focusProps}
        suffix={
          <DialogTrigger
            hideArrow
            type={dialogType}
            mobileType={dialogMobileType}
            placement={props.placement ?? 'bottom right'}
            targetRef={props.targetRef ?? targetRef}
            isOpen={endState.isOpen}
            shouldFlip={props.shouldFlip}
            onOpenChange={endState.setOpen}
          >
            <DatePickerButton
              aria-label={t(
                'datePicker.showEndCalendar',
                'Show calendar for the end date',
              )}
              size={size}
              {...mergeProps(endFocusProps.focusProps, endProps.buttonProps)}
              isDisabled={isDisabled}
            />
            <Dialog
              {...endProps.dialogProps}
              width={{ 'type=popover': 'max-content' }}
            >
              <Calendar
                {...endProps.calendarProps}
                defaultFocusedValue={
                  state.value?.end || state.value?.start || undefined
                }
                selectedRange={
                  state.value?.start && state.value?.end
                    ? { start: state.value.start, end: state.value.end }
                    : undefined
                }
                onChange={(value: DateValue) => {
                  onChange(value, 'end');
                }}
              />
              {showTimeField && (
                <TimeInput
                  padding="1x"
                  label={t('datePicker.time', 'Time')}
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
