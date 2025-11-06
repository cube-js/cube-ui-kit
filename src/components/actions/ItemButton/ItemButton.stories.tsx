import { userEvent, within } from '@storybook/test';
import {
  IconEdit,
  IconExternalLink,
  IconFile,
  IconTrash,
} from '@tabler/icons-react';

import { timeout } from '../../../utils/promise';
import { ItemAction } from '../ItemAction';

import { ItemButton } from './ItemButton';

import type { Meta, StoryObj } from '@storybook/react-vite';

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
      control: 'object',
      description:
        'Tooltip configuration: string for simple text, true for auto overflow tooltips, or object for advanced config with optional auto property',
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
    htmlType: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type attribute',
    },
    description: {
      control: 'text',
      description: 'Secondary text shown below the main content',
    },
    isLoading: {
      control: 'boolean',
      description:
        'Whether the button shows loading state with disabled interaction',
    },
    loadingSlot: {
      control: 'select',
      options: ['auto', 'icon', 'rightIcon', 'prefix', 'suffix'],
      description:
        'Which slot to replace with loading icon (auto intelligently selects)',
    },
    showActionsOnHover: {
      control: 'boolean',
      description:
        'When true, actions are hidden by default and fade in on hover',
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
          'Demonstrates the checkbox functionality in ItemButton when `isSelected` prop is provided. When `isSelected` is `true`, the checkbox is visible (opacity 1, hover opacity 0.8). When `isSelected` is `false`, the checkbox is invisible (opacity 0, hover opacity 0.4). The checkbox replaces the `icon` prop when `isSelected` is provided, inherited from the Item component.',
      },
    },
  },
};

export const WithLoading: Story = {
  render: (args) => {
    // Extract isDisabled from args to prevent it from interfering with loading state
    const { isDisabled: _, ...cleanArgs } = args;

    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <h4>Loading States with Auto Slot Selection</h4>
          <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
            <ItemButton {...cleanArgs} isLoading={false} icon={<IconFile />}>
              Normal state
            </ItemButton>
            <ItemButton {...cleanArgs} isLoading={true} icon={<IconFile />}>
              Loading (auto - replaces icon)
            </ItemButton>
            <ItemButton
              {...cleanArgs}
              isLoading={true}
              rightIcon={<IconExternalLink />}
            >
              Loading (auto - replaces rightIcon)
            </ItemButton>
            <ItemButton {...cleanArgs} isLoading={true} prefix="$" suffix=".00">
              Loading (auto - no icons, fallback to icon)
            </ItemButton>
          </div>
        </div>

        <div>
          <h4>Loading with Different Types</h4>
          <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
            <ItemButton
              {...cleanArgs}
              type="primary"
              isLoading={true}
              icon={<IconFile />}
            >
              Primary Loading
            </ItemButton>
            <ItemButton
              {...cleanArgs}
              type="secondary"
              isLoading={true}
              icon={<IconFile />}
            >
              Secondary Loading
            </ItemButton>
            <ItemButton
              {...cleanArgs}
              type="outline"
              isLoading={true}
              icon={<IconFile />}
            >
              Outline Loading
            </ItemButton>
          </div>
        </div>

        <div>
          <h4>Explicit Loading Slots</h4>
          <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
            <ItemButton
              {...cleanArgs}
              isLoading={true}
              loadingSlot="rightIcon"
              icon={<IconFile />}
              rightIcon={<IconExternalLink />}
            >
              Loading in rightIcon slot
            </ItemButton>
            <ItemButton
              {...cleanArgs}
              isLoading={true}
              loadingSlot="prefix"
              icon={<IconFile />}
              prefix="$"
            >
              Loading in prefix slot
            </ItemButton>
            <ItemButton
              {...cleanArgs}
              isLoading={true}
              loadingSlot="suffix"
              icon={<IconFile />}
              suffix=".00"
            >
              Loading in suffix slot
            </ItemButton>
          </div>
        </div>

        <div>
          <h4>Loading Behavior</h4>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            Loading buttons are automatically disabled and cannot be interacted
            with:
          </p>
          <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
            <ItemButton
              {...cleanArgs}
              isLoading={true}
              icon={<IconFile />}
              onPress={() => alert('This should not trigger!')}
            >
              Loading button (disabled)
            </ItemButton>
            <ItemButton
              {...cleanArgs}
              isLoading={false}
              icon={<IconFile />}
              onPress={() => alert('Normal button clicked!')}
            >
              Normal button (clickable)
            </ItemButton>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the loading functionality in ItemButton. When `isLoading` is true, the button shows a loading icon in the appropriate slot (auto-selected or explicitly specified) and becomes disabled. The auto mode intelligently selects: icon → rightIcon → fallback to icon slot.',
      },
    },
  },
};

