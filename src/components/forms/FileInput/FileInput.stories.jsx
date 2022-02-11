import { FileInput } from './FileInput';
import {
  MESSAGE_ARG,
  IS_DISABLED_ARG,
  IS_REQUIRED_ARG,
  LABEL_ARG,
  LABEL_POSITION_ARG,
  VALIDATION_STATE_ARG,
  SIZE_ARG,
} from '../../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Forms/FileInput',
  component: FileInput,
  argTypes: {
    ...IS_DISABLED_ARG,
    ...VALIDATION_STATE_ARG,
    ...IS_REQUIRED_ARG,
    ...SIZE_ARG,
    ...MESSAGE_ARG,
    ...LABEL_ARG,
    ...LABEL_POSITION_ARG,
    type: {
      control: 'radio',
      options: ['file', 'text'],
    },
    placeholder: {
      defaultValue: null,
      control: 'text',
    },
  },
};

const Template = ({ icon, ...props }) => (
  <FileInput {...props} onChange={(query) => console.log('change', query)} />
);

export const Default = Template.bind({});
Default.args = {};
