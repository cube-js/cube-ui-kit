import { DollarCircleOutlined } from '@ant-design/icons';

import { Tag } from './Tag';

export default {
  title: 'Content/Tag',
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
    isClosable: {
      defaultValue: false,
      description: 'Whether the tag is closable',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
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

const Template = ({ label, ...props }) => (
  <Tag {...props} onClose={() => console.log('close')}>
    {label}
  </Tag>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Tag name or content',
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  icon: <DollarCircleOutlined />,
  label: 'Tag name or content',
};

export const Closable = Template.bind({});
Closable.args = {
  label: 'Tag name or content',
  isClosable: true,
};
