import { Avatar } from './Avatar';
import { DollarCircleOutlined } from '@ant-design/icons';

export default {
  title: 'UIKit/Content/Avatar',
  component: Avatar,
  argTypes: {
    icon: {
      defaultValue: false,
      description: 'Show the icon',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    size: {
      defaultValue: '4x',
      control: {
        type: 'radio',
        options: ['8x', '6x', '4x', '3x'],
      },
    },
    radius: {
      defaultValue: 'round',
      control: {
        type: 'radio',
        options: ['0', '1r', 'round'],
      },
    },
    label: {
      defaultValue: 'CU',
      control: 'text',
      description: 'The content to display inside avatar.',
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
