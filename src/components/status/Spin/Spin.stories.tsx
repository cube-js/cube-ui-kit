import { Meta, StoryFn } from '@storybook/react';

import { Paragraph } from '../../content/Paragraph';

import { Spin } from './Spin';
import { CubeSpinProps } from './types';

export default {
  title: 'Status/Spin',
  component: Spin,
  excludeStories: ['StressTest'],
} as Meta<CubeSpinProps>;

const Template: StoryFn<CubeSpinProps> = (args) => <Spin {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const Small = Template.bind({});
Small.args = { size: 'small' };

export const Large = Template.bind({});
Large.args = { size: 'large' };

export const WithChildren = Template.bind({});
WithChildren.args = { spinning: false, children: <Paragraph>Hello</Paragraph> };

export const StressTest: Story<CubeSpinProps> = (args) => (
  <>
    {Array.from({ length: 500 }).map((_, i) => (
      <Spin key={i} {...args} styles={{ display: 'inline-flex' }} />
    ))}
  </>
);
