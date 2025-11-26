import { useState } from 'react';

import { Button } from '../../actions/Button';
import { Switch } from '../../fields/Switch';
import { Space } from '../../layout/Space';
import { Divider } from '../Divider';
import { Paragraph } from '../Paragraph';

import { Disclosure } from './Disclosure';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Content/Disclosure',
  component: Disclosure,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    /* State Control */
    isExpanded: {
      control: 'boolean',
      description: 'Controls expanded state in controlled mode',
      table: {
        type: { summary: 'boolean' },
      },
    },
    defaultExpanded: {
      control: 'boolean',
      description: 'Initial expanded state in uncontrolled mode',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    onExpandedChange: {
      action: 'expanded-change',
      description: 'Callback fired when expanded state changes',
      table: {
        type: { summary: '(isExpanded: boolean) => void' },
      },
    },

    /* Behavior */
    isDisabled: {
      control: 'boolean',
      description: 'Disables trigger interactions and force-closes the content',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },

    /* Appearance */
    shape: {
      control: 'radio',
      options: ['default', 'card', 'sharp'],
      description:
        'Visual shape variant: default (no styling), card (border/radius), sharp (radius 0)',
      table: {
        type: { summary: "'default' | 'card' | 'sharp'" },
        defaultValue: { summary: 'default' },
      },
    },

    /* Animation */
    transitionDuration: {
      control: 'number',
      description:
        'Duration for DisplayTransition animation in milliseconds. When undefined, uses default CSS transition timing',
      table: {
        type: { summary: 'number' },
      },
    },

    /* Content */
    children: {
      control: { type: null },
      description: 'Disclosure.Trigger and Disclosure.Content components',
      table: {
        type: {
          summary: 'ReactNode | ((state: DisclosureStateContext) => ReactNode)',
        },
      },
    },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Basic single disclosure with trigger and content
 */
export const SingleDisclosure: Story = {
  render: (args) => (
    <Disclosure {...args}>
      <Disclosure.Trigger>What is Cube?</Disclosure.Trigger>
      <Disclosure.Content>
        <Paragraph>
          Cube is a semantic layer that connects data sources to applications.
          It provides a unified interface for data modeling, access control, and
          caching.
        </Paragraph>
      </Disclosure.Content>
    </Disclosure>
  ),
};

/**
 * Multiple disclosures in a group with single-open (accordion) behavior
 */
export const GroupDisclosure: Story = {
  render: () => (
    <Disclosure.Group>
      <Disclosure.Item id="faq-1">
        <Disclosure.Trigger>What is Cube?</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>
            Cube is a semantic layer that connects data sources to applications.
            It provides a unified interface for data modeling, access control,
            and caching.
          </Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>

      <Disclosure.Item id="faq-2">
        <Disclosure.Trigger>How does it work?</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>
            Cube connects to your data sources, allows you to define metrics and
            dimensions, and serves them through a unified API. It handles query
            optimization and caching automatically.
          </Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>

      <Disclosure.Item id="faq-3">
        <Disclosure.Trigger>What are the benefits?</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>
            Cube provides consistency across your data stack, improves
            performance with intelligent caching, ensures governance with
            centralized access control, and scales efficiently with your data
            needs.
          </Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>
    </Disclosure.Group>
  ),
};

/**
 * Card shape variant with border and rounded corners
 */
export const CardShape: Story = {
  render: (args) => (
    <Disclosure {...args} shape="card">
      <Disclosure.Trigger>What is Cube?</Disclosure.Trigger>
      <Disclosure.Content>
        <Paragraph>
          Cube is a semantic layer that connects data sources to applications.
          It provides a unified interface for data modeling, access control, and
          caching.
        </Paragraph>
      </Disclosure.Content>
    </Disclosure>
  ),
};

/**
 * Sharp shape variant with no border radius
 */
export const SharpShape: Story = {
  render: (args) => (
    <Disclosure {...args} shape="sharp">
      <Disclosure.Trigger type="secondary">What is Cube?</Disclosure.Trigger>
      <Disclosure.Content>
        <Paragraph>
          Cube is a semantic layer that connects data sources to applications.
          It provides a unified interface for data modeling, access control, and
          caching.
        </Paragraph>
      </Disclosure.Content>
    </Disclosure>
  ),
};

/**
 * Disclosure that starts in expanded state
 */
export const DefaultExpanded: Story = {
  render: (args) => (
    <Disclosure {...args} defaultExpanded>
      <Disclosure.Trigger>Already expanded</Disclosure.Trigger>
      <Disclosure.Content>
        <Paragraph>
          This content is visible by default when the component mounts.
        </Paragraph>
      </Disclosure.Content>
    </Disclosure>
  ),
};

/**
 * Disabled disclosure that cannot be toggled
 */
export const Disabled: Story = {
  render: (args) => (
    <Disclosure {...args} isDisabled>
      <Disclosure.Trigger>Cannot be toggled</Disclosure.Trigger>
      <Disclosure.Content>
        <Paragraph>This content will never be visible.</Paragraph>
      </Disclosure.Content>
    </Disclosure>
  ),
};

/**
 * Controlled disclosure with external state management
 */
export const Controlled: Story = {
  render: function ControlledStory(args) {
    const [isExpanded, setExpanded] = useState(false);

    return (
      <Space flow="column" gap="2x">
        <Space gap="1x">
          <Button onPress={() => setExpanded(true)}>Open</Button>
          <Button onPress={() => setExpanded(false)}>Close</Button>
          <Button onPress={() => setExpanded((prev) => !prev)}>Toggle</Button>
        </Space>

        <Disclosure
          {...args}
          isExpanded={isExpanded}
          onExpandedChange={setExpanded}
        >
          <Disclosure.Trigger>Controlled disclosure</Disclosure.Trigger>
          <Disclosure.Content>
            <Paragraph>
              This disclosure is controlled by external buttons.
            </Paragraph>
          </Disclosure.Content>
        </Disclosure>
      </Space>
    );
  },
};

/**
 * Group allowing multiple items to be expanded simultaneously
 */
export const MultipleExpanded: Story = {
  render: () => (
    <Disclosure.Group allowsMultipleExpanded>
      <Disclosure.Item id="item-1">
        <Disclosure.Trigger>First item</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>
            This can be open at the same time as other items.
          </Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>

      <Disclosure.Item id="item-2">
        <Disclosure.Trigger>Second item</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>Multiple items can be expanded simultaneously.</Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>

      <Disclosure.Item id="item-3">
        <Disclosure.Trigger>Third item</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>
            Unlike accordion mode, opening one doesn't close others.
          </Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>
    </Disclosure.Group>
  ),
};

/**
 * Group with some items pre-expanded
 */
export const DefaultExpandedKeys: Story = {
  render: () => (
    <Disclosure.Group defaultExpandedKeys={['item-2']}>
      <Disclosure.Item id="item-1">
        <Disclosure.Trigger>First item (collapsed)</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>First item content.</Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>

      <Disclosure.Item id="item-2">
        <Disclosure.Trigger>
          Second item (expanded by default)
        </Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>
            This item starts expanded via defaultExpandedKeys.
          </Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>

      <Disclosure.Item id="item-3">
        <Disclosure.Trigger>Third item (collapsed)</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>Third item content.</Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>
    </Disclosure.Group>
  ),
};

/**
 * Using render prop for custom trigger structure
 */
export const RenderProp: Story = {
  render: (args) => (
    <Disclosure {...args}>
      {({ isExpanded, toggle }) => (
        <>
          <Button onPress={toggle}>
            {isExpanded ? 'Hide details' : 'Show details'}
          </Button>
          <Disclosure.Content>
            <Paragraph>
              Custom trigger using render prop pattern. The trigger can be any
              component that calls the toggle function.
            </Paragraph>
          </Disclosure.Content>
        </>
      )}
    </Disclosure>
  ),
};

/**
 * Disabled group where all items are non-interactive
 */
export const DisabledGroup: Story = {
  render: () => (
    <Disclosure.Group isDisabled>
      <Disclosure.Item id="item-1">
        <Disclosure.Trigger>Cannot toggle</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>Hidden content.</Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>

      <Disclosure.Item id="item-2">
        <Disclosure.Trigger>Also disabled</Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>Hidden content.</Paragraph>
        </Disclosure.Content>
      </Disclosure.Item>
    </Disclosure.Group>
  ),
};

/**
 * Nested disclosures
 */
export const Nested: Story = {
  render: (args) => (
    <Disclosure {...args} shape="card">
      <Disclosure.Trigger>Outer disclosure</Disclosure.Trigger>
      <Disclosure.Content>
        <Paragraph>Outer content with a nested disclosure:</Paragraph>

        <Disclosure shape="card">
          <Disclosure.Trigger>Inner disclosure</Disclosure.Trigger>
          <Disclosure.Content>
            <Paragraph>
              Nested disclosure content. Each disclosure maintains independent
              state.
            </Paragraph>
          </Disclosure.Content>
        </Disclosure>
      </Disclosure.Content>
    </Disclosure>
  ),
};

/**
 * Trigger with actions containing a Switch to control disabled state
 */
export const TriggerWithActions: Story = {
  render: function TriggerWithActionsStory(args) {
    const [isDisabled, setIsDisabled] = useState(false);

    return (
      <Disclosure {...args} isDisabled={isDisabled}>
        <Disclosure.Trigger
          actions={
            <Switch
              aria-label="Disable disclosure"
              size="small"
              isSelected={!isDisabled}
              // @ts-expect-error - onChange exists on AriaSwitchProps but TS inference issue
              onChange={(value) => setIsDisabled(!value)}
            />
          }
        >
          Toggle disabled state with the switch
        </Disclosure.Trigger>
        <Disclosure.Content>
          <Paragraph>
            Use the switch in the trigger to disable/enable this disclosure.
            When disabled, the content cannot be toggled.
          </Paragraph>
        </Disclosure.Content>
      </Disclosure>
    );
  },
};
