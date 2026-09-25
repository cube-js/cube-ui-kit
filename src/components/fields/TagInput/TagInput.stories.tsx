import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Paragraph } from '../../content/Paragraph';
import { Form } from '../../form/Form';
import { Space } from '../../layout/Space';

import { CubeTagInputProps, TagInput } from './TagInput';

import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';

const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

const validateEmail = (value: string) =>
  EMAIL.test(value) || 'Enter an email address';

const ACTIONS = [
  { key: 'read', label: 'read' },
  { key: 'refresh', label: 'refresh' },
  { key: 'rebuild', label: 'rebuild' },
  { key: 'deploy', label: 'deploy' },
  { key: 'delete', label: 'delete' },
  { key: 'manage', label: 'manage' },
];

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** The option the combobox's `aria-activedescendant` points at. */
const activeOption = (input: HTMLElement) => {
  const id = input.getAttribute('aria-activedescendant');

  return id ? document.getElementById(id) : null;
};

const meta = {
  title: 'Forms/TagInput',
  component: TagInput,
  subcomponents: { Item: TagInput.Item, Section: TagInput.Section },
  args: { width: '360px', label: 'Also send to' },
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description:
        'TagInput.Item elements, or a render function for `items`, that suggest values',
    },
    items: {
      control: { type: null },
      description: 'Options to suggest, as data',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the input',
    },
    icon: {
      control: { type: null },
      description: 'Icon element rendered before the input',
    },
    prefix: {
      control: { type: null },
      description: 'Input decoration before the main input',
    },
    suffix: {
      control: { type: null },
      description: 'Input decoration after the main input',
    },
    suffixPosition: {
      options: ['before', 'after'],
      control: { type: 'radio' },
      description:
        'Whether the suffix goes before or after the validation and loading icons',
      table: { defaultValue: { summary: 'before' } },
    },
    tagProps: {
      control: { type: null },
      description:
        "Props for each chip's Tag, by value. A string `children` also names the value to screen readers; `isDisabled` locks the chip",
      table: { type: { summary: '(value: string) => Partial<CubeTagProps>' } },
    },

    /* Selection */
    value: {
      control: { type: null },
      description: 'The values in controlled mode',
      table: { type: { summary: 'string[]' } },
    },
    defaultValue: {
      control: { type: null },
      description: 'The initial values in uncontrolled mode',
      table: { type: { summary: 'string[]' } },
    },
    inputValue: {
      control: { type: 'text' },
      description: 'The text being typed, in controlled mode',
    },
    defaultInputValue: {
      control: { type: 'text' },
      description: 'The initial text being typed, in uncontrolled mode',
    },
    allowsCustomValue: {
      control: { type: 'boolean' },
      description:
        'Whether typed values that are not among the options are accepted. Only applies when options are given',
      table: { defaultValue: { summary: false } },
    },

    /* Behavior */
    delimiters: {
      control: { type: 'object' },
      description:
        'Characters that commit the typed text and split pasted text. Pasted text is also split on line breaks',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: "[',']" },
      },
    },
    validateTag: {
      control: { type: null },
      description:
        'Checks one value before it becomes a chip. Return `false` or a message to reject it',
      table: {
        type: {
          summary: '(value: string) => boolean | string | null | undefined',
        },
      },
    },
    normalizeTag: {
      control: { type: null },
      description:
        'Rewrites a typed value before it is checked and added. Return an empty string to drop it',
      table: { type: { summary: '(value: string) => string' } },
    },
    maxTags: {
      control: { type: 'number' },
      description:
        'The most values the field holds. Values past it are refused and stay in the input',
    },
    shouldCommitOnBlur: {
      control: { type: 'boolean' },
      description: 'Whether leaving the field commits the typed text',
      table: { defaultValue: { summary: true } },
    },
    isClearable: {
      control: { type: 'boolean' },
      description:
        'Whether a button in the input clears the typed text. It shows while there is text',
      table: { defaultValue: { summary: false } },
    },
    filter: {
      control: { type: null },
      description:
        'Custom filter for the options, or `false` to show every option',
    },
    popoverTrigger: {
      options: ['focus', 'input', 'manual'],
      control: { type: 'radio' },
      description: 'When the suggestions popover opens',
      table: { defaultValue: { summary: 'input' } },
    },
    hideTrigger: {
      control: { type: 'boolean' },
      description: 'Whether to hide the button that toggles the popover',
      table: { defaultValue: { summary: false } },
    },
    disabledKeys: {
      control: { type: null },
      description: 'Keys of options that cannot be picked',
    },
    autoComplete: {
      control: { type: 'text' },
      description: 'HTML `autocomplete` attribute for the input',
      table: { defaultValue: { summary: 'off' } },
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Size of the input. The chips follow it',
      table: { defaultValue: { summary: 'medium' } },
    },
    direction: {
      options: ['bottom', 'top'],
      control: { type: 'radio' },
      description: 'Where the suggestions popover opens',
      table: { defaultValue: { summary: 'bottom' } },
    },
    shouldFlip: {
      control: { type: 'boolean' },
      description: 'Whether the popover flips when there is no room',
      table: { defaultValue: { summary: true } },
    },
    overlayOffset: {
      control: { type: 'number' },
      description: 'Distance between the input and the popover, in pixels',
      table: { defaultValue: { summary: 8 } },
    },
    containerPadding: {
      control: { type: 'number' },
      description:
        'Minimum space between the popover and the viewport edge, in pixels',
      table: { defaultValue: { summary: 8 } },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the field is disabled',
      table: { defaultValue: { summary: false } },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the field is read-only',
      table: { defaultValue: { summary: false } },
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Whether the field shows a loading indicator',
      table: { defaultValue: { summary: false } },
    },
    ...VALIDATION_ARGS,

    /* Events */
    onChange: {
      action: 'change',
      description: 'Called with the whole new list of values',
      control: { type: null },
    },
    onInputChange: {
      action: 'input-change',
      description: 'Called when the text being typed changes',
      control: { type: null },
    },
    onClear: {
      action: 'clear',
      description: 'Called when the clear button is pressed',
      control: { type: null },
    },
    onOpenChange: {
      action: 'open-change',
      description: 'Called when the suggestions popover opens or closes',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description:
        'Called when focus enters the component: the input, a chip or the popover',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Called when focus leaves the component entirely',
      control: { type: null },
    },
    onKeyDown: {
      action: 'key-down',
      description:
        'Called when a key is pressed in the input, before the component handles it',
      control: { type: null },
    },
  },
} satisfies Meta<typeof TagInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: StoryFn<CubeTagInputProps> = (args) => (
  <TagInput
    placeholder="name@company.com"
    defaultValue={['ana@acme.com', 'ops-team@acme.com']}
    validateTag={validateEmail}
    {...args}
  />
);

