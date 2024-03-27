import { Meta, StoryFn } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { RangeSlider, CubeRangeSliderProps } from './RangeSlider';

export default {
  title: 'Forms/RangeSlider',
  component: RangeSlider,
  args: {
    id: 'name',
    width: '100%',
    defaultValue: [4, 12],
    minValue: 0,
    maxValue: 20,
    step: 2,
  },
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeRangeSliderProps>;

const Template: StoryFn<CubeRangeSliderProps> = (args) => (
  <RangeSlider {...args} />
);

export const Default = Template.bind({});
Default.args = {
  label: 'Slider',
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const WithGradation = Template.bind({});
WithGradation.args = {
  gradation: ['0', '50', '100'],
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  label: 'Slider',
  showValueLabel: false,
};
