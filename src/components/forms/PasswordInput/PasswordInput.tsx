import { forwardRef, useCallback, useRef, useState } from 'react';
import {
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';
import { useProviderProps } from '../../../provider';
import { useTextField } from '@react-aria/textfield';
import { Button } from '../../actions';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

function PasswordInput(props: WithNullableValue<CubeTextInputBaseProps>, ref) {
  props = castNullableStringValue(props);

  let { suffix, multiLine, ...otherProps } = useProviderProps({ ...props });
  let [type, setType] = useState('password');
  let inputRef = useRef(null);
  let { labelProps, inputProps } = useTextField(
    {
      ...otherProps,
      type,
    },
    inputRef,
  );

  const toggleType = useCallback((e) => {
    setType((type) => (type === 'password' ? 'text' : 'password'));
  }, []);

  const wrappedSuffix = (
    <>
      {suffix}
      <Button
        type="neutral"
        htmlType="button"
        onPress={toggleType}
        placeSelf="stretch"
        height="auto"
        radius="right (1r - 1bw)"
        padding=".5x 1x"
        width="auto"
        label="Toggle masking"
        excludeFromTabOrder
        icon={type === 'password' ? <EyeInvisibleOutlined /> : <EyeOutlined />}
      />
    </>
  );

  return (
    <TextInputBase
      labelProps={labelProps}
      inputProps={inputProps}
      ref={ref}
      inputRef={inputRef}
      inputStyles={{ paddingRight: '4x' }}
      type={type}
      suffixPosition="after"
      suffix={wrappedSuffix}
      multiLine={multiLine}
      {...otherProps}
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
