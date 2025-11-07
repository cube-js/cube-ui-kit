import { userEvent, within } from '@storybook/test';
import { useMemo, useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';

import { ComboBox, CubeComboBoxProps } from './ComboBox';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Forms/ComboBox',
  component: ComboBox,
  subcomponents: { Item: ComboBox.Item, Section: ComboBox.Section },
  args: { width: '200px', label: 'Choose an option' },
  parameters: { controls: { exclude: baseProps }, layout: 'centered' },
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
    shouldCommitOnBlur: {
      control: { type: 'boolean' },
      description:
        'Whether to commit custom value on blur in allowsCustomValue mode',
      table: {
        defaultValue: { summary: true },
      },
    },
    clearOnBlur: {
      control: { type: 'boolean' },
      description:
        'Whether to clear selection and input on blur (only applies to non-custom-value mode)',
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
    sortSelectedToTop: {
      control: { type: 'boolean' },
      description:
        'Whether to sort selected item to the top when popover opens (only works with items prop)',
      table: {
        defaultValue: { summary: 'true when items provided, false otherwise' },
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
    onFocus: {
      action: 'focus',
      description:
        'Callback fired when focus enters the ComboBox wrapper element',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description:
        'Callback fired when focus leaves the ComboBox wrapper element',
      control: { type: null },
    },
  },
} satisfies Meta<typeof ComboBox>;

export default meta;

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

export const WithDefaultInputValue = () => (
  <ComboBox
    label="Search Query"
    placeholder="Start typing..."
    defaultInputValue="Pre-filled search text"
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <div>
      <ComboBox
        allowsCustomValue
        label="Tags"
        placeholder="Type or select..."
        inputValue={inputValue}
        selectedKey={selectedKey}
        onInputChange={setInputValue}
        onSelectionChange={(key) => {
          setSelectedKey(key);
          console.log('Selection committed:', key);
        }}
      >
        <ComboBox.Item key="react">React</ComboBox.Item>
        <ComboBox.Item key="vue">Vue</ComboBox.Item>
        <ComboBox.Item key="angular">Angular</ComboBox.Item>
        <ComboBox.Item key="svelte">Svelte</ComboBox.Item>
      </ComboBox>
      <div style={{ marginTop: '16px' }}>
        <div>
          Input value: <strong>{inputValue || 'none'}</strong>
        </div>
        <div>
          Selected (committed): <strong>{selectedKey || 'none'}</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Type text and press Enter or blur to commit. Select from list to
          commit immediately.
        </div>
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

export const ClearOnBlur = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <div>
      <ComboBox
        clearOnBlur
        label="Fruit"
        placeholder="Select a fruit..."
        selectedKey={selectedKey}
        onSelectionChange={setSelectedKey}
      >
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
        <ComboBox.Item key="banana">Banana</ComboBox.Item>
        <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
        <ComboBox.Item key="date">Date</ComboBox.Item>
      </ComboBox>
      <div style={{ marginTop: '16px' }}>
        <div>
          Selected: <strong>{selectedKey || 'none'}</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          With clearOnBlur, selection and input are cleared when the input loses
          focus. This is useful for search-like scenarios where you want to
          reset after each interaction.
        </div>
      </div>
    </div>
  );
};

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
    <ComboBox.Item key="apple">Apple</ComboBox.Item>
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

export const SortSelectedToTop = () => {
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
    { key: 'fig', label: 'Fig' },
    { key: 'grape', label: 'Grape' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ComboBox<Fruit>
        label="With sorting (default)"
        placeholder="Select a fruit..."
        defaultSelectedKey="grape"
        items={fruits}
      >
        {(item) => <ComboBox.Item key={item.key}>{item.label}</ComboBox.Item>}
      </ComboBox>
      <ComboBox<Fruit>
        label="Without sorting"
        placeholder="Select a fruit..."
        defaultSelectedKey="grape"
        sortSelectedToTop={false}
        items={fruits}
      >
        {(item) => <ComboBox.Item key={item.key}>{item.label}</ComboBox.Item>}
      </ComboBox>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        Open both dropdowns. The first one shows "Grape" at the top (default
        behavior with items prop). The second one keeps the original order.
      </div>
    </div>
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

export const IndependentControls = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <div>
      <ComboBox
        label="Fruit"
        placeholder="Type to filter..."
        inputValue={inputValue}
        selectedKey={selectedKey}
        onInputChange={setInputValue}
        onSelectionChange={setSelectedKey}
      >
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
        <ComboBox.Item key="banana">Banana</ComboBox.Item>
        <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
        <ComboBox.Item key="date">Date</ComboBox.Item>
        <ComboBox.Item key="elderberry">Elderberry</ComboBox.Item>
      </ComboBox>
      <div style={{ marginTop: '16px' }}>
        <div>
          Input value: <strong>{inputValue || 'empty'}</strong>
        </div>
        <div>
          Selected key: <strong>{selectedKey || 'none'}</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          inputValue and selectedKey are independent. Typing updates input and
          clears selection. Selecting from list updates both.
        </div>
      </div>
    </div>
  );
};

export const AllowsCustomValueNoCommitOnBlur = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <div>
      <ComboBox
        allowsCustomValue
        shouldCommitOnBlur={false}
        label="Tags (Enter only)"
        placeholder="Type or select..."
        inputValue={inputValue}
        selectedKey={selectedKey}
        onInputChange={setInputValue}
        onSelectionChange={(key) => {
          setSelectedKey(key);
          console.log('Selection committed:', key);
        }}
      >
        <ComboBox.Item key="react">React</ComboBox.Item>
        <ComboBox.Item key="vue">Vue</ComboBox.Item>
        <ComboBox.Item key="angular">Angular</ComboBox.Item>
        <ComboBox.Item key="svelte">Svelte</ComboBox.Item>
      </ComboBox>
      <div style={{ marginTop: '16px' }}>
        <div>
          Input value: <strong>{inputValue || 'none'}</strong>
        </div>
        <div>
          Selected (committed): <strong>{selectedKey || 'none'}</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          With shouldCommitOnBlur=false, custom values only commit on Enter key,
          not on blur.
        </div>
      </div>
    </div>
  );
};

