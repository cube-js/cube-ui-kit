import { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';

import { CopyPasteBlock, CubeCopyPasteBlockProps } from './CopyPasteBlock';

export default {
  title: 'Content/CopyPasteBlock',
  component: CopyPasteBlock,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
} as Meta<typeof CopyPasteBlock>;

const Template: StoryFn<CubeCopyPasteBlockProps> = (args) => {
  const [value, setValue] = useState('');

  return (
    <CopyPasteBlock
      placeholder="Select the block and paste your text without spaces here"
      {...args}
      value={args.value ? args.value : value}
      onPaste={(text) => {
        if (!text.includes(' ')) {
          setValue(text);
        } else {
          throw 'The string should not contain spaces';
        }
      }}
      onCopy={() => console.log('! copied', value)}
    />
  );
};

export const Empty = Template.bind({});
Empty.args = {};

export const WithValue = Template.bind({});
WithValue.args = {
  value: 'some long text',
};

export const Small = Template.bind({});
Small.args = {
  value: 'some long text',
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  value: 'some long text',
  size: 'large',
};

export const WithLongValue = Template.bind({});
WithLongValue.args = {
  value:
    'some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text some long text',
};

export const MultiLineNowrap = Template.bind({});
MultiLineNowrap.args = {
  value: 'some long text\nsome long text',
};
