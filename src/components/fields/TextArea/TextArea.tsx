import { forwardRef, useRef } from 'react';
import { useControlledState } from '@react-stately/utils';
import { useTextField } from 'react-aria';

import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';
import { useProviderProps } from '../../../provider';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { chain, useLayoutEffect } from '../../../utils/react';
import { useFieldProps } from '../../form';
import { useEvent } from '../../../_internal';

export interface CubeTextAreaProps extends CubeTextInputBaseProps {
  /** Whether the textarea should change its size depends on content */
  autoSize?: boolean;
  /** The rows attribute in HTML is used to specify the number of visible text lines for the
   * control i.e. the number of rows to display. */
  rows?: number;
}

function TextArea(props: WithNullableValue<CubeTextAreaProps>, ref) {
  props = castNullableStringValue(props);
  props = useProviderProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      onChange,
      value: value?.toString() ?? '',
    }),
  });
  let {
    autoSize = false,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    onChange,
    rows = 3,
    ...otherProps
  } = props;

  let [inputValue, setInputValue] = useControlledState(
    props.value,
    props.defaultValue,
    () => {},
  );
  let inputRef = useRef<HTMLTextAreaElement>(null);

  let onHeightChange = useEvent(() => {
    if (autoSize && inputRef.current) {
      let input = inputRef.current;
      let prevAlignment = input.style.alignSelf;
      let computedStyle = getComputedStyle(input);
      input.style.alignSelf = 'start';
      input.style.height = 'auto';
      input.style.height = input.scrollHeight
        ? `calc(${input.scrollHeight}px + (2 * var(--border-width)))`
        : `${
            parseFloat(computedStyle.paddingTop) +
            parseFloat(computedStyle.paddingBottom) +
            parseFloat(computedStyle.lineHeight) * (rows || 3) +
            2
          }px`;
      input.style.alignSelf = prevAlignment;
    }
  });

  useLayoutEffect(() => {
    if (inputRef.current) {
      onHeightChange();
    }
  }, [inputValue, inputRef.current]);

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
      ref={ref}
      {...otherProps}
      multiLine
      inputRef={inputRef}
      labelProps={labelProps}
      inputProps={inputProps}
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

(_TextArea as any).cubeInputType = 'Text';
_TextArea.displayName = 'TextArea';

export { _TextArea as TextArea };
