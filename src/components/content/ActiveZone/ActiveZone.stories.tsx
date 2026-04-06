import { baseProps } from '../../../stories/lists/baseProps';
import { Tooltip } from '../../overlays/Tooltip/Tooltip';
import { TooltipTrigger } from '../../overlays/Tooltip/TooltipTrigger';

import { ActiveZone } from './ActiveZone';

import type { StoryFn } from '@storybook/react-vite';

export default {
  title: 'Content/ActiveZone',
  component: ActiveZone,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ isDisabled, label }) => (
  <ActiveZone isDisabled={isDisabled}>{label}</ActiveZone>
);

const TooltipTemplate = ({ isDisabled, label }) => (
  <TooltipTrigger>
    <ActiveZone isDisabled={isDisabled}>{label}</ActiveZone>
    <Tooltip>Tooltip</Tooltip>
  </TooltipTrigger>
);

export const Default: StoryFn = Template.bind({});
Default.args = {
  label: 'ActiveZone',
};

export const WithTooltip: StoryFn = TooltipTemplate.bind({});
WithTooltip.args = {
  label: 'ActiveZone',
};
