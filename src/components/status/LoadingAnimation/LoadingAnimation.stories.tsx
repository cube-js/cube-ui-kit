import { LoadingAnimation } from './LoadingAnimation';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'Status/LoadingAnimation',
  component: LoadingAnimation,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ size }) => <LoadingAnimation size={size} />;

export const Default = Template.bind({});
Default.args = {};
