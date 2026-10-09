import { StoryFn } from '@storybook/react-vite';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';
import { COLOR_FORMATS } from '../color/color';

import { ColorInput, CubeColorInputProps } from './ColorInput';

export default {
  title: 'Forms/ColorInput',
  component: ColorInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  args: {
    width: '30x',
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
    placeholder: {
      control: { type: 'text' },
      description: 'Text shown while the field is empty',
      table: { defaultValue: { summary: 'Pick a color' } },
    },

    /* Presentation */
    format: {
      options: [...COLOR_FORMATS],
      control: { type: 'radio' },
      description: 'Notation the value is written in',
      table: { defaultValue: { summary: 'hex' } },
    },
    formatMode: {
      options: ['forced', 'derive', 'free'],
      control: { type: 'radio' },
      description: 'How strictly the input text is tied to `format`',
      table: { defaultValue: { summary: 'forced' } },
    },
    defaultSpace: {
      options: ['hst', 'lch', 'rgb'],
      control: { type: 'radio' },
      description: 'Color concept the popover opens with',
      table: { defaultValue: { summary: 'hst' } },
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Input size',
      table: { defaultValue: { summary: 'medium' } },
    },
    shouldFlip: {
      control: { type: 'boolean' },
      description: 'Whether the popover may flip to the other side',
      table: { defaultValue: { summary: true } },
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
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the color can be read but not changed',
      table: { defaultValue: { summary: false } },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether a color is required before form submission',
      table: { defaultValue: { summary: false } },
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Show loading spinner and disable interactions',
      table: { defaultValue: { summary: false } },
    },
    ...VALIDATION_ARGS,
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: { defaultValue: { summary: false } },
    },

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
    onBlur: { action: 'blur', control: { type: null } },
    onFocus: { action: 'focus', control: { type: null } },

    /* Styling */
    inputStyles: {
      control: { type: null },
      table: { type: { summary: 'Styles' } },
    },
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

const Template: StoryFn<CubeColorInputProps> = (props) => (
  <ColorInput aria-label="Brand color" {...props} />
);

export const Default = Template.bind({});
Default.args = {};

export const WithValue = Template.bind({});
WithValue.args = { defaultValue: '#26fcb2' };

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Brand color',
  description: 'Any hex, rgb, hsl, okhsl, okhst or oklch notation works.',
  defaultValue: '#7a4dbf',
};

export const Formats: StoryFn<CubeColorInputProps> = (args) => (
  <Flow gap="2x">
    {COLOR_FORMATS.map((format) => (
      <ColorInput
        key={format}
        {...args}
        label={format}
        format={format}
        defaultValue="#7a4dbf"
      />
    ))}
  </Flow>
);
Formats.parameters = {
  docs: {
    description: {
      story:
        'With the default `forced` mode the text is always rewritten in `format`.',
    },
  },
};

export const FormatModes: StoryFn<CubeColorInputProps> = (args) => {
  const [forced, setForced] = useState<string | null>('rgb(122 77 191)');
  const [derived, setDerived] = useState<string | null>('rgb(122 77 191)');
  const [free, setFree] = useState<string | null>('rgb(122 77 191)');

  return (
    <Flow gap="2x">
      <ColorInput
        {...args}
        label="forced"
        formatMode="forced"
        value={forced}
        onChange={setForced}
      />
      <Text preset="s4">{JSON.stringify(forced)}</Text>

      <ColorInput
        {...args}
        label="derive"
        formatMode="derive"
        value={derived}
        onChange={setDerived}
      />
      <Text preset="s4">{JSON.stringify(derived)}</Text>

      <ColorInput
        {...args}
        label="free"
        formatMode="free"
        value={free}
        onChange={setFree}
      />
      <Text preset="s4">{JSON.stringify(free)}</Text>
    </Flow>
  );
};
FormatModes.parameters = {
  docs: {
    description: {
      story:
        'All three start from the same loosely written color. `forced` normalizes the text, `derive` keeps the notation but normalizes the value, and `free` passes the text through untouched.',
    },
  },
};

export const Spaces: StoryFn<CubeColorInputProps> = (args) => (
  <Space gap="2x" placeItems="start">
    <ColorInput {...args} label="HST" defaultSpace="hst" />
    <ColorInput {...args} label="LCH" defaultSpace="lch" />
    <ColorInput {...args} label="RGB" defaultSpace="rgb" />
  </Space>
);
Spaces.args = { defaultValue: '#26fcb2', width: '20x' };
Spaces.parameters = {
  docs: {
    description: {
      story:
        'Each picker opens on its own space. Only one popover can be open at a time, so open them one by one to compare.',
    },
  },
};

export const Sizes: StoryFn<CubeColorInputProps> = (args) => (
  <Flow gap="2x">
    <ColorInput {...args} label="small" size="small" />
    <ColorInput {...args} label="medium" size="medium" />
    <ColorInput {...args} label="large" size="large" />
  </Flow>
);
Sizes.args = { defaultValue: '#7a4dbf' };

export const Disabled = Template.bind({});
Disabled.args = { defaultValue: '#7a4dbf', isDisabled: true };

export const ReadOnly = Template.bind({});
ReadOnly.args = { defaultValue: '#7a4dbf', isReadOnly: true };

export const Validation: StoryFn<CubeColorInputProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Valid State</Title>
    <ColorInput {...args} label="Valid" isValid defaultValue="#26fcb2" />

    <Title level={5}>Invalid State</Title>
    <ColorInput {...args} label="Invalid" isInvalid defaultValue="#ff0000" />
  </Space>
);

export const Open = Template.bind({});
Open.args = { defaultValue: '#7a4dbf', defaultOpen: true };

export const OpensOnTrigger: StoryFn<CubeColorInputProps> = (args) => (
  <ColorInput aria-label="Brand color" {...args} />
);
OpensOnTrigger.args = { defaultValue: '#7a4dbf' };
OpensOnTrigger.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await userEvent.click(canvas.getByRole('button'));
};
// Ends on the same open panel `Open` renders via `defaultOpen`; this story proves the click path, which a snapshot cannot show.
OpensOnTrigger.parameters = NO_SNAPSHOT;
