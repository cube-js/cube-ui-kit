import { expect, userEvent, waitFor, within } from '@storybook/test';
import {
  IconArrowBack,
  IconArrowForward,
  IconClipboard,
  IconCopy,
  IconCut,
  IconDeviceFloppy,
  IconFile,
  IconFileText,
  IconFolder,
  IconSearch,
  IconSettings,
} from '@tabler/icons-react';
import React, { useState } from 'react';

import {
  Dialog,
  DialogTrigger,
  useDialogContainer,
} from '../../overlays/Dialog';
import { Button } from '../Button';
import { Menu } from '../Menu/Menu';

import { CommandMenu, CubeCommandMenuProps } from './CommandMenu';

import type { StoryFn } from '@storybook/react';

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
      options: ['small', 'medium'],
      control: { type: 'radio' },
      description: 'Size of the select component',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'small' },
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
  },
  {
    key: 'paste',
    label: 'Paste',
    description: 'Paste from clipboard',
    hotkeys: 'Ctrl+V',
  },
  {
    key: 'cut',
    label: 'Cut',
    description: 'Cut selected text',
    hotkeys: 'Ctrl+X',
  },
  {
    key: 'undo',
    label: 'Undo',
    description: 'Undo last action',
    hotkeys: 'Ctrl+Z',
  },
  {
    key: 'redo',
    label: 'Redo',
    description: 'Redo last action',
    hotkeys: 'Ctrl+Y',
  },
  {
    key: 'select-all',
    label: 'Select All',
    description: 'Select all text',
    hotkeys: 'Ctrl+A',
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
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

Default.args = {
  searchPlaceholder: 'Search commands...',
  autoFocus: true,
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
        {...args}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      >
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
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
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

CustomFilter.args = {
  searchPlaceholder: 'Try fuzzy search (e.g., "cp" for Copy)...',
  autoFocus: true,
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
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

ForceMountItems.args = {
  searchPlaceholder: 'Help and Settings always visible...',
  autoFocus: true,
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
};

export const MultipleSelection: StoryFn<CubeCommandMenuProps<any>> = (args) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <strong>Selected:</strong> {selectedKeys.join(', ') || 'None'}
      </div>
      <CommandMenu
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

export const MediumSize: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu {...args} size="medium">
    {basicCommands.map((command) => (
      <CommandMenu.Item
        key={command.key}
        description={command.description}
        hotkeys={command.hotkeys}
      >
        {command.label}
      </CommandMenu.Item>
    ))}
  </CommandMenu>
);

MediumSize.args = {
  searchPlaceholder: 'Medium size command palette...',
  autoFocus: true,
};

export const WithDialog: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <DialogTrigger>
    <Button>Open Command Menu</Button>
    <Dialog size="medium" isDismissable={false}>
      <CommandMenu width="100%" height="min(40x, 90vh)" {...args} size="medium">
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
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

function CommandMenuDialogContent({
  onClose,
  ...args
}: CubeCommandMenuProps<any> & { onClose: () => void }) {
  const commandMenuProps = {
    ...args,
    onAction: (key: React.Key) => {
      console.log('Action selected:', key);
      onClose();
    },
  };

  return (
    <Dialog size="medium" isDismissable={false}>
      <CommandMenu
        width="100%"
        height="min(40x, 90vh)"
        {...commandMenuProps}
        size="medium"
      >
        {basicCommands.map((command) => (
          <CommandMenu.Item
            key={command.key}
            description={command.description}
            hotkeys={command.hotkeys}
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
  const dialog = useDialogContainer(CommandMenuDialogContent);

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

export const WithIcons: StoryFn<CubeCommandMenuProps<any>> = (args) => (
  <CommandMenu {...args}>
    <Menu.Section title="File Operations">
      <CommandMenu.Item
        key="new-file"
        icon={<IconFile />}
        description="Create a new file"
        hotkeys="Ctrl+N"
      >
        New File
      </CommandMenu.Item>
      <CommandMenu.Item
        key="open-file"
        icon={<IconFolder />}
        description="Open an existing file"
        hotkeys="Ctrl+O"
      >
        Open File
      </CommandMenu.Item>
      <CommandMenu.Item
        key="save-file"
        icon={<IconDeviceFloppy />}
        description="Save current file"
        hotkeys="Ctrl+S"
      >
        Save File
      </CommandMenu.Item>
    </Menu.Section>

    <Menu.Section title="Edit Operations">
      <CommandMenu.Item
        key="copy"
        icon={<IconCopy />}
        description="Copy selected text"
        hotkeys="Ctrl+C"
        keywords={['duplicate', 'clone']}
      >
        Copy
      </CommandMenu.Item>
      <CommandMenu.Item
        key="paste"
        icon={<IconClipboard />}
        description="Paste from clipboard"
        hotkeys="Ctrl+V"
        keywords={['insert']}
      >
        Paste
      </CommandMenu.Item>
      <CommandMenu.Item
        key="cut"
        icon={<IconCut />}
        description="Cut selected text"
        hotkeys="Ctrl+X"
      >
        Cut
      </CommandMenu.Item>
      <CommandMenu.Item
        key="undo"
        icon={<IconArrowBack />}
        description="Undo last action"
        hotkeys="Ctrl+Z"
      >
        Undo
      </CommandMenu.Item>
      <CommandMenu.Item
        key="redo"
        icon={<IconArrowForward />}
        description="Redo last action"
        hotkeys="Ctrl+Y"
      >
        Redo
      </CommandMenu.Item>
    </Menu.Section>

    <Menu.Section title="Tools">
      <CommandMenu.Item
        key="search"
        icon={<IconSearch />}
        description="Search in files"
        hotkeys="Ctrl+F"
      >
        Search
      </CommandMenu.Item>
      <CommandMenu.Item
        key="settings"
        icon={<IconSettings />}
        description="Open settings"
        hotkeys="Ctrl+."
      >
        Settings
      </CommandMenu.Item>
      <CommandMenu.Item key="documents" description="View all documents">
        Documents
      </CommandMenu.Item>
    </Menu.Section>
  </CommandMenu>
);

WithIcons.args = {
  searchPlaceholder: 'Search commands with icons...',
  autoFocus: true,
};
