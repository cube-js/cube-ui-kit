import { ForwardedRef, forwardRef, useRef } from 'react';
import { useTextField } from 'react-aria';

import { useProviderProps } from '../../../provider';
import { mergeProps } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { useFieldProps } from '../../form';

import { CubeTextInputBaseProps, TextInputBase } from './TextInputBase';

export type CubeTextInputProps = WithNullableValue<CubeTextInputBaseProps>;

export { useTextField };

export const TextInput = forwardRef(function TextInput(
  props: CubeTextInputProps,
  ref: ForwardedRef<HTMLElement>,
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

  let {
    labelProps: userLabelProps,
    inputRef: propsInputRef,
    ...restProps
  } = props;
  let localInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  let inputRef = propsInputRef ?? localInputRef;

  let { labelProps, inputProps } = useTextField(restProps, inputRef);

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
