import {
  expect,
  findByRole,
  userEvent,
  waitFor,
  within,
} from '@storybook/test';
import {
  IconArrowBack,
  IconArrowForward,
  IconClipboard,
  IconCopy,
  IconCut,
  IconSelect,
} from '@tabler/icons-react';
import React, { useState } from 'react';

import { tasty } from '../../../tasty';
import { Card } from '../../content/Card/Card';
import { HotKeys } from '../../content/HotKeys';
import { Paragraph } from '../../content/Paragraph';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';
import {
  Dialog,
  DialogTrigger,
  useDialogContainer,
} from '../../overlays/Dialog';
import { Button } from '../Button';
import { Menu } from '../Menu/Menu';
import { useAnchoredMenu } from '../use-anchored-menu';
import { useContextMenu } from '../use-context-menu';

import { CommandMenu, CubeCommandMenuProps } from './CommandMenu';

import type { StoryFn } from '@storybook/react';

// Styled components for header and footer
const HeaderTitle = tasty(Text, {
  styles: {
    preset: 't2m',
    color: '#dark',
  },
});

const HeaderSubtitle = tasty(Text, {
  styles: {
    preset: 't4',
    color: '#dark-03',
  },
});

const FooterText = tasty(Text, {
  styles: {
    preset: 't4',
    color: '#dark-03',
  },
});

export default {
  title: 'Actions/CommandMenu',
  component: CommandMenu,
  parameters: {
    docs: {
      description: {
        component:
          'A searchable menu interface that provides a command-line-like experience for users to quickly find and execute actions.',
      },
    },
  },
  argTypes: {
    /* Search */
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the search input',
      table: {
        defaultValue: { summary: 'Search commands...' },
      },
    },
    searchValue: {
      control: 'text',
      description: 'The search value in controlled mode',
    },
    onSearchChange: {
      action: 'searchChanged',
      description: 'Callback fired when search value changes',
    },
    filter: {
      description: 'Custom filter function for search',
    },
    emptyLabel: {
      control: 'text',
      description: 'Label to show when no results are found',
      table: {
        defaultValue: { summary: 'No commands found' },
      },
    },
    searchInputStyles: {
      description: 'Custom styles for the search input',
    },

    /* Advanced Features */
    isLoading: {
      control: 'boolean',
      description: 'Whether the command palette is loading',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    shouldFilter: {
      control: 'boolean',
      description: 'Whether to filter items based on search',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    autoFocus: {
      control: 'boolean',
      description: 'Whether to auto-focus the search input',
      table: {
        defaultValue: { summary: 'true' },
      },
    },

    /* Menu Props */
    onAction: {
      action: 'action',
      description: 'Callback fired when an item is selected',
    },
    onSelectionChange: {
      action: 'selectionChange',
      description: 'Callback fired when selection changes',
    },
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple'],
      description: 'Selection mode for the command palette',
      table: {
        defaultValue: { summary: 'none' },
      },
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the command palette is disabled',
    },

    /* Styling */
    size: {
      options: ['medium', 'large'],
      control: { type: 'radio' },
      description: 'Size of the command menu component',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
      },
    },
    styles: {
      description: 'Custom styles for the command palette container',
    },
  },
};

const basicCommands = [
  {
    key: 'copy',
    label: 'Copy',
    description: 'Copy selected text',
    hotkeys: 'Ctrl+C',
    icon: <IconCopy />,
  },
  {
    key: 'paste',
    label: 'Paste',
    description: 'Paste from clipboard',
    hotkeys: 'Ctrl+V',
    icon: <IconClipboard />,
  },
  {
    key: 'cut',
    label: 'Cut',
    description: 'Cut selected text',
    hotkeys: 'Ctrl+X',
    icon: <IconCut />,
  },
  {
    key: 'undo',
    label: 'Undo',
    description: 'Undo last action',
    hotkeys: 'Ctrl+Z',
    icon: <IconArrowBack />,
  },
  {
    key: 'redo',
    label: 'Redo',
    description: 'Redo last action',
    hotkeys: 'Ctrl+Y',
    icon: <IconArrowForward />,
  },
  {
    key: 'select-all',
    label: 'Select All',
    description: 'Select all text',
    hotkeys: 'Ctrl+A',
    icon: <IconSelect />,
  },
];

