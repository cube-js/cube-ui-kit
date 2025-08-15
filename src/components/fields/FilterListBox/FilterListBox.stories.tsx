import { StoryFn } from '@storybook/react-vite';
import { IconFile, IconFileDiff } from '@tabler/icons-react';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';

import {
  BellFilledIcon,
  CheckIcon,
  DatabaseIcon,
  FilterIcon,
  PlusIcon,
  RightIcon,
  SettingsIcon,
  UserIcon,
} from '../../../icons';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Badge } from '../../content/Badge/Badge';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Form, SubmitButton } from '../../form';
import { Space } from '../../layout/Space';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

import { CubeFilterListBoxProps, FilterListBox } from './FilterListBox';

// import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: any = {
  title: 'Forms/FilterListBox',
  component: FilterListBox,
  parameters: {
    controls: {
      exclude: baseProps,
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
      options: ['single', 'multiple'],
      control: { type: 'radio' },
      description: 'Selection mode',
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

    /* Search */
    searchPlaceholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the search input',
      table: {
        defaultValue: { summary: 'Search...' },
      },
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
      table: {
        defaultValue: { summary: 'No results found' },
      },
    },
    filter: {
      control: false,
      description:
        'Custom filter function for determining if an option should be included in search results',
    },

    /* Presentation */
    size: {
      options: ['medium', 'large'],
      control: { type: 'radio' },
      description: 'FilterListBox size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },
    header: {
      control: { type: 'text' },
      description: 'Custom header content',
    },
    footer: {
      control: { type: 'text' },
      description: 'Custom footer content',
    },

    /* Behavior */
    isCheckable: {
      control: { type: 'boolean' },
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

    /* State */
    isLoading: {
      control: { type: 'boolean' },
      description: 'Whether the FilterListBox is loading',
      table: {
        defaultValue: { summary: false },
      },
    },
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the FilterListBox is disabled',
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
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description: 'Validation state of the FilterListBox',
      table: {
        defaultValue: { summary: undefined },
      },
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
  },
};

export default meta;
type Story = any;

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
  {
    key: 'honeydew',
    label: 'Honeydew',
    description: 'Sweet green melon with pale flesh',
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

const herbs = [
  {
    key: 'basil',
    label: 'Basil',
    description: 'Aromatic herb used in Mediterranean cooking',
  },
  {
    key: 'oregano',
    label: 'Oregano',
    description: 'Pungent herb popular in Italian cuisine',
  },
  {
    key: 'thyme',
    label: 'Thyme',
    description: 'Fragrant herb with earthy flavor',
  },
  {
    key: 'parsley',
    label: 'Parsley',
    description: 'Fresh herb used for garnish and flavor',
  },
  {
    key: 'cilantro',
    label: 'Cilantro',
    description: 'Bright herb with citrusy flavor',
  },
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
  {
    key: 'javascript',
    label: 'JavaScript',
    description: 'Dynamic, interpreted programming language',
  },
  {
    key: 'python',
    label: 'Python',
    description: 'High-level, general-purpose programming language',
  },
  {
    key: 'typescript',
    label: 'TypeScript',
    description: 'Strongly typed programming language based on JavaScript',
  },
  {
    key: 'rust',
    label: 'Rust',
    description:
      'Systems programming language focused on safety and performance',
  },
  {
    key: 'go',
    label: 'Go',
    description: 'Open source programming language supported by Google',
  },
  {
    key: 'java',
    label: 'Java',
    description: 'Object-oriented programming language',
  },
  {
    key: 'csharp',
    label: 'C#',
    description: 'Modern object-oriented language',
  },
  { key: 'php', label: 'PHP', description: 'Server-side scripting language' },
];

const Template: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox {...args}>
    {fruits.slice(0, 6).map((fruit) => (
      <FilterListBox.Item key={fruit.key}>{fruit.label}</FilterListBox.Item>
    ))}
  </FilterListBox>
);

export const Default: Story = {
  render: Template,
  args: {
    label: 'Choose a fruit',
    searchPlaceholder: 'Search fruits...',
  },
};

export const SingleSelection: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      {fruits.map((fruit) => (
        <FilterListBox.Item key={fruit.key}>{fruit.label}</FilterListBox.Item>
      ))}
    </FilterListBox>
  ),
  args: {
    label: 'Choose your favorite fruit',
    selectionMode: 'single',
    defaultSelectedKey: 'apple',
    searchPlaceholder: 'Search fruits...',
  },
};

