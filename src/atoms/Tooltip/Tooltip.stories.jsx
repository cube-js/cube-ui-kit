import React from 'react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button/Button';
import { TooltipTrigger } from './TooltipTrigger';
import { IS_DISABLED_ARG } from '../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Atoms/Tooltip',
  component: Tooltip,
  argTypes: {
    placement: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'top', 'right', 'bottom', 'left'],
      },
      description: 'The placement of the element with respect to its anchor element.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    delay: {
      defaultValue: undefined,
      control: 'number',
      description: 'The delay time for the tooltip to show up. See guidelines.',
    },
    trigger: {
      defaultValue: undefined,
      control: {
        type: 'inline-radio',
        options: [undefined, 'focus'],
      },
      description: 'By default, opens for both focus and hover. Can be made to open only for focus.',
    },
    isDisabled: {
      defaultValue: false,
      description: 'Whether the tooltip should be disabled, independent from the trigger.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    offset: {
      defaultValue: undefined,
      control: 'number',
      description: 'The additional offset applied along the main axis between the element and its anchor element.',
    },
    crossOffset: {
      defaultValue: undefined,
      control: 'number',
      description: 'The additional offset applied along the cross axis between the element and its anchor element.',
    },
    shouldFlip: {
      defaultValue: undefined,
      control: {
        type: 'inline-radio',
        options: [undefined, false, true],
      },
      description: 'Whether the element should flip its orientation (e.g. top to bottom or left to right) when there is insufficient room for it to render completely.',
    },
  },
};

const Template = (args) => (
  <TooltipTrigger {...args}>
    <Button margin="8x 18x">
      Hover to show a tooltip
    </Button>
    <Tooltip>Tooltip content</Tooltip>
  </TooltipTrigger>
);

export const Default = Template.bind({});
Default.args = {};
