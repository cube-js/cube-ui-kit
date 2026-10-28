import { StoryFn } from '@storybook/react-vite';
import { useState } from 'react';
import { within } from 'storybook/test';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { openTooltip } from '../../../stories/interactions';
import { baseProps } from '../../../stories/lists/baseProps';
import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';

import { CommandTextArea } from './CommandTextArea';

export default {
  title: 'Forms/CommandTextArea',
  component: CommandTextArea,
  args: { fieldStyles: { width: '0 40x 100%' } },
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    value: {
      control: { type: 'text' },
      description: 'The text value in controlled mode',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default text value in uncontrolled mode',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    triggers: {
      control: { type: null },
      description:
        'Trigger descriptors that open the autocomplete (default: a slash command at the start of the input)',
    },
    autoSize: {
      control: { type: 'boolean' },
      description: 'Whether the textarea resizes to fit its content',
      table: { defaultValue: { summary: false } },
    },
    rows: {
      control: { type: 'number' },
      description: 'Number of visible rows',
      table: { defaultValue: { summary: 3 } },
    },
    maxRows: {
      control: { type: 'number' },
      description: 'Max visible rows when autoSize is true',
      table: { defaultValue: { summary: 10 } },
    },
    direction: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom'],
      description: 'Popover placement',
      table: { defaultValue: { summary: 'top' } },
    },
    insertSpaceAfter: {
      control: { type: 'boolean' },
      description: 'Insert a trailing space after the chosen command',
      table: { defaultValue: { summary: true } },
    },
    onCommand: { control: { type: null } },
    filter: { control: { type: null } },
    shouldFlip: {
      control: { type: 'boolean' },
      description: 'Whether the popover flips when overflowing',
      table: { defaultValue: { summary: true } },
    },
    overlayOffset: {
      control: { type: 'number' },
      description: 'Distance between the textarea and the popover',
      table: { defaultValue: { summary: 8 } },
    },
    containerPadding: {
      control: { type: 'number' },
      description: 'Padding between the popover and the viewport edge',
      table: { defaultValue: { summary: 8 } },
    },
    overlayStyles: {
      control: { type: null },
      description: 'Styles for the popover overlay',
    },
    listBoxStyles: {
      control: { type: null },
      description: 'Styles for the inner listbox',
    },
    listGap: {
      control: { type: 'number' },
      description: 'Space between options, in pixels',
      table: {
        defaultValue: { summary: '$item-gap' },
        type: { summary: 'number' },
      },
    },
    optionStyles: {
      control: { type: null },
      description: 'Styles for individual options',
    },
    sectionStyles: {
      control: { type: null },
      description: 'Styles for section containers',
    },
    headingStyles: {
      control: { type: null },
      description: 'Styles for section headings',
    },
    disabledKeys: {
      control: { type: null },
      description: 'Keys of disabled options',
    },
    tooltip: {
      control: { type: 'text' },
      description:
        "The input's own tooltip, shown on hover over the field box and on keyboard focus, including while disabled",
    },
    ...VALIDATION_ARGS,
  },
};

const commands = [
  { key: '/clear', description: 'Clear conversation' },
  { key: '/help', description: 'Show help' },
  { key: '/share', description: 'Share conversation' },
  { key: '/summarize', description: 'Summarize thread' },
  { key: '/settings', description: 'Open settings' },
];

export const Default: StoryFn = (props) => (
  <CommandTextArea
    label="Message"
    placeholder="Type / to see commands…"
    {...props}
  >
    {commands.map((c) => (
      <CommandTextArea.Item
        key={c.key}
        textValue={c.key}
        description={c.description}
      >
        {c.key}
      </CommandTextArea.Item>
    ))}
  </CommandTextArea>
);

export const WithTooltip: StoryFn = ({ tooltip, ...props }) => (
  <CommandTextArea
    qa="Message"
    aria-label="Message"
    placeholder="Type / to see commands…"
    {...props}
    // `delay: 0` only so the story does not depend on the open delay.
    tooltip={{ title: tooltip, delay: 0 }}
  >
    {commands.map((c) => (
      <CommandTextArea.Item
        key={c.key}
        textValue={c.key}
        description={c.description}
      >
        {c.key}
      </CommandTextArea.Item>
    ))}
  </CommandTextArea>
);

WithTooltip.args = {
  tooltip: 'Visible to everyone in this channel',
  // Room above the field, so the tooltip opens in its default `top` placement.
  fieldStyles: { width: '0 40x 100%', margin: '6x top' },
};

WithTooltip.parameters = {
  // The same open tooltip over a text area's field box as
  // `TextArea / WithTooltip`, which photographs it.
  ...NO_SNAPSHOT,
  docs: {
    description: {
      story:
        'The tooltip closes on the first key, so it never covers the command suggestions.',
    },
  },
};

WithTooltip.play = async ({ canvasElement }) => {
  // The tooltip is the field box's, so hover the box, as a pointer would.
  await openTooltip(
    () =>
      within(canvasElement)
        .getByTestId('Message')
        .closest('[data-qa="InputWrapper"]') as HTMLElement,
  );
};