export const MultipleSelection: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      {permissions.map((permission) => (
        <FilterListBox.Item
          key={permission.key}
          description={permission.description}
        >
          {permission.label}
        </FilterListBox.Item>
      ))}
    </FilterListBox>
  ),
  args: {
    label: 'Select permissions',
    selectionMode: 'multiple',
    defaultSelectedKeys: ['read', 'write'],
    searchPlaceholder: 'Filter permissions...',
  },
};

export const WithDescriptions: StoryFn<CubeFilterListBoxProps<any>> = (
  args,
) => (
  <FilterListBox {...args}>
    {fruits.slice(0, 5).map((fruit) => (
      <FilterListBox.Item key={fruit.key} description={fruit.description}>
        {fruit.label}
      </FilterListBox.Item>
    ))}
  </FilterListBox>
);
WithDescriptions.args = {
  label: 'Choose a fruit',
  searchPlaceholder: 'Search fruits...',
};

export const WithSections: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox {...args}>
    <FilterListBox.Section key="fruits" title="Fruits">
      {fruits.slice(0, 3).map((fruit) => (
        <FilterListBox.Item key={fruit.key}>{fruit.label}</FilterListBox.Item>
      ))}
    </FilterListBox.Section>
    <FilterListBox.Section key="vegetables" title="Vegetables">
      {vegetables.slice(0, 3).map((vegetable) => (
        <FilterListBox.Item key={vegetable.key}>
          {vegetable.label}
        </FilterListBox.Item>
      ))}
    </FilterListBox.Section>
    <FilterListBox.Section key="herbs" title="Herbs">
      {herbs.slice(0, 3).map((herb) => (
        <FilterListBox.Item key={herb.key}>{herb.label}</FilterListBox.Item>
      ))}
    </FilterListBox.Section>
  </FilterListBox>
);
WithSections.args = {
  label: 'Choose an ingredient',
  searchPlaceholder: 'Search ingredients...',
};

export const WithSectionsAndDescriptions: StoryFn<
  CubeFilterListBoxProps<any>
> = (args) => (
  <FilterListBox {...args}>
    <FilterListBox.Section key="fruits" title="Fruits">
      {fruits.slice(0, 3).map((fruit) => (
        <FilterListBox.Item key={fruit.key} description={fruit.description}>
          {fruit.label}
        </FilterListBox.Item>
      ))}
    </FilterListBox.Section>
    <FilterListBox.Section key="vegetables" title="Vegetables">
      {vegetables.slice(0, 3).map((vegetable) => (
        <FilterListBox.Item
          key={vegetable.key}
          description={vegetable.description}
        >
          {vegetable.label}
        </FilterListBox.Item>
      ))}
    </FilterListBox.Section>
    <FilterListBox.Section key="herbs" title="Herbs">
      {herbs.slice(0, 3).map((herb) => (
        <FilterListBox.Item key={herb.key} description={herb.description}>
          {herb.label}
        </FilterListBox.Item>
      ))}
    </FilterListBox.Section>
  </FilterListBox>
);
WithSectionsAndDescriptions.args = {
  label: 'Choose an ingredient',
  searchPlaceholder: 'Search ingredients...',
};

export const WithHeaderAndFooter: StoryFn<CubeFilterListBoxProps<any>> = (
  args,
) => (
  <FilterListBox
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
    {languages.slice(0, 5).map((language) => (
      <FilterListBox.Item
        key={language.key}
        textValue={`${language.label} - ${language.description}`}
      >
        {language.label}
      </FilterListBox.Item>
    ))}
  </FilterListBox>
);
WithHeaderAndFooter.args = {
  label: 'Choose your preferred programming language',
  searchPlaceholder: 'Search languages...',
};

export const CheckableMultipleSelection: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      {permissions.map((permission) => (
        <FilterListBox.Item
          key={permission.key}
          description={permission.description}
        >
          {permission.label}
        </FilterListBox.Item>
      ))}
    </FilterListBox>
  ),
  args: {
    label: 'Select user permissions',
    selectionMode: 'multiple',
    isCheckable: true,
    defaultSelectedKeys: ['read', 'write'],
    searchPlaceholder: 'Filter permissions...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `isCheckable={true}` and `selectionMode="multiple"`, checkboxes appear on the left of each option. The checkbox is only visible when the item is hovered or selected.',
      },
    },
  },
};

