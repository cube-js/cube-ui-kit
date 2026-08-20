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
import { Paragraph } from '../../content/Paragraph';
import { Title } from '../../content/Title';
import { Flow } from '../../layout/Flow';
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
      description: 'Icon element or "checkmark" for selection indicator',
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
      options: ['primary', 'outline', 'clear'],
      description:
        'Visual type/variant of the action button (inherits from context when inside ItemButton/Item)',
      table: {
        defaultValue: { summary: 'clear' },
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
      description: 'Shows as selected (works with checkmark icon)',
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
    <Flow gap="2x">
      <Flow gap="1x">
        <Title level={4}>Primary</Title>
        <Space>
          <ItemAction
            theme="default"
            type="primary"
            icon={<IconEdit />}
            tooltip="Edit"
          />
          <ItemAction
            theme="default"
            type="primary"
            icon={<IconCopy />}
            tooltip="Copy"
          />
          <ItemAction
            theme="default"
            type="primary"
            icon={<IconTrash />}
            tooltip="Delete"
          />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Outline (unselected)</Title>
        <Space>
          <ItemAction
            theme="default"
            type="outline"
            icon={<IconEdit />}
            tooltip="Edit"
          />
          <ItemAction
            theme="default"
            type="outline"
            icon={<IconCopy />}
            tooltip="Copy"
          />
          <ItemAction
            theme="default"
            type="outline"
            icon={<IconTrash />}
            tooltip="Delete"
          />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Outline (selected)</Title>
        <Space>
          <ItemAction
            isSelected
            theme="default"
            type="outline"
            icon={<IconEdit />}
            tooltip="Edit"
          />
          <ItemAction
            isSelected
            theme="default"
            type="outline"
            icon={<IconCopy />}
            tooltip="Copy"
          />
          <ItemAction
            isSelected
            theme="default"
            type="outline"
            icon={<IconTrash />}
            tooltip="Delete"
          />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Clear (unselected)</Title>
        <Space>
          <ItemAction theme="default" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="default" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="default" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Clear (selected)</Title>
        <Space>
          <ItemAction
            isSelected
            theme="default"
            icon={<IconEdit />}
            tooltip="Edit"
          />
          <ItemAction
            isSelected
            theme="default"
            icon={<IconCopy />}
            tooltip="Copy"
          />
          <ItemAction
            isSelected
            theme="default"
            icon={<IconTrash />}
            tooltip="Delete"
          />
        </Space>
      </Flow>
    </Flow>
  ),
};

export const Themes: Story = {
  render: (args) => (
    <Flow gap="2x">
      <Flow gap="1x">
        <Title level={4}>Default Theme</Title>
        <Space>
          <ItemAction theme="default" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="default" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="default" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Danger Theme</Title>
        <Space>
          <ItemAction theme="danger" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="danger" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="danger" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Success Theme</Title>
        <Space>
          <ItemAction theme="success" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="success" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="success" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Warning Theme</Title>
        <Space>
          <ItemAction theme="warning" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="warning" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="warning" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Note Theme</Title>
        <Space>
          <ItemAction theme="note" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="note" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="note" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Special Theme</Title>
        <Space fill="#dark" padding="2x" radius="1x">
          <ItemAction theme="special" icon={<IconEdit />} tooltip="Edit" />
          <ItemAction theme="special" icon={<IconCopy />} tooltip="Copy" />
          <ItemAction theme="special" icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Current Theme (default)</Title>
        <Space
          fill="#note-surface"
          color="#note-accent-text"
          padding="2x"
          radius="1x"
        >
          <ItemAction icon={<IconEdit />} tooltip="Edit" />
          <ItemAction icon={<IconCopy />} tooltip="Copy" />
          <ItemAction icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
    </Flow>
  ),
};

Themes.parameters = {
  docs: {
    description: {
      story:
        "`current` is the default theme, and the only one that names no color of its own: it mixes fill and label from the container's inherited text color, so an action tracks whatever row hosts it. Name any other theme to have the action paint itself instead.",
    },
  },
};

