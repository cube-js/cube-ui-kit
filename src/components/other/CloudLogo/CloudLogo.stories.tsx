import { baseProps } from '../../../stories/lists/baseProps';

import { CloudLogo } from './CloudLogo';

import type { StoryFn } from '@storybook/react-vite';

export default {
  title: 'Other/CloudLogo',
  component: CloudLogo,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = () => <CloudLogo />;

export const Default: StoryFn = Template.bind({});
Default.args = {};
