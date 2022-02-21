import { PasswordInput } from './PasswordInput';
import { TEXT_VALUE_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Forms/PasswordInput',
  component: PasswordInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TEXT_VALUE_ARG,
  },
};

const Template = (props) => (
  <PasswordInput
    {...props}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};
