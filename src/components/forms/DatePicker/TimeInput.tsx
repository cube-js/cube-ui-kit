import { forwardRef, ReactElement, useRef } from 'react';
import { FocusableRef } from '@react-types/shared';
import { TimeValue } from '@react-types/datepicker';
import { useLocale } from '@react-aria/i18n';
import { AriaTimeFieldProps, useTimeField } from '@react-aria/datepicker';
import { useTimeFieldState } from '@react-stately/datepicker';

import { wrapWithField } from '../wrapper';
import { useProviderProps } from '../../../provider';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
} from '../../../tasty';
import { FieldBaseProps, ValidationState } from '../../../shared';
import { useFieldProps, useFormProps } from '../Form';

import { DateInputBase } from './DateInputBase';
import { DatePickerSegment } from './DatePickerSegment';
import { useFocusManagerRef } from './utils';
import { DEFAULT_TIME_PROPS } from './props';

export interface CubeTimeInputProps<T extends TimeValue = TimeValue>
  extends AriaTimeFieldProps<T>,
    BaseProps,
    ContainerStyleProps,
    FieldBaseProps {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  validationState?: ValidationState;
}

function TimeInput<T extends TimeValue>(
  props: CubeTimeInputProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
  });

  let styles = extractStyles(props, CONTAINER_STYLES);

  let {
    inputStyles,
    wrapperStyles,
    autoFocus,
    isDisabled,
    isReadOnly,
    isRequired,
    validationState,
    size = 'medium',
  } = props;

  let domRef = useFocusManagerRef(ref);
  let { locale } = useLocale();
  let state = useTimeFieldState({
    ...DEFAULT_TIME_PROPS,
    ...props,
    locale,
  });

  let fieldRef = useRef(null);
  let { labelProps, fieldProps } = useTimeField(props, state, fieldRef);

  const timeInput = (
    <DateInputBase
      ref={fieldRef}
      size={size}
      fieldProps={fieldProps}
      isDisabled={isDisabled}
      autoFocus={autoFocus}
      inputStyles={inputStyles}
      styles={wrapperStyles}
      validationState={validationState}
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

  return wrapWithField(timeInput, domRef, {
    ...props,
    styles,
    labelProps,
  });
}

/**
 * TimeFields allow users to enter and edit time values using a keyboard.
 * Each part of the time is displayed in an individually editable segment.
 */
const _TimeInput = forwardRef(TimeInput) as <T extends TimeValue>(
  props: CubeTimeInputProps<T> & { ref?: FocusableRef<HTMLElement> },
) => ReactElement;
export { _TimeInput as TimeInput };
