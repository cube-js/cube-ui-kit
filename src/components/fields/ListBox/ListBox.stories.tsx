import { StoryFn } from '@storybook/react';
import { useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Form } from '../../form';

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
    selectionMode: {
      options: ['single', 'multiple', 'none'],
      control: { type: 'radio' },
      description: 'Selection mode',
      table: {
        defaultValue: { summary: 'single' },
      },
    },

    /* Search */
    isSearchable: {
      control: { type: 'boolean' },
      description: 'Whether the ListBox includes a search input',
      table: {
        defaultValue: { summary: false },
      },
    },
    searchPlaceholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the search input',
      table: {
        defaultValue: { summary: 'Search...' },
      },
    },

    /* Presentation */
    size: {
      options: ['small', 'default', 'large'],
      control: { type: 'radio' },
      description: 'ListBox size',
      table: {
        defaultValue: { summary: 'default' },
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
    SearchLoadingState: {
      control: { type: 'boolean' },
      description: 'Whether the listbox is loading. Works only with search.',
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
      options: ['valid', 'invalid'],
      control: { type: 'radio' },
      description: 'Validation state',
    },

    /* Events */
    onSelectionChange: {
      action: 'selection changed',
      description: 'Callback when selection changes',
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

export const WithSearch: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Item key="apple">Apple</ListBox.Item>
    <ListBox.Item key="banana">Banana</ListBox.Item>
    <ListBox.Item key="cherry">Cherry</ListBox.Item>
    <ListBox.Item key="date">Date</ListBox.Item>
    <ListBox.Item key="elderberry">Elderberry</ListBox.Item>
    <ListBox.Item key="fig">Fig</ListBox.Item>
    <ListBox.Item key="grape">Grape</ListBox.Item>
    <ListBox.Item key="honeydew">Honeydew</ListBox.Item>
    <ListBox.Item key="kiwi">Kiwi</ListBox.Item>
    <ListBox.Item key="lemon">Lemon</ListBox.Item>
  </ListBox>
);
WithSearch.args = {
  label: 'Search fruits',
  isSearchable: true,
  searchPlaceholder: 'Type to search fruits...',
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

export const WithSearchAndSections: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Section title="Frontend">
      <ListBox.Item
        key="react"
        description="JavaScript library for building UIs"
      >
        React
      </ListBox.Item>
      <ListBox.Item key="vue" description="Progressive JavaScript framework">
        Vue.js
      </ListBox.Item>
      <ListBox.Item key="angular" description="Platform for web applications">
        Angular
      </ListBox.Item>
    </ListBox.Section>
    <ListBox.Section title="Backend">
      <ListBox.Item key="nodejs" description="JavaScript runtime environment">
        Node.js
      </ListBox.Item>
      <ListBox.Item key="python" description="High-level programming language">
        Python
      </ListBox.Item>
      <ListBox.Item
        key="java"
        description="Object-oriented programming language"
      >
        Java
      </ListBox.Item>
    </ListBox.Section>
    <ListBox.Section title="Database">
      <ListBox.Item
        key="postgresql"
        description="Advanced open source database"
      >
        PostgreSQL
      </ListBox.Item>
      <ListBox.Item key="mongodb" description="Document-oriented database">
        MongoDB
      </ListBox.Item>
      <ListBox.Item key="redis" description="In-memory data structure store">
        Redis
      </ListBox.Item>
    </ListBox.Section>
  </ListBox>
);
WithSearchAndSections.args = {
  label: 'Choose technologies',
  isSearchable: true,
  searchPlaceholder: 'Search technologies...',
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
  isSearchable: true,
  searchPlaceholder: 'Search skills...',
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

export const SearchLoadingState: StoryFn<CubeListBoxProps<any>> = (args) => (
  <ListBox {...args}>
    <ListBox.Item key="option1">Option 1</ListBox.Item>
    <ListBox.Item key="option2">Option 2</ListBox.Item>
    <ListBox.Item key="option3">Option 3</ListBox.Item>
  </ListBox>
);
SearchLoadingState.args = {
  label: 'Loading ListBox',
  isSearchable: true,
  searchPlaceholder: 'Search...',
  isLoading: true,
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
        isSearchable
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
        isSearchable
        name="technology"
        label="Preferred Technology"
        description="Select your preferred technology stack"
        selectionMode="single"
        searchPlaceholder="Search technologies..."
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
