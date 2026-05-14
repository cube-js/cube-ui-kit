import { ComponentMeta, Story } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Block } from '../../Block';
import { Paragraph } from '../../content/Paragraph';
import { Text } from '../../content/Text';

import { Tooltip } from './Tooltip';
import { CubeTooltipProviderProps, TooltipProvider } from './TooltipProvider';
import { CubeTooltipTriggerProps, TooltipTrigger } from './TooltipTrigger';

export default {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    controls: {
      exclude: baseProps,
    },
  },
} as ComponentMeta<typeof Button>;

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const Template: Story<CubeTooltipTriggerProps> = (args) => (
  <TooltipTrigger {...args}>
    <Button>Hover to show a tooltip</Button>
    <Tooltip>Tooltip content</Tooltip>
  </TooltipTrigger>
);

const ViaProviderTemplate: Story<CubeTooltipProviderProps> = (args) => (
  <TooltipProvider title="Tooltip content" {...args}>
    <Button>Hover to show a tooltip</Button>
  </TooltipProvider>
);

export const Default: typeof Template = Template.bind({});
Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');
  // this is a weird hack that makes tooltip working properly on page load
  await userEvent.unhover(button);
  await userEvent.hover(button);

  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeInTheDocument());
};

export const Side: typeof Template = Template.bind({});
Side.args = { placement: 'right' };
Side.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');
  // this is a weird hack that makes tooltip working properly on page load
  await userEvent.unhover(button);
  await userEvent.hover(button);

  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeInTheDocument());
};

export const ViaProvider: typeof ViaProviderTemplate = ViaProviderTemplate.bind(
  {},
);
ViaProvider.args = {
  delay: 0,
};
ViaProvider.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // wait for TooltipProvider setRendered to true
  await timeout(250);

  const button = await canvas.findByRole('button');
  // this is hack that makes tooltip working properly on page load
  await userEvent.unhover(button);
  await userEvent.hover(button);

  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};

export const ViaProviderWithActiveWrap: typeof ViaProviderTemplate =
  ViaProviderTemplate.bind({});
ViaProviderWithActiveWrap.args = { activeWrap: true, delay: 0 };
ViaProviderWithActiveWrap.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // wait for TooltipProvider setRendered to true
  await timeout(250);

  const button = await canvas.findByRole('button');
  // this is a weird hack that makes tooltip working properly on page load
  await userEvent.unhover(button);
  await userEvent.hover(button);

  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};

export const Light: typeof Template = Template.bind({});
Light.args = { isLight: true };
Light.play = Default.play;

const FunctionPatternTemplate: Story<CubeTooltipProviderProps> = (args) => (
  <Block padding="2.5x">
    <Paragraph>This should show a div with tooltip below:</Paragraph>
    <TooltipProvider title="Tooltip with function pattern" {...args}>
      {(triggerProps, ref) => (
        <Block
          ref={ref as any}
          {...triggerProps}
          display="inline-block"
          padding="1x 2x"
          border="2bw solid #purple"
          radius="0.5r"
          cursor="pointer"
          fill="#purple.10"
          color="#dark"
          styles={{ fontWeight: 'bold' }}
        >
          Hover over this non-focusable element
        </Block>
      )}
    </TooltipProvider>
    <Paragraph>The div should be visible above this text.</Paragraph>
  </Block>
);

export const FunctionPattern: typeof FunctionPatternTemplate =
  FunctionPatternTemplate.bind({});
FunctionPattern.args = { delay: 1000 };
FunctionPattern.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // wait for TooltipProvider setRendered to true
  await timeout(250);

  const div = await canvas.findByText('Hover over this non-focusable element');
  // this is hack that makes tooltip working properly on page load
  await userEvent.unhover(div);
  await userEvent.hover(div);

  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};

const DirectFunctionPatternTemplate: Story<CubeTooltipTriggerProps> = (
  args,
) => (
  <Block padding="2.5x">
    <Paragraph>Direct TooltipTrigger with function pattern:</Paragraph>
    <TooltipTrigger {...args}>
      {(triggerProps, ref) => (
        <Text
          ref={ref as any}
          {...triggerProps}
          display="inline-block"
          padding="0.5x 1x"
          border="1bw solid #danger"
          radius="0.5r"
          cursor="pointer"
          fill="#danger.10"
        >
          Direct function trigger
        </Text>
      )}
      <Tooltip>Direct tooltip content</Tooltip>
    </TooltipTrigger>
  </Block>
);

export const DirectFunctionPattern: typeof DirectFunctionPatternTemplate =
  DirectFunctionPatternTemplate.bind({});
DirectFunctionPattern.args = { delay: 1000 };
DirectFunctionPattern.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const span = await canvas.findByText('Direct function trigger');
  await userEvent.unhover(span);
  await userEvent.hover(span);
  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};
