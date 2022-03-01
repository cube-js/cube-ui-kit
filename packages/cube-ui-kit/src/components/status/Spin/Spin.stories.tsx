import { Spin } from './Spin';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Status/Spin',
  component: Spin,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ size }) => <Spin size={size} />;

export const Default = Template.bind({});
Default.args = {};
