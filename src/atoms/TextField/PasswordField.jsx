import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { TextFieldBase } from './TextFieldBase';
import { useProviderProps } from '../../provider';
import { useTextField } from '@react-aria/textfield';
import { Button } from '../Button/Button';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

function PasswordField(props, ref) {
  props = useProviderProps({ ...props });

  let [type, setType] = useState('password');
  let inputRef = useRef();

  props.type = type;

  let { labelProps, inputProps } = useTextField(props, inputRef);

  const toggleType = useCallback(() => {
    setType((type) => (type === 'password' ? 'text' : 'password'));
  }, []);

  return (
    <TextFieldBase
      {...props}
      labelProps={labelProps}
      inputProps={inputProps}
      ref={ref}
      inputRef={inputRef}
      inputStyles={{ paddingRight: '4x' }}
      type={type}
      wrapperChildren={
        <Button
          type="clear"
          onPress={toggleType}
          color={{
            '': '#dark.50',
            'hovered | pressed': '#purple-text',
          }}
          padding=".5x"
          icon={
            type === 'password' ? <EyeInvisibleOutlined /> : <EyeOutlined />
          }
        />
      }
    />
  );
}

/**
 * PasswordFields are password inputs that allow users to input passwords or code entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _PasswordField = forwardRef(PasswordField);
export { _PasswordField as PasswordField };
