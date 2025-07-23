import { StoryFn } from '@storybook/react';
import { useState } from 'react';

import { FilterIcon, RightIcon } from '../../../icons';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Badge } from '../../content/Badge/Badge';
import { Paragraph } from '../../content/Paragraph';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Form, SubmitButton } from '../../form';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

import { CubeFilterListBoxProps, FilterListBox } from './FilterListBox';

export default {
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
      description: 'The selected keys in controlled multiple mode',
    },
    defaultSelectedKeys: {
      control: { type: 'object' },
      description: 'The default selected keys in uncontrolled multiple mode',
    },
    selectionMode: {
      options: ['single', 'multiple', 'none'],
      control: { type: 'radio' },
      description: 'Selection mode',
      table: {
        defaultValue: { summary: 'single' },
      },
    },
    allowsCustomValue: {
      control: { type: 'boolean' },
      description: 'Whether the FilterListBox allows custom values',
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
      description: 'Custom filter function for search',
    },

    /* Presentation */
    size: {
      options: ['small', 'medium'],
      control: { type: 'radio' },
      description: 'FilterListBox size',
      table: {
        defaultValue: { summary: 'small' },
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
      description: 'Whether to show checkboxes for multiple selection',
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
  },
};

const Template: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox {...args}>
    <FilterListBox.Item key="apple">Apple</FilterListBox.Item>
    <FilterListBox.Item key="banana">Banana</FilterListBox.Item>
    <FilterListBox.Item key="cherry">Cherry</FilterListBox.Item>
    <FilterListBox.Item key="date">Date</FilterListBox.Item>
    <FilterListBox.Item key="elderberry">Elderberry</FilterListBox.Item>
    <FilterListBox.Item key="fig">Fig</FilterListBox.Item>
    <FilterListBox.Item key="grape">Grape</FilterListBox.Item>
    <FilterListBox.Item key="honeydew">Honeydew</FilterListBox.Item>
  </FilterListBox>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Choose a fruit',
  searchPlaceholder: 'Search fruits...',
};

export const WithSections: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox {...args}>
    <FilterListBox.Section key="fruits" title="Fruits">
      <FilterListBox.Item key="apple">Apple</FilterListBox.Item>
      <FilterListBox.Item key="banana">Banana</FilterListBox.Item>
      <FilterListBox.Item key="cherry">Cherry</FilterListBox.Item>
    </FilterListBox.Section>
    <FilterListBox.Section key="vegetables" title="Vegetables">
      <FilterListBox.Item key="carrot">Carrot</FilterListBox.Item>
      <FilterListBox.Item key="broccoli">Broccoli</FilterListBox.Item>
      <FilterListBox.Item key="spinach">Spinach</FilterListBox.Item>
    </FilterListBox.Section>
    <FilterListBox.Section key="herbs" title="Herbs">
      <FilterListBox.Item key="basil">Basil</FilterListBox.Item>
      <FilterListBox.Item key="oregano">Oregano</FilterListBox.Item>
      <FilterListBox.Item key="thyme">Thyme</FilterListBox.Item>
    </FilterListBox.Section>
  </FilterListBox>
);
WithSections.args = {
  label: 'Choose an ingredient',
  searchPlaceholder: 'Search ingredients...',
};

export const WithHeaderAndFooter: StoryFn<CubeFilterListBoxProps<any>> = (
  args,
) => (
  <FilterListBox
    {...args}
    header={
      <Space gap="1x" placeContent="space-between" flow="row">
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
      </Space>
    }
    footer={
      <Space
        gap="1x"
        placeContent="space-between"
        flow="row"
        placeItems="center"
      >
        <Text color="#dark.50" preset="t4">
          Popular languages shown
        </Text>
        <Button type="link" size="small" rightIcon={<RightIcon />}>
          View all
        </Button>
      </Space>
    }
  >
    <FilterListBox.Item
      key="javascript"
      textValue="JavaScript - Dynamic, interpreted programming language"
    >
      JavaScript
    </FilterListBox.Item>
    <FilterListBox.Item
      key="python"
      textValue="Python - High-level, general-purpose programming language"
    >
      Python
    </FilterListBox.Item>
    <FilterListBox.Item
      key="typescript"
      textValue="TypeScript - Strongly typed programming language based on JavaScript"
    >
      TypeScript
    </FilterListBox.Item>
    <FilterListBox.Item
      key="rust"
      textValue="Rust - Systems programming language focused on safety and performance"
    >
      Rust
    </FilterListBox.Item>
    <FilterListBox.Item
      key="go"
      textValue="Go - Open source programming language supported by Google"
    >
      Go
    </FilterListBox.Item>
  </FilterListBox>
);
WithHeaderAndFooter.args = {
  label: 'Choose your preferred programming language',
  searchPlaceholder: 'Search languages...',
};

