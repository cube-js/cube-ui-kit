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
    selectionMode: 'multiple',
    searchPlaceholder: 'Search options...',
    width: 'max 30x',
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
