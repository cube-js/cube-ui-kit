import { forwardRef, useRef } from 'react';
import { CubeTextInputBaseProps, TextInputBase } from './TextInputBase';
import { useProviderProps } from '../../provider';
import { useTextField } from '@react-aria/textfield';

function TextInput(props: CubeTextInputBaseProps, ref) {
  props = useProviderProps(props);

  let inputRef = useRef(null);
  let { labelProps, inputProps } = useTextField(props, inputRef);

  return (
    <TextInputBase
      {...props}
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
const _TextInput = forwardRef(TextInput);
export { _TextInput as TextInput };
