import { forwardRef, useRef } from 'react';
import { CubeTextInputBaseProps, TextInputBase } from './TextInputBase';
import { useProviderProps } from '../../../provider';
import { useTextField } from '@react-aria/textfield';
import {
  castNullableValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

function TextInput(
  props: WithNullableValue<CubeTextInputBaseProps> | CubeTextInputBaseProps,
  ref,
) {
  let castedProps = castNullableValue(props);

  castedProps = useProviderProps(castedProps);

  let inputRef = useRef(null);
  let { labelProps, inputProps } = useTextField(castedProps, inputRef);

  return (
    <TextInputBase
      {...castedProps}
      labelProps={labelProps}
      inputProps={inputProps}
      ref={ref}
      inputRef={inputRef}
    />
  );
}

/**
 * TextInputs are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _TextInput = Object.assign(forwardRef(TextInput), {
  cubeInputType: 'Text',
});
export { _TextInput as TextInput };
