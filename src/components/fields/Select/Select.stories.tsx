import { userEvent, within } from '@storybook/test';
import { IconCoin, IconUser } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Text } from '../../content/Text';
import { Space } from '../../layout/Space';

import { CubeSelectProps, Select } from './Select';

import type { Meta, StoryObj } from '@storybook/react';

export default {
  title: 'Forms/Select',
  component: Select,
  args: { width: '200px' },
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Content */
    selectedKey: {
      control: { type: 'text' },
      description: 'The selected value in controlled mode',
      table: {
        type: { summary: 'string' },
      },
    },
    defaultSelectedKey: {
      control: { type: 'text' },
      description: 'The default selected value in uncontrolled mode',
      table: {
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when no option is selected',
      table: {
        type: { summary: 'string' },
      },
    },
    icon: {
      control: { type: null },
      description: 'Icon element rendered before the select value',
      table: {
        type: { summary: 'ReactElement' },
      },
    },
    prefix: {
      control: { type: null },
      description: 'Content rendered before the select value',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    suffix: {
      control: { type: null },
      description: 'Content rendered after the select value',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    suffixPosition: {
      options: ['before', 'after'],
      control: { type: 'radio' },
      description: 'Position of suffix relative to validation icons',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'before' },
      },
    },

    /* Presentation */
    type: {
      options: ['outline', 'clear', 'primary', 'secondary', 'neutral'],
      control: { type: 'radio' },
      description: 'Visual style variant of the select',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'outline' },
      },
    },
    theme: {
      options: ['default', 'special'],
      control: { type: 'radio' },
      description: 'Theme variant affecting overall styling',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Size of the select component',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
      },
    },
    direction: {
      options: ['top', 'bottom'],
      control: { type: 'radio' },
      description: 'Preferred direction for the dropdown menu',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'bottom' },
      },
    },
    shouldFlip: {
      control: { type: 'boolean' },
      description: 'Whether dropdown should flip to fit in viewport',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    overlayOffset: {
      control: { type: 'number' },
      description: 'Distance between select and dropdown in pixels',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 8 },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the select is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether user selection is required before form submission',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Show loading spinner and disable interactions',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the select should display valid or invalid visual styling',
      table: {
        type: { summary: 'string' },
      },
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },

    /* Collection */
    items: {
      control: { type: 'object' },
      description: 'Item objects used when rendering dynamic collections',
      table: {
        type: { summary: 'Iterable<T>' },
      },
    },
    disabledKeys: {
      control: { type: 'object' },
      description: 'Keys of items that are disabled',
      table: {
        type: { summary: 'Iterable<Key>' },
      },
    },
    children: {
      control: { type: null },
      description: 'Static child items or render function for dynamic items',
      table: {
        type: { summary: 'ReactNode | (item: T) => ReactElement' },
      },
    },

    /* Advanced */
    triggerRef: {
      control: { type: null },
      description: 'Ref for the trigger button element',
      table: {
        type: { summary: 'RefObject<HTMLButtonElement>' },
      },
    },
    popoverRef: {
      control: { type: null },
      description: 'Ref for the popover overlay element',
      table: {
        type: { summary: 'RefObject<HTMLInputElement>' },
      },
    },
    listBoxRef: {
      control: { type: null },
      description: 'Ref for the list box element',
      table: {
        type: { summary: 'RefObject<HTMLElement>' },
      },
    },
    loadingIndicator: {
      control: { type: null },
      description: 'Custom loading indicator element',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    hideTrigger: {
      control: { type: 'boolean' },
      description: 'Whether to hide the trigger button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },

    /* Styling */
    styles: {
      control: { type: 'object' },
      description: 'Styles for the root wrapper element',
      table: {
        type: { summary: 'Styles' },
      },
    },
    inputStyles: {
      control: { type: 'object' },
      description: 'Styles for the input trigger element',
      table: {
        type: { summary: 'Styles' },
      },
    },
    listBoxStyles: {
      control: { type: 'object' },
      description: 'Styles for the dropdown list container',
      table: {
        type: { summary: 'Styles' },
      },
    },
    optionStyles: {
      control: { type: 'object' },
      description: 'Styles for individual option items',
      table: {
        type: { summary: 'Styles' },
      },
    },
    overlayStyles: {
      control: { type: 'object' },
      description: 'Styles for the dropdown overlay wrapper',
      table: {
        type: { summary: 'Styles' },
      },
    },
    wrapperStyles: {
      control: { type: 'object' },
      description: 'Styles for the outer wrapper element',
      table: {
        type: { summary: 'Styles' },
      },
    },
    triggerStyles: {
      control: { type: 'object' },
      description: 'Styles for the trigger button element',
      table: {
        type: { summary: 'Styles' },
      },
    },
    inputProps: {
      control: { type: 'object' },
      description: 'Additional props for the input element',
      table: {
        type: { summary: 'Props' },
      },
    },

    /* Events */
    onSelectionChange: {
      action: 'selectionChange',
      description: 'Callback fired when the selected option changes',
      control: { type: null },
      table: {
        type: { summary: '(key: Key) => void' },
      },
    },
    onOpenChange: {
      action: 'openChange',
      description: 'Callback fired when the dropdown opens or closes',
      control: { type: null },
      table: {
        type: { summary: '(isOpen: boolean) => void' },
      },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the select receives focus',
      control: { type: null },
      table: {
        type: { summary: '(e: FocusEvent) => void' },
      },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the select loses focus',
      control: { type: null },
      table: {
        type: { summary: '(e: FocusEvent) => void' },
      },
    },
    onFocusChange: {
      action: 'focusChange',
      description: 'Callback fired when focus state changes',
      control: { type: null },
      table: {
        type: { summary: '(isFocused: boolean) => void' },
      },
    },

    /* Accessibility */
    'aria-label': {
      control: { type: 'text' },
      description: 'Accessible label when no visible label exists',
      table: {
        type: { summary: 'string' },
      },
    },
    'aria-labelledby': {
      control: { type: 'text' },
      description: 'ID of element that labels the select',
      table: {
        type: { summary: 'string' },
      },
    },
    'aria-describedby': {
      control: { type: 'text' },
      description: 'ID of element that describes the select',
      table: {
        type: { summary: 'string' },
      },
    },
    name: {
      control: { type: 'text' },
      description: 'The name of the input element for form submission',
      table: {
        type: { summary: 'string' },
      },
    },
  },
} as Meta<CubeSelectProps<any>>;