export const ShowAllOnNoResults: StoryObj<typeof ComboBox> = {
  render: () => (
    <div>
      <ComboBox
        label="Search Fruits"
        placeholder="Type 'xyz' to see behavior..."
      >
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
        <ComboBox.Item key="banana">Banana</ComboBox.Item>
        <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
        <ComboBox.Item key="date">Date</ComboBox.Item>
        <ComboBox.Item key="elderberry">Elderberry</ComboBox.Item>
      </ComboBox>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        Type text that matches no items (e.g., "xyz"), then click the dropdown
        arrow or press Down/Up to see all options.
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Type text that yields no results
    await userEvent.type(input, 'xyz', { delay: 100 });

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Click the trigger to show all items
    const trigger = canvas.getByTestId('ComboBoxTrigger');
    await userEvent.click(trigger);
  },
};

export const VirtualizedList = () => {
  const [selected, setSelected] = useState<string | null>(null);

  interface Item {
    key: string;
    name: string;
  }

  // Generate a large list of items with varying content to test virtualization
  const items: Item[] = Array.from({ length: 1000 }, (_, i) => ({
    key: `item-${i}`,
    name: `Item ${i + 1}${i % 7 === 0 ? ' - This is a longer item name to test dynamic sizing' : ''}`,
  }));

  return (
    <div>
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
        Large list with {items.length} items. Virtualization is automatically
        enabled in the ListBox. Type to filter or scroll through the dropdown to
        test performance.
      </div>
      <ComboBox<Item>
        label="Virtualized List"
        placeholder="Search from 1000 items..."
        items={items}
        selectedKey={selected}
        onSelectionChange={setSelected}
      >
        {(item) => <ComboBox.Item key={item.key}>{item.name}</ComboBox.Item>}
      </ComboBox>
      <div style={{ marginTop: '16px' }}>
        Selected: <strong>{selected || 'None'}</strong>
      </div>
    </div>
  );
};
