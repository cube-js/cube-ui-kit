import { Tag } from './Tag';

export default {
  title: 'UIKit/Content/Tag',
  component: Tag,
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
    color: {
      control: {
        type: 'inline-radio',
        options: [undefined, '#dark.50', '#danger', '#success', '#note'],
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

const Template = ({ label, ...props }) => <Tag {...props}>{label}</Tag>;

export const Default = Template.bind({});
Default.args = {
  label: 'SELECT MAX(ts) FROM cubejs_slack.messages',
};
