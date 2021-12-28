import { Text } from '../components/content/Text';

export default {
  title: 'UIKit/Generic/Text',
  component: Text,
  argTypes: {
    italic: {
      // defaultValue: false,
      control: 'boolean',
    },
    nowrap: {
      // defaultValue: false,
      control: 'boolean',
    },
    ellipsis: {
      // defaultValue: false,
      control: 'boolean',
    },
    font: {
      // defaultValue: undefined,
      control: 'radio',
      options: [undefined, 'monospace'],
    },
  },
};

const Template = ({ label, ...args }) => <Text {...args}>{label}</Text>;

export const Default = Template.bind({});
Default.args = {
  label: 'Plain text',
};
