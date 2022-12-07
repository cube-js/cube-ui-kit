import { Story } from '@storybook/react';

import { Tag, CubeTagProps } from './Tag';

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

const Template: Story<CubeTagProps> = (args) => <Tag {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Tag name or content',
};
