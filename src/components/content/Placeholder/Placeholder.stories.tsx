import { baseProps } from '../../../stories/lists/baseProps';

import { Placeholder } from './Placeholder';

import type { StoryFn } from '@storybook/react-vite';

export default {
  title: 'Content/Placeholder',
  component: Placeholder,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = (args) => <Placeholder {...args} />;

export const Box: StoryFn = Template.bind({});
Box.args = {};

export const BigBox: StoryFn = Template.bind({});
BigBox.args = {
  height: '6x',
};

export const Circle: StoryFn = Template.bind({});
Circle.args = {
  circle: true,
  size: '6x',
};

export const Static: StoryFn = Template.bind({});
Static.args = { isStatic: true };
