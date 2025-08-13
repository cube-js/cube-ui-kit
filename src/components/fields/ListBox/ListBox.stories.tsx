import { StoryFn, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  CheckIcon,
  DatabaseIcon,
  EditIcon,
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
import { Form } from '../../form';
import { Space } from '../../layout/Space';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

import { CubeListBoxProps, ListBox } from './ListBox';

import type { Meta } from '@storybook/react';

const meta: Meta<typeof ListBox> = {
  title: 'Forms/ListBox',
  component: ListBox,
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

    /* Presentation */
    size: {
      options: ['medium', 'large'],
      control: { type: 'radio' },
      description: 'ListBox size',
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
    focusOnHover: {
      control: { type: 'boolean' },
      description:
        'Whether moving the pointer over an option will move DOM focus to that option',
      table: {
        defaultValue: { summary: true },
      },
    },
    shouldUseVirtualFocus: {
      control: { type: 'boolean' },
      description: 'Whether to use virtual focus instead of DOM focus',
      table: {
        defaultValue: { summary: false },
      },
    },
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
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the ListBox is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether selection is required',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description: 'Validation state',
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
type Story = StoryObj<typeof ListBox>;

// Sample data for stories
const fruits = [
  { key: 'apple', label: 'Apple' },
  { key: 'banana', label: 'Banana' },
  { key: 'cherry', label: 'Cherry' },
  { key: 'date', label: 'Date' },
  { key: 'elderberry', label: 'Elderberry' },
  { key: 'fig', label: 'Fig' },
  { key: 'grape', label: 'Grape' },
  { key: 'honeydew', label: 'Honeydew' },
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

const Template: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Item key="apple">Apple</ListBox.Item>
    <ListBox.Item key="banana">Banana</ListBox.Item>
    <ListBox.Item key="cherry">Cherry</ListBox.Item>
    <ListBox.Item key="date">Date</ListBox.Item>
    <ListBox.Item key="elderberry">Elderberry</ListBox.Item>
  </ListBox>
);

export const Default: Story = {
  render: Template,
  args: {
    label: 'Select a fruit',
    selectionMode: 'single',
  },
};

export const SingleSelection: Story = {
  render: (args) => (
    <ListBox {...args}>
      {fruits.map((fruit) => (
        <ListBox.Item key={fruit.key}>{fruit.label}</ListBox.Item>
      ))}
    </ListBox>
  ),
  args: {
    label: 'Choose your favorite fruit',
    selectionMode: 'single',
    defaultSelectedKey: 'apple',
  },
};

export const MultipleSelection: Story = {
  render: (args) => (
    <ListBox {...args}>
      {permissions.map((permission) => (
        <ListBox.Item
          key={permission.key}
          icon="checkbox"
          description={permission.description}
        >
          {permission.label}
        </ListBox.Item>
      ))}
    </ListBox>
  ),
  args: {
    label: 'Select permissions',
    selectionMode: 'multiple',
    defaultSelectedKeys: ['read', 'write'],
  },
};

export const WithDescriptions: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Item
      key="react"
      description="A JavaScript library for building user interfaces"
    >
      React
    </ListBox.Item>
    <ListBox.Item key="vue" description="The Progressive JavaScript Framework">
      Vue.js
    </ListBox.Item>
    <ListBox.Item
      key="angular"
      description="Platform for building mobile and desktop web applications"
    >
      Angular
    </ListBox.Item>
    <ListBox.Item key="svelte" description="Cybernetically enhanced web apps">
      Svelte
    </ListBox.Item>
  </ListBox>
);
WithDescriptions.args = {
  label: 'Choose a framework',
  selectionMode: 'single',
};

export const WithSections: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Section title="Fruits">
      <ListBox.Item key="apple">Apple</ListBox.Item>
      <ListBox.Item key="banana">Banana</ListBox.Item>
      <ListBox.Item key="cherry">Cherry</ListBox.Item>
    </ListBox.Section>
    <ListBox.Section title="Vegetables">
      <ListBox.Item key="carrot">Carrot</ListBox.Item>
      <ListBox.Item key="broccoli">Broccoli</ListBox.Item>
      <ListBox.Item key="spinach">Spinach</ListBox.Item>
    </ListBox.Section>
    <ListBox.Section title="Grains">
      <ListBox.Item key="rice">Rice</ListBox.Item>
      <ListBox.Item key="wheat">Wheat</ListBox.Item>
      <ListBox.Item key="oats">Oats</ListBox.Item>
    </ListBox.Section>
  </ListBox>
);
WithSections.args = {
  label: 'Select food items',
  selectionMode: 'single',
};

export const WithHeaderAndFooter: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox
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
    <ListBox.Item
      key="javascript"
      description="Dynamic, interpreted programming language"
    >
      JavaScript
    </ListBox.Item>
    <ListBox.Item
      key="python"
      description="High-level, general-purpose programming language"
    >
      Python
    </ListBox.Item>
    <ListBox.Item
      key="typescript"
      description="Strongly typed programming language based on JavaScript"
    >
      TypeScript
    </ListBox.Item>
    <ListBox.Item
      key="rust"
      description="Systems programming language focused on safety and performance"
    >
      Rust
    </ListBox.Item>
    <ListBox.Item
      key="go"
      description="Open source programming language supported by Google"
    >
      Go
    </ListBox.Item>
  </ListBox>
);
WithHeaderAndFooter.args = {
  label: 'Choose your preferred programming language',
  selectionMode: 'single',
  size: 'large',
};

