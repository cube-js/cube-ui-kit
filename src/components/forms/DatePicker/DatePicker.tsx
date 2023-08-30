import { forwardRef, ReactElement, useRef } from 'react';
import { AriaDatePickerProps, DateValue } from '@react-types/datepicker';
import { FocusableRef } from '@react-types/shared';
import { useDatePicker } from '@react-aria/datepicker';
import { useDatePickerState } from '@react-stately/datepicker';
import { useLocalizedStringFormatter } from '@react-aria/i18n';

import { useProviderProps } from '../../../provider';
import { wrapWithField } from '../wrapper';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
} from '../../../tasty';
import { FieldBaseProps, ValidationState } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFieldProps, useFormProps } from '../Form';
import { Space } from '../../layout/Space';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import { Calendar } from '../../other/Calendar/Calendar';

import { useFocusManagerRef } from './utils';
import { DateInputBase } from './DateInputBase';
import { DatePickerInput } from './DatePickerInput';
import { TimeInput } from './TimeInput';
import { DatePickerButton } from './DatePickerButton';
import { DEFAULT_DATE_PROPS } from './props';

export interface CubeDatePickerProps<T extends DateValue = DateValue>
  extends AriaDatePickerProps<T>,
    BaseProps,
    ContainerStyleProps,
    FieldBaseProps {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  triggerStyles?: Styles;
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

function DatePicker<T extends DateValue>(
  props: CubeDatePickerProps<T>,
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
  let state = useDatePickerState({
    ...DEFAULT_DATE_PROPS,
    ...props,
    shouldCloseOnSelect: () => !state.hasTime,
  });
  let { isOpen, setOpen } = state;
  let domRef = useFocusManagerRef(ref);
  let stringFormatter = useLocalizedStringFormatter(intlMessages);

  let {
    groupProps,
    labelProps,
    fieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
  } = useDatePicker(props, state, targetRef);

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
        radius="left"
        border="top left bottom"
        isDisabled={isDisabled}
        validationState={validationState}
        size={size}
      >
        <DatePickerInput {...fieldProps} />
      </DateInputBase>
      <DialogTrigger
        hideArrow
        type="popover"
        mobileType="tray"
        placement="bottom left"
        targetRef={targetRef}
        isOpen={isOpen}
        offset={8}
        shouldFlip={shouldFlip}
        onOpenChange={setOpen}
      >
        <DatePickerButton
          size={size}
          {...buttonProps}
          isDisabled={isDisabled}
        />
        <Dialog {...dialogProps} width="max-content">
          <Calendar {...calendarProps} />
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

const _DatePicker = forwardRef(DatePicker) as <T extends DateValue>(
  props: CubeDatePickerProps<T> & { ref?: FocusableRef<HTMLElement> },
) => ReactElement;
export { _DatePicker as DatePicker };
