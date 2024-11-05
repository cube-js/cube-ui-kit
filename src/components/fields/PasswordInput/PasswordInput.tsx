import { forwardRef, useCallback, useRef, useState } from 'react';
import { useTextField } from 'react-aria';

import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';
import { useProviderProps } from '../../../provider';
import { Button } from '../../actions';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { useFieldProps } from '../../form/Form';
import { EyeIcon, EyeInvisibleIcon } from '../../../icons';

export interface CubePasswordInputProps
  extends WithNullableValue<CubeTextInputBaseProps> {}

function PasswordInput(props: CubePasswordInputProps, ref) {
  props = castNullableStringValue(props);
  props = useProviderProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value?.toString() ?? '',
      onChange,
    }),
  });

  let [type, setType] = useState('password');
  let inputRef = useRef(null);
  let { labelProps, inputProps } = useTextField(
    {
      ...props,
      type,
    },
    inputRef,
  );

  const { suffix, multiLine, ...rest } = props;

  const toggleType = useCallback(() => {
    setType((type) => (type === 'password' ? 'text' : 'password'));
  }, []);

  const wrappedSuffix = (
    <>
      {suffix}
      <Button
        excludeFromTabOrder
        type="neutral"
        htmlType="button"
        placeSelf="stretch"
        height="auto"
        radius="right"
        width="4x"
        label="Toggle masking"
        icon={type === 'password' ? <EyeInvisibleIcon /> : <EyeIcon />}
        onPress={toggleType}
      />
    </>
  );

  return (
    <TextInputBase
      ref={ref}
      labelProps={labelProps}
      inputProps={inputProps}
      inputRef={inputRef}
      inputStyles={{ paddingRight: '4x' }}
      type={type}
      suffixPosition="after"
      suffix={wrappedSuffix}
      multiLine={multiLine}
      {...rest}
    />
  );
}

/**
 * PasswordInputs are password inputs that allow users to input passwords or code entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _PasswordInput = forwardRef(PasswordInput);

(_PasswordInput as any).cubeInputType = 'Text';

export { _PasswordInput as PasswordInput };
