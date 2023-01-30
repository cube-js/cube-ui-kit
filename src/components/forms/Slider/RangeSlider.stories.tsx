import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { RangeSlider, CubeRangeSliderProps } from './RangeSlider';

export default {
  title: 'Forms/RangeSlider',
  component: RangeSlider,
  args: {
    id: 'name',
    width: '100%',
    defaultValue: { start: 4, end: 12 },
    minValue: 0,
    maxValue: 20,
    step: 2,
  },
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeRangeSliderProps>;

const Template: Story<CubeRangeSliderProps> = (args) => (
  <RangeSlider {...args} />
);

export const Single = Template.bind({});
Single.args = {
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
