import { StoryFn, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { FilterIcon, RightIcon } from '../../../icons';
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

export default {
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
      options: ['small', 'medium'],
      control: { type: 'radio' },
      description: 'ListBox size',
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
    focusOnHover: {
      control: { type: 'boolean' },
      description:
        'Whether moving pointer over an option moves DOM focus to it',
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
      description: 'Whether to show checkboxes for multiple selection',
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
  },
};

const Template: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Item key="apple">Apple</ListBox.Item>
    <ListBox.Item key="banana">Banana</ListBox.Item>
    <ListBox.Item key="cherry">Cherry</ListBox.Item>
    <ListBox.Item key="date">Date</ListBox.Item>
    <ListBox.Item key="elderberry">Elderberry</ListBox.Item>
  </ListBox>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Select a fruit',
  selectionMode: 'single',
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
};

export const MultipleSelection: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Item key="html">HTML</ListBox.Item>
    <ListBox.Item key="css">CSS</ListBox.Item>
    <ListBox.Item key="javascript">JavaScript</ListBox.Item>
    <ListBox.Item key="typescript">TypeScript</ListBox.Item>
    <ListBox.Item key="react">React</ListBox.Item>
    <ListBox.Item key="vue">Vue.js</ListBox.Item>
    <ListBox.Item key="angular">Angular</ListBox.Item>
  </ListBox>
);
MultipleSelection.args = {
  label: 'Select skills (multiple)',
  selectionMode: 'multiple',
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
  <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
    <ListBox
      label="Valid Selection"
      validationState="valid"
      selectionMode="single"
      defaultSelectedKey="option1"
    >
      <ListBox.Item key="option1">Valid Option</ListBox.Item>
      <ListBox.Item key="option2">Another Option</ListBox.Item>
    </ListBox>

    <ListBox
      label="Invalid Selection"
      validationState="invalid"
      selectionMode="single"
      defaultSelectedKey="option1"
      errorMessage="Please select a valid option"
    >
      <ListBox.Item key="option1">Option 1</ListBox.Item>
      <ListBox.Item key="option2">Option 2</ListBox.Item>
    </ListBox>
  </div>
);

export const ControlledExample: StoryFn<CubeListBoxProps<any>> = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>('apple');

  return (
    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
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

      <p>Selected: {selectedKey || 'None'}</p>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setSelectedKey('banana')}>Select Banana</button>
        <button onClick={() => setSelectedKey(null)}>Clear Selection</button>
      </div>
    </div>
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
    <div
      style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <p>
        Selected technology: <strong>{selectedKey || 'None'}</strong>
      </p>

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
    </div>
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

InPopover.play = async ({ canvasElement }) => {
  const canvas = canvasElement;
  const button = canvas.querySelector('button');

  if (button) {
    // Simulate clicking the button to open the popover
    button.click();

    // Wait a moment for the popover to open and autoFocus to take effect
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export const VirtualizedList: StoryFn<CubeListBoxProps<any>> = (args) => {
  const [selected, setSelected] = useState<string | null>(null);

  // Generate a large list of items with varying content to test virtualization
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
      <Text>
        Large list with {items.length} items with varying heights
        (virtualization automatically enabled if there is no sections. Scroll
        down and back up to test smooth virtualization.
      </Text>
      <Space height="1x" />
      <ListBox
        {...args}
        label="Virtualized List with Mixed Content"
        selectedKey={selected}
        height="300px"
        overflow="auto"
        onSelectionChange={setSelected}
      >
        {items.map((item) => (
          <ListBox.Item key={item.id} description={item.description}>
            {item.name}
          </ListBox.Item>
        ))}
      </ListBox>
      <Space height="1x" />
      <Text>Selected: {selected || 'None'}</Text>
    </div>
  );
};

VirtualizedList.parameters = {
  docs: {
    description: {
      story:
        'When a ListBox contains more than 30 items, virtualization is automatically enabled to improve performance. Only visible items are rendered in the DOM, providing smooth scrolling even with large datasets. This story includes items with varying heights to demonstrate stable virtualization without scroll jumping.',
    },
  },
};