export const AllowsCustomValue: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      {fruits.slice(0, 5).map((fruit) => (
        <FilterListBox.Item key={fruit.key}>{fruit.label}</FilterListBox.Item>
      ))}
    </FilterListBox>
  ),
  args: {
    label: 'Select or add fruits',
    allowsCustomValue: true,
    selectionMode: 'multiple',
    searchPlaceholder: 'Search or type new fruit...',
  },
  parameters: {
    docs: {
      description: {
        story:
          "When `allowsCustomValue={true}`, users can type custom values that aren't in the predefined list. Custom values appear at the bottom of search results.",
      },
    },
  },
};

export const DisabledItems: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      <FilterListBox.Item key="available1">
        Available Option 1
      </FilterListBox.Item>
      <FilterListBox.Item key="disabled1">Disabled Option 1</FilterListBox.Item>
      <FilterListBox.Item key="available2">
        Available Option 2
      </FilterListBox.Item>
      <FilterListBox.Item key="disabled2">Disabled Option 2</FilterListBox.Item>
      <FilterListBox.Item key="available3">
        Available Option 3
      </FilterListBox.Item>
    </FilterListBox>
  ),
  args: {
    label: 'Select an option',
    selectionMode: 'single',
    disabledKeys: ['disabled1', 'disabled2'],
    searchPlaceholder: 'Search options...',
  },
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
  render: (args) => (
    <FilterListBox {...args}>
      {fruits.slice(0, 4).map((fruit) => (
        <FilterListBox.Item key={fruit.key}>{fruit.label}</FilterListBox.Item>
      ))}
    </FilterListBox>
  ),
  args: {
    label: 'Must select one option',
    selectionMode: 'single',
    disallowEmptySelection: true,
    defaultSelectedKey: 'apple',
    searchPlaceholder: 'Search fruits...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `disallowEmptySelection={true}`, the user cannot deselect the last selected item, ensuring at least one item is always selected.',
      },
    },
  },
};

export const WithTextValue: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      <FilterListBox.Item
        key="basic"
        textValue="Basic Plan - Free with limited features"
      >
        <Space gap="1x" flow="column">
          <Text weight="600">Basic Plan</Text>
          <Badge type="neutral">Free</Badge>
        </Space>
      </FilterListBox.Item>
      <FilterListBox.Item
        key="pro"
        textValue="Pro Plan - Monthly subscription with all features"
      >
        <Space gap="1x" flow="column">
          <Text weight="600">Pro Plan</Text>
          <Badge type="purple">$19/month</Badge>
        </Space>
      </FilterListBox.Item>
      <FilterListBox.Item
        key="enterprise"
        textValue="Enterprise Plan - Custom pricing for large teams"
      >
        <Space gap="1x" flow="column">
          <Text weight="600">Enterprise Plan</Text>
          <Badge type="note">Custom</Badge>
        </Space>
      </FilterListBox.Item>
    </FilterListBox>
  ),
  args: {
    label: 'Choose your plan',
    selectionMode: 'single',
    searchPlaceholder: 'Search plans...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the `textValue` prop when option content is complex (JSX) to provide searchable text that includes more context than just the visible label.',
      },
    },
  },
};

export const CustomFilter: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox
    {...args}
    filter={(text, search) => {
      // Custom filter: starts with search term (case insensitive)
      return text.toLowerCase().startsWith(search.toLowerCase());
    }}
  >
    {languages.slice(0, 6).map((language) => (
      <FilterListBox.Item key={language.key}>
        {language.label}
      </FilterListBox.Item>
    ))}
  </FilterListBox>
);
CustomFilter.args = {
  label: 'Programming Language',
  searchPlaceholder: 'Type first letters...',
  description: 'Custom filter that matches items starting with your input',
};

export const LoadingState: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      <FilterListBox.Item key="item1">Loading Item 1</FilterListBox.Item>
      <FilterListBox.Item key="item2">Loading Item 2</FilterListBox.Item>
      <FilterListBox.Item key="item3">Loading Item 3</FilterListBox.Item>
    </FilterListBox>
  ),
  args: {
    label: 'Choose an item',
    isLoading: true,
    searchPlaceholder: 'Loading data...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `isLoading={true}`, a loading icon appears in the search input and the placeholder can indicate loading state.',
      },
    },
  },
};

