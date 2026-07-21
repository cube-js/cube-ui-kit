import { useEffect, useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Paragraph } from '../../content/Paragraph';
import { Text } from '../../content/Text';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';

import { CubeSearchComboBoxProps, SearchComboBox } from './SearchComboBox';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Forms/SearchComboBox',
  component: SearchComboBox,
  subcomponents: {
    Item: SearchComboBox.Item,
    Section: SearchComboBox.Section,
  },
  args: { width: '260px', label: 'Search' },
  parameters: { controls: { exclude: baseProps }, layout: 'centered' },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description:
        'SearchComboBox.Item elements that define the available suggestions',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when the input is empty',
    },
    icon: {
      control: { type: null },
      description:
        'Icon element rendered before the input (defaults to search)',
    },
    emptyLabel: {
      control: { type: 'text' },
      description: 'Label shown when no results are available',
    },
    inputValue: {
      control: { type: 'text' },
      description: 'The current input value in controlled mode',
    },
    defaultInputValue: {
      control: { type: 'text' },
      description: 'The default input value in uncontrolled mode',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the search combobox',
    },
    description: {
      control: { type: 'text' },
      description: 'Description text displayed below the input',
    },
    message: {
      control: { type: 'text' },
      description: 'Message text displayed below the input',
    },

    /* Behavior */
    popoverTrigger: {
      options: ['focus', 'input', 'manual'],
      control: { type: 'radio' },
      description: 'How the popover is triggered',
      table: { defaultValue: { summary: 'input' } },
    },
    filter: {
      control: { type: null },
      description:
        'Custom filter function or false to disable filtering (external/server-side filtering)',
    },
    isClearable: {
      control: { type: 'boolean' },
      description: 'Whether the input is clearable via clear button or Escape',
      table: { defaultValue: { summary: true } },
    },
    hideTrigger: {
      control: { type: 'boolean' },
      description: 'Whether the dropdown trigger button is hidden',
      table: { defaultValue: { summary: true } },
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Whether items are being loaded (e.g. from a server)',
      table: { defaultValue: { summary: false } },
    },
    loadingDelay: {
      control: { type: 'number' },
      description: 'Delay in ms before the loading indicator is shown',
      table: { defaultValue: { summary: '1000' } },
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'SearchComboBox size',
      table: { defaultValue: { summary: 'medium' } },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
      table: { defaultValue: { summary: false } },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the input is read-only',
      table: { defaultValue: { summary: false } },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description: 'Whether the input shows valid or invalid styling',
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the input receives focus on render',
      table: { defaultValue: { summary: false } },
    },

    /* Events */
    onSelect: {
      action: 'select',
      description: 'Callback fired when a suggestion is picked',
      control: { type: null },
    },
    onSubmit: {
      action: 'submit',
      description:
        'Callback fired when Enter is pressed without an available option',
      control: { type: null },
    },
    onInputChange: {
      action: 'input-change',
      description: 'Callback fired when the input text changes',
      control: { type: null },
    },
    onClear: {
      action: 'clear',
      description: 'Callback fired when the input is cleared',
      control: { type: null },
    },
    onOpenChange: {
      action: 'open-change',
      description: 'Callback fired when the popover opens or closes',
      control: { type: null },
    },
  },
} satisfies Meta<typeof SearchComboBox>;

export default meta;

type Story = StoryObj<typeof SearchComboBox>;

const fruits = [
  'Apple',
  'Apricot',
  'Banana',
  'Cherry',
  'Date',
  'Elderberry',
  'Fig',
  'Grape',
];

export const Default: Story = {
  render: (args: CubeSearchComboBoxProps<object>) => (
    <SearchComboBox placeholder="Search a fruit..." {...args}>
      {fruits.map((fruit) => (
        <SearchComboBox.Item key={fruit.toLowerCase()}>
          {fruit}
        </SearchComboBox.Item>
      ))}
    </SearchComboBox>
  ),
};

