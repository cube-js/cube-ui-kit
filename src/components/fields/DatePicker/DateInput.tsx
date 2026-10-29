import { createCalendar } from '@internationalized/date';
import { FocusableRef } from '@react-types/shared';
import { BaseProps, Styles } from '@tenphi/tasty';
import { forwardRef, useRef } from 'react';
import {
  AriaDateFieldProps,
  DateValue,
  useDateField,
  useLocale,
} from 'react-aria';
import { useDateFieldState } from 'react-stately';

import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFieldProps, wrapWithField } from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';

import { DateInputBase } from './DateInputBase';
import { DatePickerSegment } from './DatePickerSegment';
import { parseAbsoluteDate } from './parseDate';
import { DEFAULT_DATE_PROPS } from './props';
import { formatSegments, useFocusManagerRef } from './utils';

import type { ReactElement, Ref } from 'react';

export interface CubeDateInputProps<T extends DateValue = DateValue>
  extends
    Omit<AriaDateFieldProps<T>, 'errorMessage' | 'form' | 'name'>,
    BaseProps,
    FieldLayoutStyleProps,
    FieldBaseProps<T | null | undefined> {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  useLocale?: boolean;
}

function DateInput<T extends DateValue>(
  rawProps: CubeDateInputProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  let props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      value: typeof value === 'string' ? parseAbsoluteDate(value) : value,
      onChange,
    }),
  });
  props = Object.assign({}, DEFAULT_DATE_PROPS, props);

  let {
    qa,
    autoFocus,
    isDisabled,
    inputStyles,
    wrapperStyles,
    isReadOnly,
    isRequired,
    isValid,
    size = 'medium',
    useLocale: useLocaleProp,
  } = props;

  // `wrapperStyles` styles the same box as `styles` and wins over it.
  const { styles, field } = splitFieldLayout(props, {
    overStyles: wrapperStyles,
  });

  let domRef = useRef<HTMLDivElement>(null);

  useFocusManagerRef(ref, domRef);
  let { locale } = useLocale();
  let state = useDateFieldState({
    ...props,
    locale: useLocaleProp ? locale : 'en-US',
    createCalendar,
  });

  if (useLocaleProp == null) {
    state.segments = formatSegments(state.segments);
  }

  let fieldRef = useRef(null);
  let { labelProps, fieldProps } = useDateField(props, state, fieldRef);

  const component = (
    <DateInputBase
      ref={fieldRef}
      wrapperRef={domRef}
      qa={qa || 'DateInput'}
      inputType="dateinput"
      size={size}
      fieldProps={fieldProps}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      autoFocus={autoFocus}
      isInvalid={state.isInvalid}
      isValid={isValid}
      styles={styles}
      inputStyles={inputStyles}
    >
      {state.segments.map((segment, i) => (
        <DatePickerSegment
          key={i}
          segment={segment}
          state={state}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired}
        />
      ))}
    </DateInputBase>
  );

  return wrapWithField(component, {
    ...props,
    ...field,
    labelProps: mergeProps(props.labelProps, labelProps),
  });
}

/**
 * DateInputs allow users to enter and edit date and time values using a keyboard.
 * Each part of a date value is displayed in an individually editable segment.
 */
const _DateInput = forwardRef(DateInput) as <T extends DateValue = DateValue>(
  props: CubeDateInputProps<T> & { ref?: Ref<HTMLElement> },
) => ReactElement | null;

(_DateInput as any).displayName = 'DateInput';

export { _DateInput as DateInput };
