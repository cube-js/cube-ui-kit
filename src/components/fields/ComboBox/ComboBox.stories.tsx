import { within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';

import { ComboBox, CubeComboBoxProps } from './ComboBox';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default {
  title: 'Forms/ComboBox',
  component: ComboBox,
  subcomponents: { Item: ComboBox.Item, Section: ComboBox.Section },
  args: { width: '200px', label: 'Choose an option' },
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description: 'ComboBox.Item elements that define the available options',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when input is empty',
    },
    icon: {
      control: { type: null },
      description: 'Icon element rendered before the input',
    },
    inputValue: {
      control: { type: 'text' },
      description: 'The current text value in controlled mode',
    },
    defaultInputValue: {
      control: { type: 'text' },
      description: 'The default text value in uncontrolled mode',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the combo box',
    },
    description: {
      control: { type: 'text' },
      description: 'Description text displayed below the input',
    },
    message: {
      control: { type: 'text' },
      description:
        'Message text displayed below the input (validation message)',
    },
    emptyLabel: {
      control: { type: 'text' },
      description: 'Text shown when no items match the filter',
    },

    /* Selection */
    selectedKey: {
      control: { type: 'text' },
      description: 'The currently selected key (controlled)',
    },
    defaultSelectedKey: {
      control: { type: 'text' },
      description: 'The key of the initially selected item (uncontrolled)',
    },
    allowsCustomValue: {
      control: { type: 'boolean' },
      description: 'Whether the combo box allows custom values to be entered',
      table: {
        defaultValue: { summary: false },
      },
    },
    isClearable: {
      control: { type: 'boolean' },
      description:
        'Whether the combo box is clearable using ESC keyboard button or clear button inside the input',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Behavior */
    popoverTrigger: {
      options: ['focus', 'input', 'manual'],
      control: { type: 'radio' },
      description: 'How the popover is triggered',
      table: {
        defaultValue: { summary: 'input' },
      },
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Whether the ComboBox is in a loading state',
      table: {
        defaultValue: { summary: false },
      },
    },
    filter: {
      control: { type: null },
      description:
        'Custom filter function or false to disable filtering. If not provided, uses default contains filter',
    },
    hideTrigger: {
      control: { type: 'boolean' },
      description: 'Whether to hide the trigger button',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'ComboBox size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the input can be selected but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether user input is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the input should display valid or invalid visual styling',
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        defaultValue: { summary: false },
      },
    },
    necessityIndicator: {
      options: [undefined, 'label', 'icon'],
      control: { type: 'radio' },
      description: 'How the required state should be indicated',
    },

    /* Events */
    onSelectionChange: {
      action: 'selection-change',
      description: 'Callback fired when the selected option changes',
      control: { type: null },
    },
    onInputChange: {
      action: 'input-change',
      description: 'Callback fired when the input text changes',
      control: { type: null },
    },
    onOpenChange: {
      action: 'open-change',
      description: 'Callback fired when the popover opens or closes',
      control: { type: null },
    },
    onBlur: {
      action: (e) => ({ type: 'blur', target: e?.target?.tagName }),
      description: 'Callback fired when the input loses focus',
      control: { type: null },
    },
    onFocus: {
      action: (e) => ({ type: 'focus', target: e?.target?.tagName }),
      description: 'Callback fired when the input receives focus',
      control: { type: null },
    },
  },
} as Meta<typeof ComboBox>;

const Template = (args: CubeComboBoxProps<object>) => <ComboBox {...args} />;

export const Default = (args) => (
  <ComboBox label="Fruit" placeholder="Select a fruit..." {...args}>
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    <ComboBox.Item key="date">Date</ComboBox.Item>
    <ComboBox.Item key="elderberry">Elderberry</ComboBox.Item>
    <ComboBox.Item key="fig">Fig</ComboBox.Item>
    <ComboBox.Item key="grape">Grape</ComboBox.Item>
  </ComboBox>
);

export const WithDefaultValue = () => (
  <ComboBox
    label="Fruit"
    placeholder="Select a fruit..."
    defaultSelectedKey="banana"
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    <ComboBox.Item key="date">Date</ComboBox.Item>
  </ComboBox>
);

