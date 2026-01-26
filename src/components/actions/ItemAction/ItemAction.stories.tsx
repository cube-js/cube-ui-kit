import {
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconFile,
  IconHeart,
  IconStar,
  IconTrash,
} from '@tabler/icons-react';
import { userEvent, within } from 'storybook/test';

import { Item } from '../../content/Item';
import { Space } from '../../layout/Space';
import { ItemButton } from '../ItemButton';

import { ItemAction } from './ItemAction';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ItemAction> = {
  title: 'Actions/ItemAction',
  component: ItemAction,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    /* Content */
    icon: {
      control: { type: null },
      description: 'Icon element or "checkbox" for selection indicator',
    },
    children: {
      control: { type: 'text' },
      description: 'Action label (optional, for labeled buttons)',
    },
    tooltip: {
      control: { type: 'object' },
      description:
        'Tooltip configuration: string for simple text or object for advanced config (shown for icon-only buttons)',
    },

    /* Presentation */
    type: {
      control: 'select',
      options: ['primary', 'secondary', 'neutral', 'clear'],
      description:
        'Visual type/variant of the action button (inherits from context when inside ItemButton/Item)',
      table: {
        defaultValue: { summary: 'neutral' },
      },
    },
    theme: {
      control: 'select',
      options: ['default', 'danger', 'success', 'warning', 'note', 'special'],
      description:
        'Color theme of the action button (inherits from context when inside ItemButton/Item)',
      table: {
        defaultValue: { summary: 'default' },
      },
    },

    /* State */
    isLoading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
      table: {
        defaultValue: { summary: false },
      },
    },
    isSelected: {
      control: 'boolean',
      description: 'Shows as selected (works with checkbox icon)',
      table: {
        defaultValue: { summary: false },
      },
    },
    isDisabled: {
      control: 'boolean',
      description:
        'Disables the action button. Inherits from parent Item/ItemButton when used inside actions prop. Use isDisabled={false} to keep action enabled when parent is disabled.',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onPress: {
      action: 'pressed',
      description: 'Callback fired when action button is pressed',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ItemAction>;

export const Default: Story = {
  args: {
    icon: <IconEdit />,
    tooltip: 'Edit',
  },
};

export const IconOnly: Story = {
  render: (args) => (
    <Space>
      <ItemAction icon={<IconEdit />} tooltip="Edit" {...args} />
      <ItemAction icon={<IconCopy />} tooltip="Copy" {...args} />
      <ItemAction icon={<IconTrash />} tooltip="Delete" {...args} />
      <ItemAction icon={<IconExternalLink />} tooltip="Open" {...args} />
    </Space>
  ),
};

export const WithLabel: Story = {
  render: (args) => (
    <Space>
      <ItemAction icon={<IconEdit />} {...args}>
        Edit
      </ItemAction>
      <ItemAction icon={<IconCopy />} {...args}>
        Copy
      </ItemAction>
      <ItemAction icon={<IconTrash />} {...args}>
        Delete
      </ItemAction>
    </Space>
  ),
};

export const LabelOnly: Story = {
  render: (args) => (
    <Space>
      <ItemAction {...args}>Edit</ItemAction>
      <ItemAction {...args}>Copy</ItemAction>
      <ItemAction {...args}>Delete</ItemAction>
    </Space>
  ),
};

export const Types: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h4>Primary</h4>
        <Space>
          <ItemAction type="primary" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction type="primary" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction type="primary" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Secondary</h4>
        <Space>
          <ItemAction type="secondary" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction type="secondary" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction type="secondary" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Neutral</h4>
        <Space>
          <ItemAction type="neutral" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction type="neutral" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction type="neutral" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Clear</h4>
        <Space>
          <ItemAction type="clear" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction type="clear" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction type="clear" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
    </div>
  ),
};

