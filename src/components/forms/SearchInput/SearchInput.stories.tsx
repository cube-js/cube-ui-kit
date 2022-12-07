import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { TEXT_VALUE_ARG } from '../../../stories/FormFieldArgs';

import { CubeSearchInputProps, SearchInput } from './SearchInput';

export default {
  title: 'Forms/SearchInput',
  component: SearchInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TEXT_VALUE_ARG,
  },
} as Meta<CubeSearchInputProps>;

const Template: Story<CubeSearchInputProps> = (args) => (
  <SearchInput {...args} />
);

export const Default = Template.bind({});
Default.args = {};

export const Clearable = Template.bind({});
Clearable.args = {
  isClearable: true,
};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { value: 'Back to the Future' };

export const Invalid = Template.bind({});
Invalid.args = {
  validationState: 'invalid',
};