export const Controlled = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>('apple');

  return (
    <div>
      <ComboBox
        label="Controlled Fruit"
        placeholder="Select a fruit..."
        selectedKey={selectedKey}
        onSelectionChange={(key) => setSelectedKey(key)}
      >
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
        <ComboBox.Item key="banana">Banana</ComboBox.Item>
        <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
        <ComboBox.Item key="date">Date</ComboBox.Item>
      </ComboBox>
      <div style={{ marginTop: '16px' }}>
        Selected: <strong>{selectedKey || 'none'}</strong>
      </div>
    </div>
  );
};

export const AllowsCustomValue = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div>
      <ComboBox
        allowsCustomValue
        label="Tags"
        placeholder="Type or select..."
        inputValue={inputValue}
        onInputChange={setInputValue}
      >
        <ComboBox.Item key="react">React</ComboBox.Item>
        <ComboBox.Item key="vue">Vue</ComboBox.Item>
        <ComboBox.Item key="angular">Angular</ComboBox.Item>
        <ComboBox.Item key="svelte">Svelte</ComboBox.Item>
      </ComboBox>
      <div style={{ marginTop: '16px' }}>
        Value: <strong>{inputValue || 'none'}</strong>
      </div>
    </div>
  );
};

export const AllowsCustomValueNoItems: StoryObj<typeof ComboBox> = {
  render: () => {
    const [inputValue, setInputValue] = useState('');

    return (
      <div>
        <ComboBox
          isLoading
          allowsCustomValue
          label="Custom Input"
          placeholder="Type anything..."
          inputValue={inputValue}
          emptyLabel="No predefined options available"
          onInputChange={setInputValue}
        />
        <div style={{ marginTop: '16px' }}>
          Value: <strong>{inputValue || 'none'}</strong>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    await userEvent.type(input, 'Custom value example', { delay: 100 });
  },
};

export const Clearable = () => (
  <ComboBox
    isClearable
    label="Fruit"
    placeholder="Select a fruit..."
    defaultSelectedKey="apple"
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    <ComboBox.Item key="date">Date</ComboBox.Item>
  </ComboBox>
);

export const WithSections = () => (
  <ComboBox label="Food" placeholder="Select food...">
    <ComboBox.Section key="fruits" title="Fruits">
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox.Section>
    <ComboBox.Section key="vegetables" title="Vegetables">
      <ComboBox.Item key="carrot">Carrot</ComboBox.Item>
      <ComboBox.Item key="broccoli">Broccoli</ComboBox.Item>
      <ComboBox.Item key="spinach">Spinach</ComboBox.Item>
    </ComboBox.Section>
  </ComboBox>
);

export const WithDisabledItems = () => (
  <ComboBox
    label="Fruit"
    placeholder="Select a fruit..."
    disabledKeys={['banana', 'date']}
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana (disabled)</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    <ComboBox.Item key="date">Date (disabled)</ComboBox.Item>
    <ComboBox.Item key="elderberry">Elderberry</ComboBox.Item>
  </ComboBox>
);

export const Loading = (args) => (
  <ComboBox isLoading label="Fruit" placeholder="Select a fruit..." {...args}>
    <ComboBox.Item
      key="ap
    ple"
    >
      Apple
    </ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
  </ComboBox>
);

export const LoadingWithCustomValue = (args) => (
  <ComboBox
    isLoading
    allowsCustomValue
    label="Fruit"
    placeholder="Select a fruit..."
    {...args}
  >
    <ComboBox.Item
      key="ap
    ple"
    >
      Apple
    </ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
  </ComboBox>
);

export const Disabled = () => (
  <ComboBox
    isDisabled
    label="Fruit"
    placeholder="Select a fruit..."
    defaultSelectedKey="apple"
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
  </ComboBox>
);

export const ValidationStates = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <ComboBox
      label="Valid"
      validationState="valid"
      defaultSelectedKey="apple"
      message="Good choice!"
    >
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox>
    <ComboBox
      label="Invalid"
      validationState="invalid"
      defaultSelectedKey="apple"
      message="This fruit is not available"
    >
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox>
  </div>
);