const options = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'violet',
  'very-long-option-value-with-suffix',
];

const Template: StoryObj<CubeSelectProps<any>>['render'] = (args) => (
  <Space
    radius="1x"
    padding={args.theme === 'special' ? '2x' : undefined}
    fill={args.theme === 'special' ? '#dark' : undefined}
  >
    <Select {...args}>
      {options.map((option) => (
        <Select.Item key={option}>{option}</Select.Item>
      ))}
    </Select>
  </Space>
);

export const Default = Template.bind({});
Default.args = {};

export const Primary = Template.bind({});
Primary.args = { type: 'primary', placeholder: 'primary' };

export const Clear = Template.bind({});
Clear.args = { type: 'clear', placeholder: 'clear', width: 'max-content' };

export const Invalid = Template.bind({});
Invalid.args = { selectedKey: 'yellow', validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { selectedKey: 'yellow', validationState: 'valid' };

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = { placeholder: 'Enter a value' };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <IconCoin /> };

export const OverTheCustomBG = Template.bind({});
OverTheCustomBG.parameters = { backgrounds: { default: 'gray' } };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true, label: 'Disabled' };

export const WithDisabledOption = Template.bind({});
WithDisabledOption.args = { disabledKeys: ['red'] };

WithDisabledOption.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);
};

export const Wide: StoryObj<CubeSelectProps<any>>['render'] = (args) => (
  <Select {...args}>
    {options.map((option) => (
      <Select.Item key={option}>
        {option} lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Select.Item>
    ))}
  </Select>
);
Wide.args = { width: 'max-content', defaultSelectedKey: options[0] };

export const WithEllipsis = Template.bind({});
WithEllipsis.args = {
  styles: { width: 'max 30x' },
  defaultSelectedKey: 'very-long-option-value-with-suffix',
};

export const WithDescription: StoryObj<CubeSelectProps<any>>['render'] = (
  args,
) => (
  <Select
    {...args}
    placeholder="Select a color"
    listBoxStyles={{ width: 'max 30x' }}
  >
    <Select.Item key="red" description="The color of fire">
      Red
    </Select.Item>
    <Select.Item key="green" description="The color of nature">
      Green
    </Select.Item>
    <Select.Item
      key="blue"
      description="The color of the sky (very long description)"
    >
      Blue
    </Select.Item>
  </Select>
);
WithDescription.args = {};
WithDescription.play = WithDisabledOption.play;

export const WithIconsAndDescriptions: StoryObj<
  CubeSelectProps<any>
