import { ActiveZone } from './ActiveZone';
import { TooltipTrigger } from '../../overlays/Tooltip/TooltipTrigger';
import { Tooltip } from '../../overlays/Tooltip/Tooltip';

export default {
  title: 'UIKit/Content/ActiveZone',
  component: ActiveZone,
  argTypes: {
    isDisabled: {
      defaultValue: false,
      description: 'Disables the button.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    label: {
      defaultValue: 'ActiveZone',
      control: 'text',
    },
  },
};

const Template = ({
  isDisabled,
  label,
}) => (
  <ActiveZone
    isDisabled={isDisabled}
  >
    {label}
  </ActiveZone>
);

const TooltipTemplate = ({
  isDisabled,
  label,
}) => (
  <TooltipTrigger>
    <ActiveZone isDisabled={isDisabled}>
      {label}
    </ActiveZone>
    <Tooltip>Tooltip</Tooltip>
  </TooltipTrigger>
)

export const Default = Template.bind({});
Default.args = {
  label: 'ActiveZone',
};

export const WithTooltip = TooltipTemplate.bind({});
WithTooltip.args = {
  label: 'ActiveZone',
};
