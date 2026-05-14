import { useRef, useState } from 'react';

import { Button } from '../../actions/Button/Button';
import { Block } from '../../Block';
import { Flex } from '../../layout/Flex';
import { HotKeys } from '../HotKeys/HotKeys';
import { Paragraph } from '../Paragraph';
import { Title } from '../Title';

import { CubeInlineInputRef, InlineInput } from './InlineInput';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Content/InlineInput',
  component: InlineInput,
  args: {
    defaultValue: 'Edit me',
  },
  argTypes: {
    /* Content */
    value: {
      control: 'text',
      description:
        'Controlled value. When provided, the component is controlled.',
      table: {
        type: { summary: 'string' },
      },
    },
    defaultValue: {
      control: 'text',
      description: 'Initial value for uncontrolled usage.',
      table: {
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description:
        'Placeholder text shown in the input when the draft is empty.',
      table: {
        type: { summary: 'string' },
      },
    },

    /* Behavior */
    editTrigger: {
      control: 'radio',
      options: ['dblclick', 'click', 'none'],
      description:
        'How edit mode is activated from the display element. Programmatic entry via ref still works regardless.',
      table: {
        defaultValue: { summary: 'dblclick' },
        type: { summary: "'dblclick' | 'click' | 'none'" },
      },
    },
    keyboardActivation: {
      control: 'boolean',
      description:
        'When true (default) the display element is keyboard-focusable and responds to Enter / F2 / Space. Hosts that own keyboard handling (e.g. editable tabs) should pass `false`.',
      table: {
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    submitOnBlur: {
      control: 'boolean',
      description: 'Whether to submit when focus leaves the input.',
      table: {
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    trimOnSubmit: {
      control: 'boolean',
      description: 'Whether to trim the value on submit.',
      table: {
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    allowEmpty: {
      control: 'boolean',
      description:
        'When false, submitting an empty/whitespace value cancels instead.',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },

    /* State */
    isEditing: {
      control: 'boolean',
      description:
        'Controlled editing state. When provided, the editing state is controlled.',
      table: {
        type: { summary: 'boolean' },
      },
    },
    defaultIsEditing: {
      control: 'boolean',
      description: 'Default editing state for uncontrolled usage.',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    isDisabled: {
      control: 'boolean',
      description:
        'When true, edit mode cannot be entered (programmatically or otherwise).',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    isReadOnly: {
      control: 'boolean',
      description: 'When true, edit mode cannot be entered.',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description:
        'Fires on commit only when the value actually changed. Use for state updates.',
      table: {
        type: { summary: '(value: string) => void' },
      },
    },
    onSubmit: {
      action: 'submit',
      description:
        'Fires every commit (even when the value did not change). Use for side effects.',
      table: {
        type: { summary: '(value: string) => void' },
      },
    },
    onCancel: {
      action: 'cancel',
      description: 'Called when editing is cancelled.',
      table: {
        type: { summary: '() => void' },
      },
    },
    onEditingChange: {
      action: 'editingChange',
      description: 'Called when editing mode starts or ends.',
      table: {
        type: { summary: '(isEditing: boolean) => void' },
      },
    },

    /* Display */
    renderDisplay: {
      control: { type: null },
      description: 'Custom render for display (non-editing) mode.',
      table: {
        type: { summary: '(value: string) => ReactNode' },
      },
    },
    inputStyles: {
      control: { type: null },
      description: 'Convenience prop for styling the Input sub-element.',
      table: {
        type: { summary: 'Styles' },
      },
    },
    tooltip: {
      control: 'boolean',
      description:
        'Tooltip behaviour. `true` (default) shows the full value when the text is truncated. `false` disables the tooltip. A string always shows that text. Full object config is also accepted.',
      table: {
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean | string | AutoTooltipValue' },
      },
    },
    tooltipPlacement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Default tooltip placement.',
      table: {
        defaultValue: { summary: 'top' },
        type: { summary: "'top' | 'bottom' | 'left' | 'right' | ..." },
      },
    },
  },
} satisfies Meta<typeof InlineInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleClickTrigger: Story = {
  args: {
    editTrigger: 'click',
    defaultValue: 'Click me to edit',
  },
};

export const ManualTrigger: Story = {
  args: {
    editTrigger: 'none',
    defaultValue: 'Use the button',
  },
  render: function ManualTriggerStory(args) {
    const ref = useRef<CubeInlineInputRef>(null);

    return (
      <Flex gap="1.5x" placeItems="center">
        <InlineInput ref={ref} {...args} />
        <Button onPress={() => ref.current?.startEditing()}>Rename</Button>
      </Flex>
    );
  },
};

export const Controlled: Story = {
  render: function ControlledStory(args) {
    const [value, setValue] = useState('Controlled value');

    return <InlineInput {...args} value={value} onChange={setValue} />;
  },
};

export const ControlledEditing: Story = {
  args: {
    editTrigger: 'none',
  },
  render: function ControlledEditingStory(args) {
    const [editing, setEditing] = useState(false);

    return (
      <Flex gap="1.5x" placeItems="center">
        <InlineInput
          {...args}
          isEditing={editing}
          defaultValue="Controlled isEditing"
          onEditingChange={setEditing}
        />
        <Button onPress={() => setEditing((p) => !p)}>
          {editing ? 'Stop editing' : 'Start editing'}
        </Button>
      </Flex>
    );
  },
};

export const InHeading: Story = {
  render: (args) => (
    <Title level={2}>
      <InlineInput {...args} defaultValue="Editable heading" />
    </Title>
  ),
};

export const InParagraph: Story = {
  render: (args) => (
    <Paragraph>
      Hello, my name is <InlineInput {...args} defaultValue="John Doe" /> and I
      love editing text in place.
    </Paragraph>
  ),
};

export const Placeholder: Story = {
  args: {
    defaultValue: '',
    placeholder: 'Untitled',
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: 'You can\u2019t edit me',
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: 'Read-only value',
    isReadOnly: true,
  },
};

export const AllowEmpty: Story = {
  args: {
    defaultValue: 'Clearable',
    allowEmpty: true,
    placeholder: 'Empty allowed',
  },
};

export const KeyboardActivation: Story = {
  args: {
    defaultValue: 'Tab to me, press Enter',
  },
  render: (args) => (
    <Paragraph>
      Use <HotKeys>Tab</HotKeys> to move focus to the value (a keyboard focus
      ring will appear), then press <HotKeys>Enter</HotKeys>,{' '}
      <HotKeys>F2</HotKeys> or <HotKeys>Space</HotKeys> to enter edit mode.
      Press <HotKeys>Esc</HotKeys> to cancel.
      <br />
      <br />
      <InlineInput {...args} />
    </Paragraph>
  ),
};

export const Overflow: Story = {
  args: {
    defaultValue:
      'A very long inline value that does not fit in the container and gets truncated with an ellipsis',
  },
  render: (args) => (
    <Block width="200px" padding="1x" border="1bw dashed #border">
      <InlineInput {...args} />
    </Block>
  ),
};
