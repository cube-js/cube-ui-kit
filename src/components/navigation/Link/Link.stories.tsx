import { Meta, Story } from '@storybook/react';
import { CubeButtonProps } from 'src';

import { baseProps } from '../../../stories/lists/baseProps';

import { Link } from './Link';

export default {
  title: 'Navigation/Link',
  component: Link,
  args: {
    to: '!https://cube.dev',
    children: 'Link',
  },
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    label: {
      defaultValue: 'Button',
      control: 'text',
    },
  },
} as Meta<CubeButtonProps>;

const Template: Story<CubeButtonProps> = (args) => <Link {...args} />;

export const Default = Template.bind({});
