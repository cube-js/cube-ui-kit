import { LoadingAnimation } from './LoadingAnimation';

export default {
  title: 'UIKit/Status/LoadingAnimation',
  component: LoadingAnimation,
  argTypes: {
    size: {
      defaultValue: undefined,
      control: {
        type: 'inline-radio',
        options: [undefined, 'small', 'medium', 'large', 128],
      },
    },
  },
};

const Template = ({ size }) => <LoadingAnimation size={size} />;

export const Default = Template.bind({});
Default.args = {};
