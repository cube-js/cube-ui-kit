import { baseProps } from '../../../stories/lists/baseProps';

import { FileInput } from './FileInput';

export default {
  title: 'Forms/FileInput',
  component: FileInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ icon, ...props }) => (
  <FileInput {...props} onChange={(value) => console.log('onChange', value)} />
);

export const Default = Template.bind({});
Default.args = {};
