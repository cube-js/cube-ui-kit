import { forwardRef, ReactElement, useRef } from 'react';
import { AriaDateRangePickerProps, DateValue } from '@react-types/datepicker';
import { FocusableRef } from '@react-types/shared';
import { useDateRangePicker } from '@react-aria/datepicker';
import { useDateRangePickerState } from '@react-stately/datepicker';
import { useLocalizedStringFormatter } from '@react-aria/i18n';

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
import { Space } from '../../layout/Space';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import { RangeCalendar } from '../../other/Calendar/RangeCalendar';

import { useFocusManagerRef } from './utils';
import { DateInputBase } from './DateInputBase';
import { DatePickerInput } from './DatePickerInput';
import { TimeInput } from './TimeInput';
import { DatePickerButton } from './DatePickerButton';
import { DEFAULT_DATE_PROPS } from './props';

const DateRangeDash = tasty({
  'aria-hidden': 'true',
  'data-qa': 'DateRangeDash',
  children: '–',
  styles: {
    padding: '0 .5x',
  },
});

export interface CubeDateRangePickerProps<T extends DateValue = DateValue>
  extends AriaDateRangePickerProps<T>,
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
}

const intlMessages = {
  'en-US': {
    time: 'Time',
    startTime: 'Start time',
    endTime: 'End time',
  },
};

function DateRangePicker<T extends DateValue>(
  props: CubeDateRangePickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
  });
  props = Object.assign({}, DEFAULT_DATE_PROPS, props);

  let styles = extractStyles(props, CONTAINER_STYLES);

  let { size, shouldFlip, placeholderValue, isDisabled, validationState } =
    props;
  let targetRef = useRef<HTMLDivElement>(null);
  let state = useDateRangePickerState({
    ...props,
    shouldCloseOnSelect: () => !state.hasTime,
  });
  let { isOpen, setOpen } = state;
  let domRef = useFocusManagerRef(ref);
  let stringFormatter = useLocalizedStringFormatter(intlMessages);

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
  //
  // let visibleMonths = useVisibleMonths(maxVisibleMonths);

  const component = (
    <Space gap="0" styles={props.wrapperStyles}>
      <DateInputBase
        disableFocusRing
        isDisabled={isDisabled}
        validationState={validationState}
        size={size}
        styles={{ radius: 'left', border: 'top left bottom' }}
      >
        <DatePickerInput {...startFieldProps} />
        <DateRangeDash />
        <DatePickerInput {...endFieldProps} />
      </DateInputBase>
      <DialogTrigger
        hideArrow
        type="popover"
        mobileType="tray"
        placement="bottom left"
        targetRef={targetRef}
        isOpen={isOpen}
        shouldFlip={shouldFlip}
        onOpenChange={setOpen}
      >
        <DatePickerButton size={size} {...buttonProps} />
        <Dialog {...dialogProps} width="max-content">
          <RangeCalendar {...calendarProps} />
          {showTimeField && (
            <TimeInput
              padding="1x"
              label={stringFormatter.format('time')}
              value={state.timeValue}
              placeholderValue={timePlaceholder}
              granularity={timeGranularity}
              minValue={timeMinValue}
              maxValue={timeMaxValue}
              hourCycle={props.hourCycle}
              hideTimeZone={props.hideTimeZone}
              onChange={state.setTimeValue}
            />
          )}
        </Dialog>
      </DialogTrigger>
    </Space>
  );

  return wrapWithField(component, domRef, {
    ...props,
    styles,
    labelProps: mergeProps(props.labelProps, labelProps),
    fieldProps: groupProps,
  });
}

const _DateRangePicker = forwardRef(DateRangePicker) as <T extends DateValue>(
  props: CubeDateRangePickerProps<T> & { ref?: FocusableRef<HTMLElement> },
) => ReactElement;
export { _DateRangePicker as DateRangePicker };
