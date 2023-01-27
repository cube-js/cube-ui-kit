import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { RangeSlider, CubeRangeSliderProps } from './RangeSlider';

export default {
  title: 'Forms/RangeSlider',
  component: RangeSlider,
  args: { id: 'name', width: '100%' },
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeRangeSliderProps>;

const Template: Story<CubeRangeSliderProps> = (args) => (
  <RangeSlider {...args} />
);

export const Single = Template.bind({});

Single.args = {
  defaultValue: { start: 4, end: 12 },
  minValue: 0,
  maxValue: 20,
  step: 2,
  label: 'Slider',
  gradation: ['0', '50', '100'],
};
