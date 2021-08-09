import { Text } from '../components/Text';

export default {
  title: 'UIKit/Generic/Text',
  component: Text,
  argTypes: {
    italic: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    nowrap: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    ellipsis: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    font: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'monospace'],
      },
    },
  },
};

const Template = ({ label, ...args }) => (
  <Text {...args}>{label}</Text>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Plain text',
};
