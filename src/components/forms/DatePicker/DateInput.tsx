/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { forwardRef, ReactElement, useRef } from 'react';
import { createCalendar } from '@internationalized/date';
import { DateValue, SpectrumDateFieldProps } from '@react-types/datepicker';
import { Field } from '@react-spectrum/label';
import { FocusableRef } from '@react-types/shared';
import { useDateField } from '@react-aria/datepicker';
import { useDateFieldState } from '@react-stately/datepicker';
import { useLocale } from '@react-aria/i18n';

import { useProviderProps } from '../../../provider';

import { useFocusManagerRef, useFormatHelpText } from './utils';
import { Input } from './Input';
import { DatePickerSegment } from './DatePickerSegment';

function DateInput<T extends DateValue>(
  props: SpectrumDateFieldProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useProviderProps(props);
  let { autoFocus, isDisabled, isReadOnly, isRequired, isQuiet } = props;

  let domRef = useFocusManagerRef(ref);
  let { locale } = useLocale();
  let state = useDateFieldState({
    ...props,
    locale,
    createCalendar,
  });

  let fieldRef = useRef(null);
  let inputRef = useRef(null);
  let {
    labelProps,
    fieldProps,
    inputProps,
    descriptionProps,
    errorMessageProps,
  } = useDateField(
    {
      ...props,
      inputRef,
    },
    state,
    fieldRef,
  );

  // Note: this description is intentionally not passed to useDatePicker.
  // The format help text is unnecessary for screen reader users because each segment already has a label.
  let description = useFormatHelpText(props);
  if (description && !props.description) {
    descriptionProps.id = null;
  }

  return (
    <Field
      {...props}
      ref={domRef}
      elementType="span"
      description={description}
      labelProps={labelProps}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      validationState={state.validationState}
    >
      <Input
        ref={fieldRef}
        fieldProps={fieldProps}
        isDisabled={isDisabled}
        isQuiet={isQuiet}
        autoFocus={autoFocus}
        validationState={state.validationState}
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
        <input {...inputProps} ref={inputRef} />
      </Input>
    </Field>
  );
}

/**
 * DateFields allow users to enter and edit date and time values using a keyboard.
 * Each part of a date value is displayed in an individually editable segment.
 */
const _DateField = forwardRef(DateInput) as <T extends DateValue>(
  props: SpectrumDateFieldProps<T> & { ref?: FocusableRef<HTMLElement> },
) => ReactElement;
export { _DateField as DateField };
