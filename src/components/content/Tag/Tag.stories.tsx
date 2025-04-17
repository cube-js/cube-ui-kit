import { DollarCircleOutlined } from '@ant-design/icons';
import { StoryFn } from '@storybook/react';

import { CubeTagProps, Tag } from './Tag';

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

const Template: StoryFn<CubeTagProps> = ({ ...props }) => (
  <Tag {...props} onClose={() => console.log('! onClose')} />
);

export const Default = Template.bind({});
Default.args = {
  children: 'Tag name or content',
};

export const Danger = Template.bind({});
Danger.args = {
  children: 'Tag name or content',
  theme: 'danger',
};

export const Success = Template.bind({});
Success.args = {
  children: 'Tag name or content',
  theme: 'success',
};

export const Note = Template.bind({});
Note.args = {
  children: 'Tag name or content',
  theme: 'note',
};

export const Disabled = Template.bind({});
Disabled.args = {
  children: 'Tag name or content',
  theme: 'disabled',
};

export const Special = Template.bind({});
Special.args = {
  children: 'Tag name or content',
  theme: 'special',
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  children: 'Tag name or content',
  icon: <DollarCircleOutlined />,
  label: 'Tag name or content',
};

export const Closable = Template.bind({});
Closable.args = {
  children: 'Tag name or content',
  label: 'Tag name or content',
  isClosable: true,
};