export const AutoTooltipOnOverflow: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h4>Auto Tooltip with tooltip=true</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            tooltip={true}
            icon={<IconFile />}
            style={{ width: '200px' }}
          >
            This text is long enough to overflow and trigger auto tooltip
          </ItemButton>
          <ItemButton
            {...args}
            tooltip={true}
            icon={<IconExternalLink />}
            style={{ width: '200px' }}
          >
            Short text
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Auto Tooltip with Configuration Object</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            tooltip={{ auto: true, placement: 'top' }}
            icon={<IconFile />}
            style={{ width: '180px' }}
          >
            Long text with custom placement that will show tooltip on top
          </ItemButton>
          <ItemButton
            {...args}
            tooltip={{ auto: true, placement: 'bottom', delay: 500 }}
            icon={<IconExternalLink />}
            style={{ width: '180px' }}
          >
            Text with custom delay and bottom placement
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Auto vs Explicit Tooltip</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            tooltip={{ title: 'Custom tooltip text', auto: true }}
            icon={<IconFile />}
            style={{ width: '150px' }}
          >
            Explicit title takes priority over auto
          </ItemButton>
          <ItemButton
            {...args}
            tooltip={{ auto: true }}
            icon={<IconExternalLink />}
            style={{ width: '150px' }}
          >
            Auto tooltip shows this text when overflowed
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>No Tooltip When Not Overflowed</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            tooltip={true}
            icon={<IconFile />}
            style={{ width: '300px' }}
          >
            Short text (no tooltip)
          </ItemButton>
          <ItemButton
            {...args}
            tooltip={{ auto: true, placement: 'top' }}
            icon={<IconExternalLink />}
            style={{ width: '400px' }}
          >
            Normal length text (no tooltip)
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Auto Tooltip with Different Button Types</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            tooltip={true}
            type="primary"
            icon={<IconFile />}
            style={{ width: '140px' }}
          >
            Primary button with overflow
          </ItemButton>
          <ItemButton
            {...args}
            tooltip={true}
            type="outline"
            icon={<IconExternalLink />}
            style={{ width: '140px' }}
          >
            Outline button with overflow
          </ItemButton>
          <ItemButton
            {...args}
            tooltip={true}
            type="clear"
            icon={<IconFile />}
            style={{ width: '140px' }}
          >
            Clear button with overflow
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Auto Tooltip with Hotkeys</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            tooltip={{ auto: true, placement: 'top' }}
            hotkeys="cmd+s"
            icon={<IconFile />}
            style={{ width: '160px' }}
            onPress={() => alert('Save action triggered!')}
          >
            Save with very long descriptive name
          </ItemButton>
          <ItemButton
            {...args}
            tooltip={true}
            hotkeys="cmd+o"
            type="primary"
            icon={<IconExternalLink />}
            style={{ width: '160px' }}
            onPress={() => alert('Open action triggered!')}
          >
            Open document with long name
          </ItemButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the auto tooltip functionality that shows tooltips only when button text overflows. Use `tooltip={true}` for simple auto tooltips or `tooltip={{ auto: true, ...config }}` for advanced configuration. When text is not overflowed, no tooltip is shown. Explicit `title` in tooltip config takes priority over auto behavior. Auto tooltips work with all button types, hotkeys, and other features.',
      },
    },
  },
};

export const WithActionsLayouts: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
      <div>
        <h4>Different Sizes</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            size="xsmall"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            XSmall Size
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            size="small"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Small Size
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            size="medium"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Medium Size
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            size="large"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Large Size
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            size="xlarge"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            XLarge Size
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Only Actions</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Item with Actions
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Very long item name that should truncate properly with actions
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Left Icon</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Item with Icon
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Very long item name with icon that should truncate properly
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Prefix</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            prefix="$"
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Item with Prefix
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            prefix="$"
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Very long item name with prefix that should truncate properly
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Left Icon and Prefix</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            prefix="$"
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Item with Both
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            prefix="$"
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Very long item name with icon and prefix that should truncate
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Inline Description</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            description="Additional info"
            descriptionPlacement="inline"
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Item with Inline Description
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            description="Additional info"
            descriptionPlacement="inline"
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Very long item name with inline description that should truncate
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Inline Description and Left Icon</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            description="Additional info"
            descriptionPlacement="inline"
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Item with Both
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            description="Additional info"
            descriptionPlacement="inline"
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Very long item name with icon and inline description
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Block Description</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            description="Additional information"
            descriptionPlacement="block"
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Item with Block Description
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            description="Additional information"
            descriptionPlacement="block"
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Very long item name with block description that should truncate
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Block Description and Left Icon</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            description="Additional information"
            descriptionPlacement="block"
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Item with Both
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            description="Additional information"
            descriptionPlacement="block"
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Very long item name with icon and block description
          </ItemButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates ItemButton with actions in various layouts. Each layout shows a regular version and a truncated version (with long text and limited width). The actions are absolutely positioned on the right side, and the button automatically reserves space for them to prevent content overlap.',
      },
    },
  },
};

export const WithActionsHoverBehavior: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
      <div>
        <h4>Only Actions</h4>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Hover over the buttons to see the difference in action visibility
        </p>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          <ItemButton
            {...args}
            type="outline"
            showActionsOnHover={false}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Long item name always showing actions
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            showActionsOnHover={true}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Long item name with hover actions
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Left Icon</h4>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            showActionsOnHover={false}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Long item name with icon always showing actions
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            showActionsOnHover={true}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Long item name with icon and hover actions
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Left Icon and Inline Description</h4>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            description="Additional info"
            descriptionPlacement="inline"
            showActionsOnHover={false}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Long item name with icon and inline description
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            description="Additional info"
            descriptionPlacement="inline"
            showActionsOnHover={true}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Long item name with icon and inline description
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Left Icon and Block Description</h4>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            description="Additional information"
            descriptionPlacement="block"
            showActionsOnHover={false}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Long item name with icon and block description
          </ItemButton>
          <ItemButton
            {...args}
            type="outline"
            icon={<IconFile />}
            description="Additional information"
            descriptionPlacement="block"
            showActionsOnHover={true}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} aria-label="Edit" />
                <ItemAction icon={<IconTrash />} aria-label="Delete" />
              </>
            }
          >
            Long item name with icon and block description
          </ItemButton>
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');

    // Find the first button with showActionsOnHover={true}
    // It should be the second button in the first row
    if (buttons[3]) {
      await userEvent.hover(buttons[3]);
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the `showActionsOnHover` flag behavior. Each row compares two buttons side-by-side: one with actions always visible (left) and one with actions shown only on hover (right). The play function automatically hovers over the first button with `showActionsOnHover={true}` to demonstrate the hover behavior.',
      },
    },
  },
};