export const MultipleSelection: StoryFn<CubeFilterListBoxProps<any>> = (
  args,
) => (
  <FilterListBox {...args}>
    <FilterListBox.Item key="read">Read</FilterListBox.Item>
    <FilterListBox.Item key="write">Write</FilterListBox.Item>
    <FilterListBox.Item key="execute">Execute</FilterListBox.Item>
    <FilterListBox.Item key="delete">Delete</FilterListBox.Item>
    <FilterListBox.Item key="admin">Admin</FilterListBox.Item>
    <FilterListBox.Item key="moderator">Moderator</FilterListBox.Item>
    <FilterListBox.Item key="viewer">Viewer</FilterListBox.Item>
  </FilterListBox>
);
MultipleSelection.args = {
  label: 'Select permissions',
  selectionMode: 'multiple',
  defaultSelectedKeys: ['read', 'write'],
  searchPlaceholder: 'Filter permissions...',
};

export const WithDescriptions: StoryFn<CubeFilterListBoxProps<any>> = (
  args,
) => (
  <FilterListBox {...args}>
    <FilterListBox.Item key="apple" description="Crisp and sweet red fruit">
      Apple
    </FilterListBox.Item>
    <FilterListBox.Item
      key="banana"
      description="Yellow tropical fruit rich in potassium"
    >
      Banana
    </FilterListBox.Item>
    <FilterListBox.Item
      key="cherry"
      description="Small red stone fruit with sweet flavor"
    >
      Cherry
    </FilterListBox.Item>
    <FilterListBox.Item
      key="date"
      description="Sweet dried fruit from date palm"
    >
      Date
    </FilterListBox.Item>
    <FilterListBox.Item
      key="elderberry"
      description="Dark purple berry with tart flavor"
    >
      Elderberry
    </FilterListBox.Item>
  </FilterListBox>
);
WithDescriptions.args = {
  label: 'Choose a fruit',
  searchPlaceholder: 'Search fruits...',
};

export const WithSectionsAndDescriptions: StoryFn<
  CubeFilterListBoxProps<any>
> = (args) => (
  <FilterListBox {...args}>
    <FilterListBox.Section key="fruits" title="Fruits">
      <FilterListBox.Item key="apple" description="Crisp and sweet red fruit">
        Apple
      </FilterListBox.Item>
      <FilterListBox.Item
        key="banana"
        description="Yellow tropical fruit rich in potassium"
      >
        Banana
      </FilterListBox.Item>
      <FilterListBox.Item
        key="cherry"
        description="Small red stone fruit with sweet flavor"
      >
        Cherry
      </FilterListBox.Item>
    </FilterListBox.Section>
    <FilterListBox.Section key="vegetables" title="Vegetables">
      <FilterListBox.Item
        key="carrot"
        description="Orange root vegetable high in beta-carotene"
      >
        Carrot
      </FilterListBox.Item>
      <FilterListBox.Item
        key="broccoli"
        description="Green cruciferous vegetable packed with nutrients"
      >
        Broccoli
      </FilterListBox.Item>
      <FilterListBox.Item
        key="spinach"
        description="Leafy green vegetable rich in iron"
      >
        Spinach
      </FilterListBox.Item>
    </FilterListBox.Section>
    <FilterListBox.Section key="herbs" title="Herbs">
      <FilterListBox.Item
        key="basil"
        description="Aromatic herb used in Mediterranean cooking"
      >
        Basil
      </FilterListBox.Item>
      <FilterListBox.Item
        key="oregano"
        description="Pungent herb popular in Italian cuisine"
      >
        Oregano
      </FilterListBox.Item>
      <FilterListBox.Item
        key="thyme"
        description="Fragrant herb with earthy flavor"
      >
        Thyme
      </FilterListBox.Item>
    </FilterListBox.Section>
  </FilterListBox>
);
WithSectionsAndDescriptions.args = {
  label: 'Choose an ingredient',
  searchPlaceholder: 'Search ingredients...',
};

export const CustomFilter: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox
    {...args}
    filter={(text, search) => {
      // Custom filter: starts with search term (case insensitive)
      return text.toLowerCase().startsWith(search.toLowerCase());
    }}
  >
    <FilterListBox.Item key="javascript">JavaScript</FilterListBox.Item>
    <FilterListBox.Item key="typescript">TypeScript</FilterListBox.Item>
    <FilterListBox.Item key="python">Python</FilterListBox.Item>
    <FilterListBox.Item key="java">Java</FilterListBox.Item>
    <FilterListBox.Item key="csharp">C#</FilterListBox.Item>
    <FilterListBox.Item key="php">PHP</FilterListBox.Item>
    <FilterListBox.Item key="ruby">Ruby</FilterListBox.Item>
    <FilterListBox.Item key="go">Go</FilterListBox.Item>
  </FilterListBox>
);
CustomFilter.args = {
  label: 'Programming Language',
  searchPlaceholder: 'Type first letters...',
  description: 'Custom filter that matches items starting with your input',
};

