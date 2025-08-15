import { StoryFn } from '@storybook/react-vite';

import { CubeTextProps, Text } from '../index';

import { baseProps } from './lists/baseProps';

export default {
  title: 'Generic/Text',
  component: Text,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template: StoryFn<CubeTextProps> = ({ label, ...args }) => (
  <Text {...args}>{label}</Text>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Plain text',
};
