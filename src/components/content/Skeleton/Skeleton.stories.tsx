import { Skeleton } from './Skeleton';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Content/Skeleton',
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

export const Page = Template.bind({});
Page.args = {
  layout: 'page',
};

export const Topbar = Template.bind({});
Topbar.args = {
  layout: 'topbar',
};

export const Menu = Template.bind({});
Menu.args = {
  layout: 'menu',
};

export const Tabs = Template.bind({});
Tabs.args = {
  layout: 'tabs',
};

export const Stats = Template.bind({});
Stats.args = {
  layout: 'stats',
};

export const Table = Template.bind({});
Table.args = {
  layout: 'table',
};

export const Chart = Template.bind({});
Chart.args = {
  layout: 'chart',
  columns: 16,
};
