import { LABEL_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

import { PasswordInput } from './PasswordInput';

export default {
  title: 'Forms/PasswordInput',
  component: PasswordInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...LABEL_ARG,
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
