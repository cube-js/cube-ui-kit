import { FocusableRef } from '@react-types/shared';
import { forwardRef, useRef } from 'react';
import {
  AriaDateRangePickerProps,
  DateValue,
  useDateRangePicker,
  useFocusRing,
} from 'react-aria';
import { useDateRangePickerState } from 'react-stately';

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
import { Space } from '../../layout/Space';
import { RangeCalendar } from '../../other/Calendar/RangeCalendar';
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
  },
});

export interface CubeDateRangePickerProps<T extends DateValue = DateValue>
  extends Omit<AriaDateRangePickerProps<T>, 'errorMessage'>,
    BaseProps,
    DateFieldBase<T>,
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

  let {
    size,
    shouldFlip,
    placeholderValue,
    isDisabled,
    validationState,
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
    <DatePickerElement
      ref={targetRef}
      styles={props.wrapperStyles}
      mods={{ focused: isFocused && !isFocusedButton }}
      {...focusProps}
    >
      <DateInputBase
        disableFocusRing
        isDisabled={isDisabled}
        validationState={validationState}
        size={size}
        styles={{ radius: 'left', border: 'top left bottom' }}
      >
        <DatePickerInput useLocale={useLocaleProp} {...startFieldProps} />
        <DateRangeDash />
        <DatePickerInput useLocale={useLocaleProp} {...endFieldProps} />
      </DateInputBase>
      <DialogTrigger
        hideArrow
        type="popover"
        mobileType="tray"
        placement="bottom right"
        targetRef={targetRef}
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
                label={dateMessages['startTime']}
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
                label={dateMessages['endTime']}
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
    </DatePickerElement>
  );

  return wrapWithField(component, domRef, {
    ...props,
    styles,
    labelProps: mergeProps(props.labelProps, labelProps),
    fieldProps: groupProps,
  });
}

const _DateRangePicker = forwardRef(DateRangePicker) as typeof DateRangePicker;

(_DateRangePicker as any).displayName = 'DateRangePicker';

export { _DateRangePicker as DateRangePicker };
