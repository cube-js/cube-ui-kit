import { userEvent, within } from '@storybook/test';

import { EditIcon, FilterIcon, RightIcon } from '../../../icons';
import { Button } from '../../actions/Button/Button';
import { Badge } from '../../content/Badge/Badge';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Space } from '../../layout/Space';

import { FilterPicker } from './FilterPicker';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FilterPicker> = {
  title: 'Forms/FilterPicker',
  component: FilterPicker,
  argTypes: {
    selectionMode: {
      control: 'radio',
      options: ['single', 'multiple'],
    },
    placeholder: {
      control: 'text',
    },
    isDisabled: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
    validationState: {
      control: 'radio',
      options: [undefined, 'valid', 'invalid'],
    },
    allowsCustomValue: {
      control: 'boolean',
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

export const Default: Story = {
  args: {
    label: 'Select Options',
    placeholder: 'Choose items...',
    searchPlaceholder: 'Search options...',
    width: 'max 30x',
  },
  // play: async ({ canvasElement }) => {
  //   const canvas = within(canvasElement);
  //   const trigger = canvas.getByRole('button');
  //   await userEvent.click(trigger);
  // },
  render: (args) => (
    <FilterPicker {...args}>
      <FilterPicker.Item key="apple" textValue="Apple">
        Apple
      </FilterPicker.Item>
      <FilterPicker.Item key="banana" textValue="Banana">
        Banana
      </FilterPicker.Item>
      <FilterPicker.Item key="cherry" textValue="Cherry">
        Cherry
      </FilterPicker.Item>
      <FilterPicker.Item key="carrot" textValue="Carrot">
        Carrot
      </FilterPicker.Item>
      <FilterPicker.Item key="broccoli" textValue="Broccoli">
        Broccoli
      </FilterPicker.Item>
      <FilterPicker.Item key="spinach" textValue="Spinach">
        Spinach
      </FilterPicker.Item>
      <FilterPicker.Item key="rice" textValue="Rice">
        Rice
      </FilterPicker.Item>
      <FilterPicker.Item key="quinoa" textValue="Quinoa">
        Quinoa
      </FilterPicker.Item>
    </FilterPicker>
  ),
};

export const WithSections: Story = {
  args: {
    label: 'Select Options',
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
        <FilterPicker.Item key="apple" textValue="Apple">
          Apple
        </FilterPicker.Item>
        <FilterPicker.Item key="banana" textValue="Banana">
          Banana
        </FilterPicker.Item>
        <FilterPicker.Item key="cherry" textValue="Cherry">
          Cherry
        </FilterPicker.Item>
        <FilterPicker.Item key="date" textValue="Date">
          Date
        </FilterPicker.Item>
        <FilterPicker.Item key="elderberry" textValue="Elderberry">
          Elderberry
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="Vegetables">
        <FilterPicker.Item key="carrot" textValue="Carrot">
          Carrot
        </FilterPicker.Item>
        <FilterPicker.Item key="broccoli" textValue="Broccoli">
          Broccoli
        </FilterPicker.Item>
        <FilterPicker.Item key="spinach" textValue="Spinach">
          Spinach
        </FilterPicker.Item>
        <FilterPicker.Item key="pepper" textValue="Bell Pepper">
          Bell Pepper
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="Grains">
        <FilterPicker.Item key="rice" textValue="Rice">
          Rice
        </FilterPicker.Item>
        <FilterPicker.Item key="quinoa" textValue="Quinoa">
          Quinoa
        </FilterPicker.Item>
        <FilterPicker.Item key="oats" textValue="Oats">
          Oats
        </FilterPicker.Item>
      </FilterPicker.Section>
    </FilterPicker>
  ),
};

export const CustomLabel: Story = {
  args: {
    label: 'Custom Summary',
    placeholder: 'Choose items...',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    width: 'max 30x',
    renderSummary: ({ selectedLabels, selectedKeys, selectionMode }) => {
      if (selectionMode === 'single') {
        return `Selected item: ${selectedLabels[0]}`;
      }
      return `${selectedKeys.length} of 12 selected`;
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
        <FilterPicker.Item key="apple" textValue="Apple">
          Apple
        </FilterPicker.Item>
        <FilterPicker.Item key="banana" textValue="Banana">
          Banana
        </FilterPicker.Item>
        <FilterPicker.Item key="cherry" textValue="Cherry">
          Cherry
        </FilterPicker.Item>
        <FilterPicker.Item key="date" textValue="Date">
          Date
        </FilterPicker.Item>
        <FilterPicker.Item key="elderberry" textValue="Elderberry">
          Elderberry
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="Vegetables">
        <FilterPicker.Item key="carrot" textValue="Carrot">
          Carrot
        </FilterPicker.Item>
        <FilterPicker.Item key="broccoli" textValue="Broccoli">
          Broccoli
        </FilterPicker.Item>
        <FilterPicker.Item key="spinach" textValue="Spinach">
          Spinach
        </FilterPicker.Item>
        <FilterPicker.Item key="pepper" textValue="Bell Pepper">
          Bell Pepper
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="Grains">
        <FilterPicker.Item key="rice" textValue="Rice">
          Rice
        </FilterPicker.Item>
        <FilterPicker.Item key="quinoa" textValue="Quinoa">
          Quinoa
        </FilterPicker.Item>
        <FilterPicker.Item key="oats" textValue="Oats">
          Oats
        </FilterPicker.Item>
      </FilterPicker.Section>
    </FilterPicker>
  ),
};

export const WithHeaderAndFooter: Story = {
  args: {
    label: 'Choose your preferred programming language',
    placeholder: 'Select languages...',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search languages...',
    width: 'max 30x',
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
            icon={<FilterIcon />}
            aria-label="Filter languages"
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

export const SingleIcon: Story = {
  args: {
    label: 'Single Icon',
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    renderSummary: false,
    icon: <EditIcon />,
    rightIcon: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  },
  render: (args) => (
    <FilterPicker {...args}>
      <FilterPicker.Section title="Fruits">
        <FilterPicker.Item key="apple" textValue="Apple">
          Apple
        </FilterPicker.Item>
        <FilterPicker.Item key="banana" textValue="Banana">
          Banana
        </FilterPicker.Item>
        <FilterPicker.Item key="cherry" textValue="Cherry">
          Cherry
        </FilterPicker.Item>
        <FilterPicker.Item key="date" textValue="Date">
          Date
        </FilterPicker.Item>
        <FilterPicker.Item key="elderberry" textValue="Elderberry">
          Elderberry
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="Vegetables">
        <FilterPicker.Item key="carrot" textValue="Carrot">
          Carrot
        </FilterPicker.Item>
        <FilterPicker.Item key="broccoli" textValue="Broccoli">
          Broccoli
        </FilterPicker.Item>
        <FilterPicker.Item key="spinach" textValue="Spinach">
          Spinach
        </FilterPicker.Item>
        <FilterPicker.Item key="pepper" textValue="Bell Pepper">
          Bell Pepper
        </FilterPicker.Item>
      </FilterPicker.Section>
      <FilterPicker.Section title="Grains">
        <FilterPicker.Item key="rice" textValue="Rice">
          Rice
        </FilterPicker.Item>
        <FilterPicker.Item key="quinoa" textValue="Quinoa">
          Quinoa
        </FilterPicker.Item>
        <FilterPicker.Item key="oats" textValue="Oats">
          Oats
        </FilterPicker.Item>
      </FilterPicker.Section>
    </FilterPicker>
  ),
};

export const WithCheckboxes: Story = {
  name: 'With Checkboxes',
  render: (props) => (
    <FilterPicker
      {...props}
      label="Select Fruits"
      placeholder="Choose fruits..."
      selectionMode="multiple"
      isCheckable={true}
    >
      <FilterPicker.Item key="apple">Apple</FilterPicker.Item>
      <FilterPicker.Item key="banana">Banana</FilterPicker.Item>
      <FilterPicker.Item key="cherry">Cherry</FilterPicker.Item>
      <FilterPicker.Item key="date">Date</FilterPicker.Item>
      <FilterPicker.Item key="elderberry">Elderberry</FilterPicker.Item>
      <FilterPicker.Item key="fig">Fig</FilterPicker.Item>
      <FilterPicker.Item key="grape">Grape</FilterPicker.Item>
    </FilterPicker>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When `isCheckable={true}` and `selectionMode="multiple"`, checkboxes appear on the left of each option. The checkbox is only visible when the item is hovered or selected. Clicking the checkbox toggles the item, while clicking elsewhere on the item toggles it and closes the popover.',
      },
    },
  },
};
