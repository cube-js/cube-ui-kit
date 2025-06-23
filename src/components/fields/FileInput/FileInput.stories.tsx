import { StoryFn } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';

import { CubeFileInputProps, FileInput } from './FileInput';

export default {
  title: 'Forms/FileInput',
  component: FileInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    placeholder: {
      control: { type: 'text' },
      description: 'Text displayed when no file is selected',
    },
    buttonText: {
      control: { type: 'text' },
      description: 'Text displayed on the selection button',
    },

    /* File Configuration */
    accept: {
      control: { type: 'text' },
      description: 'Comma-separated list of accepted file types',
    },
    multiple: {
      control: { type: 'boolean' },
      description: 'Whether multiple files can be selected',
      table: {
        defaultValue: { summary: false },
      },
    },
    capture: {
      options: [undefined, 'user', 'environment'],
      control: { type: 'radio' },
      description: 'Camera to use for file capture on mobile devices',
    },

    /* Processing */
    type: {
      options: ['file', 'text'],
      control: { type: 'radio' },
      description: 'How to process the selected file(s)',
      table: {
        defaultValue: { summary: 'file' },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the file input is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the file input can be focused but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether file selection is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the file input should display valid or invalid visual styling',
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
      description: 'Callback fired when files are selected',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the file input loses focus',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the file input receives focus',
      control: { type: null },
    },
  },
};

const Template: StoryFn<CubeFileInputProps> = (props) => (
  <FileInput
    qa="FileInput"
    {...props}
    onChange={(value) => console.log('onChange', value)}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const LongFilePlaceholderOverflow = Template.bind({});
LongFilePlaceholderOverflow.args = {
  inputStyles: {
    width: '280px',
  },
  placeholder: 'Very long placeholder here',
};

export const LongFileNameOverflow = Template.bind({});
LongFileNameOverflow.args = {
  inputStyles: {
    width: '300px',
  },
  inputProps: {
    title: 'Test input',
  },
};

LongFileNameOverflow.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const input = await canvas.getByTitle('Test input');
  const file = new File(['test'], 'file-with-a-very-long-name.txt', {
    type: 'text/plain',
  });

  await waitFor(async () => {
    await userEvent.upload(input, file);
  });
};

export const ExtractText = Template.bind({});
ExtractText.args = {
  type: 'text',
  inputStyles: {
    width: '300px',
  },
  inputProps: {
    title: 'Test input',
  },
};

ExtractText.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const input = await canvas.getByTitle('Test input');
  const file = new File(['test'], 'file-with-a-very-long-name.txt', {
    type: 'text/plain',
  });

  await waitFor(async () => {
    await userEvent.upload(input, file);
  });
};