export const CustomEmptyState: Story = {
  render: (args) => (
    <FilterListBox
      {...args}
      emptyLabel={
        <Space gap="1x" flow="column" placeItems="center" padding="2x">
          <Text preset="t1">🔍</Text>
          <Text weight="600">No matching countries found</Text>
          <Text preset="t4" color="#dark.60">
            Try searching for a different country name
          </Text>
        </Space>
      }
    >
      <FilterListBox.Item key="us">United States</FilterListBox.Item>
      <FilterListBox.Item key="ca">Canada</FilterListBox.Item>
      <FilterListBox.Item key="uk">United Kingdom</FilterListBox.Item>
      <FilterListBox.Item key="de">Germany</FilterListBox.Item>
      <FilterListBox.Item key="fr">France</FilterListBox.Item>
    </FilterListBox>
  ),
  args: {
    label: 'Select country',
    searchPlaceholder: 'Search countries...',
    description:
      "Try searching for something that doesn't exist to see the custom empty state",
  },
  parameters: {
    docs: {
      description: {
        story:
          'Customize the empty state message shown when search results are empty using the `emptyLabel` prop. Can be a string or custom JSX.',
      },
    },
  },
};

export const AutoFocus: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      {fruits.slice(0, 5).map((fruit) => (
        <FilterListBox.Item key={fruit.key}>{fruit.label}</FilterListBox.Item>
      ))}
    </FilterListBox>
  ),
  args: {
    label: 'Auto-focused search',
    autoFocus: true,
    searchPlaceholder: 'Start typing immediately...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use `autoFocus={true}` to automatically focus the search input when the component mounts. Useful in dialogs and other focused contexts.',
      },
    },
  },
};

export const DisabledState: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox {...args}>
    <FilterListBox.Item key="option1">Option 1</FilterListBox.Item>
    <FilterListBox.Item key="option2">Option 2</FilterListBox.Item>
    <FilterListBox.Item key="option3">Option 3</FilterListBox.Item>
  </FilterListBox>
);
DisabledState.args = {
  label: 'Disabled FilterListBox',
  isDisabled: true,
  searchPlaceholder: 'Cannot search...',
};

export const ValidationStates: StoryFn<CubeFilterListBoxProps<any>> = () => (
  <Space gap="3x" flow="column">
    <FilterListBox
      label="Valid state"
      validationState="valid"
      message="Good choice!"
      defaultSelectedKey="option1"
      searchPlaceholder="Search options..."
    >
      <FilterListBox.Item key="option1">Valid Option 1</FilterListBox.Item>
      <FilterListBox.Item key="option2">Valid Option 2</FilterListBox.Item>
    </FilterListBox>

    <FilterListBox
      label="Invalid state"
      validationState="invalid"
      message="Please select a different option"
      defaultSelectedKey="option1"
      searchPlaceholder="Search options..."
    >
      <FilterListBox.Item key="option1">Invalid Option 1</FilterListBox.Item>
      <FilterListBox.Item key="option2">Invalid Option 2</FilterListBox.Item>
    </FilterListBox>
  </Space>
);

