import { StoryFn } from '@storybook/react-vite';

import { Text } from '../components/content/Text';
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
              <Text preset="t4">{iconName}</Text>
            </Space>
          );
        })}
      </Grid>
      <Title>24px (full-size)</Title>
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
              <Icon size={24} color="#purple-text" />
              <Text preset="t4">{iconName}</Text>
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

/**
 * This story renders every exported icon, which includes `LoadingIcon` — and that
 * carries `.cube-animation-spin`, an infinite 1s rotation (see `GlobalStyles`).
 * A snapshot therefore catches it at whatever angle it happened to reach, and the
 * story diffs against itself on runs where nothing changed.
 *
 * Freeze the rotation for THIS story only. The override is scoped to the wrapper
 * rather than injected globally, so any other story that legitimately shows a
 * spinner in motion — and the docs page, where several stories share a document —
 * is unaffected. `[data-static-spin] .cube-animation-spin` is specificity (0,2,0)
 * against the global rule's (0,1,0), so it wins without `!important`.
 *
 * `animation: none` drops the element back to its untransformed state, i.e. a
 * deterministic 0deg, instead of pausing at an arbitrary frame.
 */
Default.decorators = [
  (Story: StoryFn) => (
    <div data-static-spin="">
      <style>
        {'[data-static-spin] .cube-animation-spin { animation: none; }'}
      </style>
      <Story />
    </div>
  ),
];

export const WithSize = TemplateWithSize.bind({});
WithSize.args = {
  size: '8x',
};

export const Direction = TemplateDirectionIcon.bind({});
Direction.args = {
  to: 'bottom',
};
