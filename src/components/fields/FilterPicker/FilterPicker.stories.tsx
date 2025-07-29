import { userEvent, within } from '@storybook/test';
import { useState } from 'react';

import {
  CheckIcon,
  DatabaseIcon,
  EditIcon,
  FilterIcon,
  PlusIcon,
  RightIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from '../../../icons';
import { Button } from '../../actions/Button/Button';
import { Badge } from '../../content/Badge/Badge';
import { Paragraph } from '../../content/Paragraph';
import { Tag } from '../../content/Tag/Tag';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Form } from '../../form';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';

import { FilterPicker } from './FilterPicker';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FilterPicker> = {
  title: 'Forms/FilterPicker',
  component: FilterPicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'FilterPicker is a versatile selection component that combines a trigger button with a filterable dropdown. It supports both single and multiple selection modes, custom summaries, and various UI states.',
      },
    },
  },
  argTypes: {
    /* Content */
    selectedKey: {
      control: { type: 'text' },
      description: 'The selected key in controlled mode',
    },
    defaultSelectedKey: {
      control: { type: 'text' },
      description: 'The default selected key in uncontrolled mode',
    },
    selectedKeys: {
      control: { type: 'object' },
      description:
        'The selected keys in controlled multiple mode. Use "all" to select all items or an array of keys.',
    },
    defaultSelectedKeys: {
      control: { type: 'object' },
      description:
        'The default selected keys in uncontrolled multiple mode. Use "all" to select all items or an array of keys.',
    },
    selectionMode: {
      control: 'radio',
      options: ['single', 'multiple'],
      description: 'Selection mode for the picker',
      table: {
        defaultValue: { summary: 'single' },
      },
    },
    allowsCustomValue: {
      control: { type: 'boolean' },
      description:
        'Whether to allow entering custom values that are not present in the predefined options',
      table: {
        defaultValue: { summary: false },
      },
    },
    disallowEmptySelection: {
      control: { type: 'boolean' },
      description: 'Whether to disallow empty selection',
      table: {
        defaultValue: { summary: false },
      },
    },
    disabledKeys: {
      control: { type: 'object' },
      description: 'Array of keys for disabled items',
    },
    items: {
      control: false,
      description:
        'Array of items to render when using the render function pattern for large datasets with dynamic content',
    },

    /* Trigger */
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no selection is made',
    },
    icon: {
      control: false,
      description: 'Icon to show in the trigger button',
    },
    type: {
      control: 'radio',
      options: ['outline', 'clear', 'primary', 'secondary', 'neutral'],
      description: 'Button styling type',
      table: {
        defaultValue: { summary: 'outline' },
      },
    },
    theme: {
      control: 'radio',
      options: ['default', 'special'],
      description: 'Button theme',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Size of the picker component',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },

    /* Search */
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder text in the search input',
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the search input should have autofocus',
      table: {
        defaultValue: { summary: false },
      },
    },
    emptyLabel: {
      control: { type: 'text' },
      description:
        'Custom label to display when no results are found after filtering',
    },
    filter: {
      control: false,
      description:
        'Custom filter function for determining if an option should be included in search results',
    },

    /* Presentation */
    header: {
      control: { type: 'text' },
      description: 'Custom header content',
    },
    footer: {
      control: { type: 'text' },
      description: 'Custom footer content',
    },
    renderSummary: {
      control: false,
      description:
        'Custom renderer for the summary shown inside the trigger when there is a selection',
    },

    /* Behavior */
    isCheckable: {
      control: 'boolean',
      description: 'Whether to show checkboxes for multiple selection mode',
      table: {
        defaultValue: { summary: false },
      },
    },
    shouldFocusWrap: {
      control: { type: 'boolean' },
      description: 'Whether keyboard navigation should wrap around',
      table: {
        defaultValue: { summary: false },
      },
    },
    showSelectAll: {
      control: { type: 'boolean' },
      description:
        'Whether to show the "Select All" option in multiple selection mode',
      table: {
        defaultValue: { summary: false },
      },
    },
    selectAllLabel: {
      control: { type: 'text' },
      description: 'Label for the "Select All" option',
      table: {
        defaultValue: { summary: 'Select All' },
      },
    },

    /* State */
    isDisabled: {
      control: 'boolean',
      description: 'Whether the picker is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the picker is in loading state',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether the field is required',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      control: 'radio',
      options: [undefined, 'valid', 'invalid'],
      description: 'Validation state of the picker',
    },

    /* Field */
    label: {
      control: { type: 'text' },
      description: 'Label text',
    },
    description: {
      control: { type: 'text' },
      description: 'Field description',
    },
    message: {
      control: { type: 'text' },
      description: 'Help or error message',
    },

    /* Styling */
    listBoxStyles: {
      control: false,
      description:
        'Custom styles for the dropdown list container within the popover',
    },
    popoverStyles: {
      control: false,
      description:
        'Custom styles for the popover dialog that contains the FilterListBox',
    },
    triggerStyles: {
      control: false,
      description: 'Custom styles for the trigger button element',
    },
    headerStyles: {
      control: false,
      description:
        'Custom styles for the header area when header prop is provided',
    },
    footerStyles: {
      control: false,
      description:
        'Custom styles for the footer area when footer prop is provided',
    },

    /* Events */
    onSelectionChange: {
      action: 'selection changed',
      description: 'Callback when selection changes',
    },
    onEscape: {
      action: 'escape pressed',
      description: 'Callback when Escape key is pressed',
    },
    onOptionClick: {
      action: 'option clicked',
      description: 'Callback when an option is clicked (non-checkbox area)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterPicker>;

// Sample data for stories
const fruits = [
  { key: 'apple', label: 'Apple', description: 'Crisp and sweet red fruit' },
  {
    key: 'banana',
    label: 'Banana',
    description: 'Yellow tropical fruit rich in potassium',
  },
  {
    key: 'cherry',
    label: 'Cherry',
    description: 'Small red stone fruit with sweet flavor',
  },
  {
    key: 'date',
    label: 'Date',
    description: 'Sweet dried fruit from date palm',
  },
  {
    key: 'elderberry',
    label: 'Elderberry',
    description: 'Dark purple berry with tart flavor',
  },
  { key: 'fig', label: 'Fig', description: 'Sweet fruit with soft flesh' },
  {
    key: 'grape',
    label: 'Grape',
    description: 'Small sweet fruit that grows in clusters',
  },
];

const vegetables = [
  {
    key: 'carrot',
    label: 'Carrot',
    description: 'Orange root vegetable high in beta-carotene',
  },
  {
    key: 'broccoli',
    label: 'Broccoli',
    description: 'Green cruciferous vegetable packed with nutrients',
  },
  {
    key: 'spinach',
    label: 'Spinach',
    description: 'Leafy green vegetable rich in iron',
  },
  { key: 'pepper', label: 'Bell Pepper', description: 'Colorful sweet pepper' },
  {
    key: 'tomato',
    label: 'Tomato',
    description: 'Red fruit commonly used as vegetable',
  },
];

const grains = [
  { key: 'rice', label: 'Rice', description: 'Staple grain eaten worldwide' },
  {
    key: 'quinoa',
    label: 'Quinoa',
    description: 'Protein-rich seed often used as grain',
  },
  { key: 'oats', label: 'Oats', description: 'Nutritious cereal grain' },
  { key: 'barley', label: 'Barley', description: 'Versatile cereal grain' },
];

const permissions = [
  { key: 'read', label: 'Read', description: 'View content and data' },
  { key: 'write', label: 'Write', description: 'Create and edit content' },
  { key: 'delete', label: 'Delete', description: 'Remove content permanently' },
  { key: 'admin', label: 'Admin', description: 'Full administrative access' },
  {
    key: 'moderate',
    label: 'Moderate',
    description: 'Review and approve content',
  },
  { key: 'share', label: 'Share', description: 'Share content with others' },
];

const languages = [
  { key: 'javascript', label: 'JavaScript', category: 'Frontend' },
  { key: 'typescript', label: 'TypeScript', category: 'Frontend' },
  { key: 'react', label: 'React', category: 'Frontend' },
  { key: 'vue', label: 'Vue.js', category: 'Frontend' },
  { key: 'python', label: 'Python', category: 'Backend' },
  { key: 'nodejs', label: 'Node.js', category: 'Backend' },
  { key: 'rust', label: 'Rust', category: 'Backend' },
  { key: 'go', label: 'Go', category: 'Backend' },
  { key: 'sql', label: 'SQL', category: 'Database' },
  { key: 'mongodb', label: 'MongoDB', category: 'Database' },
  { key: 'redis', label: 'Redis', category: 'Database' },
  { key: 'postgres', label: 'PostgreSQL', category: 'Database' },
];

export const Default: Story = {
  args: {
    label: 'Select Options',
    placeholder: 'Choose items...',
    searchPlaceholder: 'Search options...',
    width: 'max 30x',
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.map((fruit) => (
        <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
};

export const SingleSelection: Story = {
  args: {
    label: 'Choose a Fruit',
    placeholder: 'Select one fruit...',
    selectionMode: 'single',
    searchPlaceholder: 'Search fruits...',
    width: 'max 30x',
    defaultSelectedKey: 'banana',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.map((fruit) => (
        <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
};

export const MultipleSelection: Story = {
  args: {
    label: 'Select Multiple Options',
    placeholder: 'Choose items...',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    width: 'max 30x',
    defaultSelectedKeys: ['banana', 'cherry'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      <FilterPicker.Section title="Fruits">
        {fruits.map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker.Section>
      <FilterPicker.Section title="Vegetables">
        {vegetables.map((vegetable) => (
          <FilterPicker.Item key={vegetable.key} textValue={vegetable.label}>
            {vegetable.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker.Section>
    </FilterPicker>
  ),
};

export const WithCheckboxes: Story = {
  args: {
    label: 'Select with Checkboxes',
    placeholder: 'Choose items...',
    selectionMode: 'multiple',
    isCheckable: true,
    searchPlaceholder: 'Search options...',
    width: 'max 30x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      {permissions.map((permission) => (
        <FilterPicker.Item
          key={permission.key}
          textValue={permission.label}
          description={permission.description}
        >
          {permission.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When `isCheckable={true}` and `selectionMode="multiple"`, checkboxes appear on the left of each option. The checkbox is only visible when the item is hovered or selected.',
      },
    },
  },
};

export const WithDescriptions: Story = {
  args: {
    label: 'Options with Descriptions',
    placeholder: 'Choose items...',
    selectionMode: 'single',
    searchPlaceholder: 'Search options...',
    width: 'max 35x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.slice(0, 5).map((fruit) => (
        <FilterPicker.Item
          key={fruit.key}
          textValue={fruit.label}
          description={fruit.description}
        >
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Options can include descriptions to provide additional context for each choice.',
      },
    },
  },
};

export const WithSections: Story = {
  args: {
    label: 'Organized by Sections',
    placeholder: 'Choose items...',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search ingredients...',
    width: 'max 30x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      <FilterPicker.Section title="Fruits">
        {fruits.slice(0, 3).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker.Section>
      <FilterPicker.Section title="Vegetables">
        {vegetables.slice(0, 3).map((vegetable) => (
          <FilterPicker.Item key={vegetable.key} textValue={vegetable.label}>
            {vegetable.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker.Section>
      <FilterPicker.Section title="Grains">
        {grains.slice(0, 3).map((grain) => (
          <FilterPicker.Item key={grain.key} textValue={grain.label}>
            {grain.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker.Section>
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use sections to organize related options into logical groups for better usability.',
      },
    },
  },
};

export const CustomSummary: Story = {
  args: {
    label: 'Custom Summary Display',
    placeholder: 'Choose items...',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    width: 'max 30x',
    renderSummary: ({ selectedLabels, selectedKeys, selectionMode }) => {
      if (selectionMode === 'single') {
        return selectedLabels[0] ? `Selected: ${selectedLabels[0]}` : null;
      }
      if (selectedKeys.length === 0) return null;
      if (selectedKeys.length === 1) return `${selectedLabels[0]} selected`;
      return `${selectedKeys.length} items selected (${selectedLabels.slice(0, 2).join(', ')}${selectedKeys.length > 2 ? '...' : ''})`;
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      <FilterPicker.Section title="Fruits">
        {fruits.map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker.Section>
      <FilterPicker.Section title="Vegetables">
        {vegetables.map((vegetable) => (
          <FilterPicker.Item key={vegetable.key} textValue={vegetable.label}>
            {vegetable.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker.Section>
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use the `renderSummary` prop to customize how the selection is displayed in the trigger button.',
      },
    },
  },
};

export const NoSummary: Story = {
  args: {
    label: 'No Summary Display',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    renderSummary: false,
    icon: <FilterIcon />,
    rightIcon: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.map((fruit) => (
        <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When `renderSummary={false}`, no text is shown in the trigger, making it useful for icon-only filter buttons.',
      },
    },
  },
};

export const WithHeaderAndFooter: Story = {
  args: {
    label: 'Programming Languages',
    placeholder: 'Select languages...',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search languages...',
    width: 'max 35x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker
      {...args}
      header={
        <>
          <Space gap="1x" flow="row" placeItems="center">
            <Title level={6}>Programming Languages</Title>
            <Badge type="purple">12</Badge>
          </Space>
          <Button
            type="clear"
            size="small"
            icon={<SettingsIcon />}
            aria-label="Filter settings"
          />
        </>
      }
      footer={
        <>
          <Text color="#dark.50" preset="t4">
            Popular languages shown
          </Text>
          <Button type="link" size="small" rightIcon={<RightIcon />}>
            View all
          </Button>
        </>
      }
    >
      {['Frontend', 'Backend', 'Database'].map((category) => (
        <FilterPicker.Section key={category} title={category}>
          {languages
            .filter((lang) => lang.category === category)
            .map((lang) => (
              <FilterPicker.Item key={lang.key} textValue={lang.label}>
                {lang.label}
              </FilterPicker.Item>
            ))}
        </FilterPicker.Section>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Add custom header and footer content to provide additional context or actions for the picker.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    label: 'Loading Data',
    placeholder: 'Loading...',
    isLoading: true,
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    width: 'max 25x',
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.map((fruit) => (
        <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Show a loading spinner in the trigger button while data is being fetched.',
      },
    },
  },
};

export const DisabledState: Story = {
  args: {
    label: 'Disabled Picker',
    placeholder: 'Cannot select...',
    isDisabled: true,
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    width: 'max 25x',
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.map((fruit) => (
        <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disable the entire picker when selection should not be allowed.',
      },
    },
  },
};

export const DisabledItems: Story = {
  args: {
    label: 'With Disabled Items',
    placeholder: 'Choose items...',
    selectionMode: 'single',
    disabledKeys: ['banana', 'cherry'],
    searchPlaceholder: 'Search options...',
    width: 'max 25x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.slice(0, 5).map((fruit) => (
        <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Individual items can be disabled using the `disabledKeys` prop. Disabled items cannot be selected and are visually distinguished.',
      },
    },
  },
};

export const DisallowEmptySelection: Story = {
  args: {
    label: 'Must Select One',
    placeholder: 'Choose one...',
    selectionMode: 'single',
    disallowEmptySelection: true,
    defaultSelectedKey: 'apple',
    searchPlaceholder: 'Search options...',
    width: 'max 25x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.slice(0, 4).map((fruit) => (
        <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When `disallowEmptySelection={true}`, the user cannot deselect the last selected item, ensuring at least one item is always selected.',
      },
    },
  },
};

export const ValidationStates: Story = {
  args: {
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    width: 'max 25x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    // Click the invalid one to show validation state
    await userEvent.click(triggers[1]);
  },
  render: (args) => (
    <Space gap="3x" flow="column">
      <FilterPicker
        {...args}
        label="Valid State"
        placeholder="All good!"
        validationState="valid"
        message="Selection is valid"
      >
        {fruits.slice(0, 4).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>

      <FilterPicker
        {...args}
        label="Invalid State"
        placeholder="Please select..."
        validationState="invalid"
        message="Selection is required"
      >
        {fruits.slice(0, 4).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>
    </Space>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Show validation states with appropriate styling and colors to indicate valid or invalid selections.',
      },
    },
  },
};

export const DifferentSizes: Story = {
  args: {
    label: 'Size Variants',
    placeholder: 'Choose size...',
    selectionMode: 'single',
    searchPlaceholder: 'Search...',
  },
  render: (args) => (
    <Space gap="3x" flow="column" placeItems="start">
      <FilterPicker {...args} size="small" placeholder="Small size">
        {fruits.slice(0, 3).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>

      <FilterPicker {...args} size="medium" placeholder="Medium size">
        {fruits.slice(0, 3).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>

      <FilterPicker {...args} size="large" placeholder="Large size">
        {fruits.slice(0, 3).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>
    </Space>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'FilterPicker supports three sizes: `small`, `medium`, and `large` to fit different interface requirements.',
      },
    },
  },
};

export const DifferentTypes: Story = {
  args: {
    label: 'Type Variants',
    placeholder: 'Choose type...',
    selectionMode: 'single',
    searchPlaceholder: 'Search...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    // Click the primary button
    await userEvent.click(triggers[1]);
  },
  render: (args) => (
    <Space gap="2x" flow="row wrap" placeItems="start">
      <FilterPicker {...args} type="outline" placeholder="Outline">
        {fruits.slice(0, 3).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>

      <FilterPicker {...args} type="primary" placeholder="Primary">
        {fruits.slice(0, 3).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>

      <FilterPicker {...args} type="secondary" placeholder="Secondary">
        {fruits.slice(0, 3).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>

      <FilterPicker {...args} type="clear" placeholder="Clear">
        {fruits.slice(0, 3).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>
    </Space>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use different button types to match your interface design: `outline`, `primary`, `secondary`, `clear`, and `neutral`.',
      },
    },
  },
};

export const WithIcons: Story = {
  args: {
    label: 'With Icons',
    placeholder: 'Filter by category...',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search categories...',
    width: 'max 30x',
    icon: <FilterIcon />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      <FilterPicker.Section title="User Management">
        <FilterPicker.Item key="users" textValue="Users">
          <Space gap="1x" flow="row" placeItems="center">
            <UserIcon />
            Users
          </Space>
        </FilterPicker.Item>
        <FilterPicker.Item key="permissions" textValue="Permissions">
          <Space gap="1x" flow="row" placeItems="center">
            <CheckIcon />
            Permissions
          </Space>
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="System">
        <FilterPicker.Item key="database" textValue="Database">
          <Space gap="1x" flow="row" placeItems="center">
            <DatabaseIcon />
            Database
          </Space>
        </FilterPicker.Item>
        <FilterPicker.Item key="settings" textValue="Settings">
          <Space gap="1x" flow="row" placeItems="center">
            <SettingsIcon />
            Settings
          </Space>
        </FilterPicker.Item>
      </FilterPicker.Section>
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Include icons in both the trigger button and the options to improve visual clarity and user experience.',
      },
    },
  },
};

export const WithCustomValues: Story = {
  args: {
    label: 'Custom Values Allowed',
    placeholder: 'Type or select...',
    selectionMode: 'multiple',
    allowsCustomValue: true,
    searchPlaceholder: 'Search or add custom value...',
    width: 'max 30x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      {fruits.slice(0, 4).map((fruit) => (
        <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
          {fruit.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When `allowsCustomValue={true}`, users can enter and select values that are not in the predefined list. Custom values are automatically added to the list when selected and persist across popover sessions.',
      },
    },
  },
};

export const WithTextValue: Story = {
  args: {
    label: 'Complex Content',
    placeholder: 'Choose plan...',
    selectionMode: 'single',
    searchPlaceholder: 'Search plans...',
    width: 'max 30x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      <FilterPicker.Item
        key="basic"
        textValue="Basic Plan - Free with limited features"
      >
        <Space gap="1x" flow="row" placeItems="center">
          <Text weight="600">Basic Plan</Text>
          <Badge type="neutral">Free</Badge>
        </Space>
      </FilterPicker.Item>
      <FilterPicker.Item
        key="pro"
        textValue="Pro Plan - Monthly subscription with all features"
      >
        <Space gap="1x" flow="row" placeItems="center">
          <Text weight="600">Pro Plan</Text>
          <Badge type="purple">$19/month</Badge>
        </Space>
      </FilterPicker.Item>
      <FilterPicker.Item
        key="enterprise"
        textValue="Enterprise Plan - Custom pricing for large teams"
      >
        <Space gap="1x" flow="row" placeItems="center">
          <Text weight="600">Enterprise Plan</Text>
          <Badge type="note">Custom</Badge>
        </Space>
      </FilterPicker.Item>
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use the `textValue` prop when option content is complex (JSX) to provide searchable text that includes more context than just the visible label.',
      },
    },
  },
};

export const ControlledExample = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>('apple');

  return (
    <Space gap="2x" flow="column" placeItems="start">
      <FilterPicker
        label="Controlled Single Selection"
        selectedKey={selectedKey}
        selectionMode="single"
        searchPlaceholder="Search fruits..."
        width="max 30x"
        onSelectionChange={(key) => setSelectedKey(key as string | null)}
      >
        {fruits.slice(0, 5).map((fruit) => (
          <FilterPicker.Item key={fruit.key} textValue={fruit.label}>
            {fruit.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>

      <Text>
        Selected: <strong>{selectedKey || 'None'}</strong>
      </Text>

      <Space gap="1x" flow="row">
        <Button
          size="small"
          type="outline"
          onClick={() => setSelectedKey('banana')}
        >
          Select Banana
        </Button>
        <Button
          size="small"
          type="outline"
          onClick={() => setSelectedKey(null)}
        >
          Clear Selection
        </Button>
      </Space>
    </Space>
  );
};

export const MultipleControlledExample = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['read', 'write']);

  return (
    <Space gap="2x" flow="column" placeItems="start">
      <FilterPicker
        label="Controlled Multiple Selection"
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        isCheckable={true}
        searchPlaceholder="Filter permissions..."
        width="max 30x"
        onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
      >
        {permissions.map((permission) => (
          <FilterPicker.Item
            key={permission.key}
            textValue={permission.label}
            description={permission.description}
          >
            {permission.label}
          </FilterPicker.Item>
        ))}
      </FilterPicker>

      <Text>
        Selected:{' '}
        <strong>
          {selectedKeys.length ? selectedKeys.join(', ') : 'None'}
        </strong>
      </Text>

      <Space gap="1x" flow="row">
        <Button
          size="small"
          type="outline"
          onClick={() => setSelectedKeys(['read', 'write', 'admin'])}
        >
          Select Admin Set
        </Button>
        <Button size="small" type="outline" onClick={() => setSelectedKeys([])}>
          Clear All
        </Button>
      </Space>
    </Space>
  );
};

export const InForm = () => {
  const [selectedTechnology, setSelectedTechnology] = useState<string | null>(
    null,
  );

  const handleSubmit = (data: any) => {
    alert(`Form submitted with technology: ${data.technology || 'None'}`);
  };

  return (
    <Form style={{ width: '400px' }} onSubmit={handleSubmit}>
      <FilterPicker
        isRequired
        name="technology"
        label="Preferred Technology"
        description="Select your preferred technology stack"
        placeholder="Choose technology..."
        selectionMode="single"
        searchPlaceholder="Search technologies..."
        value={selectedTechnology}
        onSelectionChange={(key) => setSelectedTechnology(key as string | null)}
      >
        <FilterPicker.Section title="Frontend">
          {languages
            .filter((lang) => lang.category === 'Frontend')
            .map((lang) => (
              <FilterPicker.Item key={lang.key} textValue={lang.label}>
                {lang.label}
              </FilterPicker.Item>
            ))}
        </FilterPicker.Section>
        <FilterPicker.Section title="Backend">
          {languages
            .filter((lang) => lang.category === 'Backend')
            .map((lang) => (
              <FilterPicker.Item key={lang.key} textValue={lang.label}>
                {lang.label}
              </FilterPicker.Item>
            ))}
        </FilterPicker.Section>
      </FilterPicker>

      <Form.Submit>Submit</Form.Submit>
    </Form>
  );
};

export const ComplexExample: Story = {
  args: {
    label: 'Advanced Filter System',
    placeholder: 'Apply filters...',
    selectionMode: 'multiple',
    isCheckable: true,
    searchPlaceholder: 'Search all filters...',
    width: '40x',
    renderSummary: ({ selectedKeys, selectedLabels }) => {
      if (selectedKeys.length === 0) return null;
      if (selectedKeys.length === 1) return `1 filter: ${selectedLabels[0]}`;
      if (selectedKeys.length <= 3)
        return `${selectedKeys.length} filters: ${selectedLabels.join(', ')}`;
      return `${selectedKeys.length} filters applied`;
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker
      {...args}
      header={
        <>
          <Space gap="1x" flow="row" placeItems="center">
            <FilterIcon />
            <Title level={6}>Filter Options</Title>
            <Badge type="neutral">24 available</Badge>
          </Space>
          <Space gap="1x" flow="row">
            <Button
              type="clear"
              size="small"
              icon={<SearchIcon />}
              aria-label="Advanced search"
            />
            <Button
              type="clear"
              size="small"
              icon={<PlusIcon />}
              aria-label="Add custom filter"
            />
          </Space>
        </>
      }
      footer={
        <>
          <Text color="#dark.50" preset="t4">
            Select multiple filters to combine conditions
          </Text>
          <Button type="link" size="small">
            Reset all
          </Button>
        </>
      }
    >
      <FilterPicker.Section title="Date & Time">
        <FilterPicker.Item key="created-today" textValue="Created Today">
          Created Today
        </FilterPicker.Item>
        <FilterPicker.Item key="created-week" textValue="Created This Week">
          Created This Week
        </FilterPicker.Item>
        <FilterPicker.Item key="created-month" textValue="Created This Month">
          Created This Month
        </FilterPicker.Item>
        <FilterPicker.Item
          key="modified-recently"
          textValue="Recently Modified"
        >
          Recently Modified
        </FilterPicker.Item>
      </FilterPicker.Section>

      <FilterPicker.Section title="Status & State">
        <FilterPicker.Item key="active" textValue="Active">
          Active Items
        </FilterPicker.Item>
        <FilterPicker.Item key="draft" textValue="Draft">
          Draft Items
        </FilterPicker.Item>
        <FilterPicker.Item key="archived" textValue="Archived">
          Archived Items
        </FilterPicker.Item>
        <FilterPicker.Item key="pending" textValue="Pending Review">
          Pending Review
        </FilterPicker.Item>
      </FilterPicker.Section>

      <FilterPicker.Section title="Categories">
        <FilterPicker.Item key="important" textValue="Important">
          Important
        </FilterPicker.Item>
        <FilterPicker.Item key="urgent" textValue="Urgent">
          Urgent
        </FilterPicker.Item>
        <FilterPicker.Item key="low-priority" textValue="Low Priority">
          Low Priority
        </FilterPicker.Item>
      </FilterPicker.Section>

      <FilterPicker.Section title="Advanced">
        <FilterPicker.Item key="has-attachments" textValue="Has Attachments">
          Has Attachments
        </FilterPicker.Item>
        <FilterPicker.Item key="has-comments" textValue="Has Comments">
          Has Comments
        </FilterPicker.Item>
        <FilterPicker.Item key="shared" textValue="Shared">
          Shared Items
        </FilterPicker.Item>
        <FilterPicker.Item key="favorites" textValue="Favorites">
          Favorite Items
        </FilterPicker.Item>
      </FilterPicker.Section>
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A comprehensive example showcasing multiple sections, custom header/footer, checkboxes, custom summary, and a wide variety of filter options that might be found in a real application.',
      },
    },
  },
};

export const CustomInputComponent: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByTestId('Picker');
    await userEvent.click(trigger);
  },
  render: (args) => {
    const CustomTagInput = () => {
      const [selectedKeys, setSelectedKeys] = useState<string[]>([
        'typescript',
        'react',
      ]);

      const availableOptions = [
        { key: 'javascript', label: 'JavaScript', theme: 'purple' },
        { key: 'typescript', label: 'TypeScript', theme: 'blue' },
        { key: 'react', label: 'React', theme: 'cyan' },
        { key: 'vue', label: 'Vue.js', theme: 'green' },
        { key: 'python', label: 'Python', theme: 'yellow' },
        { key: 'nodejs', label: 'Node.js', theme: 'lime' },
        { key: 'rust', label: 'Rust', theme: 'orange' },
        { key: 'go', label: 'Go', theme: 'teal' },
      ];

      const selectedOptions = availableOptions.filter((option) =>
        selectedKeys.includes(option.key),
      );

      const handleSelectionChange = (keys: string[]) => {
        setSelectedKeys(keys);
      };

      const handleTagRemove = (keyToRemove: string) => {
        setSelectedKeys((prev) => prev.filter((key) => key !== keyToRemove));
      };

      return (
        <Flow gap="2x" width="40x">
          <Text preset="t3" weight="600" color="#dark">
            Custom Tag Input Component
          </Text>

          <Flow gap="1x">
            {selectedOptions.length > 0 && (
              <Space gap=".5x" flow="row wrap" placeItems="start">
                {/* Tags display */}
                {selectedOptions.map((option) => (
                  <Tag
                    key={option.key}
                    isClosable
                    theme={option.theme}
                    onClose={() => handleTagRemove(option.key)}
                  >
                    {option.label}
                  </Tag>
                ))}
              </Space>
            )}

            {/* FilterPicker trigger */}
            <FilterPicker
              isCheckable
              qa="Picker"
              {...args}
              size="small"
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              renderSummary={false}
              icon={<PlusIcon />}
              aria-label="Add technology"
              searchPlaceholder="Search technologies..."
              onSelectionChange={handleSelectionChange}
            >
              {availableOptions.map((option) => (
                <FilterPicker.Item key={option.key} textValue={option.label}>
                  {option.label}
                </FilterPicker.Item>
              ))}
            </FilterPicker>
          </Flow>

          <Text preset="t4" color="#dark.60">
            Selected: {selectedKeys.length} / {availableOptions.length}{' '}
            technologies
          </Text>
        </Flow>
      );
    };

    return <CustomTagInput />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'A custom input component combining FilterPicker with Tag components. Selected items are displayed as removable tags, and the FilterPicker trigger shows only a plus icon for adding new items.',
      },
    },
  },
};

export const VirtualizedList: Story = {
  args: {
    label: 'Virtualized Large Dataset',
    placeholder: 'Select from large list...',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search through 100+ items...',
    width: 'max 35x',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    // Generate a large list of items with varying content to trigger virtualization
    // Mix items with and without descriptions to test dynamic sizing
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i + 1}${i % 7 === 0 ? ' - This is a longer item name to test dynamic sizing' : ''}`,
      description:
        i % 3 === 0
          ? `This is a description for item ${i + 1}. It varies in length to test virtualization with dynamic item heights.`
          : undefined,
    }));

    return (
      <Space gap="2x" flow="column" width="40x">
        <Text>
          Large list with {items.length} items with varying heights.
          Virtualization is automatically enabled when there are no sections.
          Scroll down and back up to test smooth virtualization.
        </Text>

        <FilterPicker
          {...args}
          selectedKeys={selectedKeys}
          items={items}
          onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
        >
          {(item) => (
            <FilterPicker.Item
              key={item.id}
              textValue={item.name}
              description={item.description}
            >
              {item.name}
            </FilterPicker.Item>
          )}
        </FilterPicker>

        <Text preset="t4" color="#dark.60">
          Selected: {selectedKeys.length} / {items.length} items
          {selectedKeys.length > 0 &&
            ` (${selectedKeys.slice(0, 3).join(', ')}${selectedKeys.length > 3 ? '...' : ''})`}
        </Text>
      </Space>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a FilterPicker contains many items and has no sections, virtualization is automatically enabled to improve performance. Only visible items are rendered in the DOM, providing smooth scrolling even with large datasets.',
      },
    },
  },
};

export const WithSelectAll: Story = {
  render: (args) => (
    <FilterPicker {...args}>
      {permissions.map((permission) => (
        <FilterPicker.Item
          key={permission.key}
          description={permission.description}
        >
          {permission.label}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  ),
  args: {
    label: 'Select permissions with Select All',
    placeholder: 'Choose permissions',
    selectionMode: 'multiple',
    isCheckable: true,
    showSelectAll: true,
    selectAllLabel: 'All Permissions',
    defaultSelectedKeys: ['read'],
    type: 'outline',
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `showSelectAll={true}` is used with multiple selection mode in FilterPicker, a "Select All" option appears in the dropdown above the search input. The checkbox shows indeterminate state when some items are selected, checked when all are selected, and unchecked when none are selected. The select all functionality works seamlessly with filtering and the trigger button shows the combined selection summary.',
      },
    },
  },
};