const extendedCommands = [
  // File operations
  {
    key: 'new-file',
    label: 'New File',
    description: 'Create a new file',
    section: 'File',
    hotkeys: 'Ctrl+N',
  },
  {
    key: 'open-file',
    label: 'Open File',
    description: 'Open an existing file',
    section: 'File',
    hotkeys: 'Ctrl+O',
  },
  {
    key: 'save-file',
    label: 'Save File',
    description: 'Save current file',
    section: 'File',
    hotkeys: 'Ctrl+S',
  },
  {
    key: 'save-as',
    label: 'Save As...',
    description: 'Save file with new name',
    section: 'File',
  },

  // Edit operations
  {
    key: 'copy',
    label: 'Copy',
    description: 'Copy selected text',
    section: 'Edit',
    hotkeys: 'Ctrl+C',
    keywords: ['duplicate', 'clone'],
  },
  {
    key: 'paste',
    label: 'Paste',
    description: 'Paste from clipboard',
    section: 'Edit',
    hotkeys: 'Ctrl+V',
    keywords: ['insert'],
  },
  {
    key: 'cut',
    label: 'Cut',
    description: 'Cut selected text',
    section: 'Edit',
    hotkeys: 'Ctrl+X',
  },
  {
    key: 'find',
    label: 'Find',
    description: 'Search in document',
    section: 'Edit',
    hotkeys: 'Ctrl+F',
    keywords: ['search', 'locate'],
  },
  {
    key: 'replace',
    label: 'Find and Replace',
    description: 'Find and replace text',
    section: 'Edit',
    hotkeys: 'Ctrl+H',
  },

  // View operations
  {
    key: 'zoom-in',
    label: 'Zoom In',
    description: 'Increase zoom level',
    section: 'View',
    keywords: ['magnify', 'enlarge'],
  },
  {
    key: 'zoom-out',
    label: 'Zoom Out',
    description: 'Decrease zoom level',
    section: 'View',
    keywords: ['shrink', 'reduce'],
  },
  {
    key: 'full-screen',
    label: 'Toggle Full Screen',
    description: 'Enter or exit full screen',
    section: 'View',
    hotkeys: 'F11',
  },
  {
    key: 'sidebar',
    label: 'Toggle Sidebar',
    description: 'Show or hide sidebar',
    section: 'View',
  },

  // Help
  {
    key: 'help',
    label: 'Help',
    description: 'Open help documentation',
    section: 'Help',
    forceMount: true,
  },
  {
    key: 'about',
    label: 'About',
    description: 'About this application',
    section: 'Help',
    forceMount: true,
  },
];

export const Default: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu {...args}>
    {basicCommands.map((command) => (
      <CommandMenu.Item
        key={command.key}
        description={command.description}
        hotkeys={command.hotkeys}
        icon={command.icon}
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

Default.args = {
  searchPlaceholder: 'Search commands...',
  autoFocus: true,
  width: '20x 50x',
};

export const WithSections: StoryFn<CubeCommandMenuProps<any>> = (args) => {
  const commandsBySection = extendedCommands.reduce(
    (acc, command) => {
      const section = command.section || 'Other';
      if (!acc[section]) acc[section] = [];
      acc[section].push(command);
      return acc;
    },
    {} as Record<string, typeof extendedCommands>,
  );

  return (
    <CommandMenu {...args}>
      {Object.entries(commandsBySection).map(([sectionName, commands]) => (
        <Menu.Section key={sectionName} title={sectionName}>
          {commands.map((command) => (
            <CommandMenu.Item
              key={command.key}
              description={command.description}
              hotkeys={command.hotkeys}
              keywords={command.keywords}
              forceMount={command.forceMount}
            >
              {command.label}
            </CommandMenu.Item>
          ))}
        </Menu.Section>
      ))}
    </CommandMenu>
  );
};

WithSections.args = {
  searchPlaceholder: 'Search all commands...',
  autoFocus: true,
  width: '20x 50x',
};

export const WithMenuTrigger: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu.Trigger>
    <Button>Open Command Palette</Button>
    <CommandMenu {...args}>
      {basicCommands.map((command) => (
        <CommandMenu.Item
          key={command.key}
          description={command.description}
          hotkeys={command.hotkeys}
          icon={command.icon}
        >
          {command.label}
        </CommandMenu.Item>
      ))}
    </CommandMenu>
  </CommandMenu.Trigger>
);

WithMenuTrigger.args = {
  searchPlaceholder: 'Search commands...',
  autoFocus: true,
};

WithMenuTrigger.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByRole, findByPlaceholderText, queryByPlaceholderText } =
    within(canvasElement);

  // Click the trigger button to open the command palette
  await userEvent.click(await findByRole('button'));

  // Wait for the command palette to appear and verify the search input is present
  const searchInput = await findByPlaceholderText('Search commands...');

  // Verify the search input is focused by checking if it's the active element
  await waitFor(() => {
    if (document.activeElement !== searchInput) {
      throw new Error('Search input should be focused');
    }
  });

  // // Test keyboard navigation and action triggering
  // await userEvent.keyboard('{ArrowDown}'); // Navigate to first item
  // await userEvent.keyboard('{Enter}'); // Trigger action

  // // Verify the command palette closes after action
  // await waitFor(() => {
  //   if (queryByPlaceholderText('Search commands...')) {
  //     throw new Error('Command palette should close after action');
  //   }
  // });
};

