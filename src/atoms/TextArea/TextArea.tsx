import React, { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import { TextInputBase } from '../TextInput/TextInputBase';
import { useControlledState } from '@react-stately/utils';
import { useProviderProps } from '../../provider';
import { useTextField } from '@react-aria/textfield';
import { chain } from '@react-aria/utils';

function TextArea(props, ref) {
  props = useProviderProps(props);
  let {
    autoSize = false,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    onChange,
    rows,
    ...otherProps
  } = props;

  rows = rows || 3;

  let [inputValue, setInputValue] = useControlledState(
    props.value,
    props.defaultValue,
    () => {},
  );
  let inputRef = useRef();

  let onHeightChange = useCallback(() => {
    if (autoSize && inputRef.current) {
      let input = inputRef.current;
      let prevAlignment = input.style.alignStyle;
      let computedStyle = getComputedStyle(input);
      input.style.alignSelf = 'start';
      input.style.height = 'auto';
      input.style.height = input.scrollHeight
        ? `calc(${input.scrollHeight}px + (2 * var(--border-width)))`
        : `${
            parseFloat(computedStyle.paddingTop) +
            parseFloat(computedStyle.paddingBottom) +
            parseFloat(computedStyle.lineHeight * rows) +
            2
          }px`;
      input.style.alignSelf = prevAlignment;
    }
  }, [inputRef]);

  useLayoutEffect(() => {
    if (inputRef.current) {
      onHeightChange();
    }
  }, [onHeightChange, inputValue, inputRef]);

  let { labelProps, inputProps } = useTextField(
    {
      ...props,
      onChange: chain(onChange, setInputValue),
      inputElementType: 'textarea',
    },
    inputRef,
  );

  return (
    <TextInputBase
      {...otherProps}
      ref={ref}
      inputRef={inputRef}
      labelProps={labelProps}
      inputProps={inputProps}
      multiLine
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      rows={rows}
    />
  );
}

/**
 * TextInputs are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _TextArea = forwardRef(TextArea);
export { _TextArea as TextArea };
