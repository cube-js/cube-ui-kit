import { StoryFn } from '@storybook/react';

import { baseProps } from '../stories/lists/baseProps';
import { Grid } from '../components/layout/Grid';
import { Space } from '../components/layout/Space';
import { Title } from '../components/content/Title';
import { Flow } from '../components/layout/Flow';

import { CubeIconProps, Icon } from './Icon';

import * as Icons from './index';

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
      <Title>16px</Title>
      <Grid columns="repeat(auto-fit, 200px)" flow="row" gap="16px">
        {Object.keys(Icons).map((iconName) => {
          if (iconName === 'Icon' || iconName === 'wrapIcon') return null;

          const Icon = Icons[iconName];

          return (
            <Space key={iconName} gap="1x">
              <Icon size="16px" />
              <span>{iconName}</span>
            </Space>
          );
        })}
      </Grid>
      <Title>32px</Title>
      <Grid columns="repeat(auto-fit, 200px)" flow="row" gap="16px">
        {Object.keys(Icons).map((iconName) => {
          if (iconName === 'IconContainer' || iconName === 'wrapIcon')
            return null;

          const Icon = Icons[iconName];

          return (
            <Space key={iconName} gap="1x">
              <Icon size="32px" />
              <span>{iconName}</span>
            </Space>
          );
        })}
      </Grid>
    </Flow>
  );
};

export const Default = Template.bind({});
Default.args = {};
