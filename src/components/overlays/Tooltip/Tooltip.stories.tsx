import { Tooltip } from './Tooltip';
import { Button } from '../../actions/Button/Button';
import { TooltipTrigger } from './TooltipTrigger';
import { TooltipProvider } from './TooltipProvider';
import { Block } from '../../Block';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Overlays/Tooltip',
  component: Tooltip,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = (args) => (
  <TooltipTrigger {...args}>
    <Button margin="8x 18x">Hover to show a tooltip</Button>
    <Tooltip>Tooltip content</Tooltip>
  </TooltipTrigger>
);

const ViaProviderTemplate = (args) => (
  <TooltipProvider title="Tooltip content" {...args}>
    <Button margin="8x 18x">Hover to show a tooltip</Button>
  </TooltipProvider>
);

const ViaProviderWithActiveWrapTemplate = (args) => (
  <Block padding="8x 18x">
    <TooltipProvider title="Tooltip content" activeWrap {...args}>
      Hover to show a tooltip
    </TooltipProvider>
  </Block>
);

export const Default = Template.bind({});
Default.args = {};

export const ViaProvider = ViaProviderTemplate.bind({});
ViaProvider.args = {};

export const ViaProviderWithActiveWrap = ViaProviderWithActiveWrapTemplate.bind(
  {},
);
ViaProviderWithActiveWrap.args = {};
