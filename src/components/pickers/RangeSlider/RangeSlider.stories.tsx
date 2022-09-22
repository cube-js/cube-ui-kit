import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { MULTIPLE_NUMBER_VALUE_ARG } from '../../../stories/FormFieldArgs';

import { CubeRangeSliderProps, RangeSlider } from './RangeSlider';

export default {
  title: 'Pickers/RangeSlider',
  component: RangeSlider,
  args: { id: 'name', width: '200px' },
  parameters: { controls: { exclude: baseProps } },
  argTypes: { ...MULTIPLE_NUMBER_VALUE_ARG },
} as Meta<CubeRangeSliderProps>;

const Template: Story<CubeRangeSliderProps> = (args) => (
  <>
    <RangeSlider {...args} />
  </>
);

export const Default = Template.bind({
  defaultValue: [20, 80],
  minValue: 0,
  maxValue: 100,
  step: 2,
});