export const ControlledExample: StoryFn<CubeFilterListBoxProps<any>> = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>('apple');

  return (
    <Space gap="2x" flow="column">
      <FilterListBox
        label="Controlled FilterListBox"
        selectedKey={selectedKey}
        selectionMode="single"
        searchPlaceholder="Search fruits..."
        onSelectionChange={(key) => setSelectedKey(key as string | null)}
      >
        {fruits.slice(0, 6).map((fruit) => (
          <FilterListBox.Item key={fruit.key}>{fruit.label}</FilterListBox.Item>
        ))}
      </FilterListBox>

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

export const MultipleControlledExample: StoryFn<
  CubeFilterListBoxProps<any>
> = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['read', 'write']);

  return (
    <Space gap="2x" flow="column">
      <FilterListBox
        label="Controlled Multiple Selection"
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        isCheckable={true}
        searchPlaceholder="Filter permissions..."
        onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
      >
        {permissions.map((permission) => (
          <FilterListBox.Item
            key={permission.key}
            description={permission.description}
          >
            {permission.label}
          </FilterListBox.Item>
        ))}
      </FilterListBox>

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

export const InForm: StoryFn = () => {
  const [value, setValue] = useState<string | null>(null);

  return (
    <Form
      style={{ width: '400px' }}
      onSubmit={(data) => {
        alert(`Form submitted with: ${JSON.stringify(data, null, 2)}`);
      }}
    >
      <FilterListBox
        isRequired
        name="country"
        label="Country"
        value={value}
        searchPlaceholder="Search countries..."
        onSelectionChange={(key) => setValue(key as string)}
      >
        <FilterListBox.Section title="North America">
          <FilterListBox.Item key="us">United States</FilterListBox.Item>
          <FilterListBox.Item key="ca">Canada</FilterListBox.Item>
          <FilterListBox.Item key="mx">Mexico</FilterListBox.Item>
        </FilterListBox.Section>
        <FilterListBox.Section title="Europe">
          <FilterListBox.Item key="uk">United Kingdom</FilterListBox.Item>
          <FilterListBox.Item key="de">Germany</FilterListBox.Item>
          <FilterListBox.Item key="fr">France</FilterListBox.Item>
        </FilterListBox.Section>
      </FilterListBox>

      <SubmitButton>Submit</SubmitButton>
    </Form>
  );
};

export const InDialog: StoryFn = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button>Open Dialog with FilterListBox</Button>
      <Dialog>
        <FilterListBox
          autoFocus
          size="large"
          searchPlaceholder="Search frameworks..."
        >
          <FilterListBox.Section title="Frontend">
            <FilterListBox.Item key="react">React</FilterListBox.Item>
            <FilterListBox.Item key="vue">Vue.js</FilterListBox.Item>
            <FilterListBox.Item key="angular">Angular</FilterListBox.Item>
          </FilterListBox.Section>
          <FilterListBox.Section title="Backend">
            <FilterListBox.Item key="express">Express.js</FilterListBox.Item>
            <FilterListBox.Item key="fastify">Fastify</FilterListBox.Item>
            <FilterListBox.Item key="koa">Koa.js</FilterListBox.Item>
          </FilterListBox.Section>
        </FilterListBox>
      </Dialog>
    </DialogTrigger>
  );
};

export const AsyncLoading: StoryFn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
  ]);

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setItems([
        'Avocado',
        'Blueberry',
        'Coconut',
        'Dragonfruit',
        'Fig',
        'Grape',
        'Honeydew',
        'Kiwi',
        'Lemon',
        'Mango',
      ]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <Space gap="2x" flow="column">
      <Button isDisabled={isLoading} onPress={refreshData}>
        {isLoading ? 'Loading...' : 'Refresh Data'}
      </Button>

      <FilterListBox
        label="Fruits"
        isLoading={isLoading}
        searchPlaceholder={isLoading ? 'Loading...' : 'Search fruits...'}
      >
        {items.map((item) => (
          <FilterListBox.Item key={item.toLowerCase()}>
            {item}
          </FilterListBox.Item>
        ))}
      </FilterListBox>
    </Space>
  );
};

export const WithIcons: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      <FilterListBox.Section title="User Management">
        <FilterListBox.Item key="users">
          <Space gap="1x" flow="row" placeItems="center">
            <UserIcon />
            Users
          </Space>
        </FilterListBox.Item>
        <FilterListBox.Item key="permissions">
          <Space gap="1x" flow="row" placeItems="center">
            <CheckIcon />
            Permissions
          </Space>
        </FilterListBox.Item>
      </FilterListBox.Section>
      <FilterListBox.Section title="System">
        <FilterListBox.Item key="database">
          <Space gap="1x" flow="row" placeItems="center">
            <DatabaseIcon />
            Database
          </Space>
        </FilterListBox.Item>
        <FilterListBox.Item key="settings">
          <Space gap="1x" flow="row" placeItems="center">
            <SettingsIcon />
            Settings
          </Space>
        </FilterListBox.Item>
      </FilterListBox.Section>
    </FilterListBox>
  ),
  args: {
    label: 'System Administration',
    selectionMode: 'single',
    searchPlaceholder: 'Search admin options...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'FilterListBox options can include icons to improve visual clarity and help users quickly identify options during search.',
      },
    },
  },
};