export const ClearsOnSelect = () => {
  const [log, setLog] = useState<string[]>([]);

  return (
    <Flow gap="2x">
      <SearchComboBox
        label="Add a fruit"
        placeholder="Search a fruit..."
        onSelect={(key, textValue) =>
          setLog((prev) => [...prev, `${textValue} (${key})`])
        }
      >
        {fruits.map((fruit) => (
          <SearchComboBox.Item key={fruit.toLowerCase()}>
            {fruit}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>
      <Text>
        Picked:{' '}
        <Text.Strong>{log.length ? log.join(', ') : 'nothing yet'}</Text.Strong>
      </Text>
      <Paragraph preset="t4" color="#dark-03">
        Selecting an option fires onSelect and clears the input so you can
        search again immediately.
      </Paragraph>
    </Flow>
  );
};

export const WithSubmit = () => {
  const [submitted, setSubmitted] = useState<string[]>([]);

  return (
    <Flow gap="2x">
      <SearchComboBox
        label="Search or add a tag"
        placeholder="Type and press Enter..."
        onSubmit={(value) => setSubmitted((prev) => [...prev, value])}
      >
        {fruits.map((fruit) => (
          <SearchComboBox.Item key={fruit.toLowerCase()}>
            {fruit}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>
      <Text>
        Submitted:{' '}
        <Text.Strong>
          {submitted.length ? submitted.join(', ') : 'nothing yet'}
        </Text.Strong>
      </Text>
      <Paragraph preset="t4" color="#dark-03">
        With onSubmit, typing a value that matches nothing and pressing Enter
        submits the raw text.
      </Paragraph>
    </Flow>
  );
};

export const CustomEmptyLabel: Story = {
  render: () => (
    <SearchComboBox
      label="Search a fruit"
      placeholder="Try typing 'xyz'..."
      emptyLabel="No fruit matches your search"
    >
      {fruits.map((fruit) => (
        <SearchComboBox.Item key={fruit.toLowerCase()}>
          {fruit}
        </SearchComboBox.Item>
      ))}
    </SearchComboBox>
  ),
};

export const WithTrigger: Story = {
  render: () => (
    <SearchComboBox
      hideTrigger={false}
      label="Search a fruit"
      placeholder="Search or browse..."
    >
      {fruits.map((fruit) => (
        <SearchComboBox.Item key={fruit.toLowerCase()}>
          {fruit}
        </SearchComboBox.Item>
      ))}
    </SearchComboBox>
  ),
};

const ALL_COUNTRIES = [
  'Argentina',
  'Australia',
  'Brazil',
  'Canada',
  'China',
  'Egypt',
  'France',
  'Germany',
  'India',
  'Italy',
  'Japan',
  'Mexico',
  'Spain',
  'United Kingdom',
  'United States',
];

export const ServerSideFiltering = () => {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Simulated debounced server fetch.
  useEffect(() => {
    if (!value.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handle = setTimeout(() => {
      setResults(
        ALL_COUNTRIES.filter((c) =>
          c.toLowerCase().includes(value.toLowerCase()),
        ),
      );
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(handle);
  }, [value]);

  return (
    <Flow gap="2x">
      <SearchComboBox
        filter={false}
        label="Country"
        placeholder="Search countries..."
        inputValue={value}
        isLoading={isLoading}
        items={results.map((name) => ({ key: name, name }))}
        emptyLabel={value.trim() ? 'No countries found' : 'Type to search'}
        onInputChange={setValue}
        onSelect={(key) => console.log('selected', key)}
      >
        {(item: { key: string; name: string }) => (
          <SearchComboBox.Item key={item.key}>{item.name}</SearchComboBox.Item>
        )}
      </SearchComboBox>
      <Space flow="column" gap="1x">
        <Paragraph preset="t4" color="#dark-03">
          Items are provided by the parent based on the query with `filter=
          {'{false}'}`. The loading indicator only appears if the fetch takes
          longer than `loadingDelay` (1s by default).
        </Paragraph>
      </Space>
    </Flow>
  );
};

export const Sizes = () => (
  <Flow gap="2x">
    {(['small', 'medium', 'large'] as const).map((size) => (
      <SearchComboBox
        key={size}
        size={size}
        label={size}
        placeholder={`${size} size`}
      >
        {fruits.map((fruit) => (
          <SearchComboBox.Item key={fruit.toLowerCase()}>
            {fruit}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>
    ))}
  </Flow>
);

export const Disabled: Story = {
  render: () => (
    <SearchComboBox isDisabled label="Search" placeholder="Disabled">
      {fruits.map((fruit) => (
        <SearchComboBox.Item key={fruit.toLowerCase()}>
          {fruit}
        </SearchComboBox.Item>
      ))}
    </SearchComboBox>
  ),
};
