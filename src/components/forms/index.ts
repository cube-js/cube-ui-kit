import { TextInput } from './TextInput/TextInput';
import { PasswordInput } from './PasswordInput/PasswordInput';
import { NumberInput } from './NumberInput/NumberInput';
import { FileInput } from './FileInput/FileInput';
import { TextArea } from './TextArea/TextArea';

const Input = Object.assign(
  TextInput as typeof TextInput & {
    Text: typeof TextInput;
    Password: typeof PasswordInput;
    Number: typeof NumberInput;
    TextArea: typeof TextArea;
    File: typeof FileInput;
  },
  {
    Text: TextInput,
    Password: PasswordInput,
    Number: NumberInput,
    TextArea: TextArea,
    File: FileInput,
  },
);

export { Input, TextInput, NumberInput, TextArea, PasswordInput, FileInput };