export const ControlledSearch: StoryFn<CubeCommandMenuProps<any>> = (args) => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <strong>Current search:</strong> "{searchValue}"
      </div>
      <CommandMenu
        width="20x 50x"
        {...args}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      >
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
            icon={command.icon}
          >
            {command.label}
          </CommandMenu.Item>
        ))}
      </CommandMenu>
    </div>
  );
};

ControlledSearch.args = {
  searchPlaceholder: 'Type to search...',
  autoFocus: true,
};

export const LoadingState: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu {...args}>
    {basicCommands.map((command) => (
      <CommandMenu.Item
        key={command.key}
        description={command.description}
        hotkeys={command.hotkeys}
        icon={command.icon}
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

LoadingState.args = {
  searchPlaceholder: 'Loading commands...',
  isLoading: true,
  autoFocus: true,
  width: '20x 50x',
};

export const CustomFilter: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu
    {...args}
    filter={(textValue, inputValue) => {
      // Custom fuzzy search - matches if all characters of input appear in order
      const text = textValue.toLowerCase();
      const input = inputValue.toLowerCase();
      let textIndex = 0;

      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const foundIndex = text.indexOf(char, textIndex);
        if (foundIndex === -1) return false;
        textIndex = foundIndex + 1;
      }

      return true;
    }}
  >
    {basicCommands.map((command) => (
      <CommandMenu.Item
        key={command.key}
        description={command.description}
        hotkeys={command.hotkeys}
        icon={command.icon}
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

CustomFilter.args = {
  searchPlaceholder: 'Try fuzzy search (e.g., "cp" for Copy)...',
  autoFocus: true,
  width: '20x 50x',
};

export const WithKeywords: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu {...args}>
    <CommandMenu.Item key="copy" keywords={['duplicate', 'clone', 'replicate']}>
      Copy
    </CommandMenu.Item>
    <CommandMenu.Item key="paste" keywords={['insert', 'place', 'put']}>
      Paste
    </CommandMenu.Item>
    <CommandMenu.Item key="save" keywords={['store', 'persist', 'write']}>
      Save File
    </CommandMenu.Item>
    <CommandMenu.Item key="open" keywords={['load', 'read', 'import']}>
      Open File
    </CommandMenu.Item>
  </CommandMenu>
);

WithKeywords.args = {
  searchPlaceholder: 'Try searching "duplicate" or "insert"...',
  autoFocus: true,
  width: '20x 50x',
};

export const ForceMountItems: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu {...args}>
    <CommandMenu.Item key="help" forceMount>
      Help (always visible)
    </CommandMenu.Item>
    <CommandMenu.Item key="settings" forceMount>
      Settings (always visible)
    </CommandMenu.Item>
    {basicCommands.map((command) => (
      <CommandMenu.Item
        key={command.key}
        description={command.description}
        hotkeys={command.hotkeys}
        icon={command.icon}
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

ForceMountItems.args = {
  searchPlaceholder: 'Help and Settings always visible...',
  autoFocus: true,
  width: '20x 50x',
};

export const EmptyState: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu {...args}>
    <CommandMenu.Item key="copy">Copy</CommandMenu.Item>
    <CommandMenu.Item key="paste">Paste</CommandMenu.Item>
  </CommandMenu>
);

EmptyState.args = {
  searchPlaceholder: 'Try searching for "xyz" to see empty state...',
  emptyLabel: 'No matching commands found. Try a different search term.',
  autoFocus: true,
  width: '20x 50x',
};

export const MultipleSelection: StoryFn<CubeCommandMenuProps<any>> = (args) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['copy', 'cut']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <strong>Selected:</strong> {selectedKeys.join(', ') || 'None'}
      </div>
      <CommandMenu
        width="20x 50x"
        {...args}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
      >
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
            icon={command.icon}
          >
            {command.label}
          </CommandMenu.Item>
        ))}
      </CommandMenu>
    </div>
  );
};

MultipleSelection.args = {
  searchPlaceholder: 'Select multiple commands...',
  autoFocus: true,
};

export const SingleSelection: StoryFn<CubeCommandMenuProps<any>> = (args) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <strong>Selected:</strong> {selectedKey || 'None'}
      </div>
      <CommandMenu
        width="20x 50x"
        {...args}
        selectionMode="single"
        selectedKeys={selectedKey ? [selectedKey] : []}
        onSelectionChange={(keys) => {
          setSelectedKey(keys[0] || null);
        }}
      >
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
            icon={command.icon}
          >
            {command.label}
          </CommandMenu.Item>
        ))}
      </CommandMenu>
    </div>
  );
};

