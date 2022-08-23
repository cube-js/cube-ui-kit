import { baseProps } from '../../../stories/lists/baseProps';

import { Notification } from './Notification';

export default {
  title: 'Overlays/Notification',
  component: Notification,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    label: {
      defaultValue: 'Notification text',
      control: 'text',
    },
  },
};

const Template = ({ type, label }) => (
  <Notification type={type}>{label}</Notification>
);

export const Note = Template.bind({});
Note.args = {
  type: 'note',
  label: 'Notification text',
};

export const Danger = Template.bind({});
Danger.args = {
  type: 'danger',
  label: 'Notification text',
};

export const Success = Template.bind({});
Success.args = {
  type: 'success',
  label: 'Notification text',
};
