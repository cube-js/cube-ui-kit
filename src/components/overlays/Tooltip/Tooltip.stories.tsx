import { ComponentMeta, Story } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions';

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
  <div style={{ padding: '20px' }}>
    <p>This should show a div with tooltip below:</p>
    <TooltipProvider title="Tooltip with function pattern" {...args}>
      {(triggerProps, ref) => (
        <div
          ref={ref as any}
          {...triggerProps}
          style={{
            padding: '8px 16px',
            border: '2px solid #007acc',
            borderRadius: '4px',
            cursor: '$pointer',
            display: 'inline-block',
            backgroundColor: '#f0f8ff',
            color: '#333',
            fontWeight: 'bold',
          }}
        >
          Hover over this non-focusable element
        </div>
      )}
    </TooltipProvider>
    <p>The div should be visible above this text.</p>
  </div>
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
  <div style={{ padding: '20px' }}>
    <p>Direct TooltipTrigger with function pattern:</p>
    <TooltipTrigger {...args}>
      {(triggerProps, ref) => (
        <span
          ref={ref as any}
          {...triggerProps}
          style={{
            padding: '4px 8px',
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            cursor: '$pointer',
            display: 'inline-block',
            backgroundColor: '#ffe0e0',
          }}
        >
          Direct function trigger
        </span>
      )}
      <Tooltip>Direct tooltip content</Tooltip>
    </TooltipTrigger>
  </div>
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