export const Themes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h4>Default Theme</h4>
        <Space>
          <ItemAction theme="default" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="default" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="default" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Danger Theme</h4>
        <Space>
          <ItemAction theme="danger" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="danger" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="danger" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Success Theme</h4>
        <Space>
          <ItemAction theme="success" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="success" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="success" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Warning Theme</h4>
        <Space>
          <ItemAction theme="warning" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="warning" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="warning" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Note Theme</h4>
        <Space>
          <ItemAction theme="note" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="note" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="note" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Special Theme</h4>
        <Space fill="#dark" padding="2x" radius="1x">
          <ItemAction theme="special" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="special" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="special" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h4>Normal</h4>
        <Space>
          <ItemAction icon={<IconEdit />} tooltip="Edit" />
          <ItemAction icon={<IconCopy />} tooltip="Copy" />
          <ItemAction icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Disabled</h4>
        <Space>
          <ItemAction isDisabled icon={<IconEdit />} tooltip="Edit" />
          <ItemAction isDisabled icon={<IconCopy />} tooltip="Copy" />
          <ItemAction isDisabled icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Loading</h4>
        <Space>
          <ItemAction isLoading icon={<IconEdit />} tooltip="Edit" />
          <ItemAction isLoading icon={<IconCopy />} tooltip="Copy" />
          <ItemAction isLoading icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </div>
      <div>
        <h4>Selected</h4>
        <Space>
          <ItemAction isSelected icon="checkbox" tooltip="Select" />
          <ItemAction icon="checkbox" tooltip="Select" isSelected={false} />
          <ItemAction isSelected icon={<IconStar />} tooltip="Favorite" />
        </Space>
      </div>
    </div>
  ),
};

export const InsideItemButton: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
      <div>
        <h4>Icon Only Actions</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            type="outline"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Document.pdf
          </ItemButton>
          <ItemButton
            type="primary"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconCopy />} tooltip="Copy" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Report.xlsx
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Labels</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            type="outline"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />}>Edit</ItemAction>
                <ItemAction icon={<IconTrash />}>Delete</ItemAction>
              </>
            }
          >
            Document.pdf
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Context Inheritance</h4>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Actions automatically inherit type and theme from parent ItemButton
        </p>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            type="primary"
            theme="default"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Primary Button
          </ItemButton>
          <ItemButton
            type="outline"
            theme="danger"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Danger Button
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Override Context</h4>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Actions can override inherited type/theme
        </p>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            type="outline"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction
                  icon={<IconTrash />}
                  tooltip="Delete"
                  theme="danger"
                />
              </>
            }
          >
            Document with Danger Action
          </ItemButton>
          <ItemButton
            type="primary"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconStar />} tooltip="Favorite" />
                <ItemAction
                  icon={<IconTrash />}
                  tooltip="Delete"
                  type="clear"
                  theme="danger"
                />
              </>
            }
          >
            Item with Mixed Actions
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>With Different Sizes</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            type="outline"
            size="small"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Small Button
          </ItemButton>
          <ItemButton
            type="outline"
            size="medium"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Medium Button
          </ItemButton>
          <ItemButton
            type="outline"
            size="large"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Large Button
          </ItemButton>
        </div>
      </div>

      <div>
        <h4>Hover Behavior</h4>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Actions can appear only on hover
        </p>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <ItemButton
            showActionsOnHover
            type="outline"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Hover to See Actions
          </ItemButton>
          <ItemButton
            showActionsOnHover
            type="outline"
            icon={<IconFile />}
            wrapperStyles={{ width: 'max 250px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconCopy />} tooltip="Copy" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Long Item Name with Hover Actions
          </ItemButton>
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');

    // Find the last button (with showActionsOnHover)
    if (buttons.length > 0) {
      await userEvent.hover(buttons[buttons.length - 1]);
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates ItemAction usage inside ItemButton. Actions automatically inherit the type and theme from the parent ItemButton context, but can override them when needed. Actions can be icon-only (with tooltips) or include labels.',
      },
    },
  },
};