export const CheckableMultipleSelection: Story = {
  render: (args) => (
    <ListBox {...args}>
      {permissions.map((permission) => (
        <ListBox.Item key={permission.key} description={permission.description}>
          {permission.label}
        </ListBox.Item>
      ))}
    </ListBox>
  ),
  args: {
    label: 'Select user permissions',
    selectionMode: 'multiple',
    isCheckable: true,
    defaultSelectedKeys: ['read', 'write'],
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

export const DifferentSizes: Story = {
  render: (args) => (
    <Space gap="2x" flow="column" placeItems="start">
      <ListBox width="150px" {...args} size="medium" label="Medium ListBox">
        {fruits.slice(0, 4).map((fruit) => (
          <ListBox.Item key={fruit.key}>{fruit.label}</ListBox.Item>
        ))}
      </ListBox>

      <ListBox width="150px" {...args} size="large" label="Large ListBox">
        {fruits.slice(0, 4).map((fruit) => (
          <ListBox.Item key={fruit.key}>{fruit.label}</ListBox.Item>
        ))}
      </ListBox>
    </Space>
  ),
  args: {
    selectionMode: 'single',
  },
  parameters: {
    docs: {
      description: {
        story:
          'ListBox supports two sizes: `medium` (32px item height, default) for standard use and `large` (40px item height) for emphasized sections.',
      },
    },
  },
};

export const DisabledItems: Story = {
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Item key="available1">Available Option 1</ListBox.Item>
      <ListBox.Item key="disabled1">Disabled Option 1</ListBox.Item>
      <ListBox.Item key="available2">Available Option 2</ListBox.Item>
      <ListBox.Item key="disabled2">Disabled Option 2</ListBox.Item>
      <ListBox.Item key="available3">Available Option 3</ListBox.Item>
    </ListBox>
  ),
  args: {
    label: 'Select an option',
    selectionMode: 'single',
    disabledKeys: ['disabled1', 'disabled2'],
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
    <ListBox {...args}>
      {fruits.slice(0, 4).map((fruit) => (
        <ListBox.Item key={fruit.key}>{fruit.label}</ListBox.Item>
      ))}
    </ListBox>
  ),
  args: {
    label: 'Must select one option',
    selectionMode: 'single',
    disallowEmptySelection: true,
    defaultSelectedKey: 'apple',
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
    <ListBox {...args}>
      <ListBox.Item
        key="basic"
        textValue="Basic Plan - Free with limited features"
      >
        <Space gap="1x" flow="column">
          <Text weight="600">Basic Plan</Text>
          <Badge type="neutral">Free</Badge>
        </Space>
      </ListBox.Item>
      <ListBox.Item
        key="pro"
        textValue="Pro Plan - Monthly subscription with all features"
      >
        <Space gap="1x" flow="column">
          <Text weight="600">Pro Plan</Text>
          <Badge type="purple">$19/month</Badge>
        </Space>
      </ListBox.Item>
      <ListBox.Item
        key="enterprise"
        textValue="Enterprise Plan - Custom pricing for large teams"
      >
        <Space gap="1x" flow="column">
          <Text weight="600">Enterprise Plan</Text>
          <Badge type="note">Custom</Badge>
        </Space>
      </ListBox.Item>
    </ListBox>
  ),
  args: {
    label: 'Choose your plan',
    selectionMode: 'single',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the `textValue` prop when option content is complex (JSX) to provide accessible text for screen readers and keyboard navigation.',
      },
    },
  },
};