SingleSelection.args = {
  searchPlaceholder: 'Select a single command...',
  autoFocus: true,
};

export const CustomStyling: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu
    width="20x 50x"
    {...args}
    styles={{
      border: '#purple',
      radius: '2x',
      boxShadow: '0px 10px 30px #purple.20',
    }}
    searchInputStyles={{
      color: '#purple',
      preset: 't2',
    }}
  >
    {basicCommands.map((command) => (
      <CommandMenu.Item
        key={command.key}
        description={command.description}
        hotkeys={command.hotkeys}
        icon={command.icon}
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

CustomStyling.args = {
  searchPlaceholder: 'Custom styled command palette...',
  autoFocus: true,
};

export const HotkeyTesting: StoryFn<CubeCommandMenuProps<any>> = (args) => {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleAction = (key: string) => {
    setLastAction(`Action triggered: ${key}`);
    console.log('Hotkey action triggered:', key);
    // Clear the message after 3 seconds
    setTimeout(() => setLastAction(null), 3000);
  };

  return (
    <div>
      <div
        style={{
          marginBottom: '16px',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <strong>Hotkey Test Instructions:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Try pressing Ctrl+C (Copy)</li>
          <li>Try pressing Ctrl+V (Paste)</li>
          <li>Try pressing Ctrl+X (Cut)</li>
          <li>Try pressing Ctrl+Z (Undo)</li>
        </ul>
        {lastAction && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              border: '1px solid #c3e6cb',
            }}
          >
            {lastAction}
          </div>
        )}
      </div>

      <CommandMenu {...args} onAction={handleAction}>
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
            icon={command.icon}
          >
            {command.label}
          </CommandMenu.Item>
        ))}
      </CommandMenu>
    </div>
  );
};

HotkeyTesting.args = {
  searchPlaceholder: 'Test hotkeys while focused here...',
  autoFocus: true,
};

export const DifferentSizes: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Medium Menu</Title>
    <CommandMenu {...args} size="medium">
      {basicCommands.slice(0, 3).map((command) => (
        <CommandMenu.Item
          key={command.key}
          hotkeys={command.hotkeys}
          icon={command.icon}
        >
          {command.label}
        </CommandMenu.Item>
      ))}
    </CommandMenu>

    <Title level={5}>Large Menu</Title>
    <CommandMenu {...args} size="large">
      {basicCommands.slice(0, 3).map((command) => (
        <CommandMenu.Item
          key={command.key}
          hotkeys={command.hotkeys}
          icon={command.icon}
        >
          {command.label}
        </CommandMenu.Item>
      ))}
    </CommandMenu>
  </Space>
);

DifferentSizes.args = {
  searchPlaceholder: 'Search commands...',
  autoFocus: false,
  width: '20x 50x',
};

DifferentSizes.parameters = {
  docs: {
    description: {
      story:
        'CommandMenu supports two sizes: `medium` (default) and `large` to accommodate different interface requirements.',
    },
  },
};

export const WithDialog: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <DialogTrigger>
    <Button>Open Command Menu</Button>
    <Dialog size="medium" isDismissable={false}>
      <CommandMenu {...args}>
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
            icon={command.icon}
          >
            {command.label}
          </CommandMenu.Item>
        ))}
      </CommandMenu>
    </Dialog>
  </DialogTrigger>
);

WithDialog.args = {
  searchPlaceholder: 'Search commands...',
  autoFocus: true,
  height: 'min(40x, 90vh)',
  size: 'medium',
};

