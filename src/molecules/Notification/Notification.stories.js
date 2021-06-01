import React from 'react';
import { Notification } from './Notification';

export default {
  title: 'UIKit/Molecules/Notification',
  component: Notification,
  argTypes: {
    type: {
      defaultValue: 'note',
      control: {
        type: 'radio',
        options: ['danger', 'success', 'note'],
      },
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
