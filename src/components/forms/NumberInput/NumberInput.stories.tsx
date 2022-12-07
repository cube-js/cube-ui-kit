import { Meta, Story } from '@storybook/react';
import { SearchOutlined } from '@ant-design/icons';

import { baseProps } from '../../../stories/lists/baseProps';
import { NUMBER_VALUE_ARG } from '../../../stories/FormFieldArgs';
import { CubeNumberInputProps } from '..';

import { NumberInput } from './NumberInput';

export default {
  title: 'Forms/NumberInput',
  component: NumberInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...NUMBER_VALUE_ARG,
  },
} as Meta<CubeNumberInputProps>;

const Template: Story<CubeNumberInputProps> = (args) => (
  <NumberInput {...args} />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 5 };

export const Small = Template.bind({});
Small.args = {
  size: 'small',
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  icon: <SearchOutlined />,
};
