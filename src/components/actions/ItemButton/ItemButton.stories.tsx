import { IconExternalLink, IconFile } from '@tabler/icons-react';

import { ItemButton } from './ItemButton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ItemButton> = {
  title: 'Actions/ItemButton',
  component: ItemButton,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'neutral', 'clear'],
      description: 'Visual type/variant of the button',
    },
    theme: {
      control: 'select',
      options: ['default', 'danger', 'success', 'special'],
      description: 'Color theme of the button',
    },
    size: {
      control: 'select',
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge', 'inline'],
      description: 'Size of the button',
    },
    hotkeys: {
      control: 'text',
      description:
        'Keyboard shortcut that triggers the button (e.g., "cmd+s", "ctrl+alt+d")',
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip text to show on hover',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether the button shows as selected with checkbox',
    },
    to: {
      control: 'text',
      description: 'URL for link behavior (makes button act as link)',
    },
    buttonType: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type attribute',
    },
    description: {
      control: 'text',
      description: 'Secondary text shown below the main content',
    },
    // Icon controls are typically not included in argTypes since they're complex ReactNode objects
    // prefix and suffix are also ReactNode, so omitted from controls
    onPress: {
      action: 'pressed',
      description: 'Callback fired when button is pressed',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ItemButton>;

export const Default: Story = {
  args: {
    children: 'Item Button',
  },
};

export const WithIcons: Story = {
  args: {
    children: 'Open',
    icon: <IconFile />,
    rightIcon: <IconExternalLink />,
  },
};

export const AsLink: Story = {
  args: {
    children: 'Go to Docs',
    to: '/docs',
  },
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 8 }}>
      <ItemButton {...args} type="primary">
        Primary
      </ItemButton>
      <ItemButton {...args} type="secondary">
        Secondary
      </ItemButton>
      <ItemButton {...args} type="outline">
        Outline
      </ItemButton>
      <ItemButton {...args} type="neutral">
        Neutral
      </ItemButton>
      <ItemButton {...args} type="clear">
        Clear
      </ItemButton>
      <ItemButton {...args} type="link">
        Link
      </ItemButton>
    </div>
  ),
};

export const WithHotkeys: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
      <div>
        <h4>Buttons with Keyboard Shortcuts</h4>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Try pressing the keyboard shortcuts to trigger the buttons:
        </p>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            hotkeys="cmd+s"
            onPress={() => alert('Save action triggered!')}
          >
            Save
          </ItemButton>
          <ItemButton
            {...args}
            hotkeys="cmd+o"
            type="outline"
            icon={<IconFile />}
            onPress={() => alert('Open action triggered!')}
          >
            Open File
          </ItemButton>
          <ItemButton
            {...args}
            hotkeys="cmd+shift+e"
            type="primary"
            rightIcon={<IconExternalLink />}
            onPress={() => alert('Export action triggered!')}
          >
            Export
          </ItemButton>
          <ItemButton
            {...args}
            hotkeys="esc"
            type="clear"
            onPress={() => alert('Cancel action triggered!')}
          >
            Cancel
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Custom Suffix</h4>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          When a custom suffix is provided, hotkeys are still functional but the
          shortcut hint is not shown:
        </p>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            hotkeys="cmd+d"
            suffix="Custom"
            onPress={() => alert('Download with custom suffix triggered!')}
          >
            Download
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Different Hotkey Formats</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            hotkeys="ctrl+alt+d"
            onPress={() => alert('Multi-modifier triggered!')}
          >
            Multi-modifier
          </ItemButton>
          <ItemButton
            {...args}
            hotkeys="f1"
            type="secondary"
            onPress={() => alert('Function key triggered!')}
          >
            Help
          </ItemButton>
          <ItemButton
            {...args}
            hotkeys="shift+enter"
            type="primary"
            onPress={() => alert('Shift+Enter triggered!')}
          >
            Submit
          </ItemButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the hotkeys functionality in ItemButton. When the `hotkeys` prop is provided, it automatically displays the keyboard shortcut in the suffix area (unless a custom suffix is provided) and registers a global keyboard listener. The hotkeys work from anywhere on the page and will trigger the button's onPress handler.",
      },
    },
  },
};

export const WithCheckbox: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h4>Selected Items (Checkbox Visible)</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton {...args} isSelected={true}>
            Selected item with checkbox
          </ItemButton>
          <ItemButton {...args} isSelected={true} type="primary">
            Primary selected button
          </ItemButton>
          <ItemButton {...args} isSelected={true} type="outline">
            Outline selected button
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Non-Selected Items (Checkbox Hidden)</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton {...args} isSelected={false}>
            Non-selected item with hidden checkbox
          </ItemButton>
          <ItemButton {...args} isSelected={false} type="primary">
            Primary non-selected button
          </ItemButton>
          <ItemButton {...args} isSelected={false} type="outline">
            Outline non-selected button
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Mixed Selection States</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton {...args} isSelected={true} type="primary">
            Selected Item 1
          </ItemButton>
          <ItemButton {...args} isSelected={false} type="primary">
            Non-selected Item 2
          </ItemButton>
          <ItemButton {...args} isSelected={true} type="primary">
            Selected Item 3
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Comparison: Checkbox vs Regular Icon</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton {...args} isSelected={true}>
            With checkbox (selected)
          </ItemButton>
          <ItemButton {...args} isSelected={false}>
            With checkbox (not selected)
          </ItemButton>
          <ItemButton {...args} icon={<IconFile />}>
            With regular icon
          </ItemButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the checkbox functionality in ItemButton when `isSelected` prop is provided. When `isSelected` is `true`, the checkbox is visible (opacity 1, hover opacity 0.8). When `isSelected` is `false`, the checkbox is invisible (opacity 0, hover opacity 0.4). The checkbox replaces the `icon` prop when `isSelected` is provided, inherited from the ItemBase component.',
      },
    },
  },
};
