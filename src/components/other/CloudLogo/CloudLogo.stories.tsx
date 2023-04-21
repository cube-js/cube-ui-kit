import { baseProps } from '../../../stories/lists/baseProps';

import { CloudLogo } from './CloudLogo';

export default {
  title: 'Other/CloudLogo',
  component: CloudLogo,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = () => <CloudLogo />;

export const Default = Template.bind({});
Default.args = {};
