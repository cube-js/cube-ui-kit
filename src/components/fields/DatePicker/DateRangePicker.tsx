import { FocusableRef } from '@react-types/shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
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
import { extractStyles } from '../../../utils/styles';
import { useFieldProps, wrapWithField } from '../../form';
import { Space } from '../../layout/Space';
import { RangeCalendar } from '../../other/Calendar/RangeCalendar';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';

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

export interface CubeDateRangePickerProps<T extends DateValue = DateValue>
  extends Omit<AriaDateRangePickerProps<T>, 'errorMessage' | 'form' | 'name'>,
    BaseProps,
    DateFieldBase<T>,
    ContainerStyleProps,
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
  props: CubeDateRangePickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  const { t } = useI18n();

  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
  });
  props = Object.assign({}, DEFAULT_DATE_PROPS, props);

  // The public type declares `ContainerStyleProps` and `styles`, so both have to
  // reach the root — before this they were extracted and dropped, which made
  // `width="100%"` type-check and do nothing. `extractStyles` already folds in
  // `props.styles` and lets the individual style props override it, which is the
  // precedence every other component uses; re-spreading `props.styles` here
  // would invert it. `wrapperStyles` stays the most specific and keeps winning.
  let styles: Styles = {
    ...extractStyles(props, CONTAINER_STYLES),
    ...props.wrapperStyles,
  };

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

  let domRef = useFocusManagerRef(ref);

  let {
    groupProps,
    labelProps,
    startFieldProps,
    endFieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
  } = useDateRangePicker(props, state, targetRef);

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

  const component = (
    <DateInputBase
      ref={targetRef}
      qa={qa || 'DateRangePicker'}
      inputType="daterangepicker"
      styles={styles}
      disableFocusRing={isFocusedButton}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isValid={isValid}
      size={size}
      fieldProps={groupProps}
      {...focusProps}
      suffix={
        <DialogTrigger
          hideArrow
          type="popover"
          mobileType="tray"
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
          <Dialog {...dialogProps} width="max-content">
            <RangeCalendar {...calendarProps} />
            {showTimeField && (
              <Space>
                <TimeInput
                  padding="1x"
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
                  padding="1x"
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
      <DatePickerInput useLocale={useLocaleProp} {...startFieldProps} />
      <DateRangeDash />
      <DatePickerInput useLocale={useLocaleProp} {...endFieldProps} />
    </DateInputBase>
  );

  return wrapWithField(component, domRef, {
    ...props,
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
