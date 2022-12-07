import { Meta, Story } from '@storybook/react';

import { TooltipTrigger } from '../../overlays/Tooltip/TooltipTrigger';
import { Tooltip } from '../../overlays/Tooltip/Tooltip';
import { baseProps } from '../../../stories/lists/baseProps';

import { ActiveZone, CubeActiveZoneProps } from './ActiveZone';

export default {
  title: 'Content/ActiveZone',
  component: ActiveZone,
  args: {
    children: 'ActiveZone',
  },
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
} as Meta<CubeActiveZoneProps>;

const Template: Story<CubeActiveZoneProps> = (args) => <ActiveZone {...args} />;

const TooltipTemplate: Story<CubeActiveZoneProps> = (args) => (
  <TooltipTrigger>
    <ActiveZone {...args} />
    <Tooltip>Tooltip</Tooltip>
  </TooltipTrigger>
);

export const Default = Template.bind({});

export const WithTooltip = TooltipTemplate.bind({});