WithDialog.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByText('Open Command Menu');
  await userEvent.click(button);

  // Wait for dialog to open
  await waitFor(() => {
    canvas.getByPlaceholderText('Search commands...');
  });
};

export const WithHeaderAndFooter: StoryFn<CubeCommandMenuProps<any>> = (
  args,
) => (
  <CommandMenu
    {...args}
    header={
      <>
        <HeaderTitle>Available Commands</HeaderTitle>
        <HeaderSubtitle>6 items</HeaderSubtitle>
      </>
    }
    footer={
      <>
        <FooterText>
          Press <HotKeys>Enter</HotKeys> to select
        </FooterText>
        <FooterText>
          <HotKeys>Esc</HotKeys> to clear
        </FooterText>
      </>
    }
  >
    {basicCommands.map((command) => (
      <CommandMenu.Item
        key={command.key}
        description={command.description}
        hotkeys={command.hotkeys}
        icon={command.icon}
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

WithHeaderAndFooter.args = {
  searchPlaceholder: 'Search commands...',
  autoFocus: true,
  size: 'large',
  width: '20x 50x',
};

function CommandMenuDialogContent({
  onClose,
  ...args
}: CubeCommandMenuProps<any> & { onClose: () => void }) {
  const commandMenuProps = {
    width: '100%',
    height: 'min(40x, 90vh)',
    size: 'medium',
    ...args,
    onAction: (key: React.Key) => {
      console.log('Action selected:', key);
      onClose();
    },
    header: (
      <>
        <HeaderTitle>Command Palette</HeaderTitle>
        <HeaderSubtitle>Quick Actions</HeaderSubtitle>
      </>
    ),
    footer: (
      <>
        <FooterText>
          <HotKeys>↑,↓</HotKeys> to navigate
        </FooterText>
        <FooterText>
          <HotKeys>Enter</HotKeys> to select • <HotKeys>Esc</HotKeys> to close
        </FooterText>
      </>
    ),
  };

  return (
    <Dialog size="medium" isDismissable={false}>
      <CommandMenu {...commandMenuProps}>
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
            icon={command.icon}
          >
            {command.label}
          </CommandMenu.Item>
        ))}
      </CommandMenu>
    </Dialog>
  );
}

export const WithDialogContainer: StoryFn<CubeCommandMenuProps<any>> = (
  args,
) => {
  const dialog = useDialogContainer(CommandMenuDialogContent, {
    isDismissable: true,
  });

  const handleOpenDialog = () => {
    dialog.open({
      ...args,
      onClose: dialog.close,
    });
  };

  return (
    <div>
      <Button onPress={handleOpenDialog}>Open Command Menu (Hook)</Button>
      {dialog.rendered}
    </div>
  );
};

WithDialogContainer.args = {
  searchPlaceholder: 'Search commands...',
  autoFocus: true,
  size: 'large',
};

WithDialogContainer.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByText('Open Command Menu (Hook)');
  await userEvent.click(button);

  // Wait for dialog to open
  await waitFor(() => {
    canvas.getByPlaceholderText('Search commands...');
  });
};

export const WithAnchoredMenu: StoryFn<CubeCommandMenuProps<any>> = (args) => {
  const MyCommandMenuComponent = ({ onAction, ...props }) => (
    <CommandMenu onAction={onAction} {...props}>
      {basicCommands.map((command) => (
        <CommandMenu.Item
          key={command.key}
          description={command.description}
          hotkeys={command.hotkeys}
          icon={command.icon}
        >
          {command.label}
        </CommandMenu.Item>
      ))}
    </CommandMenu>
  );

  const { anchorRef, open, close, rendered } = useAnchoredMenu(
    MyCommandMenuComponent,
    { placement: 'right top' },
  );

  const handleAction = (key) => {
    console.log('Command selected:', key);
    close();
  };

  return (
    <Flow
      gap="4x"
      placeContent="start start"
      placeItems="start"
      height="400px"
      padding="3x"
    >
      <Title level={3} margin="0 0 2x 0">
        useAnchoredMenu Hook Example
      </Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 4x 0">
        Click the button to open a menu anchored to the container
      </Paragraph>

      <Card
        ref={anchorRef}
        border="dashed #purple"
        position="relative"
        onContextMenu={(e) => {
          open({ onAction: handleAction });
          e.preventDefault();
        }}
      >
        <Button
          size="small"
          aria-label="Open Command Menu"
          onPress={() => open({ onAction: handleAction, ...args })}
        >
          Open Command Menu
        </Button>

        <Paragraph preset="t4" color="#dark-03" margin="2x 0 0 0">
          Menu will be anchored to this container
        </Paragraph>
        <Paragraph preset="t4" color="#dark-03" margin="2x 0 0 0">
          Right click on the container to open the menu
        </Paragraph>
      </Card>

      {rendered}
    </Flow>
  );
};

