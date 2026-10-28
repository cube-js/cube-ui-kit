import { FocusableRef } from '@react-types/shared';
import { BaseProps, Styles } from '@tenphi/tasty';
import { forwardRef, RefObject, useRef } from 'react';
import {
  AriaDatePickerProps,
  DateValue,
  Placement,
  useDatePicker,
  useFocusRing,
} from 'react-aria';
import { useDatePickerState } from 'react-stately';

import { useI18n } from '../../../i18n';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { mergeStyleLayers } from '../../../utils/styles';
import { useFieldProps, wrapWithField } from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import { Calendar } from '../../other/Calendar/Calendar';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

import { DateInputBase } from './DateInputBase';
import { DatePickerButton } from './DatePickerButton';
import { DatePickerInput } from './DatePickerInput';
import { DEFAULT_DATE_PROPS } from './props';
import { TimeInput } from './TimeInput';
import { DateFieldBase } from './types';
import { useFocusManagerRef } from './utils';

export interface CubeDatePickerProps<T extends DateValue = DateValue>
  extends
    Omit<
      AriaDatePickerProps<T>,
      'errorMessage' | 'form' | 'name' | keyof DateFieldBase<T>
    >,
    DateFieldBase<T>,
    BaseProps,
    FieldLayoutStyleProps,
    FieldBaseProps<T | null | undefined> {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  triggerStyles?: Styles;
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

function DatePicker<T extends DateValue>(
  rawProps: CubeDatePickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  const { t } = useI18n();

  let props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onBlur',
  });
  props = Object.assign({}, DEFAULT_DATE_PROPS, props);

  // `wrapperStyles` styles the same box as `styles` and wins over it.
  const fieldLayout = splitFieldLayout(props);
  const styles = mergeStyleLayers(fieldLayout.styles, props.wrapperStyles);

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
  let state = useDatePickerState({
    ...props,
    shouldCloseOnSelect: () => !state.hasTime,
  });
  let { isOpen, setOpen } = state;

  let domRef = useRef<HTMLDivElement>(null);

  useFocusManagerRef(ref, domRef);

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
      qa={qa || 'DatePicker'}
      inputType="datepicker"
      autoFocus={autoFocus}
      styles={styles}
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
          placement={props.placement ?? 'bottom right'}
          targetRef={props.targetRef ?? targetRef}
          isOpen={isOpen}
          shouldFlip={props.shouldFlip}
          onOpenChange={setOpen}
        >
          <DatePickerButton
            size={size}
            {...mergeProps(buttonProps, focusPropsButton)}
            isDisabled={isDisabled}
          />
          <Dialog {...dialogProps} width="max-content" overflow="auto">
            <Calendar {...calendarProps} />
            {showTimeField && (
              <TimeInput
                label={t('datePicker.time', 'Time')}
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
      }
    >
      <DatePickerInput useLocale={useLocaleProp} {...fieldProps} />
    </DateInputBase>
  );

  return wrapWithField(component, {
    ...props,
    ...fieldLayout.field,
    labelProps: mergeProps(props.labelProps, labelProps),
  });
}

const _DatePicker = forwardRef(DatePicker);

_DatePicker.displayName = 'DatePicker';

export { _DatePicker as DatePicker };
