import { Meta, StoryFn } from '@storybook/react-vite';

import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { Alert } from './Alert';
import { CubeAlertProps } from './types';

export default {
  title: 'Content/Alert',
  component: Alert,
  parameters: { controls: { exclude: baseProps } },
  args: { children: 'Card content' },
} as Meta<typeof Alert>;

const Template: StoryFn<CubeAlertProps> = (args) => <Alert {...args} />;

const THEMES = [
  'note',
  'success',
  'danger',
  'warning',
  'special',
  'disabled',
] as const;

export const Default = Template.bind({});

export const Themes: StoryFn<CubeAlertProps> = (args) => (
  <Space gap="1.5x" flow="column">
    {THEMES.map((theme) => (
      <Alert {...args} key={theme} theme={theme}>
        {theme}
      </Alert>
    ))}
  </Space>
);

Themes.parameters = {
  docs: {
    description: {
      story:
        'Every theme in one image. `note` is the default, which is why `Default` above looks like the first row. Sweeping them together is what makes an inconsistency between two themes visible — one theme drifting off the shared surface/border pairing shows up here and nowhere else.',
    },
  },
};

export const Shapes: StoryFn<CubeAlertProps> = (args) => (
  <Space gap="1.5x" flow="column">
    <Alert {...args} shape="card" theme="success">
      card — `1cr` radius and a border (default)
    </Alert>
    <Alert {...args} shape="sharp" theme="success">
      sharp — no radius, no border
    </Alert>
  </Space>
);

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

Disabled.parameters = {
  docs: {
    description: {
      story:
        '`isDisabled` overrides the theme rather than tinting it, so a disabled `danger` alert is indistinguishable from a disabled `note` one. That is the point of having one story here instead of one per theme.',
    },
  },
};

export const CustomStyling = Template.bind({});
CustomStyling.args = {
  padding: '4x',
  textAlign: 'center',
  fill: '#danger-bg',
};
