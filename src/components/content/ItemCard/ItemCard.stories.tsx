import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconNote,
  IconX,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Checkbox } from '../../fields/Checkbox/Checkbox';
import { Switch } from '../../fields/Switch/Switch';
import { Space } from '../../layout/Space';
import { Text } from '../Text';

import { CubeItemCardProps, ItemCard } from './ItemCard';

import type { FocusableRefValue } from '@react-types/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Content/ItemCard',
  component: ItemCard,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    title: {
      control: { type: 'text' },
      description: 'Card heading',
    },
    children: {
      control: { type: 'text' },
      description: 'Card body content',
    },
    icon: {
      control: { type: null },
      description: 'Icon rendered before the content',
    },

    /* Presentation */
    theme: {
      options: ['default', 'success', 'danger', 'warning', 'note'],
      control: { type: 'radio' },
      description: 'Neutral surface by default, or a semantic status theme',
      table: { defaultValue: { summary: 'default' } },
    },
    level: {
      options: [1, 2, 3, 4, 5, 6],
      control: { type: 'select' },
      description: 'Heading level for the title (h1-h6)',
      table: { defaultValue: { summary: 3 } },
    },

    size: {
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
      control: { type: 'radio' },
      description: 'Size of the card',
      table: {
        defaultValue: { summary: 'medium' },
        type: { summary: "'xsmall' | 'small' | 'medium' | 'large' | 'xlarge'" },
      },
    },
    prefix: {
      control: { type: null },
      description: 'Content rendered before the label',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    suffix: {
      control: { type: null },
      description: 'Content rendered after the label',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    tooltip: {
      control: { type: 'radio' },
      description:
        'Tooltip configuration: string for text, `true` for auto overflow tooltips, or object for advanced config',
      table: {
        defaultValue: { summary: 'true' },
        type: { summary: 'string | boolean | object' },
      },
    },
    hotkeys: {
      control: { type: 'text' },
      description: 'Keyboard shortcut displayed and triggered',
      table: {
        type: { summary: 'string' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading state, replacing an icon slot with a spinner',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
} satisfies Meta<typeof ItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    children: 'This is the card body content with additional details.',
    icon: <IconInfoCircle />,
  },
};

export const Sizes = (args: CubeItemCardProps) => (
  <Space flow="column" width="max 400px">
    <ItemCard
      {...args}
      size="medium"
      title="Medium Card"
      icon={<IconInfoCircle />}
    >
      Default size suitable for most use cases.
    </ItemCard>
    <ItemCard {...args} size="large" title="Large Card" icon={<IconCheck />}>
      Larger size for prominent notifications.
    </ItemCard>
    <ItemCard
      {...args}
      size="xlarge"
      title="Extra Large Card"
      icon={<IconAlertTriangle />}
    >
      Extra large size for emphasized alerts.
    </ItemCard>
  </Space>
);

const THEMES = [
  { theme: 'default', title: 'Default', icon: <IconInfoCircle /> },
  { theme: 'success', title: 'Success', icon: <IconCheck /> },
  { theme: 'danger', title: 'Danger', icon: <IconAlertTriangle /> },
  { theme: 'warning', title: 'Warning', icon: <IconAlertTriangle /> },
  { theme: 'note', title: 'Note', icon: <IconNote /> },
] as const;

export const Themes: Story = {
  render: (args) => (
    <Space flow="column" width="max 400px">
      {THEMES.map(({ theme, title, icon }) => (
        <ItemCard {...args} key={theme} theme={theme} title={title} icon={icon}>
          A heading and body with the {theme} theme.
        </ItemCard>
      ))}
    </Space>
  ),
};

function CasesStory(args: CubeItemCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const focusTarget = useRef<FocusableRefValue<HTMLButtonElement>>(null);
  const didInteract = useRef(false);

  useEffect(() => {
    if (didInteract.current) focusTarget.current?.focus();
  }, [isDismissed]);

  function toggleNotice() {
    didInteract.current = true;
    setIsDismissed((value) => !value);
  }

  return (
    <Space flow="column" width="max 400px" gap="2x">
      {isDismissed ? (
        <Button ref={focusTarget} onPress={toggleNotice}>
          Restore setup notice
        </Button>
      ) : (
        <ItemCard
          {...args}
          title="Setup notice"
          icon={<IconInfoCircle />}
          actions={
            <ItemCard.Action
              ref={focusTarget}
              icon={<IconX />}
              aria-label="Dismiss setup notice"
              onPress={toggleNotice}
            />
          }
        >
          Connect a data source to start exploring your data.
        </ItemCard>
      )}
      <ItemCard {...args} title="Notification settings">
        <Space flow="column" gap="1.5x">
          <Text>
            Choose what to include in scheduled refresh notifications.
          </Text>
          <Checkbox defaultSelected>Send email notifications</Checkbox>
          <Switch label="Include query details" />
        </Space>
      </ItemCard>
      <ItemCard
        {...args}
        width="max 280px"
        title="A much longer heading that cannot fit in a narrow card"
      >
        The body wraps to keep additional details readable when space is
        limited, while the heading keeps its single-line layout and overflow
        tooltip.
      </ItemCard>
    </Space>
  );
}

export const Cases: Story = {
  render: CasesStory,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Dismiss setup notice' }),
    );
    await waitFor(() => {
      expect(
        canvas.queryByRole('heading', { name: 'Setup notice' }),
      ).toBeNull();
      expect(
        canvas.getByRole('button', { name: 'Restore setup notice' }),
      ).toHaveFocus();
    });

    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Dismiss setup notice' }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard(' ');
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Restore setup notice' }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      const close = canvas.getByRole('button', {
        name: 'Dismiss setup notice',
      });
      expect(close).toBeVisible();
      expect(close).toHaveFocus();
    });
  },
};
