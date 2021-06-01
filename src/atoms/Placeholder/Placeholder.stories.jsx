import React from 'react';
import { Placeholder } from './Placeholder';

export default {
  title: 'UIKit/Atoms/Placeholder',
  component: Placeholder,
  argTypes: {
    circle: {
      control: 'boolean',
      description: 'Use the circle shape',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    size: {
      control: {
        type: 'inline-radio',
        options: [undefined, '2x', '4x', '6x'],
      },
      description: 'Placeholder size',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: undefined },
      },
    },
  },
};

const Template = (args) => <Placeholder {...args} />;

export const Box = Template.bind({});
Box.args = {};

export const BigBox = Template.bind({});
BigBox.args = {
  height: '6x',
};

export const Circle = Template.bind({});
Circle.args = {
  circle: true,
  size: '6x',
};
