import { forwardRef, useCallback, useRef, useState } from 'react';
import { TextInputBase } from '../TextInput/TextInputBase';
import { useProviderProps } from '../../provider';
import { useTextField } from '@react-aria/textfield';
import { Button } from '../Button/Button';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

function PasswordInput(props, ref) {
  props = useProviderProps({ ...props });

  let [type, setType] = useState('password');
  let inputRef = useRef();

  props.type = type;

  let { labelProps, inputProps } = useTextField(props, inputRef);

  const toggleType = useCallback((e) => {
    setType((type) => (type === 'password' ? 'text' : 'password'));
  }, []);

  props.suffix = (
    <>
      {props.suffix}
      <Button
        type="item"
        onPress={toggleType}
        preventDefault
        place="stretch"
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
      {...props}
    />
  );
}

/**
 * PasswordInputs are password inputs that allow users to input passwords or code entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _PasswordInput = forwardRef(PasswordInput);
export { _PasswordInput as PasswordInput };
