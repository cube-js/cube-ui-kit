import { baseProps } from '../../../stories/lists/baseProps';

import { Base64Upload } from './Base64Upload';

export default {
  title: 'Other/Base64Upload',
  component: Base64Upload,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = () => <Base64Upload />;

export const Default = Template.bind({});
Default.args = {};