export const States: Story = {
  render: (args) => (
    <Flow gap="2x">
      <Flow gap="1x">
        <Title level={4}>Normal</Title>
        <Space>
          <ItemAction icon={<IconEdit />} tooltip="Edit" />
          <ItemAction icon={<IconCopy />} tooltip="Copy" />
          <ItemAction icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Disabled</Title>
        <Space>
          <ItemAction isDisabled icon={<IconEdit />} tooltip="Edit" />
          <ItemAction isDisabled icon={<IconCopy />} tooltip="Copy" />
          <ItemAction isDisabled icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Loading</Title>
        <Space>
          <ItemAction isLoading icon={<IconEdit />} tooltip="Edit" />
          <ItemAction isLoading icon={<IconCopy />} tooltip="Copy" />
          <ItemAction isLoading icon={<IconTrash />} tooltip="Delete" />
        </Space>
      </Flow>
      <Flow gap="1x">
        <Title level={4}>Selected</Title>
        <Space>
          <ItemAction isSelected icon="checkmark" tooltip="Select" />
          {/* oxlint-disable-next-line cube-ui-kit/no-redundant-default-prop -- contrasts with the isSelected sibling; dropping it makes the pair identical */}
          <ItemAction icon="checkmark" tooltip="Select" isSelected={false} />
          <ItemAction isSelected icon={<IconStar />} tooltip="Favorite" />
        </Space>
      </Flow>
    </Flow>
  ),
};

export const InsideItemButton: Story = {
  render: (args) => (
    <Flow gap="2x" width="max 600px">
      <Flow gap="1x">
        <Title level={4}>Icon Only Actions</Title>
        <Space flow="column" placeItems="start">
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>With Labels</Title>
        <Space flow="column" placeItems="start">
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>Context Inheritance</Title>
        <Paragraph preset="t4" color="#dark-03" margin="0 0 2x 0">
          Actions automatically inherit type and theme from parent ItemButton
        </Paragraph>
        <Space flow="column" placeItems="start">
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>Override Context</Title>
        <Paragraph preset="t4" color="#dark-03" margin="0 0 2x 0">
          Actions can override inherited type/theme
        </Paragraph>
        <Space flow="column" placeItems="start">
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
                  theme="danger"
                />
              </>
            }
          >
            Item with Mixed Actions
          </ItemButton>
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>With Different Sizes</Title>
        <Space flow="column" placeItems="start">
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>Hover Behavior</Title>
        <Paragraph preset="t4" color="#dark-03" margin="0 0 2x 0">
          Actions can appear only on hover
        </Paragraph>
        <Space flow="column" placeItems="start">
          <ItemButton
            autoHideActions
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
            autoHideActions
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
        </Space>
      </Flow>
    </Flow>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');

    // Find the last button (with autoHideActions)
    if (buttons.length > 0) {
      await userEvent.hover(buttons[buttons.length - 4]);
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
    <Flow gap="2x" width="max 600px">
      <Flow gap="1x">
        <Title level={4}>Basic Usage</Title>
        <Space flow="column" placeItems="start">
          <Item
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>Different Item Types</Title>
        <Space flow="column" placeItems="start">
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
            type="clear"
            icon={<IconFile />}
            actions={
              <>
                <ItemAction icon={<IconEdit />} tooltip="Edit" />
                <ItemAction icon={<IconTrash />} tooltip="Delete" />
              </>
            }
          >
            Clear Item
          </Item>
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>With Description</Title>
        <Space flow="column" placeItems="start">
          <Item
            icon={<IconFile />}
            description="Last modified 2 days ago"
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>Theme Inheritance</Title>
        <Space flow="column" placeItems="start">
          <Item
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>Mixed Action Types</Title>
        <Space flow="column" placeItems="start">
          <Item
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>With Loading States</Title>
        <Space flow="column" placeItems="start">
          <Item
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>Disabled State Inheritance</Title>
        <Paragraph preset="t4" color="#dark-03" margin="0 0 1x 0">
          Actions inherit disabled state from parent Item. Use isDisabled=false
          to keep action enabled.
        </Paragraph>
        <Space flow="column" placeItems="start">
          <Item
            isDisabled
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
        </Space>
      </Flow>

      <Flow gap="1x">
        <Title level={4}>Truncated Content</Title>
        <Space flow="column" placeItems="start">
          <Item
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
        </Space>
      </Flow>
    </Flow>
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
    <Flow gap="2x" width="max 600px">
      <Title level={4}>Interactive File List</Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 2x 0">
        Click on the action buttons to see the interactions
      </Paragraph>
      <Space flow="column" placeItems="start">
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
          autoHideActions
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
      </Space>
    </Flow>
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
