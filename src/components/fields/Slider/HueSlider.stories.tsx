import { useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';

import { CubeHueSliderProps, HueSlider } from './HueSlider';

import type { Meta, StoryFn } from '@storybook/react-vite';

export default {
  title: 'Forms/HueSlider',
  component: HueSlider,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    value: {
      control: { type: 'number', min: 0, max: 359 },
      description: 'The hue value in controlled mode (0-359)',
    },
    defaultValue: {
      control: { type: 'number', min: 0, max: 359 },
      description: 'The default hue value in uncontrolled mode (0-359)',
      table: {
        defaultValue: { summary: 0 },
      },
    },

    /* Presentation */
    orientation: {
      options: ['horizontal', 'vertical'],
      control: { type: 'radio' },
      description: 'The orientation of the slider',
      table: {
        defaultValue: { summary: 'horizontal' },
      },
    },
    showValueLabel: {
      control: { type: 'boolean' },
      description: 'Whether to show the current value label',
      table: {
        defaultValue: { summary: true },
      },
    },
    getValueLabel: {
      control: { type: null },
      description: 'Function to format the value label',
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the slider is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the hue value changes',
      control: { type: null },
    },
    onChangeEnd: {
      action: 'changeEnd',
      description: 'Callback fired when the slider interaction ends',
      control: { type: null },
    },

    /* Form */
    label: {
      control: { type: 'text' },
      description: 'The label text for the slider',
    },
    labelPosition: {
      options: ['top', 'side'],
      control: { type: 'radio' },
      description: 'The position of the label relative to the input',
      table: {
        defaultValue: { summary: 'top' },
      },
    },

    /* Style */
    styles: {
      control: { type: 'object' },
      description:
        'Custom styles object for styling the component and sub-elements',
    },
  },
  args: {
    defaultValue: 180,
    fieldStyles: {
      width: '200px',
    },
  },
} as Meta<CubeHueSliderProps>;

const Template: StoryFn<CubeHueSliderProps> = (args) => <HueSlider {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Hue',
};

export const WithCustomLabel = Template.bind({});
WithCustomLabel.args = {
  label: 'Hue',
  getValueLabel: (val) => `${val}°`,
};

export const Controlled: StoryFn<CubeHueSliderProps> = (args) => {
  const [hue, setHue] = useState(0);

  return (
    <HueSlider
      {...args}
      value={hue}
      getValueLabel={(val) => `${val}°`}
      onChange={setHue}
    />
  );
};
Controlled.args = {
  label: 'Controlled Hue',
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Hue',
  isDisabled: true,
};

export const Vertical = Template.bind({});
Vertical.args = {
  orientation: 'vertical',
  fieldStyles: {
    height: '200px',
  },
};
