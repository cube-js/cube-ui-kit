import { ForwardedRef, forwardRef, useRef } from 'react';
import { useTextField } from 'react-aria';

import { useProviderProps } from '../../../provider';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { useFieldProps } from '../../form/Form';

import { CubeTextInputBaseProps, TextInputBase } from './TextInputBase';

export type CubeTextInputProps = WithNullableValue<CubeTextInputBaseProps>;

export { useTextField };

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

  let inputRef = useRef(null);
  let { labelProps, inputProps } = useTextField(props, inputRef);

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

/**
 * TextInputs are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */

(TextInput as any).cubeInputType = 'Text';
