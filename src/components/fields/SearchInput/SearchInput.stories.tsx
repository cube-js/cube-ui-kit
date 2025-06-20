import { StoryFn } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

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
    /* Content */
    value: {
      control: { type: 'text' },
      description: 'The search value in controlled mode',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default search value in uncontrolled mode',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when input is empty',
    },
    suffix: {
      control: { type: null },
      description:
        'Input decoration after the main input (before clear button)',
    },

    /* Search Specific */
    isClearable: {
      control: { type: 'boolean' },
      description: 'Whether the search input shows a clear button',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Presentation */
    size: {
      options: ['small', 'default', 'large'],
      control: { type: 'radio' },
      description: 'Input size',
      table: {
        defaultValue: { summary: 'default' },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the input can be selected but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether user input is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the input should display valid or invalid visual styling',
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the search value changes',
      control: { type: null },
    },
    onSubmit: {
      action: 'submit',
      description: 'Callback fired when search is submitted',
      control: { type: null },
    },
    onClear: {
      action: 'clear',
      description: 'Callback fired when search is cleared',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the input loses focus',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the input receives focus',
      control: { type: null },
    },
  },
};

const Template: StoryFn<CubeSearchInputProps> = (props) => (
  <SearchInput {...props} onSubmit={(query) => console.log('submit', query)} />
);

export const Default = Template.bind({});
Default.args = {
  label: 'Search',
  placeholder: 'Search products...',
};

export const WithClearButton = Template.bind({});
WithClearButton.args = {
  label: 'Filter items',
  placeholder: 'Type to filter...',
  isClearable: true,
  defaultValue: 'sample search',
};

export const Small = Template.bind({});
Small.args = {
  size: 'small',
  placeholder: 'Quick search...',
  'aria-label': 'Quick search',
};

export const Invalid = Template.bind({});
Invalid.args = {
  label: 'Search Query',
  validationState: 'invalid',
  placeholder: 'Enter at least 3 characters',
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Search (Offline)',
  isDisabled: true,
  placeholder: 'Search unavailable',
};
