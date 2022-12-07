import { Meta, Story } from '@storybook/react';
import { CubeBase64UploadProps } from 'src';

import { baseProps } from '../../../stories/lists/baseProps';

import { Base64Upload } from './Base64Upload';

export default {
  title: 'Other/Base64Upload',
  component: Base64Upload,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
} as Meta<CubeBase64UploadProps>;

const Template: Story<CubeBase64UploadProps> = (args) => (
  <Base64Upload {...args} />
);

export const Default = Template.bind({});
