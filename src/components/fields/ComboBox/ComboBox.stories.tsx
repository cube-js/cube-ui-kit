import { useState } from 'react';

import { ComboBox, CubeComboBoxProps } from './ComboBox';

import type { Meta } from '@storybook/react-vite';

export default {
  title: 'Forms/ComboBox',
  component: ComboBox,
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    popoverTrigger: {
      control: 'select',
      options: ['focus', 'input', 'manual'],
    },
    validationState: {
      control: 'select',
      options: [undefined, 'valid', 'invalid'],
    },
  },
} as Meta<typeof ComboBox>;

const Template = (args: CubeComboBoxProps<object>) => <ComboBox {...args} />;

export const Default = () => (
  <ComboBox label="Fruit" placeholder="Select a fruit...">
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

export const Loading = () => (
  <ComboBox isLoading label="Fruit" placeholder="Select a fruit...">
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
