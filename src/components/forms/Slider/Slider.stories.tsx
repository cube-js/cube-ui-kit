import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { Slider, CubeSliderProps } from './Slider';

export default {
  title: 'Forms/Slider',
  component: Slider,
  args: { id: 'name', width: '200px' },
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeSliderProps>;

const Template: Story<CubeSliderProps> = (args) => <Slider {...args} />;

export const Default = Template.bind({});

Default.args = {
  defaultValue: 6,
  minValue: 0,
  maxValue: 20,
  step: 2,
  label: 'Slider',
};

export const Vertical = Template.bind({});
Vertical.args = {
  defaultValue: 4,
  minValue: 0,
  maxValue: 20,
  step: 2,
  orientation: 'vertical',
  label: 'Slider',
  // labelPosition: 'side',
};
