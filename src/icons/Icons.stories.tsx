import { StoryFn } from '@storybook/react';

import { Title } from '../components/content/Title';
import { Flow } from '../components/layout/Flow';
import { Grid } from '../components/layout/Grid';
import { Space } from '../components/layout/Space';
import { baseProps } from '../stories/lists/baseProps';

import { Icon } from './Icon';

import * as Icons from './index';
import { DirectionIcon, SparklesIcon } from './index';

import type { CubeIconProps } from './Icon';

export default {
  title: 'Content/Icons',
  component: Icon,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template: StoryFn<CubeIconProps> = (name) => {
  return (
    <Flow gap="2x">
      <Title>18px (base size)</Title>
      <Grid columns="repeat(auto-fit, 200px)" flow="row" gap="16px">
        {Object.keys(Icons).map((iconName) => {
          if (
            iconName === 'Icon' ||
            iconName === 'wrapIcon' ||
            iconName === 'DirectionIcon'
          )
            return null;

          const Icon = Icons[iconName];

          return (
            <Space key={iconName} gap="1x">
              <Icon size={18} />
              <span>{iconName}</span>
            </Space>
          );
        })}
      </Grid>
      <Title>36px (double-sized)</Title>
      <Grid columns="repeat(auto-fit, 200px)" flow="row" gap="16px">
        {Object.keys(Icons).map((iconName) => {
          if (
            iconName === 'Icon' ||
            iconName === 'wrapIcon' ||
            iconName === 'DirectionIcon'
          )
            return null;

          const Icon = Icons[iconName];

          return (
            <Space key={iconName} gap="1x">
              <Icon size={36} />
              <span>{iconName}</span>
            </Space>
          );
        })}
      </Grid>
    </Flow>
  );
};

const TemplateWithSize: StoryFn<CubeIconProps> = ({ size }) => {
  return <SparklesIcon size={size} />;
};

const TemplateDirectionIcon: StoryFn<CubeIconProps> = (args) => {
  return <DirectionIcon {...args} />;
};

export const Default = Template.bind({});
Default.args = {};

export const WithSize = TemplateWithSize.bind({});
WithSize.args = {
  size: '8x',
};

export const Direction = TemplateDirectionIcon.bind({});
Direction.args = {
  to: 'bottom',
};
