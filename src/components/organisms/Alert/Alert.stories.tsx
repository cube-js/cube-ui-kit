import { Alert } from './Alert';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Content/Alert',
  component: Alert,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = (args) => <Alert {...args}>Card content</Alert>;

export const Note = Template.bind({});

export const Success = Template.bind({});
Success.args = {
  type: 'success',
};

export const Danger = Template.bind({});
Danger.args = {
  type: 'danger',
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};