WithAnchoredMenu.args = {
  searchPlaceholder: 'Search commands...',
  autoFocus: true,
  width: '320px',
};

WithAnchoredMenu.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByRole, findByPlaceholderText, findByText } =
    within(canvasElement);

  // Click the button to open the anchored command menu
  await userEvent.click(await findByRole('button'));

  // Wait for the command menu to appear and verify the search input is present
  const searchInput = await findByPlaceholderText('Search commands...');

  // Verify the search input is focused
  await waitFor(() => {
    if (document.activeElement !== searchInput) {
      throw new Error('Search input should be focused');
    }
  });

  // Verify command menu items are present
  await expect(findByText('Copy')).resolves.toBeInTheDocument();
  await expect(findByText('Paste')).resolves.toBeInTheDocument();
  await expect(findByText('Cut')).resolves.toBeInTheDocument();

  // Test search functionality
  await userEvent.type(searchInput, 'copy');

  // Verify filtering works
  await waitFor(() => expect(findByText('Copy')).resolves.toBeInTheDocument());
};

export const WithContextMenu = () => {
  const MyCommandMenuComponent = ({
    onAction,
    searchPlaceholder,
    ...props
  }: CubeCommandMenuProps<any>) => (
    <CommandMenu
      searchPlaceholder={searchPlaceholder}
      onAction={onAction}
      {...props}
    >
      <Menu.Item key="copy" icon={<span style={{ fontSize: '16px' }}>📋</span>}>
        Copy
      </Menu.Item>
      <Menu.Item
        key="paste"
        icon={<span style={{ fontSize: '16px' }}>📄</span>}
      >
        Paste
      </Menu.Item>
      <Menu.Item key="cut" icon={<span style={{ fontSize: '16px' }}>✂️</span>}>
        Cut
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<span style={{ fontSize: '16px' }}>🗑️</span>}
      >
        Delete
      </Menu.Item>
      <Menu.Item
        key="rename"
        icon={<span style={{ fontSize: '16px' }}>✏️</span>}
      >
        Rename
      </Menu.Item>
    </CommandMenu>
  );

  const { targetRef, rendered } = useContextMenu(
    MyCommandMenuComponent,
    {},
    { searchPlaceholder: 'commands', width: '320px' },
  );

  return (
    <Flow
      gap="4x"
      placeContent="start start"
      placeItems="start"
      height="400px"
      padding="3x"
    >
      <Title level={3} margin="0 0 2x 0">
        useContextMenu with CommandMenu
      </Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 4x 0">
        Right-click to open a searchable command menu at cursor position
      </Paragraph>

      <Card
        ref={targetRef}
        border="dashed #green"
        position="relative"
        padding="4x"
      >
        {rendered}
        <Title level={4} margin="0 0 2x 0">
          Command Palette Context Menu
        </Title>
        <Paragraph preset="t4" color="#dark-03" margin="0 0 2x 0">
          Right-click anywhere to open a searchable command menu.
        </Paragraph>
        <Paragraph preset="t4" color="#dark-03" margin="0">
          Try typing to filter the available commands.
        </Paragraph>
      </Card>
    </Flow>
  );
};

WithContextMenu.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByText, findByRole } = within(canvasElement);

  // Wait for the content to be fully rendered
  await waitFor(() =>
    expect(
      findByText('useContextMenu with CommandMenu'),
    ).resolves.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(
      findByText('Command Palette Context Menu'),
    ).resolves.toBeInTheDocument(),
  );

  const contextArea = await findByText('Command Palette Context Menu');
  const container =
    contextArea.closest('[role="region"]') || contextArea.parentElement;

  // Right-click to open the context menu
  await userEvent.pointer([
    { target: container, coords: { clientX: 150, clientY: 150 } },
    { keys: '[MouseRight]', target: container },
  ]);

  // Wait for the menu to appear
  await waitFor(() => expect(findByRole('menu')).resolves.toBeInTheDocument());

  // Verify menu items are present
  await expect(findByText('Copy')).resolves.toBeInTheDocument();
  await expect(findByText('Paste')).resolves.toBeInTheDocument();
  await expect(findByText('Cut')).resolves.toBeInTheDocument();
};
