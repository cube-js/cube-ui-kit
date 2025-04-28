import { ForwardedRef, forwardRef } from 'react';

import { FileInput } from '../FileInput/FileInput';
import { NumberInput } from '../NumberInput/NumberInput';
import { PasswordInput } from '../PasswordInput/PasswordInput';
import { TextArea } from '../TextArea/TextArea';
import { TextInput } from '../TextInput';

type CubeInput = typeof TextInput & {
  Text: typeof TextInput;
  Password: typeof PasswordInput;
  Number: typeof NumberInput;
  TextArea: typeof TextArea;
  File: typeof FileInput;
};

export const Input: CubeInput = Object.assign(
  forwardRef(function Input(props, ref: ForwardedRef<HTMLElement>) {
    return <TextInput ref={ref} {...props} />;
  }),
  {
    Text: TextInput,
    Password: PasswordInput,
    Number: NumberInput,
    TextArea: TextArea,
    File: FileInput,
  },
);
