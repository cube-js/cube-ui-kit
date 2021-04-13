import React from 'react';

import UIKitSkeleton from './Skeleton';

// fix component name
const Skeleton = (args) => <UIKitSkeleton {...args} />;

export default {
  title: 'UIKit/Atoms/Skeleton',
  component: Skeleton,
  argTypes: {
    size: {
      control: {
        type: 'radio',
        options: [undefined, 'page', 'topbar', 'menu'],
      },
      description: 'Skeleton layout',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: undefined },
      },
    },
  },
};

const Template = (args) => <Skeleton {...args} />;

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
