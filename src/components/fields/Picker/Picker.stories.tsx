import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Text } from '../../content/Text';
import { Flex } from '../../layout/Flex';

import { Picker } from './Picker';

const meta = {
  title: 'Forms/Picker',
  component: Picker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Picker>;

export default meta;
type Story = StoryObj<typeof meta>;

const fruits = [
  { key: 'apple', label: 'Apple' },
  { key: 'banana', label: 'Banana' },
  { key: 'orange', label: 'Orange' },
  { key: 'strawberry', label: 'Strawberry' },
  { key: 'mango', label: 'Mango' },
  { key: 'pineapple', label: 'Pineapple' },
];

export const SingleSelection: Story = {
  args: {
    placeholder: 'Select a fruit',
    label: 'Favorite Fruit',
    selectionMode: 'single',
    children: fruits.map((fruit) => (
      <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
    )),
  },
};

export const MultipleSelection: Story = {
  args: {
    placeholder: 'Select fruits',
    label: 'Favorite Fruits',
    selectionMode: 'multiple',
    isCheckable: true,
    children: fruits.map((fruit) => (
      <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
    )),
  },
};

export const IsClearable: Story = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Picker
        placeholder="Select a fruit"
        label="Single Selection (Clearable)"
        selectionMode="single"
        isClearable={true}
        defaultSelectedKey="apple"
      >
        {fruits.map((fruit) => (
          <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
        ))}
      </Picker>
      <Picker
        placeholder="Select fruits"
        label="Multiple Selection (Clearable)"
        selectionMode="multiple"
        isCheckable={true}
        isClearable={true}
        defaultSelectedKeys={['apple', 'banana']}
      >
        {fruits.map((fruit) => (
          <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
        ))}
      </Picker>
    </Flex>
  ),
};

export const WithSelectAll: Story = {
  args: {
    placeholder: 'Select fruits',
    label: 'Favorite Fruits',
    selectionMode: 'multiple',
    isCheckable: true,
    showSelectAll: true,
    selectAllLabel: 'All Fruits',
    children: fruits.map((fruit) => (
      <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
    )),
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Select a fruit',
    label: 'Favorite Fruit',
    selectionMode: 'single',
    isDisabled: true,
    defaultSelectedKey: 'apple',
    children: fruits.map((fruit) => (
      <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
    )),
  },
};

export const WithCustomRenderSummary: Story = {
  args: {
    placeholder: 'Select fruits',
    label: 'Favorite Fruits',
    selectionMode: 'multiple',
    isCheckable: true,
    defaultSelectedKeys: ['apple', 'banana'],
    renderSummary: ({ selectedLabels }) => {
      if (!selectedLabels || selectedLabels.length === 0) return null;
      if (selectedLabels.length === 1) return selectedLabels[0];
      return `${selectedLabels.length} fruits selected`;
    },
    children: fruits.map((fruit) => (
      <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
    )),
  },
};

export const WithSections: Story = {
  args: {
    placeholder: 'Select a food',
    label: 'Favorite Food',
    selectionMode: 'single',
    children: (
      <>
        <Picker.Section title="Fruits">
          <Picker.Item key="apple">Apple</Picker.Item>
          <Picker.Item key="banana">Banana</Picker.Item>
          <Picker.Item key="orange">Orange</Picker.Item>
        </Picker.Section>
        <Picker.Section title="Vegetables">
          <Picker.Item key="carrot">Carrot</Picker.Item>
          <Picker.Item key="broccoli">Broccoli</Picker.Item>
          <Picker.Item key="spinach">Spinach</Picker.Item>
        </Picker.Section>
      </>
    ),
  },
};

export const DynamicSections: Story = {
  args: {
    placeholder: 'Select a food',
    label: 'Favorite Food',
    selectionMode: 'single',
  },
  render: (args) => {
    const categories = [
      {
        name: 'Fruits',
        children: [
          { key: 'apple', label: 'Apple' },
          { key: 'banana', label: 'Banana' },
          { key: 'orange', label: 'Orange' },
        ],
      },
      {
        name: 'Vegetables',
        children: [
          { key: 'carrot', label: 'Carrot' },
          { key: 'broccoli', label: 'Broccoli' },
          { key: 'spinach', label: 'Spinach' },
        ],
      },
    ];

    return (
      <Picker {...args} items={categories}>
        {(category: any) => (
          <Picker.Section
            key={category.name}
            title={category.name}
            items={category.children}
          >
            {(item: any) => (
              <Picker.Item key={item.key}>{item.label}</Picker.Item>
            )}
          </Picker.Section>
        )}
      </Picker>
    );
  },
};

export const WithItemsArray: Story = {
  args: {
    placeholder: 'Select a fruit',
    label: 'Favorite Fruit',
    selectionMode: 'single',
    items: fruits,
    children: (item: { key: string; label: string }) => (
      <Picker.Item key={item.key}>{item.label}</Picker.Item>
    ),
  },
};

export const Controlled = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <Flex flow="column" gap="2x">
      <Picker
        placeholder="Select a fruit"
        label="Favorite Fruit"
        selectionMode="single"
        selectedKey={selectedKey}
        onSelectionChange={(key) => setSelectedKey(key as string | null)}
      >
        {fruits.map((fruit) => (
          <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
        ))}
      </Picker>
      <Text>Selected: {selectedKey || 'None'}</Text>
    </Flex>
  );
};

export const ControlledMultiple = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['apple']);

  return (
    <Flex flow="column" gap="2x">
      <Picker
        placeholder="Select fruits"
        label="Favorite Fruits"
        selectionMode="multiple"
        isCheckable={true}
        isClearable={true}
        selectedKeys={selectedKeys}
        items={fruits}
        onSelectionChange={(keys) => {
          if (keys === 'all') {
            setSelectedKeys(fruits.map((f) => f.key));
          } else {
            setSelectedKeys(keys as string[]);
          }
        }}
      >
        {(fruit) => <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>}
      </Picker>
      <Text>Selected: {selectedKeys.join(', ') || 'None'}</Text>
    </Flex>
  );
};

export const DifferentSizes: Story = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Picker
        placeholder="Select a fruit"
        label="Small Picker"
        selectionMode="single"
        size="small"
      >
        {fruits.map((fruit) => (
          <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
        ))}
      </Picker>
      <Picker
        placeholder="Select a fruit"
        label="Medium Picker"
        selectionMode="single"
        size="medium"
      >
        {fruits.map((fruit) => (
          <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
        ))}
      </Picker>
      <Picker
        placeholder="Select a fruit"
        label="Large Picker"
        selectionMode="single"
        size="large"
      >
        {fruits.map((fruit) => (
          <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
        ))}
      </Picker>
    </Flex>
  ),
};

export const WithValidation: Story = {
  args: {
    placeholder: 'Select a fruit',
    label: 'Favorite Fruit (Required)',
    selectionMode: 'single',
    isRequired: true,
    validationState: 'invalid',
    message: 'Please select a fruit',
    children: fruits.map((fruit) => (
      <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
    )),
  },
};

export const WithDescription: Story = {
  args: {
    placeholder: 'Select a fruit',
    label: 'Favorite Fruit',
    description: 'Choose your favorite fruit from the list',
    selectionMode: 'single',
    children: fruits.map((fruit) => (
      <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
    )),
  },
};

export const LoadingState: Story = {
  args: {
    placeholder: 'Loading...',
    label: 'Favorite Fruit',
    selectionMode: 'single',
    isLoading: true,
    children: fruits.map((fruit) => (
      <Picker.Item key={fruit.key}>{fruit.label}</Picker.Item>
    )),
  },
};