export const Loading: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox {...args}>
    <FilterListBox.Item key="item1">Loading Item 1</FilterListBox.Item>
    <FilterListBox.Item key="item2">Loading Item 2</FilterListBox.Item>
    <FilterListBox.Item key="item3">Loading Item 3</FilterListBox.Item>
  </FilterListBox>
);
Loading.args = {
  label: 'Choose an item',
  isLoading: true,
  searchPlaceholder: 'Loading data...',
};

export const CustomEmptyState: StoryFn<CubeFilterListBoxProps<any>> = (
  args,
) => (
  <FilterListBox
    {...args}
    emptyLabel={
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>🔍</div>
        <div>No matching countries found.</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
          Try searching for a different country name.
        </div>
      </div>
    }
  >
    <FilterListBox.Item key="us">United States</FilterListBox.Item>
    <FilterListBox.Item key="ca">Canada</FilterListBox.Item>
    <FilterListBox.Item key="uk">United Kingdom</FilterListBox.Item>
    <FilterListBox.Item key="de">Germany</FilterListBox.Item>
    <FilterListBox.Item key="fr">France</FilterListBox.Item>
  </FilterListBox>
);
CustomEmptyState.args = {
  label: 'Select country',
  searchPlaceholder: 'Search countries...',
  description:
    "Try searching for something that doesn't exist to see the custom empty state",
};

export const Disabled: StoryFn<CubeFilterListBoxProps<any>> = (args) => (
  <FilterListBox {...args}>
    <FilterListBox.Item key="option1">Option 1</FilterListBox.Item>
    <FilterListBox.Item key="option2">Option 2</FilterListBox.Item>
    <FilterListBox.Item key="option3">Option 3</FilterListBox.Item>
  </FilterListBox>
);
Disabled.args = {
  label: 'Disabled FilterListBox',
  isDisabled: true,
  searchPlaceholder: 'Cannot search...',
};

export const ValidationStates: StoryFn<CubeFilterListBoxProps<any>> = () => (
  <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
    <FilterListBox
      label="Valid state"
      validationState="valid"
      message="Good choice!"
      defaultSelectedKey="option1"
    >
      <FilterListBox.Item key="option1">Valid Option 1</FilterListBox.Item>
      <FilterListBox.Item key="option2">Valid Option 2</FilterListBox.Item>
    </FilterListBox>

    <FilterListBox
      label="Invalid state"
      validationState="invalid"
      message="Please select a different option"
      defaultSelectedKey="option1"
    >
      <FilterListBox.Item key="option1">Invalid Option 1</FilterListBox.Item>
      <FilterListBox.Item key="option2">Invalid Option 2</FilterListBox.Item>
    </FilterListBox>
  </div>
);

// Form integration examples
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
        <FilterListBox autoFocus searchPlaceholder="Search frameworks...">
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

// Advanced examples
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
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Button isDisabled={isLoading} onPress={refreshData}>
          {isLoading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

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
    </div>
  );
};

export const WithCustomStyles: StoryFn = () => (
  <FilterListBox
    label="Custom Styled FilterListBox"
    searchPlaceholder="Search with custom styles..."
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

export const VirtualizedList: StoryFn<CubeFilterListBoxProps<any>> = (args) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Generate a large list of items with varying content to trigger virtualization (> 30 items)
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
    <div style={{ height: '400px', width: '350px' }}>
      <Flow gap="2x">
        <Paragraph preset="t3">
          Large list with {items.length} items with varying heights
          (virtualization automatically enabled for {'>'}30 items). Scroll down
          and back up to test smooth virtualization.
        </Paragraph>

        <FilterListBox
          {...args}
          label="Virtualized Large Dataset"
          searchPlaceholder="Search through 100+ items..."
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          height="300px"
          overflow="auto"
          onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
        >
          {items.map((item) => (
            <FilterListBox.Item key={item.id} description={item.description}>
              {item.name}
            </FilterListBox.Item>
          ))}
        </FilterListBox>

        <Paragraph preset="p4" color="#dark-03">
          Selected: {selectedKeys.length} / {items.length} items
          {selectedKeys.length > 0 &&
            ` (${selectedKeys.slice(0, 3).join(', ')}${selectedKeys.length > 3 ? '...' : ''})`}
        </Paragraph>
      </Flow>
    </div>
  );
};

VirtualizedList.parameters = {
  docs: {
    description: {
      story:
        'When a FilterListBox contains more than 30 items, virtualization is automatically enabled to improve performance. Only visible items are rendered in the DOM, providing smooth scrolling even with large datasets. This story includes items with varying heights to demonstrate stable virtualization without scroll jumping.',
    },
  },
};
