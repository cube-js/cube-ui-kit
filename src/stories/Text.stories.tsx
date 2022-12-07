import { Meta, Story } from '@storybook/react';

import { Text, CubeTextProps } from '../components/content/Text';

import { baseProps } from './lists/baseProps';

export default {
  title: 'Generic/Text',
  component: Text,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
} as Meta<CubeTextProps>;

const Template: Story<CubeTextProps> = ({ children, ...args }) => (
  <Text {...args}>{children}</Text>
);

export const Default = Template.bind({});
Default.args = {
  children: 'Plain text',
};
