import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import {
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';
import { useControlledState } from '@react-stately/utils';
import { useProviderProps } from '../../provider';
import { useTextField } from '@react-aria/textfield';
import { chain } from '@react-aria/utils';

export interface CubeTextAreaProps extends CubeTextInputBaseProps {
  /** Whether the textarea should change its size depends on content */
  autoSize?: boolean;
  /** The rows attribute in HTML is used to specify the number of visible text lines for the
   * control i.e the number of rows to display. */
  rows?: number;
}

function TextArea(props: CubeTextAreaProps, ref) {
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
  let inputRef = useRef<HTMLInputElement>(null);

  let onHeightChange = useCallback(() => {
    if (autoSize && inputRef.current) {
      let input = inputRef.current;
      let prevAlignment = input.style.alignSelf;
      let computedStyle = getComputedStyle(input);
      input.style.alignSelf = 'start';
      input.style.height = 'auto';
      input.style.height = input.scrollHeight
        ? `calc(${input.scrollHeight}px + (2 * var(--border-width)))`
        : `${
            parseFloat(computedStyle.paddingTop)
            + parseFloat(computedStyle.paddingBottom)
            + parseFloat(computedStyle.lineHeight) * (rows || 3)
            + 2
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
