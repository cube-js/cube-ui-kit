import { StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Flow } from '../../layout/Flow';
import { ColorPicker } from '../ColorPicker';

import {
  ColorSwatchGroup,
  CubeColorSwatchGroupProps,
} from './ColorSwatchGroup';

const PALETTE = [
  '#7a4dbf',
  '#26fcb2',
  '#ff0000',
  '#ff8800',
  '#ffd400',
  '#00a3ff',
  '#0044cc',
  '#111111',
];

export default {
  title: 'Forms/ColorSwatchGroup',
  component: ColorSwatchGroup,
  parameters: { controls: { exclude: baseProps } },
  args: { colors: PALETTE },
  argTypes: {
    /* Content */
    colors: {
      control: { type: 'object' },
      description:
        'The colors to offer. Either strings, or `{ color, label }` to name them',
    },
    value: {
      control: { type: 'text' },
      description: 'The selected color in controlled mode',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The selected color in uncontrolled mode',
    },

    /* Presentation */
    columns: {
      control: { type: 'number' },
      description: 'How many swatches per row. Defaults to a single row',
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Size of each swatch',
      table: { defaultValue: { summary: 'medium' } },
    },
    format: {
      options: ['hex', 'rgb', 'hsl', 'okhsl', 'okhst', 'oklch'],
      control: { type: 'radio' },
      description: 'Notation the value is written in',
      table: { defaultValue: { summary: 'hex' } },
    },

    /* Behavior */
    allowCustom: {
      control: { type: 'boolean' },
      description:
        'Append a `ColorPicker` for colors outside the set. Ignored inside a color popover',
      table: { defaultValue: { summary: false } },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      table: { defaultValue: { summary: false } },
    },
    isRequired: {
      control: { type: 'boolean' },
      table: { defaultValue: { summary: false } },
    },
    ...VALIDATION_ARGS,

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when a color is chosen',
      control: { type: null },
    },

    /* Styling */
    swatchStyles: {
      control: { type: null },
      table: { type: { summary: 'Styles' } },
    },
  },
};

const Template: StoryFn<CubeColorSwatchGroupProps> = (props) => (
  <ColorSwatchGroup aria-label="Palette" {...props} />
);

export const Default = Template.bind({});
Default.args = {};

export const WithSelection = Template.bind({});
WithSelection.args = { defaultValue: '#26fcb2' };

export const Columns = Template.bind({});
Columns.args = { defaultValue: '#7a4dbf', columns: 4 };
Columns.parameters = {
  docs: {
    description: {
      story: 'Without `columns` the swatches sit on one row.',
    },
  },
};

export const AllowCustom = Template.bind({});
AllowCustom.args = { defaultValue: '#26fcb2', allowCustom: true };
AllowCustom.parameters = {
  docs: {
    description: {
      story:
        'The trailing picker covers colors outside the set. It shows the current color whenever that color is not one of the swatches.',
    },
  },
};

export const Named = Template.bind({});
Named.args = {
  colors: [
    { color: '#7a4dbf', label: 'Primary' },
    { color: '#26fcb2', label: 'Success' },
    { color: '#ff0000', label: 'Danger' },
    { color: '#ffd400', label: 'Warning' },
  ],
  defaultValue: '#7a4dbf',
};
Named.parameters = {
  docs: {
    description: {
      story:
        'A swatch announces its color by default. `label` replaces that with a name.',
    },
  },
};

export const Deduplicated = Template.bind({});
Deduplicated.args = {
  colors: ['#ff0000', 'rgb(255 0 0)', 'hsl(0 100% 50%)', '#26fcb2'],
};
Deduplicated.parameters = {
  docs: {
    description: {
      story:
        'The first three are the same color written three ways, so only two swatches render — equivalent colors would make selection ambiguous.',
    },
  },
};

export const Sizes: StoryFn<CubeColorSwatchGroupProps> = (args) => (
  <Flow gap="2x">
    <ColorSwatchGroup {...args} aria-label="Small" size="small" />
    <ColorSwatchGroup {...args} aria-label="Medium" size="medium" />
    <ColorSwatchGroup {...args} aria-label="Large" size="large" />
  </Flow>
);
Sizes.args = { defaultValue: '#7a4dbf' };

export const Disabled = Template.bind({});
Disabled.args = { defaultValue: '#7a4dbf', isDisabled: true };

export const InsideColorPicker: StoryFn<CubeColorSwatchGroupProps> = () => {
  const [color, setColor] = useState<string | null>('#7a4dbf');

  return (
    <ColorPicker
      label="Brand color"
      value={color}
      swatches={PALETTE}
      swatchColumns={4}
      defaultOpen
      onChange={setColor}
    />
  );
};
InsideColorPicker.parameters = {
  docs: {
    description: {
      story:
        'Passing `swatches` to a `ColorPicker` puts a palette under the editor. The group drops its custom-color escape hatch there, since that escape hatch is itself a picker.',
    },
  },
};
