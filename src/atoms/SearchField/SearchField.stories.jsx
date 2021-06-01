import React from 'react';
import { SearchField } from './SearchField';

export default {
  title: 'UIKit/Atoms/SearchField',
  component: SearchField,
  argTypes: {
    isDisabled: {
      defaultValue: false,
      description: 'Disables the button.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isClearable: {
      defaultValue: false,
      description: 'Show clear button',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
  },
};

const Template = (args) => (
  <SearchField {...args} onSubmit={(query) => console.log('result', query)} />
);

export const Default = Template.bind({});
Default.args = {};

export const Clearable = Template.bind({});
Clearable.args = {
  isClearable: true,
};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { value: 'default value' };