export const WithSuggestions: Story = {
  args: { label: 'Allowed actions', placeholder: 'Search actions' },
  render: (args) => (
    <TagInput qa="Actions" defaultValue={['read', 'rebuild']} {...args}>
      {ACTIONS.map((action) => (
        <TagInput.Item key={action.key}>{action.label}</TagInput.Item>
      ))}
    </TagInput>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByTestId('Actions');

    await userEvent.type(input, 're');

    // The first match takes virtual focus a couple of frames after the list
    // opens; that focus is part of the picture.
    await waitFor(() => expect(activeOption(input)).toHaveTextContent('read'));
  },
};

export const CustomValues: Story = {
  args: {
    label: 'Allowed actions',
    placeholder: 'Search or add an action',
    allowsCustomValue: true,
  },
  render: (args) => (
    <TagInput qa="Actions" defaultValue={['read']} {...args}>
      {ACTIONS.map((action) => (
        <TagInput.Item key={action.key}>{action.label}</TagInput.Item>
      ))}
    </TagInput>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByTestId('Actions');

    await userEvent.type(input, 'de');

    await waitFor(() =>
      expect(
        within(document.body).getByRole('option', { name: 'de' }),
      ).toBeVisible(),
    );
    await waitFor(() =>
      expect(activeOption(input)).toHaveTextContent('deploy'),
    );
  },
};