export const PopoverTriggers = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <ComboBox label="Trigger on Input (default)" popoverTrigger="input">
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox>
    <ComboBox label="Trigger on Focus" popoverTrigger="focus">
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox>
    <ComboBox label="Manual Trigger" popoverTrigger="manual">
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <ComboBox label="Small" size="small" placeholder="Small size">
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox>
    <ComboBox label="Medium (default)" size="medium" placeholder="Medium size">
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox>
    <ComboBox label="Large" size="large" placeholder="Large size">
      <ComboBox.Item key="apple">Apple</ComboBox.Item>
      <ComboBox.Item key="banana">Banana</ComboBox.Item>
      <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    </ComboBox>
  </div>
);

export const WithItemsArray = () => {
  interface Fruit {
    key: string;
    label: string;
  }

  const fruits: Fruit[] = [
    { key: 'apple', label: 'Apple' },
    { key: 'banana', label: 'Banana' },
    { key: 'cherry', label: 'Cherry' },
    { key: 'date', label: 'Date' },
    { key: 'elderberry', label: 'Elderberry' },
  ];

  return (
    <ComboBox<Fruit>
      label="Fruit"
      placeholder="Select a fruit..."
      items={fruits}
    >
      {(item) => <ComboBox.Item key={item.key}>{item.label}</ComboBox.Item>}
    </ComboBox>
  );
};

export const WithCustomFilter = () => (
  <ComboBox
    label="Fruit (starts with filter)"
    placeholder="Type to filter..."
    filter={(textValue: string, inputValue: string) => {
      return textValue.toLowerCase().startsWith(inputValue.toLowerCase());
    }}
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="apricot">Apricot</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    <ComboBox.Item key="date">Date</ComboBox.Item>
  </ComboBox>
);

export const NoFilter = () => (
  <ComboBox
    label="Fruit (no filtering)"
    placeholder="Type anything..."
    filter={false}
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
    <ComboBox.Item key="date">Date</ComboBox.Item>
  </ComboBox>
);

export const EmptyState = () => (
  <ComboBox
    label="Search (no results)"
    placeholder="Type xyz to see empty state..."
    emptyLabel="No fruits found. Try a different search."
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
  </ComboBox>
);

export const LongList = () => (
  <ComboBox label="Countries" placeholder="Select a country...">
    <ComboBox.Item key="us">United States</ComboBox.Item>
    <ComboBox.Item key="uk">United Kingdom</ComboBox.Item>
    <ComboBox.Item key="canada">Canada</ComboBox.Item>
    <ComboBox.Item key="australia">Australia</ComboBox.Item>
    <ComboBox.Item key="germany">Germany</ComboBox.Item>
    <ComboBox.Item key="france">France</ComboBox.Item>
    <ComboBox.Item key="spain">Spain</ComboBox.Item>
    <ComboBox.Item key="italy">Italy</ComboBox.Item>
    <ComboBox.Item key="japan">Japan</ComboBox.Item>
    <ComboBox.Item key="china">China</ComboBox.Item>
    <ComboBox.Item key="india">India</ComboBox.Item>
    <ComboBox.Item key="brazil">Brazil</ComboBox.Item>
    <ComboBox.Item key="mexico">Mexico</ComboBox.Item>
    <ComboBox.Item key="argentina">Argentina</ComboBox.Item>
    <ComboBox.Item key="south-africa">South Africa</ComboBox.Item>
    <ComboBox.Item key="egypt">Egypt</ComboBox.Item>
    <ComboBox.Item key="russia">Russia</ComboBox.Item>
    <ComboBox.Item key="south-korea">South Korea</ComboBox.Item>
    <ComboBox.Item key="thailand">Thailand</ComboBox.Item>
    <ComboBox.Item key="vietnam">Vietnam</ComboBox.Item>
  </ComboBox>
);

export const Required = () => (
  <ComboBox
    isRequired
    label="Fruit"
    placeholder="Select a fruit..."
    necessityIndicator="label"
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
  </ComboBox>
);

export const WithDescription = () => (
  <ComboBox
    label="Fruit"
    placeholder="Select a fruit..."
    description="Choose your favorite fruit from the list"
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
  </ComboBox>
);

export const HiddenTrigger = () => (
  <ComboBox
    hideTrigger
    label="Fruit (no trigger button)"
    placeholder="Type to search..."
  >
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
    <ComboBox.Item key="banana">Banana</ComboBox.Item>
    <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
  </ComboBox>
);
