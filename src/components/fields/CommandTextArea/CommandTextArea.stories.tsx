import { StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';

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
  },
};

const commands = [
  { key: '/clear', children: 'Clear conversation', textValue: '/clear' },
  { key: '/help', children: 'Show help', textValue: '/help' },
  { key: '/share', children: 'Share conversation', textValue: '/share' },
  { key: '/summarize', children: 'Summarize thread', textValue: '/summarize' },
  { key: '/settings', children: 'Open settings', textValue: '/settings' },
];

export const Default: StoryFn = (props) => (
  <CommandTextArea
    label="Message"
    placeholder="Type / to see commands…"
    width="40x"
    {...props}
  >
    {commands.map((c) => (
      <CommandTextArea.Item key={c.key} textValue={c.textValue}>
        {c.children}
      </CommandTextArea.Item>
    ))}
  </CommandTextArea>
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
        <CommandTextArea.Item key={c.key} textValue={c.textValue}>
          {c.children}
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
      { key: '@john', children: 'John Doe', textValue: '@john' },
      { key: '@jane', children: 'Jane Roe', textValue: '@jane' },
      { key: '@alex', children: 'Alex Kim', textValue: '@alex' },
    ].map((c) => (
      <CommandTextArea.Item key={c.key} textValue={c.textValue}>
        {c.children}
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
      <CommandTextArea.Item key="/clear" textValue="/clear">
        Clear conversation
      </CommandTextArea.Item>
      <CommandTextArea.Item key="/share" textValue="/share">
        Share conversation
      </CommandTextArea.Item>
    </CommandTextArea.Section>
    <CommandTextArea.Section title="Info">
      <CommandTextArea.Item key="/help" textValue="/help">
        Show help
      </CommandTextArea.Item>
      <CommandTextArea.Item key="/settings" textValue="/settings">
        Open settings
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
      <CommandTextArea.Item key={c.key} textValue={c.textValue}>
        {c.children}
      </CommandTextArea.Item>
    ))}
  </CommandTextArea>
);