export const InsideItem: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
      <div>
        <h4>Basic Usage</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <Item
            type="item"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Document.pdf
          </Item>
          <Item
            type="item"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconCopy />} tooltip="Copy" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Report.xlsx
          </Item>
        </div>
      </div>

      <div>
        <h4>Different Item Types</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <Item
            type="primary"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Primary Item
          </Item>
          <Item
            type="outline"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Outline Item
          </Item>
          <Item
            type="neutral"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Neutral Item
          </Item>
        </div>
      </div>

      <div>
        <h4>With Description</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <Item
            type="item"
            icon={<IconFile />}
            description="Last modified 2 days ago"
            descriptionPlacement="inline"
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Document.pdf
          </Item>
          <Item
            type="item"
            icon={<IconFile />}
            description="Last modified 2 days ago"
            descriptionPlacement="block"
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Report.xlsx
          </Item>
        </div>
      </div>

      <div>
        <h4>Theme Inheritance</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <Item
            type="item"
            theme="danger"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Danger Theme Item
          </Item>
          <Item
            type="item"
            theme="success"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Success Theme Item
          </Item>
        </div>
      </div>

      <div>
        <h4>Mixed Action Types</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <Item
            type="item"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconStar />} tooltip="Favorite" />
                <ItemAction icon={<IconHeart />} tooltip="Like" />
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction
                  icon={<IconTrash />}
                  tooltip="Delete"
                  theme="danger"
                />
              </>
            }
          >
            Item with Multiple Actions
          </Item>
        </div>
      </div>

      <div>
        <h4>With Loading States</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <Item
            type="item"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction isLoading icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Item with Loading Action
          </Item>
        </div>
      </div>

      <div>
        <h4>Disabled State Inheritance</h4>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          Actions inherit disabled state from parent Item. Use isDisabled=false
          to keep action enabled.
        </p>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <Item
            isDisabled
            type="item"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit (disabled)" />
                <ItemAction icon={<IconTrash />} tooltip="Delete (disabled)" />
              </>
            }
          >
            Disabled Item (all actions disabled)
          </Item>
          <Item
            isDisabled
            type="item"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit (disabled)" />
                <ItemAction
                  icon={<IconTrash />}
                  tooltip="Delete (enabled)"
                  isDisabled={false}
                />
              </>
            }
          >
            Disabled Item (delete action enabled)
          </Item>
        </div>
      </div>

      <div>
        <h4>Truncated Content</h4>
        <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
          <Item
            type="item"
            icon={<IconFile />}
            styles={{ width: 'max 300px' }}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconCopy />} tooltip="Copy" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Very Long Item Name That Should Truncate With Actions
          </Item>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates ItemAction usage inside Item component. Actions automatically inherit the type, theme, and disabled state from the parent Item context. Use isDisabled={false} on individual actions to keep them enabled when the parent is disabled. Works with all Item configurations including descriptions, different sizes, and themes.',
      },
    },
  },
};

export const InteractiveExample: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
      <h4>Interactive File List</h4>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
        Click on the action buttons to see the interactions
      </p>
      <div style={{ display: 'grid', gap: 8, placeItems: 'start' }}>
        <ItemButton
          type="outline"
          icon={<IconFile />}
          actions={
            <>
              <ItemAction
                icon={<IconEdit />}
                tooltip="Edit"
                onPress={() => alert('Edit clicked')}
              />
              <ItemAction
                icon={<IconCopy />}
                tooltip="Copy"
                onPress={() => alert('Copy clicked')}
              />
              <ItemAction
                icon={<IconExternalLink />}
                tooltip="Open"
                onPress={() => alert('Open clicked')}
              />
              <ItemAction
                icon={<IconTrash />}
                tooltip="Delete"
                theme="danger"
                onPress={() => alert('Delete clicked')}
              />
            </>
          }
        >
          Document.pdf
        </ItemButton>
        <ItemButton
          type="outline"
          icon={<IconFile />}
          description="Last modified 2 days ago"
          descriptionPlacement="inline"
          actions={
            <>
              <ItemAction
                icon={<IconStar />}
                tooltip="Favorite"
                onPress={() => alert('Favorite clicked')}
              />
              <ItemAction
                icon={<IconEdit />}
                tooltip="Edit"
                onPress={() => alert('Edit clicked')}
              />
              <ItemAction
                icon={<IconTrash />}
                tooltip="Delete"
                theme="danger"
                onPress={() => alert('Delete clicked')}
              />
            </>
          }
        >
          Report.xlsx
        </ItemButton>
        <ItemButton
          showActionsOnHover
          type="outline"
          icon={<IconFile />}
          actions={
            <>
              <ItemAction
                icon={<IconEdit />}
                tooltip="Edit"
                onPress={() => alert('Edit clicked')}
              />
              <ItemAction
                icon={<IconTrash />}
                tooltip="Delete"
                theme="danger"
                onPress={() => alert('Delete clicked')}
              />
            </>
          }
        >
          Presentation.pptx (hover to see actions)
        </ItemButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive example showing real-world usage of ItemAction in a file list. Click on any action button to see the interaction.',
      },
    },
  },
};
