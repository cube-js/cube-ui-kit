import { FocusableRef } from '@react-types/shared';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { forwardRef, useRef } from 'react';
import {
  AriaDatePickerProps,
  DateValue,
  useDatePicker,
  useFocusRing,
  useLocale,
} from 'react-aria';
import { useDatePickerState } from 'react-stately';

import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { useFieldProps, wrapWithField } from '../../form';
import { Calendar } from '../../other/Calendar/Calendar';
import { PeriodCalendar } from '../../other/Calendar/PeriodCalendar';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';

import { DateInputBase } from './DateInputBase';
import { DatePickerButton } from './DatePickerButton';
import { formatPeriod, PickerType, snapToPeriod } from './period';
import { useFocusManagerRef } from './utils';

const DEFAULT_PLACEHOLDER: Record<PickerType, string> = {
  week: 'Select week',
  month: 'Select month',
  quarter: 'Select quarter',
  year: 'Select year',
};

const PeriodValueElement = tasty({
  styles: {
    preset: 't3',
    width: 'max 100%',
    whiteSpace: 'nowrap',
    color: {
      '': '#dark',
      placeholder: '#dark.30',
    },
  },
});

export interface CubePeriodPickerProps<T extends DateValue = DateValue>
  extends Omit<AriaDatePickerProps<T>, 'errorMessage' | 'granularity'>,
    BaseProps,
    ContainerStyleProps,
    FieldBaseProps {
  /** Which period the picker selects. Set by the concrete picker components. */
  picker?: PickerType;
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  triggerStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  shouldFlip?: boolean;
  /** Placeholder shown when no value is selected. */
  placeholder?: string;
  /** Override how the selected value is rendered as text. */
  formatValue?: (date: DateValue, picker: PickerType) => string;
}

function PeriodPicker<T extends DateValue>(
  props: CubePeriodPickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
  });

  let styles = extractStyles(props, CONTAINER_STYLES);

  let {
    qa,
    size,
    picker = 'month',
    placeholder,
    formatValue,
    isDisabled,
    isInvalid,
    isValid,
    autoFocus,
  } = props;

  let { locale } = useLocale();
  let targetRef = useRef<HTMLDivElement>(null);
  let state = useDatePickerState({
    ...props,
    granularity: 'day',
    shouldCloseOnSelect: true,
  });
  let { isOpen, setOpen } = state;

  let domRef = useFocusManagerRef(ref);

  let { isFocused: isFocusedButton, focusProps: focusPropsButton } =
    useFocusRing({
      within: false,
      isTextInput: false,
      autoFocus,
    });

  let { groupProps, labelProps, buttonProps, dialogProps, calendarProps } =
    useDatePicker({ ...props, granularity: 'day' }, state, targetRef);

  let handleSelect = (date: DateValue) => {
    state.setValue(snapToPeriod(date, picker, locale));
    setOpen(false);
  };

  let displayText = state.value
    ? (formatValue ?? formatPeriod)(state.value, picker, locale)
    : placeholder ?? DEFAULT_PLACEHOLDER[picker];

  const panel =
    picker === 'week' ? (
      <Calendar
        {...calendarProps}
        autoFocus
        pickerMode="week"
        isDisabled={isDisabled}
        onChange={handleSelect}
      />
    ) : (
      <PeriodCalendar
        autoFocus
        picker={picker}
        value={calendarProps.value}
        minValue={calendarProps.minValue}
        maxValue={calendarProps.maxValue}
        isDateUnavailable={calendarProps.isDateUnavailable}
        isDisabled={isDisabled}
        onChange={handleSelect}
      />
    );

  const component = (
    <DateInputBase
      ref={targetRef}
      qa={qa || 'PeriodPicker'}
      inputType="datepicker"
      styles={props.wrapperStyles}
      inputStyles={props.inputStyles}
      disableFocusRing={isFocusedButton}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isValid={isValid}
      size={size}
      fieldProps={groupProps}
      suffix={
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
            styles={props.triggerStyles}
          />
          <Dialog {...dialogProps} width="max-content">
            {panel}
          </Dialog>
        </DialogTrigger>
      }
    >
      <PeriodValueElement
        {...labelProps}
        mods={{ placeholder: !state.value }}
        onClick={() => !isDisabled && setOpen(true)}
      >
        {displayText}
      </PeriodValueElement>
    </DateInputBase>
  );

  return wrapWithField(component, domRef, {
    ...props,
    labelProps: mergeProps(props.labelProps, labelProps),
  });
}

const _PeriodPicker = forwardRef(PeriodPicker);

_PeriodPicker.displayName = 'PeriodPicker';

export { _PeriodPicker as PeriodPicker };