export const RejectedEntry: Story = {
  args: { placeholder: 'name@company.com' },
  render: (args) => (
    <TagInput
      qa="Emails"
      defaultValue={['ana@acme.com']}
      validateTag={validateEmail}
      {...args}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByTestId('Emails');

    await timeout(100);
    await userEvent.click(input);
    await userEvent.paste('lee@acme.com, not-an-email');

    await waitFor(() =>
      expect(canvas.getByText('Enter an email address')).toBeVisible(),
    );
  },
};

RejectedEntry.parameters = {
  docs: {
    description: {
      story:
        'A pasted list is split into values. Accepted ones become chips; a rejected one stays in the input with the message from `validateTag`.',
    },
  },
};

export const Validation: StoryFn<CubeTagInputProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="stretch" width="360px">
    <TagInput {...args} label="Valid" defaultValue={['ana@acme.com']} isValid />
    <TagInput
      {...args}
      label="Invalid"
      defaultValue={['ana@acme.com']}
      isInvalid
      errorMessage="Add at least two recipients"
    />
    <TagInput
      {...args}
      label="Invalid chip"
      defaultValue={['ana@acme.com', 'lee.acme.com']}
      validateTag={validateEmail}
    />
  </Space>
);

Validation.args = { width: undefined };

export const Sizes: StoryFn<CubeTagInputProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="stretch" width="360px">
    {(['small', 'medium', 'large'] as const).map((size) => (
      <TagInput
        key={size}
        {...args}
        label={size}
        size={size}
        placeholder="name@company.com"
        defaultValue={['ana@acme.com', 'ops-team@acme.com']}
      />
    ))}
  </Space>
);

Sizes.args = { width: undefined };

export const DisabledAndReadOnly: StoryFn<CubeTagInputProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="stretch" width="360px">
    <TagInput
      {...args}
      isDisabled
      label="Disabled"
      defaultValue={['ana@acme.com', 'ops-team@acme.com']}
    />
    <TagInput
      {...args}
      isReadOnly
      label="Read-only"
      defaultValue={['ana@acme.com', 'ops-team@acme.com']}
    />
  </Space>
);

DisabledAndReadOnly.args = { width: undefined };

export const SideLabel: StoryFn<CubeTagInputProps> = (args) => (
  <TagInput
    {...args}
    labelPosition="side"
    placeholder="name@company.com"
    description="Press Enter or type a comma to add an address."
    defaultValue={['ana@acme.com', 'ops-team@acme.com', 'lee@acme.com']}
  />
);

SideLabel.args = { width: '480px' };

export const ManyValues: StoryFn<CubeTagInputProps> = (args) => (
  <TagInput
    {...args}
    label="Bin boundaries"
    placeholder="Add a number"
    defaultValue={['0', '10', '25', '50', '75', '100', '250', '500', '1000']}
    validateTag={(value) => Number.isFinite(Number(value)) || 'Enter a number'}
  />
);

ManyValues.args = { width: '240px' };

export const ChipThemes: StoryFn<CubeTagInputProps> = (args) => {
  const members: Record<string, 'measure' | 'dimension'> = {
    'orders.count': 'measure',
    'orders.total': 'measure',
    'orders.status': 'dimension',
    'orders.created_at': 'dimension',
  };

  return (
    <TagInput
      {...args}
      label="Members"
      placeholder="Search members"
      defaultValue={['orders.count', 'orders.status']}
      tagProps={(value) => ({
        theme: members[value] === 'measure' ? 'primary' : 'success',
      })}
    >
      {Object.keys(members).map((key) => (
        <TagInput.Item key={key}>{key}</TagInput.Item>
      ))}
    </TagInput>
  );
};

ChipThemes.parameters = {
  docs: {
    description: {
      story:
        '`tagProps` sets props per chip, here the theme by member type. Options come in as children, so the chips show their labels.',
    },
  },
};

export const KeyboardToChips: Story = {
  render: (args) => (
    <TagInput
      qa="Emails"
      placeholder="name@company.com"
      defaultValue={['ana@acme.com', 'ops-team@acme.com', 'lee@acme.com']}
      {...args}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByTestId('Emails');

    await userEvent.click(input);
    await userEvent.keyboard('{Backspace}');

    const rows = canvas.getAllByRole('row');

    await waitFor(() => expect(rows[rows.length - 1]).toHaveFocus());
  },
};

