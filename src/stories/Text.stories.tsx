import { Text } from '../components/content/Text';
import { baseProps } from './lists/baseProps';

export default {
  title: 'UIKit/Generic/Text',
  component: Text,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ label, ...args }) => <Text {...args}>{label}</Text>;

export const Default = Template.bind({});
Default.args = {
  label: 'Plain text',
};
