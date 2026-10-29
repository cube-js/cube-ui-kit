import { FocusableRef } from '@react-types/shared';
import { BaseProps, Styles, tasty } from '@tenphi/tasty';
import { forwardRef, RefObject, useRef } from 'react';
import {
  AriaDateRangePickerProps,
  DateValue,
  Placement,
  useDateRangePicker,
  useFocusRing,
} from 'react-aria';
import { useDateRangePickerState } from 'react-stately';

import { useI18n } from '../../../i18n';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFieldProps, wrapWithField } from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import { Space } from '../../layout/Space';
import { RangeCalendar } from '../../other/Calendar/RangeCalendar';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

import { DateInputBase } from './DateInputBase';
import { DatePickerButton } from './DatePickerButton';
import { DatePickerInput } from './DatePickerInput';
import { DEFAULT_DATE_PROPS } from './props';
import { TimeInput } from './TimeInput';
import { DateFieldBase } from './types';
import { useFocusManagerRef } from './utils';

import type { ReactElement, Ref } from 'react';

const DateRangeDash = tasty({
  'aria-hidden': 'true',
  'data-qa': 'DateRangeDash',
  children: '–',
  styles: {
    padding: '0 .5x',
  },
});

// One row of the box: the start date with its dash, or the end date. Too narrow
// for one row, the end date's row wraps under the start date's.
const DateRangeRow = tasty({
  role: 'presentation',
  styles: {
    display: 'flex',
    placeItems: 'center start',
    height: '($size - 2bw)',
  },
});

// The box grows by a row for a wrapped end date, its suffix stays on the first
// row, and it is never narrower than its widest row.
const WRAPPER_STYLES: Styles = {
  minWidth: 'min-content',
  height: 'min $size',
  Suffix: {
    height: '($size - 2bw)',
  },
};

const INPUT_STYLES: Styles = {
  flow: 'row wrap',
  height: 'auto',
};

export interface CubeDateRangePickerProps<T extends DateValue = DateValue>
  extends
    Omit<
      AriaDateRangePickerProps<T>,
      'errorMessage' | 'form' | 'name' | keyof DateFieldBase<T>
    >,
    BaseProps,
    DateFieldBase<T>,
    FieldLayoutStyleProps,
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
  /**
   * Placement of the popover relative to the anchor.
   * Accepts React Aria's `Placement` strings (e.g. `'bottom start'`,
   * `'top start'`, `'right top'`, `'left top'`).
   * @default 'bottom right'
   */
  placement?: Placement;
  useLocale?: boolean;
}

function DateRangePicker<T extends DateValue>(
  rawProps: CubeDateRangePickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  const { t } = useI18n();

  let props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onBlur',
  });
  props = Object.assign({}, DEFAULT_DATE_PROPS, props);

  // `wrapperStyles` styles the same box as `styles` and wins over it.
  const fieldLayout = splitFieldLayout(props, {
    defaultStyles: WRAPPER_STYLES,
    overStyles: props.wrapperStyles,
  });
  const styles = fieldLayout.styles;

  let {
    qa,
    size,
    shouldFlip,
    targetRef: targetRefProp,
    placement = 'bottom right',
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
    shouldCloseOnSelect: () => !state.hasTime,
  });
  let { isOpen, setOpen } = state;

  let { isFocused, focusProps } = useFocusRing({
    within: true,
    isTextInput: true,
    autoFocus,
  });

  let { isFocused: isFocusedButton, focusProps: focusPropsButton } =
    useFocusRing({
      within: false,
      isTextInput: false,
      autoFocus,
    });

  let domRef = useRef<HTMLDivElement>(null);

  useFocusManagerRef(ref, domRef);

  let {
    groupProps,
    labelProps,
    startFieldProps,
    endFieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
  } = useDateRangePicker(props, state, targetRef);

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
      : null;
  let showTimeField = !!timeGranularity;
  // let visibleMonths = useVisibleMonths(maxVisibleMonths);

  const component = (
    <DateInputBase
      ref={targetRef}
      wrapperRef={domRef}
      qa={qa || 'DateRangePicker'}
      inputType="daterangepicker"
      autoFocus={autoFocus}
      styles={styles}
      inputStyles={INPUT_STYLES}
      disableFocusRing={isFocusedButton}
      isDisabled={isDisabled}
      isReadOnly={props.isReadOnly}
      isInvalid={isInvalid}
      isValid={isValid}
      size={size}
      fieldProps={groupProps}
      {...focusProps}
      suffix={
        <DialogTrigger
          hideArrow
          type="popover"
          placement={placement}
          targetRef={targetRefProp ?? targetRef}
          isOpen={isOpen}
          shouldFlip={shouldFlip}
          onOpenChange={setOpen}
        >
          <DatePickerButton
            size={size}
            {...mergeProps(buttonProps, focusPropsButton)}
            isDisabled={isDisabled}
          />
          <Dialog {...dialogProps} width="max-content" overflow="auto">
            <RangeCalendar
              {...calendarProps}
              isDateUnavailable={props.isDateUnavailable}
            />
            {showTimeField && (
              <Space>
                <TimeInput
                  label={t('datePicker.startTime', 'Start time')}
                  value={state.timeRange?.start || null}
                  placeholderValue={timePlaceholder}
                  granularity={timeGranularity}
                  minValue={timeMinValue}
                  maxValue={timeMaxValue}
                  hourCycle={props.hourCycle}
                  hideTimeZone={props.hideTimeZone}
                  onChange={(v) => state.setTime('start', v)}
                />
                <TimeInput
                  label={t('datePicker.endTime', 'End time')}
                  value={state.timeRange?.end || null}
                  placeholderValue={timePlaceholder}
                  granularity={timeGranularity}
                  minValue={timeMinValue}
                  maxValue={timeMaxValue}
                  hourCycle={props.hourCycle}
                  hideTimeZone={props.hideTimeZone}
                  onChange={(v) => state.setTime('end', v)}
                />
              </Space>
            )}
          </Dialog>
        </DialogTrigger>
      }
    >
      <DateRangeRow qa="DateRangeStart">
        <DatePickerInput useLocale={useLocaleProp} {...startFieldProps} />
        <DateRangeDash />
      </DateRangeRow>
      <DateRangeRow qa="DateRangeEnd">
        <DatePickerInput useLocale={useLocaleProp} {...endFieldProps} />
      </DateRangeRow>
    </DateInputBase>
  );

  return wrapWithField(component, {
    ...props,
    ...fieldLayout.field,
    labelProps: mergeProps(props.labelProps, labelProps),
  });
}

const _DateRangePicker = forwardRef(DateRangePicker) as <
  T extends DateValue = DateValue,
>(
  props: CubeDateRangePickerProps<T> & { ref?: Ref<HTMLElement> },
) => ReactElement | null;

(_DateRangePicker as any).displayName = 'DateRangePicker';

export { _DateRangePicker as DateRangePicker };
