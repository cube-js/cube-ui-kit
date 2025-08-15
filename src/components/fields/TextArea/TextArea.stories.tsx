import { StoryFn } from '@storybook/react-vite';
import { IconCoin } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';

import { CubeTextAreaProps, TextArea } from './TextArea';

export default {
  title: 'Forms/TextArea',
  component: TextArea,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    value: {
      control: { type: 'text' },
      description: 'The text value in controlled mode',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default text value in uncontrolled mode',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when textarea is empty',
    },
    icon: {
      control: { type: null },
      description: 'Icon element rendered before the textarea',
    },
    prefix: {
      control: { type: null },
      description: 'Input decoration before the main textarea',
    },
    suffix: {
      control: { type: null },
      description: 'Input decoration after the main textarea',
    },

    /* TextArea Specific */
    autoSize: {
      control: { type: 'boolean' },
      description:
        'Whether the textarea should change its size based on content',
      table: {
        defaultValue: { summary: false },
      },
    },
    rows: {
      control: { type: 'number' },
      description: 'The number of visible text lines for the control',
      table: {
        defaultValue: { summary: 3 },
      },
    },
    maxRows: {
      control: { type: 'number' },
      description: 'Max number of visible rows when autoSize is true',
      table: {
        defaultValue: { summary: 10 },
      },
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Textarea size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the textarea is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the textarea can be selected but not changed',
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
    isLoading: {
      control: { type: 'boolean' },
      description: 'Show loading spinner and disable interactions',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the textarea should display valid or invalid visual styling',
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
      description: 'Callback fired when the textarea value changes',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the textarea loses focus',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the textarea receives focus',
      control: { type: null },
    },
    onKeyDown: {
      action: 'keyDown',
      description: 'Callback fired when a key is pressed down',
      control: { type: null },
    },
    onKeyUp: {
      action: 'keyUp',
      description: 'Callback fired when a key is released',
      control: { type: null },
    },

    /* Form */
    name: {
      control: { type: 'text' },
      description: 'The name of the textarea element for form submission',
    },
    label: {
      control: { type: 'text' },
      description: 'The label text for the textarea',
    },
    labelPosition: {
      options: ['top', 'side'],
      control: { type: 'radio' },
      description: 'The position of the label relative to the textarea',
      table: {
        defaultValue: { summary: 'top' },
      },
    },
    necessityIndicator: {
      options: ['icon', 'label'],
      control: { type: 'radio' },
      description: 'How to display required or optional indicators',
      table: {
        defaultValue: { summary: 'icon' },
      },
    },
    isInvalid: {
      control: { type: 'boolean' },
      description: 'Whether the current value is invalid',
      table: {
        defaultValue: { summary: false },
      },
    },
    description: {
      control: { type: 'text' },
      description: 'Help text to describe the textarea',
    },
    message: {
      control: { type: 'text' },
      description: 'Error message when validation fails',
    },

    /* Style */
    styles: {
      control: { type: 'object' },
      description:
        'Custom styles object for styling the component and sub-elements',
    },
  },
};

const Template: StoryFn<CubeTextAreaProps> = ({ icon, ...props }) => (
  <TextArea
    icon={icon ? <IconCoin /> : null}
    {...props}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 'default value' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };

export const Password = Template.bind({});
Password.args = { icon: true, type: 'password', defaultValue: 'hidden value' };

export const AutoSize = Template.bind({});
AutoSize.args = { autoSize: true, defaultValue: '1\n2\n3\n4', rows: 2 };

export const AutoSizeMaxRows = Template.bind({});
AutoSizeMaxRows.args = {
  autoSize: true,
  maxRows: 3,
  defaultValue: '1\n2\n3\n4',
  rows: 2,
};
