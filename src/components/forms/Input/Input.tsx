import { TextInput } from '../TextInput';
import { PasswordInput } from '../PasswordInput/PasswordInput';
import { NumberInput } from '../NumberInput/NumberInput';
import { FileInput } from '../FileInput/FileInput';
import { TextArea } from '../TextArea/TextArea';

type CubeInput = typeof TextInput & {
  Text: typeof TextInput;
  Password: typeof PasswordInput;
  Number: typeof NumberInput;
  TextArea: typeof TextArea;
  File: typeof FileInput;
};

export const Input: CubeInput = Object.assign(TextInput, {
  Text: TextInput,
  Password: PasswordInput,
  Number: NumberInput,
  TextArea: TextArea,
  File: FileInput,
});
