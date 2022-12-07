import { Meta, Story } from '@storybook/react';
import { CubeBadgeProps } from 'src';

import { baseProps } from '../../../stories/lists/baseProps';

import { Badge } from './Badge';

export default {
  title: 'Content/Badge',
  component: Badge,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
} as Meta<CubeBadgeProps>;

const Template: Story<CubeBadgeProps> = (args) => <Badge {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: '1',
};
