import { ForwardedRef, forwardRef, useRef } from 'react';
import { useTextField } from 'react-aria';

import { chain, mergeProps, useBufferedValue } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { useFieldProps } from '../../form';
import {
  CubeBufferedValueProps,
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput';
import { useAutoSizeTextArea } from '../TextInput/useAutoSizeTextArea';

export interface CubeTextAreaProps
  extends CubeTextInputBaseProps,
    CubeBufferedValueProps {
  /** Whether the textarea should change its size depends on the content */
  autoSize?: boolean;
  /** Max number of visible rows when autoSize is `true`. Defaults to 10  */
  maxRows?: number;
  /** The `rows` attribute in HTML is used to specify the number of visible text lines for the
   * control i.e. the number of rows to display. Defaults to 3 */
  rows?: number;
}

function TextArea(
  props: WithNullableValue<CubeTextAreaProps>,
  ref: ForwardedRef<HTMLElement>,
) {
  props = castNullableStringValue(props);
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
    maxRows = 10,
    rows = 3,
    labelProps: userLabelProps,
    inputRef: propsInputRef,
    value,
    isBuffered,
    ...otherProps
  } = props;

  rows = Math.max(rows, 1);
  maxRows = Math.max(maxRows, rows);

  let localInputRef = useRef<HTMLTextAreaElement>(null);
  let inputRef = propsInputRef ?? localInputRef;

  // Hold the typed text locally until the controlled value catches up — see `useBufferedValue`.
  const buffered = useBufferedValue(value, onChange, {
    isBuffered,
    isDisabled,
    isReadOnly,
  });

  const adjustHeight = useAutoSizeTextArea({
    inputRef,
    autoSize,
    rows,
    maxRows,
    // Keyed on the rendered value, not the prop, so a buffered draft is measured.
    value: buffered.value,
  });

  let { labelProps, inputProps } = useTextField(
    {
      ...otherProps,
      value: buffered.value,
      isDisabled,
      isReadOnly,
      isRequired,
      onChange: chain(buffered.onChange, adjustHeight),
      onBlur: chain(otherProps.onBlur, buffered.reset),
      inputElementType: 'textarea',
    },
    inputRef,
  );

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = mergeProps(labelProps, userLabelProps);

  return (
    <TextInputBase
      ref={ref}
      {...otherProps}
      multiLine
      inputRef={inputRef}
      labelProps={mergedLabelProps}
      inputProps={{ ...inputProps, 'data-input-type': 'textarea' }}
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