export const Validation: StoryFn = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <CommandTextArea label="Valid" {...props} isValid defaultValue="/help">
      {commands.map((c) => (
        <CommandTextArea.Item
          key={c.key}
          textValue={c.key}
          description={c.description}
        >
          {c.key}
        </CommandTextArea.Item>
      ))}
    </CommandTextArea>
    <CommandTextArea
      label="Invalid"
      placeholder="Type / to see commands…"
      {...props}
      isInvalid
    >
      {commands.map((c) => (
        <CommandTextArea.Item
          key={c.key}
          textValue={c.key}
          description={c.description}
        >
          {c.key}
        </CommandTextArea.Item>
      ))}
    </CommandTextArea>
  </Space>
);

export const Controlled: StoryFn = () => {
  const [value, setValue] = useState('');
  return (
    <CommandTextArea
      label="Message"
      placeholder="Type / to see commands…"
      value={value}
      onChange={setValue}
      onCommand={(key) => {
        console.log('picked command', key);
      }}
      fieldStyles={{ width: '0 40x 100%' }}
    >
      {commands.map((c) => (
        <CommandTextArea.Item
          key={c.key}
          textValue={c.key}
          description={c.description}
        >
          {c.key}
        </CommandTextArea.Item>
      ))}
    </CommandTextArea>
  );
};
// Starts empty, so this is the same textarea `Default` photographs.
Controlled.parameters = NO_SNAPSHOT;

export const MentionTrigger: StoryFn = (props) => (
  <CommandTextArea
    label="Message"
    placeholder="Type @ anywhere to mention…"
    triggers={[{ char: '@', atLineStart: false }]}
    {...props}
  >
    {[
      { key: '@john', description: 'John Doe' },
      { key: '@jane', description: 'Jane Roe' },
      { key: '@alex', description: 'Alex Kim' },
    ].map((c) => (
      <CommandTextArea.Item
        key={c.key}
        textValue={c.key}
        description={c.description}
      >
        {c.key}
      </CommandTextArea.Item>
    ))}
  </CommandTextArea>
);
// The `@` popover never opens here, so the snapshot is an empty textarea.
MentionTrigger.parameters = NO_SNAPSHOT;

export const WithSections: StoryFn = (props) => (
  <CommandTextArea
    label="Message"
    placeholder="Type / to see commands…"
    {...props}
  >
    <CommandTextArea.Section title="Actions">
      <CommandTextArea.Item
        key="/clear"
        textValue="/clear"
        description="Clear conversation"
      >
        /clear
      </CommandTextArea.Item>
      <CommandTextArea.Item
        key="/share"
        textValue="/share"
        description="Share conversation"
      >
        /share
      </CommandTextArea.Item>
    </CommandTextArea.Section>
    <CommandTextArea.Section title="Info">
      <CommandTextArea.Item
        key="/help"
        textValue="/help"
        description="Show help"
      >
        /help
      </CommandTextArea.Item>
      <CommandTextArea.Item
        key="/settings"
        textValue="/settings"
        description="Open settings"
      >
        /settings
      </CommandTextArea.Item>
    </CommandTextArea.Section>
  </CommandTextArea>
);
// Sections live in the command popover, which only opens once you type `/`.
WithSections.parameters = NO_SNAPSHOT;

export const AutoSize: StoryFn = (props) => (
  <CommandTextArea
    autoSize
    label="Message"
    placeholder="Type / to see commands…"
    // Auto-sizing is only visible once there is enough text to grow the field.
    // Empty, this story renders exactly like `Default` and shows nothing.
    defaultValue={
      'This field grows with its content instead of scrolling.\n' +
      'Every line you add makes it taller,\n' +
      'up to whatever the surrounding layout allows.'
    }
    {...props}
  >
    {commands.map((c) => (
      <CommandTextArea.Item
        key={c.key}
        textValue={c.key}
        description={c.description}
      >
        {c.key}
      </CommandTextArea.Item>
    ))}
  </CommandTextArea>
);

export const Multiline: StoryFn = (props) => (
  <CommandTextArea
    label="Message"
    placeholder="Type / on any line to see commands…"
    rows={6}
    defaultValue={'Hello, how are you?\n\nI wanted to ask about '}
    {...props}
  >
    {commands.map((c) => (
      <CommandTextArea.Item
        key={c.key}
        textValue={c.key}
        description={c.description}
      >
        {c.key}
      </CommandTextArea.Item>
    ))}
  </CommandTextArea>
);

export const TopPopoverPosition: StoryFn = (props) => (
  <Flex
    flow="column"
    justifyContent="flex-end"
    width="100%"
    styles={{ minHeight: '80vh' }}
  >
    <CommandTextArea
      label="Message"
      placeholder="Type / to see commands…"
      {...props}
    >
      {commands.map((c) => (
        <CommandTextArea.Item
          key={c.key}
          textValue={c.key}
          description={c.description}
        >
          {c.key}
        </CommandTextArea.Item>
      ))}
    </CommandTextArea>
  </Flex>
);
TopPopoverPosition.parameters = {
  // The popover never opens, so the placement it demonstrates is not captured.
  ...NO_SNAPSHOT,
  layout: 'fullscreen',
};
