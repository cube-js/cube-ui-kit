import { Avatar } from './Avatar';
import { DollarCircleOutlined } from '@ant-design/icons';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'Content/Avatar',
  component: Avatar,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ label, icon, ...args }) => (
  <Avatar {...args} icon={icon ? <DollarCircleOutlined /> : null}>
    {label}
  </Avatar>
);

export const Default = Template.bind({});
Default.args = {
  label: 'CU',
};
