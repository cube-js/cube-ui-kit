import { Spin } from './Spin';

export default {
  title: 'UIKit/Atoms/Spin',
  component: Spin,
  argTypes: {
    size: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'small', 'default', 'large', 8],
      },
    },
  },
};

const Template = ({ size }) => <Spin size={size} />;

export const Default = Template.bind({});
Default.args = {};