export const DisabledState: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Item key="option1">Option 1</ListBox.Item>
    <ListBox.Item key="option2">Option 2</ListBox.Item>
    <ListBox.Item key="option3">Option 3</ListBox.Item>
  </ListBox>
);
DisabledState.args = {
  label: 'Disabled ListBox',
  isDisabled: true,
  selectionMode: 'single',
};

export const ValidationStates: StoryFn<CubeListBoxProps<any>> = () => (
  <Space gap="3x" flow="column">
    <ListBox
      label="Valid Selection"
      validationState="valid"
      selectionMode="single"
      defaultSelectedKey="option1"
      message="Great choice!"
    >
      <ListBox.Item key="option1">Valid Option</ListBox.Item>
      <ListBox.Item key="option2">Another Option</ListBox.Item>
    </ListBox>

    <ListBox
      label="Invalid Selection"
      validationState="invalid"
      selectionMode="single"
      defaultSelectedKey="option1"
      message="Please select a different option"
    >
      <ListBox.Item key="option1">Option 1</ListBox.Item>
      <ListBox.Item key="option2">Option 2</ListBox.Item>
    </ListBox>
  </Space>
);

export const ControlledExample: StoryFn<CubeListBoxProps<any>> = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>('apple');

  return (
    <Space gap="2x" flow="column">
      <ListBox
        label="Controlled ListBox"
        selectedKey={selectedKey}
        selectionMode="single"
        onSelectionChange={(key) => setSelectedKey(key as string | null)}
      >
        <ListBox.Item key="apple">Apple</ListBox.Item>
        <ListBox.Item key="banana">Banana</ListBox.Item>
        <ListBox.Item key="cherry">Cherry</ListBox.Item>
        <ListBox.Item key="date">Date</ListBox.Item>
      </ListBox>

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

export const MultipleControlledExample: StoryFn<CubeListBoxProps<any>> = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['read', 'write']);

  return (
    <Space gap="2x" flow="column">
      <ListBox
        label="Controlled Multiple Selection"
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        isCheckable={true}
        onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
      >
        {permissions.map((permission) => (
          <ListBox.Item
            key={permission.key}
            description={permission.description}
          >
            {permission.label}
          </ListBox.Item>
        ))}
      </ListBox>

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

export const InForm: StoryFn<CubeListBoxProps<any>> = () => {
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
    alert(`Selected: ${data.technology || 'None'}`);
  };

  return (
    <Form style={{ maxWidth: '400px' }} onSubmit={handleSubmit}>
      <ListBox
        isRequired
        name="technology"
        label="Preferred Technology"
        description="Select your preferred technology stack"
        selectionMode="single"
      >
        <ListBox.Section title="Frontend">
          <ListBox.Item
            key="react"
            description="JavaScript library for building UIs"
          >
            React
          </ListBox.Item>
          <ListBox.Item
            key="vue"
            description="Progressive JavaScript framework"
          >
            Vue.js
          </ListBox.Item>
          <ListBox.Item
            key="angular"
            description="Platform for web applications"
          >
            Angular
          </ListBox.Item>
        </ListBox.Section>
        <ListBox.Section title="Backend">
          <ListBox.Item
            key="nodejs"
            description="JavaScript runtime environment"
          >
            Node.js
          </ListBox.Item>
          <ListBox.Item
            key="python"
            description="High-level programming language"
          >
            Python
          </ListBox.Item>
          <ListBox.Item
            key="java"
            description="Object-oriented programming language"
          >
            Java
          </ListBox.Item>
        </ListBox.Section>
      </ListBox>

      <Form.Submit>Submit</Form.Submit>
    </Form>
  );
};

