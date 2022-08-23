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
  <FileInput {...props} onChange={(query) => console.log('change', query)} />
);

export const Default = Template.bind({});
Default.args = {};
