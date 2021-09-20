import { Alert } from './Alert';

export default {
  title: 'UIKit/Organisms/Alert',
  component: Alert,
  argTypes: {
    type: {
      control: {
        type: 'inline-radio',
        options: [undefined, 'note', 'success', 'danger'],
      },
      description: 'Type of the alert',
      defaultValue: undefined,
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'note' },
      },
    },
  },
};

const Template = (args) => <Alert {...args}>Card content</Alert>;

export const Note = Template.bind({});
Note.args = {};

export const Success = Template.bind({});
Success.args = {
  type: 'success',
};

export const Danger = Template.bind({});
Danger.args = {
  type: 'danger',
};
