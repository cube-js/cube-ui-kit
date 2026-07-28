import { StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { CommandTextArea } from './CommandTextArea';

export default {
  title: 'Forms/CommandTextArea',
  component: CommandTextArea,
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
    width="40x"
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

export const Validation: StoryFn = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <CommandTextArea
      label="Valid"
      width="40x"
      {...props}
      isValid
      defaultValue="/help"
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
    <CommandTextArea
      label="Invalid"
      width="40x"
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
      width="40x"
      value={value}
      onChange={setValue}
      onCommand={(key) => {
        console.log('picked command', key);
      }}
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

export const MentionTrigger: StoryFn = (props) => (
  <CommandTextArea
    label="Message"
    placeholder="Type @ anywhere to mention…"
    width="40x"
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

export const WithSections: StoryFn = (props) => (
  <CommandTextArea
    label="Message"
    placeholder="Type / to see commands…"
    width="40x"
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

export const AutoSize: StoryFn = (props) => (
  <CommandTextArea
    autoSize
    label="Message"
    placeholder="Type / to see commands…"
    width="40x"
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
    width="40x"
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
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      minHeight: '80vh',
      width: '100%',
    }}
  >
    <CommandTextArea
      label="Message"
      placeholder="Type / to see commands…"
      width="40x"
      direction="top"
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
  </div>
);
TopPopoverPosition.parameters = {
  layout: 'fullscreen',
};