export const WithCustomStyles: StoryFn = () => (
  <FilterListBox
    allowsCustomValue
    label="Custom Styled FilterListBox"
    searchPlaceholder="Search with custom styles..."
    selectionMode="multiple"
    styles={{
      fill: '#gradient(to right, #purple.20, #blue.20)',
      border: '2bw solid #purple',
      radius: '2r',
    }}
    searchInputStyles={{
      fill: '#purple.05',
      color: '#purple',
    }}
    optionStyles={{
      fill: {
        '': '#clear',
        hovered: '#purple.10',
        selected: '#purple.20',
      },
      color: {
        '': '#purple.80',
        selected: '#purple',
      },
    }}
  >
    <FilterListBox.Item key="purple">Purple Theme</FilterListBox.Item>
    <FilterListBox.Item key="blue">Blue Theme</FilterListBox.Item>
    <FilterListBox.Item key="green">Green Theme</FilterListBox.Item>
    <FilterListBox.Item key="red">Red Theme</FilterListBox.Item>
  </FilterListBox>
);

WithCustomStyles.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // Find the search input
  const searchInput = canvas.getByPlaceholderText(
    'Search with custom styles...',
  );

  // Type a custom value
  await userEvent.type(searchInput, 'Orange Theme');

  // Wait a moment for the input to register
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Press Enter to add the custom value
  await userEvent.keyboard('{Enter}');
};

export const EscapeKeyHandling: StoryFn<CubeFilterListBoxProps<any>> = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>('apple');
  const [escapeCount, setEscapeCount] = useState(0);

  return (
    <Space gap="2x" flow="column">
      <FilterListBox
        label="Custom Escape Handling"
        selectedKey={selectedKey}
        selectionMode="single"
        searchPlaceholder="Search fruits..."
        onSelectionChange={(key) => setSelectedKey(key as string | null)}
        onEscape={() => {
          setEscapeCount((prev) => prev + 1);
          // Custom escape behavior - could close a parent modal, etc.
        }}
      >
        {fruits.slice(0, 4).map((fruit) => (
          <FilterListBox.Item key={fruit.key}>{fruit.label}</FilterListBox.Item>
        ))}
      </FilterListBox>

      <Text>
        Selected: <strong>{selectedKey || 'None'}</strong>
      </Text>
      <Text>
        Escape key pressed: <strong>{escapeCount} times</strong>
      </Text>
      <Text preset="t4" color="#dark.60">
        Focus the search input and press Escape to trigger custom handling
      </Text>
    </Space>
  );
};

EscapeKeyHandling.parameters = {
  docs: {
    description: {
      story:
        'Use the `onEscape` prop to provide custom behavior when the Escape key is pressed with empty search input, such as closing a parent modal.',
    },
  },
};

