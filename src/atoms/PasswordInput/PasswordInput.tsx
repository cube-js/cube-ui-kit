import { forwardRef, useCallback, useRef, useState } from 'react';
import {
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';
import { useProviderProps } from '../../provider';
import { useTextField } from '@react-aria/textfield';
import { Button } from '../Button/Button';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

function PasswordInput(props: CubeTextInputBaseProps, ref) {
  let { suffix, ...otherProps } = useProviderProps({ ...props });

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
        type="item"
        onPress={toggleType}
        preventDefault
        placeSelf="stretch"
        radius="right (1r - 1bw)"
        padding=".5x 1x"
        aria-label="Toggle masking"
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
_PasswordInput.displayName = 'PasswordInput';
export { _PasswordInput as PasswordInput };
