import {
  IconBold,
  IconChartBar,
  IconChartLine,
  IconItalic,
  IconStrikethrough,
  IconUnderline,
} from '@tabler/icons-react';

import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { ToggleGroup } from './ToggleGroup';

import type { Meta, StoryFn } from '@storybook/react-vite';
import type { CubeToggleGroupProps } from './ToggleGroup';

const meta = {
  title: 'Forms/ToggleGroup',
  component: ToggleGroup,
  subcomponents: { Item: ToggleGroup.Item },
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description: '`ToggleGroup.Item` elements: the toggles of the group',
    },
    label: {
      control: { type: 'text' },
      description: 'Label of the group',
    },
    description: {
      control: { type: 'text' },
      description: 'Additional descriptive text for the group',
    },

    /* Selection */
    selectionMode: {
      options: ['single', 'multiple'],
      control: { type: 'radio' },
      description:
        '`single`: one item or none, and pressing the selected item clears it. `multiple`: each item toggles on its own',
      table: {
        defaultValue: { summary: 'single' },
      },
    },
    selectedKey: {
      control: { type: 'text' },
      description:
        'The key of the item that is on, or `null` (controlled, single)',
    },
    defaultSelectedKey: {
      control: { type: 'text' },
      description: 'The key of the item that starts on (uncontrolled, single)',
    },
    selectedKeys: {
      control: { type: 'object' },
      description: 'The keys of the items that are on (controlled, multiple)',
    },
    defaultSelectedKeys: {
      control: { type: 'object' },
      description:
        'The keys of the items that start on (uncontrolled, multiple)',
    },

    /* Presentation */
    size: {
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
      control: { type: 'radio' },
      description: 'Size of every item',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },
    type: {
      options: ['outline', 'outline-2', 'clear'],
      control: { type: 'radio' },
      description: 'Look of every item',
      table: {
        defaultValue: { summary: 'outline' },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether every item is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the items can be focused but not toggled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether a selection is required',
      table: {
        defaultValue: { summary: false },
      },
    },
    ...VALIDATION_ARGS,

    /* Events */
    onSelectionChange: {
      action: 'selection change',
      description:
        'Called with a key or `null` in single mode, and with an array of keys in multiple mode',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Called when focus enters the group',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Called when focus leaves the group',
      control: { type: null },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;

const Template: StoryFn<CubeToggleGroupProps> = (args) => (
  <ToggleGroup label="Display" defaultSelectedKey="bar" {...args}>
    <ToggleGroup.Item key="bar">Bar</ToggleGroup.Item>
    <ToggleGroup.Item key="sparkline">Sparkline</ToggleGroup.Item>
    <ToggleGroup.Item key="heatmap">Heatmap</ToggleGroup.Item>
  </ToggleGroup>
);

/** One item or none: press the selected item again to clear it. */
export const Default = Template.bind({});

const FormatItems = () => [
  <ToggleGroup.Item key="bold" icon={<IconBold />} aria-label="Bold" />,
  <ToggleGroup.Item key="italic" icon={<IconItalic />} aria-label="Italic" />,
  <ToggleGroup.Item
    key="underline"
    icon={<IconUnderline />}
    aria-label="Underline"
  />,
  <ToggleGroup.Item
    key="strikethrough"
    icon={<IconStrikethrough />}
    aria-label="Strikethrough"
  />,
];

/** Several at once: each item toggles on its own. */
export const Multiple: StoryFn<CubeToggleGroupProps> = (args) => (
  <ToggleGroup
    label="Text format"
    selectionMode="multiple"
    size="small"
    defaultSelectedKeys={['bold', 'italic']}
    {...args}
  >
    {FormatItems()}
  </ToggleGroup>
);

export const IconAndText: StoryFn<CubeToggleGroupProps> = (args) => (
  <ToggleGroup label="Display" defaultSelectedKey="bar" {...args}>
    <ToggleGroup.Item key="bar" icon={<IconChartBar />}>
      Bar
    </ToggleGroup.Item>
    <ToggleGroup.Item key="sparkline" icon={<IconChartLine />}>
      Sparkline
    </ToggleGroup.Item>
  </ToggleGroup>
);

export const Sizes: StoryFn<CubeToggleGroupProps> = () => (
  <Space flow="column" gap="2x" placeItems="start">
    {(['xsmall', 'small', 'medium', 'large', 'xlarge'] as const).map((size) => (
      <ToggleGroup
        key={size}
        aria-label={`Text format, ${size}`}
        selectionMode="multiple"
        size={size}
        defaultSelectedKeys={['bold']}
      >
        {FormatItems()}
      </ToggleGroup>
    ))}
  </Space>
);

export const Types: StoryFn<CubeToggleGroupProps> = () => (
  <Space flow="column" gap="2x" placeItems="start">
    {(['outline', 'outline-2', 'clear'] as const).map((type) => (
      <ToggleGroup
        key={type}
        label={type}
        type={type}
        selectionMode="multiple"
        defaultSelectedKeys={['bold']}
        size="small"
      >
        {FormatItems()}
      </ToggleGroup>
    ))}
  </Space>
);

/**
 * A disabled group keeps showing what is selected. A disabled item with a
 * tooltip stays focusable, so the keyboard can reach the reason too.
 */
export const Disabled: StoryFn<CubeToggleGroupProps> = () => (
  <Space flow="column" gap="2x" placeItems="start">
    <ToggleGroup isDisabled label="Disabled group" defaultSelectedKey="bar">
      <ToggleGroup.Item key="bar">Bar</ToggleGroup.Item>
      <ToggleGroup.Item key="sparkline">Sparkline</ToggleGroup.Item>
    </ToggleGroup>
    <ToggleGroup
      label="Disabled item"
      selectionMode="multiple"
      size="small"
      defaultSelectedKeys={['bold']}
    >
      <ToggleGroup.Item key="bold" icon={<IconBold />} aria-label="Bold" />
      <ToggleGroup.Item
        key="italic"
        isDisabled
        icon={<IconItalic />}
        aria-label="Italic"
        tooltip="Not available for numbers"
      />
    </ToggleGroup>
  </Space>
);

export const Validation: StoryFn<CubeToggleGroupProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Template {...args} label="Valid" isValid />
    <Template
      {...args}
      label="Invalid"
      isInvalid
      errorMessage="Pick a display"
    />
  </Space>
);
