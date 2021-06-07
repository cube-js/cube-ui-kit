import React, { forwardRef, useRef } from 'react';
import { TextFieldBase } from './TextFieldBase';
import { useProviderProps } from '../../provider';
import { useTextField } from '@react-aria/textfield';

function TextField(props, ref) {
  props = useProviderProps(props);

  let inputRef = useRef();
  let { labelProps, inputProps } = useTextField(props, inputRef);

  return (
    <TextFieldBase
      {...props}
      labelProps={labelProps}
      inputProps={inputProps}
      ref={ref}
      inputRef={inputRef}
    />
  );
}

/**
 * TextFields are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _TextField = forwardRef(TextField);
export { _TextField as TextField };
