import { Story } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';

import { FileInput } from './FileInput';

import type { CubeFileInputProps } from './FileInput';

export default {
  title: 'Forms/FileInput',
  component: FileInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template: Story<CubeFileInputProps> = (props) => (
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
