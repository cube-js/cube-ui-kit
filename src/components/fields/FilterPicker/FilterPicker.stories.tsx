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
    selectionMode: {
      control: 'radio',
      options: ['single', 'multiple'],
      description: 'Selection mode for the picker',
      table: {
        defaultValue: { summary: 'single' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no selection is made',
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder text in the search input',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the picker is disabled',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the picker is in loading state',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    validationState: {
      control: 'radio',
      options: [undefined, 'valid', 'invalid'],
      description: 'Validation state of the picker',
    },
    isCheckable: {
      control: 'boolean',
      description: 'Whether to show checkboxes in multiple selection mode',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    type: {
      control: 'radio',
      options: ['outline', 'clear', 'primary', 'secondary', 'neutral'],
      description: 'Button styling type',
      table: {
        defaultValue: { summary: 'outline' },
      },
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Size of the picker',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },
    maxTags: {
      control: 'number',
      description:
        'Maximum number of tags to show before showing count (multiple mode only)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterPicker>;

// Sample data for stories
const fruits = [
  { key: 'apple', label: 'Apple' },
  { key: 'banana', label: 'Banana' },
  { key: 'cherry', label: 'Cherry' },
  { key: 'date', label: 'Date' },
  { key: 'elderberry', label: 'Elderberry' },
  { key: 'fig', label: 'Fig' },
  { key: 'grape', label: 'Grape' },
];

const vegetables = [
  { key: 'carrot', label: 'Carrot' },
  { key: 'broccoli', label: 'Broccoli' },
  { key: 'spinach', label: 'Spinach' },
  { key: 'pepper', label: 'Bell Pepper' },
  { key: 'tomato', label: 'Tomato' },
];

const grains = [
  { key: 'rice', label: 'Rice' },
  { key: 'quinoa', label: 'Quinoa' },
  { key: 'oats', label: 'Oats' },
  { key: 'barley', label: 'Barley' },
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
          'When `isCheckable={true}` and `selectionMode="multiple"`, checkboxes appear on the left of each option. The checkbox is only visible when the item is hovered or selected.',
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
      <FilterPicker.Section title="Frontend">
        <FilterPicker.Item key="javascript" textValue="JavaScript">
          JavaScript
        </FilterPicker.Item>
        <FilterPicker.Item key="typescript" textValue="TypeScript">
          TypeScript
        </FilterPicker.Item>
        <FilterPicker.Item key="react" textValue="React">
          React
        </FilterPicker.Item>
        <FilterPicker.Item key="vue" textValue="Vue.js">
          Vue.js
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="Backend">
        <FilterPicker.Item key="python" textValue="Python">
          Python
        </FilterPicker.Item>
        <FilterPicker.Item key="nodejs" textValue="Node.js">
          Node.js
        </FilterPicker.Item>
        <FilterPicker.Item key="rust" textValue="Rust">
          Rust
        </FilterPicker.Item>
        <FilterPicker.Item key="go" textValue="Go">
          Go
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="Database">
        <FilterPicker.Item key="sql" textValue="SQL">
          SQL
        </FilterPicker.Item>
        <FilterPicker.Item key="mongodb" textValue="MongoDB">
          MongoDB
        </FilterPicker.Item>
        <FilterPicker.Item key="redis" textValue="Redis">
          Redis
        </FilterPicker.Item>
        <FilterPicker.Item key="postgres" textValue="PostgreSQL">
          PostgreSQL
        </FilterPicker.Item>
      </FilterPicker.Section>
    </FilterPicker>
  ),
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
};

export const DifferentSizes: Story = {
  args: {
    label: 'Size Variants',
    placeholder: 'Choose size...',
    selectionMode: 'single',
    searchPlaceholder: 'Search...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    // Click the medium size button
    await userEvent.click(triggers[1]);
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
          <UserIcon /> Users
        </FilterPicker.Item>
        <FilterPicker.Item key="permissions" textValue="Permissions">
          <CheckIcon /> Permissions
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="System">
        <FilterPicker.Item key="database" textValue="Database">
          <DatabaseIcon /> Database
        </FilterPicker.Item>
        <FilterPicker.Item key="settings" textValue="Settings">
          <SettingsIcon /> Settings
        </FilterPicker.Item>
      </FilterPicker.Section>
    </FilterPicker>
  ),
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
    const trigger = canvas.getByTestId('AddTrigger');
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
          <Paragraph preset="t3m" color="#dark">
            Custom Tag Input Component
          </Paragraph>

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
              qa="Add"
              {...args}
              size="small"
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              renderSummary={false}
              icon={<PlusIcon />}
              rightIcon={null}
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

          <Paragraph preset="p4" color="#dark-03" height="10x">
            Selected: {selectedKeys.length} / {availableOptions.length}{' '}
            technologies
          </Paragraph>
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
