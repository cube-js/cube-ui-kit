import { forwardRef, ReactElement, useRef } from 'react';
import { createCalendar } from '@internationalized/date';
import { AriaDateFieldProps, DateValue } from '@react-types/datepicker';
import { FocusableRef } from '@react-types/shared';
import { useDateField } from '@react-aria/datepicker';
import { useDateFieldState } from '@react-stately/datepicker';
import { useLocale } from '@react-aria/i18n';

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

import { useFocusManagerRef } from './utils';
import { DateInputBase } from './DateInputBase';
import { DatePickerSegment } from './DatePickerSegment';
import { DEFAULT_DATE_PROPS } from './props';
import { parseAbsoluteDate } from './parseDate';

export interface CubeDateInputProps<T extends DateValue = DateValue>
  extends AriaDateFieldProps<T>,
    BaseProps,
    ContainerStyleProps,
    FieldBaseProps {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  validationState?: ValidationState;
}

function DateInput<T extends DateValue>(
  props: CubeDateInputProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      value: typeof value === 'string' ? parseAbsoluteDate(value) : value,
      onChange,
    }),
  });
  props = Object.assign({}, DEFAULT_DATE_PROPS, props);

  let {
    autoFocus,
    isDisabled,
    inputStyles,
    wrapperStyles,
    isReadOnly,
    isRequired,
    size = 'medium',
  } = props;

  let styles = extractStyles(props, CONTAINER_STYLES, wrapperStyles);

  let domRef = useFocusManagerRef(ref);
  let { locale } = useLocale();
  let state = useDateFieldState({
    ...props,
    locale,
    createCalendar,
  });

  let fieldRef = useRef(null);
  let { labelProps, fieldProps } = useDateField(props, state, fieldRef);

  const component = (
    <DateInputBase
      ref={fieldRef}
      size={size}
      fieldProps={fieldProps}
      isDisabled={isDisabled}
      autoFocus={autoFocus}
      validationState={state.validationState}
      styles={wrapperStyles}
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

  return wrapWithField(component, domRef, {
    ...props,
    styles,
    labelProps: mergeProps(props.labelProps, labelProps),
  });
}

/**
 * DateInputs allow users to enter and edit date and time values using a keyboard.
 * Each part of a date value is displayed in an individually editable segment.
 */
const _DateInput = forwardRef(DateInput) as <T extends DateValue>(
  props: CubeDateInputProps<T> & { ref?: FocusableRef<HTMLElement> },
) => ReactElement;
export { _DateInput as DateInput };
