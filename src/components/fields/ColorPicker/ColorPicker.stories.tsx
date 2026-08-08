import { StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';
import { COLOR_FORMATS } from '../color/color';

import { ColorPicker, CubeColorPickerProps } from './ColorPicker';

export default {
  title: 'Forms/ColorPicker',
  component: ColorPicker,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    value: {
      control: { type: 'text' },
      description: 'The selected color in controlled mode',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The selected color in uncontrolled mode',
    },
    children: {
      control: { type: 'text' },
      description:
        'Replaces the color shown on the trigger. `null` leaves the swatch on its own',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Shown on the trigger while there is no color',
      table: { defaultValue: { summary: 'Pick a color' } },
    },

    /* Presentation */
    format: {
      options: [...COLOR_FORMATS],
      control: { type: 'radio' },
      description: 'Notation the value is written in',
      table: { defaultValue: { summary: 'hex' } },
    },
    defaultSpace: {
      options: ['hst', 'lch', 'rgb'],
      control: { type: 'radio' },
      description: 'Color concept the popover opens with',
      table: { defaultValue: { summary: 'hst' } },
    },
    type: {
      options: ['outline', 'primary', 'clear', 'neutral'],
      control: { type: 'radio' },
      description: 'Visual type of the trigger',
      table: { defaultValue: { summary: 'outline' } },
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Size of the trigger',
    },
    shouldFlip: {
      control: { type: 'boolean' },
      description: 'Whether the popover may flip to the other side',
      table: { defaultValue: { summary: true } },
    },
    triggerTooltip: {
      control: { type: null },
      description: 'Tooltip for the trigger, separate from the field tooltip',
    },

    /* State */
    isOpen: {
      control: { type: 'boolean' },
      description: 'Whether the popover is open (controlled)',
    },
    defaultOpen: {
      control: { type: 'boolean' },
      description: 'Whether the popover is open initially',
      table: { defaultValue: { summary: false } },
    },
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the picker is disabled',
      table: { defaultValue: { summary: false } },
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Disable interactions while something is in flight',
      table: { defaultValue: { summary: false } },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether a color is required before form submission',
      table: { defaultValue: { summary: false } },
    },
    ...VALIDATION_ARGS,

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the color changes',
      control: { type: null },
    },
    onOpenChange: {
      action: 'open-change',
      description: 'Callback fired when the popover opens or closes',
      control: { type: null },
    },

    /* Styling */
    triggerStyles: {
      control: { type: null },
      table: { type: { summary: 'Styles' } },
    },
    swatchStyles: {
      control: { type: null },
      table: { type: { summary: 'Styles' } },
    },
  },
};

const Template: StoryFn<CubeColorPickerProps> = (props) => (
  <ColorPicker aria-label="Brand color" {...props} />
);

export const Default = Template.bind({});
Default.args = {};

export const WithValue = Template.bind({});
WithValue.args = { defaultValue: '#7a4dbf' };

export const WithLabel = Template.bind({});
WithLabel.args = { label: 'Brand color', defaultValue: '#26fcb2' };

export const SwatchOnly = Template.bind({});
SwatchOnly.args = { defaultValue: '#7a4dbf', children: null };
SwatchOnly.parameters = {
  docs: {
    description: {
      story:
        'Passing `children={null}` drops the label, leaving a swatch button for toolbars and dense tables.',
    },
  },
};

export const CustomLabel = Template.bind({});
CustomLabel.args = { defaultValue: '#7a4dbf', children: 'Accent' };

export const Types: StoryFn<CubeColorPickerProps> = (args) => (
  <Space gap="1x" placeItems="center start">
    <ColorPicker {...args} aria-label="Outline" type="outline" />
    <ColorPicker {...args} aria-label="Primary" type="primary" />
    <ColorPicker {...args} aria-label="Clear" type="clear" />
    <ColorPicker {...args} aria-label="Neutral" type="neutral" />
  </Space>
);
Types.args = { defaultValue: '#7a4dbf' };

export const Sizes: StoryFn<CubeColorPickerProps> = (args) => (
  <Space gap="1x" placeItems="center start">
    <ColorPicker {...args} aria-label="Small" size="small" />
    <ColorPicker {...args} aria-label="Medium" size="medium" />
    <ColorPicker {...args} aria-label="Large" size="large" />
  </Space>
);
Sizes.args = { defaultValue: '#7a4dbf' };

export const Disabled = Template.bind({});
Disabled.args = { defaultValue: '#7a4dbf', isDisabled: true };

export const Validation: StoryFn<CubeColorPickerProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <ColorPicker {...args} label="Valid" isValid defaultValue="#26fcb2" />
    <ColorPicker {...args} label="Invalid" isInvalid defaultValue="#ff0000" />
  </Space>
);

export const Open = Template.bind({});
Open.args = { defaultValue: '#7a4dbf', defaultOpen: true };

export const Controlled: StoryFn<CubeColorPickerProps> = (args) => {
  const [color, setColor] = useState<string | null>('#7a4dbf');

  return (
    <Space gap="1x" placeItems="center start">
      <ColorPicker
        {...args}
        aria-label="Series color"
        value={color}
        onChange={setColor}
      />
      <ColorPicker
        aria-label="Mirror"
        value={color}
        onChange={setColor}
        children={null}
      />
    </Space>
  );
};
Controlled.parameters = {
  docs: {
    description: {
      story: 'Both triggers share one value, so either one updates the other.',
    },
  },
};
