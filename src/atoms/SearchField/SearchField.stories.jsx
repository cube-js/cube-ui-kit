import React from 'react';

import UIKitSearchField from './SearchField';

// fix component name
const SearchField = (args) => <UIKitSearchField {...args} />;

export default {
  title: 'UIKit/Atoms/SearchField',
  component: SearchField,
  argTypes: {
    disabled: {
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
    clearable: {
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
