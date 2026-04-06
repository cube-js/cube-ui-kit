import { baseProps } from '../../../stories/lists/baseProps';

import { Skeleton } from './Skeleton';

import type { StoryFn } from '@storybook/react-vite';

export default {
  title: 'Content/Skeleton',
  component: Skeleton,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = (args) => {
  return <Skeleton {...args} />;
};

export const Page: StoryFn = Template.bind({});
Page.args = {
  layout: 'page',
  qa: 'CustomSkeleton',
};

export const Topbar: StoryFn = Template.bind({});
Topbar.args = {
  layout: 'topbar',
};

export const Menu: StoryFn = Template.bind({});
Menu.args = {
  layout: 'menu',
};

export const Tabs: StoryFn = Template.bind({});
Tabs.args = {
  layout: 'tabs',
};

export const Stats: StoryFn = Template.bind({});
Stats.args = {
  layout: 'stats',
};

export const Table: StoryFn = Template.bind({});
Table.args = {
  layout: 'table',
};

export const Chart: StoryFn = Template.bind({});
Chart.args = {
  layout: 'chart',
  columns: 16,
};

export const StaticPage: StoryFn = Template.bind({});
StaticPage.args = {
  layout: 'page',
  isStatic: true,
};
