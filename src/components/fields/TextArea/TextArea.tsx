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
  /** Max number of visible rows when autoSize is `true`  */
  maxVisibleRows?: number;
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
    maxVisibleRows,
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
      const prevAlignment = input.style.alignSelf;
      const computedStyle = getComputedStyle(input);

      const lineHeight = parseFloat(computedStyle.lineHeight);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);
      const borderTop = parseFloat(computedStyle.borderTopWidth);
      const borderBottom = parseFloat(computedStyle.borderBottomWidth);

      input.style.alignSelf = 'start';
      input.style.height = 'auto';

      const scrollHeight = input.scrollHeight;
      input.style.height = `calc(${scrollHeight}px + (2 * var(--border-width)))`;

      input.style.alignSelf = prevAlignment;

      const contentHeight =
        scrollHeight - paddingTop - paddingBottom - borderTop - borderBottom;
      const rowCount = Math.round(contentHeight / lineHeight);

      if (autoSize && maxVisibleRows != null && rowCount > maxVisibleRows) {
        input.style.height = `${maxVisibleRows * lineHeight + paddingTop + paddingBottom}px`;
      }
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
