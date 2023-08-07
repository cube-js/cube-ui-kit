import { forwardRef, ReactElement, useRef } from 'react';
import { AriaDateRangePickerProps, DateValue } from '@react-types/datepicker';
import { FocusableRef } from '@react-types/shared';
import { useDateRangePicker } from '@react-aria/datepicker';
import { useDateRangePickerState } from '@react-stately/datepicker';
import { CalendarOutlined } from '@ant-design/icons';
import { useLocalizedStringFormatter } from '@react-aria/i18n';

import { useProviderProps } from '../../../provider';
import { wrapWithField } from '../wrapper';
import {
  BaseProps,
  BlockStyleProps,
  DimensionStyleProps,
  PositionStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { FieldBaseProps, ValidationState } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFieldProps, useFormProps } from '../Form';
import { Space } from '../../layout/Space';
import { Block } from '../../Block';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import { Button } from '../../actions';
import { RangeCalendar } from '../../other/Calendar/RangeCalendar';

import { useFocusManagerRef } from './utils';
import { DateInputBase } from './DateInputBase';
import { DatePickerInput } from './DatePickerInput';
import { TimeInput } from './TimeInput';

const DateRangeDash = tasty({
  'aria-hidden': 'true',
  'data-qa': 'DateRangeDash',
  children: '–',
});

export interface CubeDateRangePickerProps<T extends DateValue = DateValue>
  extends AriaDateRangePickerProps<T>,
    BaseProps,
    PositionStyleProps,
    DimensionStyleProps,
    BlockStyleProps,
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
    <Block>
      <Space gap="0">
        <DateInputBase
          disableFocusRing
          isDisabled={isDisabled}
          validationState={validationState}
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
          <Button
            size={size}
            radius="1r right"
            icon={<CalendarOutlined />}
            {...buttonProps}
          />
          <Dialog {...dialogProps} width="max-content">
            <RangeCalendar {...calendarProps} />
            {showTimeField && (
              <TimeInput
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
    </Block>
  );

  return wrapWithField(component, domRef, {
    ...props,
    ...mergeProps(props.labelProps, labelProps),
    fieldProps: groupProps,
  });
}

const _DateRangePicker = forwardRef(DateRangePicker) as <T extends DateValue>(
  props: CubeDateRangePickerProps<T> & { ref?: FocusableRef<HTMLElement> },
) => ReactElement;
export { _DateRangePicker as DateRangePicker };