export const InPopover: StoryFn<CubeListBoxProps<any>> = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <Space gap="2x" flow="column" placeItems="start">
      <Text>
        Selected technology: <strong>{selectedKey || 'None'}</strong>
      </Text>

      <DialogTrigger type="popover" placement="bottom start">
        <Button>Choose Technology</Button>
        <Dialog>
          <ListBox
            selectedKey={selectedKey}
            selectionMode="single"
            styles={{
              height: '300px',
              border: false,
              fill: '#clear',
            }}
            onSelectionChange={(key) => setSelectedKey(key as string | null)}
          >
            <ListBox.Section title="Frontend">
              <ListBox.Item
                key="react"
                description="JavaScript library for building UIs"
              >
                React
              </ListBox.Item>
              <ListBox.Item
                key="vue"
                description="Progressive JavaScript framework"
              >
                Vue.js
              </ListBox.Item>
              <ListBox.Item
                key="angular"
                description="Platform for web applications"
              >
                Angular
              </ListBox.Item>
              <ListBox.Item
                key="svelte"
                description="Cybernetically enhanced web apps"
              >
                Svelte
              </ListBox.Item>
            </ListBox.Section>
            <ListBox.Section title="Backend">
              <ListBox.Item
                key="nodejs"
                description="JavaScript runtime environment"
              >
                Node.js
              </ListBox.Item>
              <ListBox.Item
                key="python"
                description="High-level programming language"
              >
                Python
              </ListBox.Item>
              <ListBox.Item
                key="java"
                description="Object-oriented programming language"
              >
                Java
              </ListBox.Item>
              <ListBox.Item
                key="csharp"
                description="Modern object-oriented language"
              >
                C#
              </ListBox.Item>
            </ListBox.Section>
            <ListBox.Section title="Database">
              <ListBox.Item
                key="postgresql"
                description="Advanced open source database"
              >
                PostgreSQL
              </ListBox.Item>
              <ListBox.Item
                key="mongodb"
                description="Document-oriented database"
              >
                MongoDB
              </ListBox.Item>
              <ListBox.Item
                key="redis"
                description="In-memory data structure store"
              >
                Redis
              </ListBox.Item>
              <ListBox.Item
                key="mysql"
                description="Popular relational database"
              >
                MySQL
              </ListBox.Item>
            </ListBox.Section>
          </ListBox>
        </Dialog>
      </DialogTrigger>
    </Space>
  );
};

InPopover.parameters = {
  docs: {
    description: {
      story:
        'ListBox can be used inside a Dialog controlled by DialogTrigger to create popover-style selection interfaces.',
    },
  },
};

export const VirtualizedList: StoryFn<CubeListBoxProps<any>> = (args) => {
  const [selected, setSelected] = useState<string | null>(null);

  // Generate a large list of items with varying content to test virtualization
  // Mix items with and without descriptions to test dynamic sizing
  const items = Array.from({ length: 100 }, (_, i) => ({
    key: `item-${i}`,
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

      <ListBox
        {...args}
        items={items}
        label="Virtualized List with Mixed Content"
        selectedKey={selected}
        height="300px"
        overflow="auto"
        onSelectionChange={setSelected}
      >
        {(item: any) => (
          <ListBox.Item key={item.key} description={item.description}>
            {item.name}
          </ListBox.Item>
        )}
      </ListBox>

      <Text>
        Selected: <strong>{selected || 'None'}</strong>
      </Text>
    </Space>
  );
};

VirtualizedList.parameters = {
  docs: {
    description: {
      story:
        'When a ListBox contains many items and has no sections, virtualization is automatically enabled to improve performance. Only visible items are rendered in the DOM, providing smooth scrolling even with large datasets. This story includes items with varying heights to demonstrate stable virtualization without scroll jumping.',
    },
  },
};

export const WithIcons: Story = {
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Section title="User Management">
        <ListBox.Item key="users" icon={<UserIcon />}>
          Users
        </ListBox.Item>
        <ListBox.Item key="permissions" icon={<CheckIcon />}>
          Permissions
        </ListBox.Item>
      </ListBox.Section>
      <ListBox.Section title="System">
        <ListBox.Item key="database" icon={<DatabaseIcon />}>
          Database
        </ListBox.Item>
        <ListBox.Item key="settings" icon={<SettingsIcon />}>
          Settings
        </ListBox.Item>
      </ListBox.Section>
    </ListBox>
  ),
  args: {
    label: 'System Administration',
    selectionMode: 'single',
  },
  parameters: {
    docs: {
      description: {
        story:
          'ListBox options can include icons to improve visual clarity and help users quickly identify options.',
      },
    },
  },
};

export const FocusBehavior: Story = {
  render: (args) => (
    <Space gap="3x" flow="column">
      <div>
        <Text preset="t3" weight="600">
          Standard Focus (focusOnHover=true)
        </Text>
        <Text preset="t4" color="#dark.60">
          Moving pointer over options will focus them
        </Text>
        <Space height="1x" />
        <ListBox {...args} focusOnHover={true} label="Standard Focus Behavior">
          {fruits.slice(0, 4).map((fruit) => (
            <ListBox.Item key={fruit.key}>{fruit.label}</ListBox.Item>
          ))}
        </ListBox>
      </div>

      <div>
        <Text preset="t3" weight="600">
          No Focus on Hover (focusOnHover=false)
        </Text>
        <Text preset="t4" color="#dark.60">
          Use keyboard or click to focus options
        </Text>
        <Space height="1x" />
        <ListBox {...args} focusOnHover={false} label="No Focus on Hover">
          {fruits.slice(0, 4).map((fruit) => (
            <ListBox.Item key={fruit.key}>{fruit.label}</ListBox.Item>
          ))}
        </ListBox>
      </div>
    </Space>
  ),
  args: {
    selectionMode: 'single',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `focusOnHover` prop controls whether moving the pointer over an option automatically focuses it. Set to `false` for components where focus should remain elsewhere (like searchable lists).',
      },
    },
  },
};