export const VirtualizedList: StoryFn<CubeFilterListBoxProps<any>> = (args) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['item-2']);

  // Generate a large list of items with varying content to test virtualization
  // Mix items with and without descriptions to test dynamic sizing
  const items = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}${i % 7 === 0 ? ' - This is a longer item name to test dynamic sizing' : ''}`,
    description:
      i % 3 === 0
        ? `This is a description for item ${i + 1}. It varies in length to test virtualization with dynamic item heights.`
        : undefined,
  }));

  return (
    <Space gap="2x" flow="column" style={{ height: '450px', width: '400px' }}>
      <Text>
        Large list with {items.length} items with varying heights.
        Virtualization is automatically enabled when there are no sections.
        Scroll down and back up to test smooth virtualization.
      </Text>

      <FilterListBox
        {...args}
        label="Virtualized Large Dataset"
        searchPlaceholder="Search through 100+ items..."
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        height="300px"
        overflow="auto"
        items={items}
        onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
      >
        {(item) => (
          <FilterListBox.Item key={item.id} description={item.description}>
            {item.name}
          </FilterListBox.Item>
        )}
      </FilterListBox>

      <Text>
        Selected:{' '}
        <strong>
          {selectedKeys.length} / {items.length} items
        </strong>
        {selectedKeys.length > 0 &&
          ` (${selectedKeys.slice(0, 3).join(', ')}${selectedKeys.length > 3 ? '...' : ''})`}
      </Text>
    </Space>
  );
};

VirtualizedList.parameters = {
  docs: {
    description: {
      story:
        'When a FilterListBox contains many items and has no sections, virtualization is automatically enabled to improve performance. Only visible items are rendered in the DOM, providing smooth scrolling even with large datasets. This story includes items with varying heights to demonstrate stable virtualization without scroll jumping.',
    },
  },
};

export const WithSelectAll: Story = {
  render: (args) => (
    <FilterListBox {...args}>
      {permissions.map((permission) => (
        <FilterListBox.Item
          key={permission.key}
          description={permission.description}
        >
          {permission.label}
        </FilterListBox.Item>
      ))}
    </FilterListBox>
  ),
  args: {
    label: 'Select permissions with Select All',
    selectionMode: 'multiple',
    isCheckable: true,
    showSelectAll: true,
    selectAllLabel: 'All Permissions',
    defaultSelectedKeys: ['read'],
    searchPlaceholder: 'Search permissions...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `showSelectAll={true}` is used with multiple selection mode in FilterListBox, a "Select All" option appears in the header above the search input. The checkbox shows indeterminate state when some items are selected, checked when all are selected, and unchecked when none are selected. The select all functionality works seamlessly with filtering - it only affects the currently visible (filtered) items.',
      },
    },
  },
};

export const CustomValueProps: Story = {
  render: (args) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>([
      'react',
      'customtag1',
      'customtag2',
    ]);

    return (
      <Space gap="2x" flow="column">
        <FilterListBox
          {...args}
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
        >
          <FilterListBox.Item key="react" icon={<IconFile />}>
            React
          </FilterListBox.Item>
          <FilterListBox.Item key="vue" icon={<IconFile />}>
            Vue.js
          </FilterListBox.Item>
          <FilterListBox.Item key="angular" icon={<IconFile />}>
            Angular
          </FilterListBox.Item>
          <FilterListBox.Item key="svelte" icon={<IconFile />}>
            Svelte
          </FilterListBox.Item>
        </FilterListBox>

        <Text>
          Selected: <strong>{selectedKeys.join(', ')}</strong>
        </Text>
      </Space>
    );
  },
  args: {
    label: 'Tags with Custom Values',
    selectionMode: 'multiple',
    // isCheckable: true,
    allowsCustomValue: true,
    searchPlaceholder: 'Search or add tags...',
    customValueProps: {
      icon: <IconFileDiff />,
      styles: {
        color: '#orange-text',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `customValueProps` prop allows you to customize existing custom values (values that are already selected but not in the predefined options). In this example, custom values are displayed with a tag icon and orange text color. Try typing and selecting new values to see how they are styled.',
      },
    },
  },
};

export const NewCustomValueProps: Story = {
  render: (args) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['react']);

    return (
      <Space gap="2x" flow="column">
        <FilterListBox
          {...args}
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
        >
          <FilterListBox.Item key="react" icon={<IconFile />}>
            React
          </FilterListBox.Item>
          <FilterListBox.Item key="vue" icon={<IconFile />}>
            Vue.js
          </FilterListBox.Item>
          <FilterListBox.Item key="angular" icon={<IconFile />}>
            Angular
          </FilterListBox.Item>
          <FilterListBox.Item key="svelte" icon={<IconFile />}>
            Svelte
          </FilterListBox.Item>
        </FilterListBox>

        <Text>
          Selected: <strong>{selectedKeys.join(', ')}</strong>
        </Text>

        <Text preset="t4" color="#dark.60">
          Type a new framework name in the search box to see the "plus" icon for
          new values
        </Text>
      </Space>
    );
  },
  args: {
    label: 'Add New Framework',
    selectionMode: 'multiple',
    // isCheckable: true,
    allowsCustomValue: true,
    searchPlaceholder: 'Search or add frameworks...',
    customValueProps: {
      icon: <IconFileDiff />,
      styles: {
        color: '#orange-text',
      },
    },
    newCustomValueProps: {
      icon: <PlusIcon />,
      styles: {
        color: '#success-text',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `newCustomValueProps` prop allows you to customize new custom values that appear when typing in the search input. These props are merged with `customValueProps` for new values. In this example, new values show with a plus icon and green text color to indicate they can be added. Try typing "Next.js" to see the styling.',
      },
    },
  },
};

NewCustomValueProps.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // Find the search input
  const searchInput = canvas.getByPlaceholderText(
    'Search or add frameworks...',
  );

  // Type "SolidJS" in the search input
  await userEvent.type(searchInput, 'SolidJS');
};