KeyboardToChips.parameters = {
  docs: {
    description: {
      story:
        'Backspace in the empty input moves to the last chip. The next Backspace removes it and moves to the one before; Escape or typing goes back to the input.',
    },
  },
};

export const LockedAndClearable: StoryFn<CubeTagInputProps> = (args) => (
  <TagInput
    {...args}
    isClearable
    label="Owners"
    placeholder="name@company.com"
    defaultInputValue="kim@acme"
    defaultValue={['you@acme.com', 'ana@acme.com', 'lee@acme.com']}
    tagProps={(value) =>
      value === 'you@acme.com'
        ? { isDisabled: true, children: 'you@acme.com (you)' }
        : undefined
    }
  />
);

LockedAndClearable.parameters = {
  docs: {
    description: {
      story:
        '`isClearable` adds a button to the input that clears the typed text; it shows while there is text. A chip with `isDisabled` from `tagProps` is locked: it has no remove button and the keyboard skips it.',
    },
  },
};

export const MaxTags: Story = {
  args: { label: 'Reviewers', maxTags: 3, placeholder: 'name@company.com' },
  render: (args) => (
    <TagInput
      qa="Reviewers"
      defaultValue={['ana@acme.com', 'lee@acme.com']}
      description="Up to three reviewers."
      {...args}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByTestId('Reviewers');

    await timeout(100);
    await userEvent.click(input);
    await userEvent.paste('kim@acme.com, joe@acme.com');

    await waitFor(() =>
      expect(canvas.getByText('You can add up to 3')).toBeVisible(),
    );
  },
};

// A refused value with its message is what `RejectedEntry` already shows.
MaxTags.parameters = NO_SNAPSHOT;

export const Normalized: StoryFn<CubeTagInputProps> = (args) => (
  <TagInput
    {...args}
    placeholder="name@company.com"
    description="Addresses are lowercased, so Ana@Acme.com is a duplicate."
    defaultValue={['ana@acme.com']}
    normalizeTag={(value) => value.toLowerCase()}
    validateTag={validateEmail}
  />
);

// The story is about typing: `normalizeTag` changes nothing in the field at
// rest.
Normalized.parameters = NO_SNAPSHOT;

export const Controlled: StoryFn<CubeTagInputProps> = (args) => {
  const [value, setValue] = useState<string[]>(['ana@acme.com']);

  return (
    <Space gap="2x" flow="column" placeItems="start">
      <TagInput
        {...args}
        placeholder="name@company.com"
        value={value}
        onChange={setValue}
      />
      <Paragraph>Value: {JSON.stringify(value)}</Paragraph>
      <Button onPress={() => setValue([])}>Clear all</Button>
    </Space>
  );
};

// The story is about the state hook: its field at rest shows nothing that
// `Default` does not.
Controlled.parameters = NO_SNAPSHOT;

export const WithoutDelimiters: StoryFn<CubeTagInputProps> = (args) => (
  <TagInput
    {...args}
    label="Allowed IAM principals"
    placeholder="arn:aws:iam::123456789012:user/name"
    delimiters={[]}
    description="Commas are allowed in IAM names, so only Enter and pasted line breaks separate values."
  />
);

// The story is about typing: `delimiters` changes nothing in the field at
// rest.
WithoutDelimiters.parameters = NO_SNAPSHOT;

export const InForm: StoryFn<CubeTagInputProps> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      defaultValues={{ recipients: ['ana@acme.com'] }}
      onSubmit={(values) => console.log('submit', values)}
    >
      <TagInput
        {...args}
        name="recipients"
        label="Recipients"
        placeholder="name@company.com"
        validateTag={validateEmail}
        rules={[
          { required: true, message: 'Add at least one recipient' },
          { max: 5, type: 'array', message: 'Up to five recipients' },
        ]}
      />
      <Form.Submit>Save</Form.Submit>
    </Form>
  );
};

// The story is about form wiring: its field at rest shows nothing that
// `Default` does not.
InForm.parameters = NO_SNAPSHOT;
