import { FocusableRef } from '@react-types/shared';
import { forwardRef, useRef } from 'react';
import {
  AriaDatePickerProps,
  DateValue,
  useDatePicker,
  useFocusRing,
} from 'react-aria';
import { useDatePickerState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps, ValidationState } from '../../../shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
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

export interface CubeDatePickerProps<T extends DateValue = DateValue>
  extends AriaDatePickerProps<T>,
    DateFieldBase<T>,
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
  useLocale?: boolean;
}

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

  let {
    size,
    placeholderValue,
    isDisabled,
    validationState,
    useLocale: useLocaleProp,
    autoFocus,
  } = props;
  let targetRef = useRef<HTMLDivElement>(null);
  let state = useDatePickerState({
    ...props,
    shouldCloseOnSelect: () => !state.hasTime,
  });
  let { isOpen, setOpen } = state;

  let domRef = useFocusManagerRef(ref);

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
        radius="left"
        border="top left bottom"
        isDisabled={isDisabled}
        validationState={validationState}
        size={size}
      >
        <DatePickerInput useLocale={useLocaleProp} {...fieldProps} />
      </DateInputBase>
      <DialogTrigger
        hideArrow
        type="popover"
        mobileType="tray"
        placement="bottom right"
        targetRef={targetRef}
        isOpen={isOpen}
        shouldFlip={props.shouldFlip}
        onOpenChange={setOpen}
      >
        <DatePickerButton
          size={size}
          {...mergeProps(buttonProps, focusPropsButton)}
          isDisabled={isDisabled}
        />
        <Dialog {...dialogProps} width="max-content">
          <Calendar {...calendarProps} />
          {showTimeField && (
            <TimeInput
              padding="1x"
              label={dateMessages['time']}
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
    </DatePickerElement>
  );

  return wrapWithField(component, domRef, {
    ...props,
    styles,
    labelProps: mergeProps(props.labelProps, labelProps),
    fieldProps: groupProps,
  });
}

const _DatePicker = forwardRef(DatePicker);

_DatePicker.displayName = 'DatePicker';

export { _DatePicker as DatePicker };
