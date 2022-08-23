import { baseProps } from '../../../stories/lists/baseProps';

import { Badge } from './Badge';

export default {
  title: 'Content/Badge',
  component: Badge,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ label, ...props }) => <Badge {...props}>{label}</Badge>;

export const Default = Template.bind({});
Default.args = {
  label: '1',
};