export const EscapeKeyHandling: StoryFn<CubeListBoxProps<any>> = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>('apple');
  const [escapeCount, setEscapeCount] = useState(0);

  return (
    <Space gap="2x" flow="column">
      <ListBox
        label="Custom Escape Handling"
        selectedKey={selectedKey}
        selectionMode="single"
        onSelectionChange={(key) => setSelectedKey(key as string | null)}
        onEscape={() => {
          setEscapeCount((prev) => prev + 1);
          // Custom escape behavior - could close a parent modal, etc.
        }}
      >
        <ListBox.Item key="apple">Apple</ListBox.Item>
        <ListBox.Item key="banana">Banana</ListBox.Item>
        <ListBox.Item key="cherry">Cherry</ListBox.Item>
      </ListBox>

      <Text>
        Selected: <strong>{selectedKey || 'None'}</strong>
      </Text>
      <Text>
        Escape key pressed: <strong>{escapeCount} times</strong>
      </Text>
      <Text preset="t4" color="#dark.60">
        Focus the ListBox and press Escape to trigger custom handling
      </Text>
    </Space>
  );
};

EscapeKeyHandling.parameters = {
  docs: {
    description: {
      story:
        'Use the `onEscape` prop to provide custom behavior when the Escape key is pressed, such as closing a parent modal. When provided, this prevents the default selection clearing behavior.',
    },
  },
};

export const WithItemsProp: Story = {
  render: (args) => (
    <ListBox {...args} items={fruits}>
      {(item: any) => <ListBox.Item key={item.key}>{item.label}</ListBox.Item>}
    </ListBox>
  ),
  args: {
    label: 'Select a fruit using items prop',
    selectionMode: 'single',
    defaultSelectedKey: 'apple',
  },
  parameters: {
    docs: {
      description: {
        story:
          'ListBox supports the `items` prop pattern where you provide an array of data objects and use a render function to create the items. This is useful when working with dynamic data or when you want to separate data from presentation.',
      },
    },
  },
};

export const WithSelectAll: Story = {
  render: (args) => (
    <ListBox {...args}>
      {permissions.map((permission) => (
        <ListBox.Item key={permission.key} description={permission.description}>
          {permission.label}
        </ListBox.Item>
      ))}
    </ListBox>
  ),
  args: {
    label: 'Select permissions with Select All',
    selectionMode: 'multiple',
    isCheckable: true,
    showSelectAll: true,
    selectAllLabel: 'All Permissions',
    defaultSelectedKeys: ['read'],
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `showSelectAll={true}` is used with multiple selection mode, a "Select All" option appears in the header. The checkbox shows indeterminate state when some items are selected, checked when all are selected, and unchecked when none are selected.',
      },
    },
  },
};

