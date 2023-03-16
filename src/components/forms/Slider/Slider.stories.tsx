import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { Slider, CubeSliderProps } from './Slider';

export default {
  title: 'Forms/Slider',
  component: Slider,
  args: {
    id: 'name',
    width: '200px',
    defaultValue: 6,
    minValue: 0,
    maxValue: 20,
    step: 2,
  },
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeSliderProps>;

const Template: Story<CubeSliderProps> = (args) => <Slider {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Slider',
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  label: 'Slider',
  showValueLabel: false,
};

export const WithCustomValue = Template.bind({});
WithCustomValue.args = {
  label: 'Slider',
  getValueLabel(val) {
    return `(${val})`;
  },
};

export const Vertical = Template.bind({});
Vertical.args = {
  orientation: 'vertical',
};
