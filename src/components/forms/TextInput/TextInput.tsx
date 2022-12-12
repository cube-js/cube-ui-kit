import { ForwardedRef, forwardRef, useRef } from 'react';
import { useTextField } from '@react-aria/textfield';

import { useProviderProps } from '../../../provider';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { useFieldProps } from '../Form';

import { CubeTextInputBaseProps, TextInputBase } from './TextInputBase';

export type CubeTextInputProps = WithNullableValue<CubeTextInputBaseProps>;

/**
 * TextInputs are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
export const TextInput = forwardRef(function TextInput(
  props: CubeTextInputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  props = castNullableStringValue(props);
  props = useProviderProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      onChange,
      value: value?.toString() ?? '',
    }),
  });

  const inputRef = useRef(null);
  const { labelProps, inputProps } = useTextField(props, inputRef);

  return (
    <TextInputBase
      {...props}
      ref={ref}
      labelProps={labelProps}
      inputProps={inputProps}
      inputRef={inputRef}
    />
  );
});