>['render'] = (args) => (
  <Select
    {...args}
    placeholder="Select a color"
    listBoxStyles={{ width: 'max 36x' }}
  >
    <Select.Item key="yellow" description="Child and light" icon={<IconUser />}>
      Yellow
    </Select.Item>
    <Select.Item
      key="red"
      description="Hot and strong"
      prefix={<span>🔥</span>}
    >
      Red
    </Select.Item>
    <Select.Item
      key="green"
      description="Fresh and calm"
      suffix={<Text color="#dark-03">#00A000</Text>}
    >
      Green
    </Select.Item>
    <Select.Item
      key="blue"
      description="Cold and deep"
      rightIcon={<span>→</span>}
    >
      Blue
    </Select.Item>
  </Select>
);
WithIconsAndDescriptions.args = {};
WithIconsAndDescriptions.storyName = 'With icons and descriptions';

// ------------------------------
// Section stories
// ------------------------------

export const SectionsStatic: StoryObj<CubeSelectProps<any>>['render'] = (
  args,
) => (
  <Select {...args} placeholder="Pick something" width="260px">
    <Select.Section title="Warm colors">
      <Select.Item key="red">Red</Select.Item>
      <Select.Item key="orange">Orange</Select.Item>
      <Select.Item key="yellow">Yellow</Select.Item>
    </Select.Section>
    <Select.Section>
      <Select.Item key="cyan">Cyan</Select.Item>
      <Select.Item key="teal">Teal</Select.Item>
    </Select.Section>
    <Select.Section title="Cool colors">
      <Select.Item key="blue">Blue</Select.Item>
      <Select.Item key="purple">Purple</Select.Item>
    </Select.Section>
  </Select>
);

SectionsStatic.storyName = 'Sections – static items';
SectionsStatic.play = WithDisabledOption.play;

export const SectionsDynamic: StoryObj<CubeSelectProps<any>>['render'] = (
  args,
) => {
  const groups = [
    {
      name: 'Fruits',
      children: [
        { id: 'apple', label: 'Apple' },
        { id: 'orange', label: 'Orange' },
        { id: 'banana', label: 'Banana' },
      ],
    },
    {
      name: 'Vegetables',
      children: [
        { id: 'carrot', label: 'Carrot' },
        { id: 'peas', label: 'Peas' },
        { id: 'broccoli', label: 'Broccoli' },
      ],
    },
  ];

  return (
    <Select {...args} items={groups} width="260px" placeholder="Choose an item">
      {(group: any) => (
        <Select.Section
          key={group.name}
          title={group.name}
          items={group.children}
        >
          {(item: any) => <Select.Item key={item.id}>{item.label}</Select.Item>}
        </Select.Section>
      )}
    </Select>
  );
};

SectionsDynamic.storyName = 'Sections – dynamic collection';
SectionsDynamic.play = WithDisabledOption.play;

export const DifferentSizes: StoryObj<CubeSelectProps<any>>['render'] = (
  args,
) => (
  <Space gap="3x" flow="column" placeItems="start">
    <Select {...args} size="small" label="Small Select">
      {options.map((option) => (
        <Select.Item key={option}>{option}</Select.Item>
      ))}
    </Select>

    <Select {...args} size="medium" label="Medium Select">
      {options.map((option) => (
        <Select.Item key={option}>{option}</Select.Item>
      ))}
    </Select>
    <Select {...args} size="large" label="Large Select">
      {options.map((option) => (
        <Select.Item key={option}>{option}</Select.Item>
      ))}
    </Select>
  </Space>
);

DifferentSizes.args = {
  width: '200px',
  defaultSelectedKey: 'red',
};

DifferentSizes.parameters = {
  docs: {
    description: {
      story:
        'Select supports three sizes: `small`, `medium` (default), and `large` to fit different interface requirements.',
    },
  },
};

export const WithTooltips: StoryObj<CubeSelectProps<any>>['render'] = (
  args,
) => (
  <Select {...args} placeholder="Choose a framework" width="260px">
    <Select.Item
      key="react"
      tooltip="React - A JavaScript library for building user interfaces"
    >
      React
    </Select.Item>
    <Select.Item
      key="vue"
      tooltip={{
        title: 'Vue.js Framework',
      }}
    >
      Vue.js
    </Select.Item>
    <Select.Item
      key="angular"
      tooltip="Angular - Platform for building mobile and desktop web applications"
    >
      Angular
    </Select.Item>
    <Select.Item
      key="svelte"
      tooltip={{
        title: 'Svelte',
      }}
    >
      Svelte
    </Select.Item>
    <Select.Item
      key="solid"
      tooltip="SolidJS - Simple and performant reactivity for building user interfaces"
    >
      SolidJS
    </Select.Item>
  </Select>
);

WithTooltips.args = {};
WithTooltips.storyName = 'With tooltips';
WithTooltips.play = WithDisabledOption.play;

WithTooltips.parameters = {
  docs: {
    description: {
      story:
        'Select options support tooltips to provide additional context. Use either a simple string or a full tooltip configuration object with title, description, and placement options.',
    },
  },
};