export const WithHotkeys: Story = {
  render: (args) => (
    <Space gap="2x" flow="column">
      <Text>
        Try pressing <strong>Ctrl+1</strong>, <strong>Ctrl+2</strong>, or{' '}
        <strong>Ctrl+3</strong> to select options via hotkeys
      </Text>
      <ListBox {...args}>
        <ListBox.Item key="new" hotkeys="ctrl+1">
          <Space gap="1x" flow="row" placeItems="center">
            <PlusIcon />
            New Project
          </Space>
        </ListBox.Item>
        <ListBox.Item key="edit" hotkeys="ctrl+2">
          <Space gap="1x" flow="row" placeItems="center">
            <EditIcon />
            Edit Project
          </Space>
        </ListBox.Item>
        <ListBox.Item key="settings" hotkeys="ctrl+3">
          <Space gap="1x" flow="row" placeItems="center">
            <SettingsIcon />
            Project Settings
          </Space>
        </ListBox.Item>
      </ListBox>
    </Space>
  ),
  args: {
    label: 'Project Actions',
    selectionMode: 'single',
  },
  parameters: {
    docs: {
      description: {
        story:
          'ListBox options now support hotkeys via the ItemBase integration. Press the specified keyboard shortcuts to select options. The hotkey hint is automatically displayed as a suffix.',
      },
    },
  },
};

export const WithSuffixAndRightIcon: Story = {
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Item
        key="users"
        suffix={<Badge type="note">5</Badge>}
        rightIcon={<UserIcon />}
      >
        User Management
      </ListBox.Item>
      <ListBox.Item
        key="database"
        suffix={<Badge type="success">Online</Badge>}
        rightIcon={<DatabaseIcon />}
      >
        Database Status
      </ListBox.Item>
      <ListBox.Item
        key="settings"
        suffix={<Badge type="warning">2</Badge>}
        rightIcon={<SettingsIcon />}
      >
        System Settings
      </ListBox.Item>
    </ListBox>
  ),
  args: {
    label: 'System Dashboard',
    selectionMode: 'single',
    size: 'large',
  },
  parameters: {
    docs: {
      description: {
        story:
          'ListBox options now support suffix content and right icons via ItemBase integration. This allows for rich option layouts with status indicators, counts, and action icons.',
      },
    },
  },
};

export const WithTooltips: Story = {
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Item
        key="create"
        tooltip="Create a new project with default settings"
        icon={<PlusIcon />}
      >
        Create Project
      </ListBox.Item>
      <ListBox.Item
        key="import"
        tooltip={{
          title: 'Import Project',
          description: 'Import an existing project from file or URL',
          placement: 'right',
        }}
        icon={<DatabaseIcon />}
      >
        Import Project
      </ListBox.Item>
      <ListBox.Item
        key="configure"
        tooltip="Configure project settings and preferences"
        icon={<SettingsIcon />}
      >
        Configure
      </ListBox.Item>
    </ListBox>
  ),
  args: {
    label: 'Project Actions',
    selectionMode: 'single',
  },
  parameters: {
    docs: {
      description: {
        story:
          'ListBox options now support tooltips via ItemBase integration. Provide either a simple string or a full tooltip configuration object.',
      },
    },
  },
};

export const RichContentOptions: Story = {
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Item
        key="admin"
        description="Full system administration access"
        prefix={<Badge type="danger">Admin</Badge>}
        suffix={<Badge type="note">3</Badge>}
        rightIcon={<SettingsIcon />}
        hotkeys="ctrl+a"
      >
        System Administrator
      </ListBox.Item>
      <ListBox.Item
        key="editor"
        description="Content creation and editing permissions"
        prefix={<Badge type="warning">Editor</Badge>}
        suffix={<Badge type="note">12</Badge>}
        rightIcon={<EditIcon />}
        hotkeys="ctrl+e"
      >
        Content Editor
      </ListBox.Item>
      <ListBox.Item
        key="viewer"
        description="Read-only access to system content"
        prefix={<Badge type="success">Viewer</Badge>}
        suffix={<Badge type="note">45</Badge>}
        rightIcon={<UserIcon />}
        hotkeys="ctrl+v"
      >
        Content Viewer
      </ListBox.Item>
    </ListBox>
  ),
  args: {
    label: 'User Roles',
    selectionMode: 'single',
    size: 'large',
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the full capabilities of ListBox options with ItemBase integration: descriptions, prefix/suffix content, right icons, and hotkeys all working together.',
      },
    },
  },
};
