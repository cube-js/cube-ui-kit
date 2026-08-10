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
} from './TextInputBase';

export type CubeTextInputProps = WithNullableValue<CubeTextInputBaseProps> &
  CubeBufferedValueProps;

export { useTextField };

export const TextInput = forwardRef(function TextInput(
  props: CubeTextInputProps,
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
    labelProps: userLabelProps,
    inputRef: propsInputRef,
    form,
    isBuffered,
    ...restProps
  } = props;
  let localInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  let inputRef = propsInputRef ?? localInputRef;

  // Hold the typed text locally until the controlled value catches up, so a parent that echoes it
  // back a render late can't overwrite the DOM node and throw the caret to the end.
  let buffered = useBufferedValue(restProps.value, restProps.onChange, {
    isBuffered,
    isDisabled: restProps.isDisabled,
    isReadOnly: restProps.isReadOnly,
  });

  let { labelProps, inputProps } = useTextField(
    {
      ...restProps,
      value: buffered.value,
      onChange: buffered.onChange,
      onBlur: chain(restProps.onBlur, buffered.reset),
    },
    inputRef,
  );

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = mergeProps(labelProps, userLabelProps);

  return (
    <TextInputBase
      {...restProps}
      ref={ref}
      labelProps={mergedLabelProps}
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
