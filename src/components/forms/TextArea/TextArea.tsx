import { ForwardedRef, forwardRef, useRef } from 'react';
import { useControlledState } from '@react-stately/utils';
import { useTextField } from '@react-aria/textfield';

import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';
import { useProviderProps } from '../../../provider';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { chain, useLayoutEffect } from '../../../utils/react';
import { useFieldProps } from '../Form';
import { useEvent } from '../../../_internal';

export interface CubeTextAreaProps extends CubeTextInputBaseProps {
  /** Whether the textarea should change its size depends on content */
  autoSize?: boolean;
  /** The rows attribute in HTML is used to specify the number of visible text lines for the
   * control i.e the number of rows to display. */
  rows?: number;
}

/**
 * TextInputs are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
export const TextArea = forwardRef(function TextArea(
  props: WithNullableValue<CubeTextAreaProps>,
  ref: ForwardedRef<HTMLTextAreaElement>,
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

  const {
    autoSize = false,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    onChange,
    rows = 3,
    ...otherProps
  } = props;

  const [inputValue, setInputValue] = useControlledState(
    props.value,
    props.defaultValue,
    () => {},
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const onHeightChange = useEvent(() => {
    if (autoSize && inputRef.current) {
      const input = inputRef.current;
      const prevAlignment = input.style.alignSelf;
      const computedStyle = getComputedStyle(input);

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
    onHeightChange();
  }, [onHeightChange, inputValue]);

  const { labelProps, inputProps } = useTextField(
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
});
