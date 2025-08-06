// @ts-nocheck
// NOTE: Type checking is disabled in this Storybook file to prevent
// noisy errors from complex generic typings that do not affect runtime behaviour.
import {
  expect,
  findByRole,
  userEvent,
  waitFor,
  within,
} from '@storybook/test';
import {
  IconBook,
  IconBulb,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconPlus,
  IconReload,
} from '@tabler/icons-react';
import { useState } from 'react';

import {
  CheckIcon,
  CloseCircleIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  FolderIcon,
  Icon,
  MoreIcon,
  PlusIcon,
} from '../../../icons';
import {
  Alert,
  AlertDialog,
  Button,
  Card,
  DialogContainer,
  DirectionIcon,
  Flex,
  Flow,
  Menu,
  MenuTrigger,
  Paragraph,
  Space,
  Text,
  Title,
  TooltipProvider,
  useAnchoredMenu,
  useContextMenu,
} from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';
import { ComboBox } from '../../fields/ComboBox';
import { Select } from '../../fields/Select';

export default {
  title: 'Actions/Menu',
  component: Menu,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description: 'Menu items and sections as static children',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    items: {
      control: { type: null },
      description: 'Item objects for dynamic collections',
      table: {
        type: { summary: 'Iterable<T>' },
      },
    },
    header: {
      control: { type: 'text' },
      description: 'Optional header content (deprecated)',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    footer: {
      control: { type: 'text' },
      description: 'Optional footer content',
      table: {
        type: { summary: 'ReactNode' },
      },
    },

    /* Selection */
    selectionMode: {
      options: ['none', 'single', 'multiple'],
      control: { type: 'radio' },
      description: 'Type of selection allowed in the menu',
      table: {
        type: { summary: "'none' | 'single' | 'multiple'" },
        defaultValue: { summary: 'none' },
      },
    },
    selectedKeys: {
      control: { type: null },
      description: 'Currently selected keys (controlled)',
      table: {
        type: { summary: 'Iterable<Key>' },
      },
    },
    defaultSelectedKeys: {
      control: { type: null },
      description: 'Initially selected keys (uncontrolled)',
      table: {
        type: { summary: 'Iterable<Key>' },
      },
    },
    selectionIcon: {
      options: [undefined, 'checkbox', 'radio'],
      control: { type: 'radio' },
      description: 'Type of selection indicator to display',
      table: {
        type: { summary: "'checkbox' | 'radio'" },
      },
    },
    disabledKeys: {
      control: { type: null },
      description: 'Keys of items that should appear disabled',
      table: {
        type: { summary: 'Iterable<Key>' },
      },
    },

    /* Focus and Navigation */
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether to auto-focus the menu when it opens',
      table: {
        type: { summary: 'boolean | FocusStrategy' },
        defaultValue: { summary: false },
      },
    },
    shouldFocusWrap: {
      control: { type: 'boolean' },
      description: 'Whether keyboard navigation should wrap around',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },

    /* Styling */
    size: {
      options: ['medium', 'large'],
      control: { type: 'radio' },
      description: 'Size of the menu items',
      table: {
        type: { summary: "'medium' | 'large'" },
        defaultValue: { summary: 'medium' },
      },
    },
    styles: {
      control: { type: null },
      description: 'Custom styles for the menu container',
      table: {
        type: { summary: 'Styles' },
      },
    },
    itemStyles: {
      control: { type: null },
      description: 'Custom styles for menu items',
      table: {
        type: { summary: 'Styles' },
      },
    },
    sectionStyles: {
      control: { type: null },
      description: 'Custom styles for section containers',
      table: {
        type: { summary: 'Styles' },
      },
    },
    sectionHeadingStyles: {
      control: { type: null },
      description: 'Custom styles for section headings',
      table: {
        type: { summary: 'Styles' },
      },
    },

    /* Events */
    onAction: {
      action: 'action',
      description: 'Handler called when an item is activated',
      table: {
        type: { summary: '(key: Key) => void' },
      },
    },
    onSelectionChange: {
      action: 'selectionChange',
      description: 'Handler called when selection changes',
      table: {
        type: { summary: '(keys: Selection) => void' },
      },
    },
    onClose: {
      action: 'close',
      description: 'Handler called when menu should close',
      table: {
        type: { summary: '() => void' },
      },
    },

    /* Accessibility */
    id: {
      control: { type: 'text' },
      description: 'Unique identifier for the menu',
      table: {
        type: { summary: 'string' },
      },
    },
    'aria-label': {
      control: { type: 'text' },
      description: 'Accessibility label for the menu',
      table: {
        type: { summary: 'string' },
      },
    },
    'aria-labelledby': {
      control: { type: 'text' },
      description: 'ID of element that labels the menu',
      table: {
        type: { summary: 'string' },
      },
    },

    /* Layout */
    width: {
      control: { type: 'text' },
      description: 'Width of the menu',
      table: {
        type: { summary: 'string | number' },
      },
    },
    height: {
      control: { type: 'text' },
      description: 'Height of the menu',
      table: {
        type: { summary: 'string | number' },
      },
    },

    /* Quality Assurance */
    qa: {
      control: { type: 'text' },
      description: 'Test identifier for the menu',
      table: {
        type: { summary: 'string' },
      },
    },
  },
};

const MenuTemplate = (props) => {
  return (
    <Menu id="menu" {...props} width="340px">
      <Menu.Item key="1">Item 1</Menu.Item>
      <Menu.Item key="2">Item 2</Menu.Item>
      <Menu.Item key="3">Item 3</Menu.Item>
      <Menu.Item key="4">Item 4</Menu.Item>
    </Menu>
  );
};

export const Default = ({ ...props }) => {
  const menu = (
    <Menu id="menu" {...props} width="220px">
      <Menu.Item key="copy" hotkeys="Ctrl+C">
        Copy
      </Menu.Item>
      <Menu.Item key="paste" hotkeys="Ctrl+V">
        Paste
      </Menu.Item>
      <Menu.Item key="cut" hotkeys="Ctrl+X">
        Cut
      </Menu.Item>
    </Menu>
  );

  return (
    <Space
      gap="10x"
      placeContent="start start"
      placeItems="start"
      height="400px"
    >
      {menu}

      <MenuTrigger>
        <Button
          size="small"
          icon={<MoreIcon />}
          aria-label="Open Context Menu"
        />
        {menu}
      </MenuTrigger>
    </Space>
  );
};

export const DifferentSizes = ({ ...props }) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Medium Menu</Title>
    <Menu id="medium-menu" {...props} size="medium" width="200px">
      <Menu.Item key="copy" hotkeys="Ctrl+C">
        Copy
      </Menu.Item>
      <Menu.Item key="paste" hotkeys="Ctrl+V">
        Paste
      </Menu.Item>
      <Menu.Item key="cut" hotkeys="Ctrl+X">
        Cut
      </Menu.Item>
    </Menu>

    <Title level={5}>Large Menu</Title>
    <Menu id="large-menu" {...props} size="large" width="200px">
      <Menu.Item key="copy" hotkeys="Ctrl+C">
        Copy
      </Menu.Item>
      <Menu.Item key="paste" hotkeys="Ctrl+V">
        Paste
      </Menu.Item>
      <Menu.Item key="cut" hotkeys="Ctrl+X">
        Cut
      </Menu.Item>
    </Menu>
  </Space>
);

DifferentSizes.parameters = {
  docs: {
    description: {
      story:
        'Menu supports two sizes: `medium` (default) and `large` to accommodate different interface requirements.',
    },
  },
};

export const DisabledKeys = ({ ...props }) => {
  const menu = (
    <Menu id="menu" disabledKeys={['copy', 'cut']} {...props} width="220px">
      <Menu.Item key="copy" hotkeys="Ctrl+C">
        Copy
      </Menu.Item>
      <Menu.Item key="paste" hotkeys="Ctrl+V">
        Paste
      </Menu.Item>
      <Menu.Item key="cut" hotkeys="Ctrl+X">
        Cut
      </Menu.Item>
    </Menu>
  );

  return (
    <Space
      gap="10x"
      placeContent="start start"
      placeItems="start"
      height="400px"
    >
      {menu}

      <MenuTrigger>
        <Button
          size="small"
          icon={<MoreIcon />}
          aria-label="Open Context Menu"
        />
        {menu}
      </MenuTrigger>
    </Space>
  );
};

export const InsideModal = () => {
  return (
    <DialogContainer>
      <AlertDialog
        content={
          <MenuTrigger>
            <Button
              size="small"
              icon={<MoreIcon />}
              qa="ContextMenuButton"
              aria-label="Open Context Menu"
            />
            <Menu
              qa="ContextMenuList"
              id="menu"
              width="220px"
              selectionMode="multiple"
            >
              <Menu.Item key="red" postfix="Ctr+C">
                Copy
              </Menu.Item>
              <Menu.Item key="orange" postfix="Ctr+V">
                Paste
              </Menu.Item>
              <Menu.Item key="yellow" postfix="Ctr+X">
                Cut
              </Menu.Item>
            </Menu>
          </MenuTrigger>
        }
      />
    </DialogContainer>
  );
};

InsideModal.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.findByTestId('ContextMenuButton');

  await userEvent.click(button);

  const list = await canvas.findByTestId('ContextMenuList');

  await waitFor(() => expect(list).toBeInTheDocument());
};

export const Sections = (props) => {
  return (
    <div style={{ padding: '20px', width: '340px' }}>
      <Menu id="menu-search" {...props}>
        <Menu.Section key="line-items" title="Line Items">
          <Menu.Item key="created">Created At</Menu.Item>
          <Menu.Item key="name">Name</Menu.Item>
          <Menu.Item key="description">Descriptions</Menu.Item>
        </Menu.Section>
        <Menu.Section key="without-title">
          <Menu.Item key="paste">Paste</Menu.Item>
          <Menu.Item key="copy">Copy</Menu.Item>
        </Menu.Section>
        <Menu.Section title="Orders">
          <Menu.Item key="status">Status</Menu.Item>
          <Menu.Item key="completed">Completed At</Menu.Item>
        </Menu.Section>
      </Menu>
    </div>
  );
};

export const StyledSectionsAndItems = (props) => {
  return (
    <div style={{ padding: '20px', width: '340px' }}>
      <Menu id="menu-search" {...props}>
        <Menu.Section key="line-items" title="Line Items">
          <Menu.Item key="created">Created At</Menu.Item>
          <Menu.Item key="name">Name</Menu.Item>
          <Menu.Item key="description">Descriptions</Menu.Item>
        </Menu.Section>
        <Menu.Section title="Orders">
          <Menu.Item key="status">Status</Menu.Item>
          <Menu.Item key="completed">Completed At</Menu.Item>
        </Menu.Section>
      </Menu>
    </div>
  );
};
StyledSectionsAndItems.args = {
  itemStyles: { color: 'red' },
  sectionHeadingStyles: { color: 'blue' },
  sectionStyles: { padding: '1x' },
};

export const GitActions = (props) => {
  const bulbIcon = <IconBulb />;
  const successIcon = (
    <Icon color="#success">
      <IconCircleCheckFilled />
    </Icon>
  );
  const stuffText = (
    <Text nowrap color="inherit">
      Suff
    </Text>
  );

  return (
    <Space gap="10x" placeContent="start start" alignItems="start">
      <Menu id="menu" {...props} header="Git Actions">
        <Menu.Item key="red">Merge to master</Menu.Item>
        <Menu.Item key="orange" mods={{ hovered: true }}>
          Merge to master (hovered)
        </Menu.Item>
        <Menu.Item key="yellow" postfix="Suff" mods={{ disabled: true }}>
          Merge to master (disabled)
        </Menu.Item>
        <Menu.Item
          key="green"
          postfix={
            <Flex gap="0.5x">
              {bulbIcon}
              {stuffText}
            </Flex>
          }
        >
          Merge to master
        </Menu.Item>
        <Menu.Item
          key="blue"
          mods={{ pressed: true }}
          postfix={
            <Space gap="0.5x">
              {successIcon}
              {stuffText}
            </Space>
          }
        >
          Merge to master (pressed)
        </Menu.Item>
        <Menu.Item key="purple" postfix={successIcon}>
          Merge to master
        </Menu.Item>
        <Menu.Item key="asdasd" postfix={<Flex gap="0.5x">{bulbIcon}</Flex>}>
          Merge to master
        </Menu.Item>
      </Menu>
    </Space>
  );
};

export const MenuSelectableSingle = (props) => {
  const [selectedKeys, setSelectedKeys] = useState(['1']);
  const onSelectionChange = (keys) => {
    setSelectedKeys(keys);
  };

  return MenuTemplate({
    ...props,
    selectionMode: 'single',
    selectedKeys,
    onSelectionChange,
  });
};

export const MenuSelectableMultiple = (props) => {
  const [selectedKeys, setSelectedKeys] = useState(['1', '2']);
  const onSelectionChange = (keys) => {
    setSelectedKeys(keys);
  };

  return MenuTemplate({
    ...props,
    selectionMode: 'multiple',
    selectedKeys,
    onSelectionChange,
  });
};

MenuSelectableMultiple.play = async ({ canvasElement }) => {
  const { getByTestId } = within(canvasElement);

  // @ts-ignore
  await userEvent.tab(getByTestId('Menu'));
};

export const MenuSelectableCheckboxes = (props) => {
  const [selectedKeys, setSelectedKeys] = useState(['1', '2']);
  const onSelectionChange = (keys) => {
    setSelectedKeys(keys);
  };

  return MenuTemplate({
    ...props,
    selectionIcon: 'checkbox',
    selectionMode: 'multiple',
    selectedKeys,
    onSelectionChange,
  });
};

export const MenuSelectableRadio = (props) => {
  const [selectedKeys, setSelectedKeys] = useState(['1']);
  const onSelectionChange = (keys) => {
    setSelectedKeys(keys);
  };

  return MenuTemplate({
    ...props,
    selectionIcon: 'radio',
    selectionMode: 'single',
    selectedKeys,
    onSelectionChange,
  });
};

export const PaymentDetails = (props) => {
  return (
    <div style={{ padding: '20px', width: '340px' }}>
      <Menu id="menu" {...props} header="Payment Details">
        <Menu.Item key="red" postfix="March, 2022">
          Invoice #16C7B3AE-000113-000113
        </Menu.Item>
        <Menu.Item key="orange" postfix="Jan, 2022">
          Invoice #16C7B3AE
        </Menu.Item>
        <Menu.Item key="purple" postfix="Feb, 2022">
          Invoice #16C7B3AE manual
        </Menu.Item>
        <Menu.Item key="yellow" postfix="July, 2022">
          #16C7B3AE
        </Menu.Item>
      </Menu>
    </div>
  );
};

export const ItemCustomIcons = (props) => {
  const [selectedKeys, setSelectedKeys] = useState(['1']);
  const onSelectionChange = (keys) => {
    setSelectedKeys(keys);
  };

  return (
    <div style={{ padding: '20px', width: '380px' }}>
      <Menu
        id="menu"
        {...props}
        selectionIcon="checkbox"
        selectionMode="single"
        selectedKeys={selectedKeys}
        header="Custom Icons"
        onSelectionChange={onSelectionChange}
      >
        <Menu.Item key="red" icon={<IconReload />} postfix="March, 2022">
          #16C7B3AE-000113-000113
        </Menu.Item>
        <Menu.Item key="orange" icon={<IconBook />} postfix="Jan, 2022">
          #16C7B3AE
        </Menu.Item>
        <Menu.Item key="purple" icon={<IconPlus />} postfix="Feb, 2022">
          #16C7B3AE
        </Menu.Item>
        <Menu.Item key="yellow" icon={<IconReload />} postfix="July, 2022">
          #16C7B3AE
        </Menu.Item>
      </Menu>
    </div>
  );
};

export const ItemWithTooltip = (props) => {
  const [selectedKeys, setSelectedKeys] = useState(['1']);
  const onSelectionChange = (keys) => {
    setSelectedKeys(keys);
  };

  return (
    <div style={{ padding: '20px', width: '340px' }}>
      <Menu
        id="menu"
        {...props}
        selectionIcon="checkbox"
        selectionMode="single"
        selectedKeys={selectedKeys}
        disabledKeys={['blue']}
        header="Items with Tooltips"
        onSelectionChange={onSelectionChange}
      >
        <Menu.Item
          key="red"
          tooltip="This is a simple tooltip for the red item"
          icon={<IconReload />}
        >
          #16C7B3AE-000113-000113
        </Menu.Item>
        <Menu.Item
          key="orange"
          tooltip={{
            title: 'Advanced tooltip with custom placement',
            placement: 'left',
          }}
          icon={<IconBook />}
        >
          #16C7B3AE
        </Menu.Item>
        <Menu.Item
          key="blue"
          tooltip={{ title: 'Tooltip with delay', delay: 1000 }}
          icon={<IconPlus />}
        >
          #2563EB
        </Menu.Item>
      </Menu>
    </div>
  );
};

export const SectionsWithTooltips = (props) => {
  const [selectedKeys, setSelectedKeys] = useState(['copy']);
  const onSelectionChange = (keys) => {
    setSelectedKeys(keys);
  };

  return (
    <div style={{ padding: '20px', width: '380px' }}>
      <Menu
        id="menu"
        {...props}
        selectionMode="single"
        selectedKeys={selectedKeys}
        header="Sections with Tooltips"
        onSelectionChange={onSelectionChange}
      >
        <Menu.Section key="file-operations" title="File Operations">
          <Menu.Item
            key="new"
            tooltip="Create a new file"
            icon={<IconPlus />}
            hotkeys="Ctrl+N"
          >
            New File
          </Menu.Item>
          <Menu.Item
            key="open"
            tooltip={{
              title: 'Open an existing file from your computer',
              placement: 'left',
            }}
            icon={<IconBook />}
            hotkeys="Ctrl+O"
          >
            Open File
          </Menu.Item>
        </Menu.Section>
        <Menu.Section key="edit-operations" title="Edit Operations">
          <Menu.Item
            key="copy"
            tooltip="Copy the selected content to clipboard"
            icon={<IconReload />}
            hotkeys="Ctrl+C"
          >
            Copy
          </Menu.Item>
          <Menu.Item
            key="paste"
            tooltip={{
              title: 'Paste content from clipboard',
              delay: 500,
            }}
            icon={<IconBulb />}
            hotkeys="Ctrl+V"
          >
            Paste
          </Menu.Item>
          <Menu.Item
            key="cut"
            tooltip="Cut the selected content"
            icon={<MoreIcon />}
            hotkeys="Ctrl+X"
          >
            Cut
          </Menu.Item>
        </Menu.Section>
        <Menu.Section key="advanced" title="Advanced">
          <Menu.Item
            key="reload"
            tooltip={{
              title: 'Reload the current document and lose unsaved changes',
              placement: 'top',
            }}
            icon={<IconReload />}
            hotkeys="F5"
          >
            Reload
          </Menu.Item>
        </Menu.Section>
      </Menu>
    </div>
  );
};

// ItemWithTooltip.play = async ({ canvasElement }) => {
//   const canvas = within(canvasElement);
//   const button = (await canvas.getAllByRole('button'))[0];
//   // this is a weird hack that makes tooltip working properly on a page load
//   await userEvent.unhover(button);
//   await userEvent.hover(button);
//
//   await waitFor(() => expect(canvas.getByRole('tooltip')).toBeInTheDocument());
// };

export const WithTriggerState = ({ ...props }) => {
  const menu = (
    <Menu id="menu" {...props} width="220px">
      <Menu.Item key="red" postfix="Ctr+C">
        Copy
      </Menu.Item>
      <Menu.Item key="orange" postfix="Ctr+V">
        Paste
      </Menu.Item>
      <Menu.Item key="yellow" postfix="Ctr+X">
        Cut
      </Menu.Item>
    </Menu>
  );

  return (
    <Space
      gap="10x"
      placeContent="start start"
      placeItems="start"
      height="400px"
    >
      <MenuTrigger>
        {({ isOpen }) => (
          <Button
            size="small"
            rightIcon={<DirectionIcon to={isOpen ? 'top' : 'bottom'} />}
            aria-label="Open Context Menu"
          >
            Menu
          </Button>
        )}
        {menu}
      </MenuTrigger>
    </Space>
  );
};
WithTriggerState.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByRole } = within(canvasElement);

  await userEvent.click(await findByRole('button'));

  await expect(await findByRole('menu')).toBeInTheDocument();
};

export const ItemsWithDescriptions = (props) => {
  return (
    <div style={{ padding: '20px', width: '340px' }}>
      <Menu id="menu" {...props} header="Items with descriptions">
        <Menu.Item key="1" description="Additional item details here">
          First item
        </Menu.Item>
        <Menu.Item key="2" description="Second description line">
          Second item
        </Menu.Item>
        <Menu.Item key="3">Item without description</Menu.Item>
      </Menu>
    </div>
  );
};

export const DynamicCollection = (props) => {
  const items = [
    { id: 'copy', label: 'Copy', icon: '📋', shortcut: 'Mod+C' },
    { id: 'paste', label: 'Paste', icon: '📄', shortcut: 'Mod+V' },
    { id: 'cut', label: 'Cut', icon: '✂️', shortcut: 'Mod+X' },
    { id: 'delete', label: 'Delete', icon: '🗑️', shortcut: 'backspace' },
  ];

  return (
    <div style={{ padding: '20px', width: '340px' }}>
      <Menu id="menu" {...props} items={items} header="Dynamic Collection">
        {(item) => (
          <Menu.Item
            key={item.id}
            icon={<span style={{ fontSize: '16px' }}>{item.icon}</span>}
            hotkeys={item.shortcut}
          >
            {item.label}
          </Menu.Item>
        )}
      </Menu>
    </div>
  );
};

export const DynamicCollectionWithSections = (props) => {
  const sections = [
    {
      name: 'File',
      id: 'file',
      items: [
        { id: 'new', label: 'New', icon: '📝', shortcut: 'Mod+N' },
        { id: 'open', label: 'Open…', icon: '📁', shortcut: 'Mod+O' },
        { id: 'save', label: 'Save', icon: '💾', shortcut: 'Mod+S' },
      ],
    },
    {
      name: 'Edit',
      id: 'edit',
      items: [
        { id: 'copy', label: 'Copy', icon: '📋', shortcut: 'Mod+C' },
        { id: 'paste', label: 'Paste', icon: '📄', shortcut: 'Mod+V' },
        { id: 'cut', label: 'Cut', icon: '✂️', shortcut: 'Mod+X' },
      ],
    },
  ];

  return (
    <div style={{ padding: '20px', width: '340px' }}>
      <Menu id="menu" {...props} items={sections} header="Dynamic Collection">
        {(section) => (
          <Menu.Section
            key={section.id}
            items={section.items}
            title={section.name}
          >
            {(item) => (
              <Menu.Item
                key={item.id}
                icon={<span style={{ fontSize: '16px' }}>{item.icon}</span>}
                hotkeys={item.shortcut}
              >
                {item.label}
              </Menu.Item>
            )}
          </Menu.Section>
        )}
      </Menu>
    </div>
  );
};

export const WithAnchoredMenu = () => {
  const MyMenuComponent = ({ onAction }) => (
    <Menu width="220px" onAction={onAction}>
      <Menu.Item key="edit" hotkeys="Ctrl+E">
        Edit
      </Menu.Item>
      <Menu.Item key="duplicate" hotkeys="Ctrl+D">
        Duplicate
      </Menu.Item>
      <Menu.Item key="delete" hotkeys="Del">
        Delete
      </Menu.Item>
    </Menu>
  );

  const { anchorRef, open, isOpen, rendered } = useAnchoredMenu(
    MyMenuComponent,
    { placement: 'right top' },
  );

  const handleAction = (key) => {
    console.log('Action selected:', key);
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
          icon={<MoreIcon />}
          aria-label="Open Context Menu"
          onPress={() => open({ onAction: handleAction })}
        >
          {isOpen ? 'Menu is opened' : 'Open Menu'}
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

WithAnchoredMenu.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByRole, findByText } = within(canvasElement);

  // Click the button to open the anchored menu
  await userEvent.click(await findByRole('button'));

  // Wait for the menu to appear
  await waitFor(() => expect(findByRole('menu')).resolves.toBeInTheDocument());

  // Verify menu items are present
  await expect(findByText('Edit')).resolves.toBeInTheDocument();
  await expect(findByText('Duplicate')).resolves.toBeInTheDocument();
  await expect(findByText('Delete')).resolves.toBeInTheDocument();
};

export const WithContextMenu = () => {
  const MyMenuComponent = ({ onAction }) => (
    <Menu width="220px" onAction={onAction}>
      <Menu.Item key="edit" hotkeys="Ctrl+E">
        Edit
      </Menu.Item>
      <Menu.Item key="duplicate" hotkeys="Ctrl+D">
        Duplicate
      </Menu.Item>
      <Menu.Item key="delete" hotkeys="Del">
        Delete
      </Menu.Item>
    </Menu>
  );

  const handleAction = (key) => {
    console.log('Context menu action selected:', key);
  };

  const { targetRef, isOpen, rendered } = useContextMenu(
    MyMenuComponent,
    {
      placement: 'right top',
    },
    { onAction: handleAction },
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
        useContextMenu Hook Example
      </Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 4x 0">
        Right-click anywhere in the container below to open a context menu at
        the exact cursor position
      </Paragraph>

      <Card
        ref={targetRef}
        position="relative"
        border="dashed #purple"
        padding="4x"
      >
        {rendered}
        <Title level={4} margin="0 0 2x 0">
          Context Menu Area
        </Title>
        <Paragraph preset="t4" color="#dark-03" margin="0 0 2x 0">
          Right-click anywhere in this area to open a context menu.
        </Paragraph>
        <Paragraph preset="t4" color="#dark-03" margin="0 0 2x 0">
          The menu will appear exactly where you clicked.
        </Paragraph>
        <Paragraph preset="t4" color="#dark-03" margin="0">
          Status:{' '}
          {isOpen ? 'Context menu is open' : 'Right-click to open context menu'}
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
    expect(findByText('Context Menu Area')).resolves.toBeInTheDocument(),
  );

  const contextArea = await findByText('Context Menu Area');
  const container = contextArea.closest('[role="region"]');

  // Right-click to open the context menu
  await userEvent.pointer([
    { target: container, coords: { clientX: 200, clientY: 150 } },
    { keys: '[MouseRight]', target: container },
  ]);

  // Wait for the menu to appear
  await waitFor(() => expect(findByRole('menu')).resolves.toBeInTheDocument());

  // Verify menu items are present
  await expect(findByText('Edit')).resolves.toBeInTheDocument();
  await expect(findByText('Duplicate')).resolves.toBeInTheDocument();
  await expect(findByText('Delete')).resolves.toBeInTheDocument();
};

export const WithContextMenuPlacements = () => {
  const MyMenuComponent = ({ onAction }) => (
    <Menu width="220px" onAction={onAction}>
      <Menu.Item key="edit" hotkeys="Ctrl+E">
        Edit
      </Menu.Item>
      <Menu.Item key="duplicate" hotkeys="Ctrl+D">
        Duplicate
      </Menu.Item>
      <Menu.Item key="delete" hotkeys="Del">
        Delete
      </Menu.Item>
    </Menu>
  );

  const placements = [
    'top',
    'top start',
    'top end',
    'bottom',
    'bottom start',
    'bottom end',
    'left',
    'left top',
    'left bottom',
    'right',
    'right top',
    'right bottom',
  ];

  const ContextContainer = ({ placement, title }) => {
    const handleAction = (key) => {
      console.log(`Action selected from ${placement}:`, key);
    };

    const { targetRef, rendered } = useContextMenu(
      MyMenuComponent,
      {
        placement,
      },
      { onAction: handleAction },
    );

    return (
      <Card
        ref={targetRef}
        position="relative"
        border="dashed #purple"
        padding="3x"
        gap="1x"
      >
        {rendered}
        <Paragraph preset="t3m" color="#dark">
          {title}
        </Paragraph>
        <Paragraph color="#dark-03">Right-click to test</Paragraph>
      </Card>
    );
  };

  return (
    <Flow
      gap="3x"
      placeContent="start start"
      placeItems="start"
      height="600px"
      padding="3x"
    >
      <Title level={3} margin="0 0 2x 0">
        useContextMenu - Different Placements
      </Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 4x 0">
        Right-click on each container to test different placement positions.
        Notice how the menu appears relative to your click position.
      </Paragraph>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          width: '100%',
        }}
      >
        {placements.map((placement) => (
          <ContextContainer
            key={placement}
            placement={placement}
            title={placement}
          />
        ))}
      </div>
    </Flow>
  );
};

WithContextMenuPlacements.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByText, findByRole } = within(canvasElement);

  // Wait for the content to be fully rendered
  await waitFor(() =>
    expect(
      findByText('useContextMenu - Different Placements'),
    ).resolves.toBeInTheDocument(),
  );
  await waitFor(() => expect(findByText('top')).resolves.toBeInTheDocument());

  // Find the first placement container
  const topContainer = await findByText('top');
  const container = topContainer.closest('[role="region"]');

  // Right-click to open the context menu
  await userEvent.pointer([
    { target: container, coords: { clientX: 50, clientY: 50 } },
    { keys: '[MouseRight]', target: container },
  ]);

  // Wait for the menu to appear
  await waitFor(() => expect(findByRole('menu')).resolves.toBeInTheDocument());

  // Verify menu items are present
  await expect(findByText('Edit')).resolves.toBeInTheDocument();
  await expect(findByText('Duplicate')).resolves.toBeInTheDocument();
  await expect(findByText('Delete')).resolves.toBeInTheDocument();
};

export const TabWithMultipleTriggers = () => {
  const menu = useAnchoredMenu(Menu, {
    placement: 'top end',
  });

  const openTab = () => {
    console.log('Opening tab...');
  };

  const openActionsMenu = () => {
    menu.open({
      onAction: (key) => {
        console.log('Tab action:', key);
      },
      children: (
        <>
          <Menu.Item key="rename">Rename Tab</Menu.Item>
          <Menu.Item key="duplicate">Duplicate Tab</Menu.Item>
          <Menu.Item key="close">Close Tab</Menu.Item>
          <Menu.Item key="close-others">Close Other Tabs</Menu.Item>
        </>
      ),
    });
  };

  const handleRightClick = (event) => {
    event.preventDefault();
    openActionsMenu(event);
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
        Tab with Multiple Triggers
      </Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 4x 0">
        This demonstrates multiple ways to trigger the same menu positioned
        relative to a tab button:
      </Paragraph>

      <ul>
        <li>Click "Open file" to open the tab (do nothing in our example)</li>
        <li>Click the dots button to open the actions menu</li>
        <li>Right-click the tab to also open the actions menu</li>
      </ul>

      <Flex
        ref={menu.anchorRef}
        display="inline-flex"
        onContextMenu={handleRightClick}
      >
        <Button size="small" radius="left" onPress={openTab}>
          Open file
        </Button>

        <Button
          size="small"
          icon={<IconDotsVertical />}
          aria-label="Tab actions"
          padding="1x"
          radius="right"
          margin="-1bw left"
          onPress={openActionsMenu}
        />
      </Flex>

      {menu.rendered}
    </Flow>
  );
};

TabWithMultipleTriggers.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByText, findByRole } = within(canvasElement);

  // Find the dots button and click it
  const dotsButton = await findByRole('button', { name: 'Tab actions' });
  await userEvent.click(dotsButton);

  // Wait for the menu to appear
  await waitFor(() => expect(findByRole('menu')).resolves.toBeInTheDocument());

  // Verify menu items are present
  await expect(findByText('Rename Tab')).resolves.toBeInTheDocument();
  await expect(findByText('Duplicate Tab')).resolves.toBeInTheDocument();
  await expect(findByText('Close Tab')).resolves.toBeInTheDocument();
  await expect(findByText('Close Other Tabs')).resolves.toBeInTheDocument();
};

export const MenuSynchronization = () => {
  const MyMenuComponent1 = ({ onAction }) => (
    <Menu width="200px" onAction={onAction}>
      <Menu.Item key="option1" icon={<EditIcon />}>
        Edit Item
      </Menu.Item>
      <Menu.Item key="option2" icon={<CopyIcon />}>
        Copy Item
      </Menu.Item>
      <Menu.Item key="option3" icon={<CloseIcon />}>
        Delete Item
      </Menu.Item>
    </Menu>
  );

  const MyContextMenuComponent = ({ onAction }) => (
    <Menu width="180px" onAction={onAction}>
      <Menu.Item key="cut" icon={<CloseCircleIcon />} hotkeys="Ctrl+X">
        Cut
      </Menu.Item>
      <Menu.Item key="copy" icon={<CopyIcon />} hotkeys="Ctrl+C">
        Copy
      </Menu.Item>
      <Menu.Item key="paste" icon={<CheckIcon />} hotkeys="Ctrl+V">
        Paste
      </Menu.Item>
    </Menu>
  );

  const {
    anchorRef: anchorRef1,
    open: open1,
    isOpen: isOpen1,
    rendered: rendered1,
  } = useAnchoredMenu(MyMenuComponent1, { placement: 'bottom start' });

  const handleAction = (key) => {
    console.log('Action selected:', key);
  };

  const {
    targetRef: targetRef3,
    open: open3,
    isOpen: isOpen3,
    rendered: rendered3,
  } = useContextMenu(
    MyContextMenuComponent,
    { placement: 'bottom start' },
    { onAction: handleAction },
  );

  return (
    <Flow gap="4x" placeContent="start" padding="4x">
      <Title level={3} margin="0 0 2x 0">
        Menu Synchronization Demo
      </Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 4x 0">
        Only one menu can be open at a time. Opening a new menu automatically
        closes any other open menu.
      </Paragraph>

      <Flow gap="3x" flexDirection="row">
        <Card border padding="3x" margin="0 0 3x 0">
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            Regular MenuTrigger
          </Paragraph>
          <MenuTrigger>
            <Button size="small" icon={<MoreIcon />} aria-label="Open Menu">
              Click to test menu synchronization
            </Button>
            <Menu width="220px">
              <Menu.Item key="sync-edit" hotkeys="Ctrl+E">
                Edit (Sync Test)
              </Menu.Item>
              <Menu.Item key="sync-duplicate" hotkeys="Ctrl+D">
                Duplicate (Sync Test)
              </Menu.Item>
              <Menu.Item key="sync-delete" hotkeys="Del">
                Delete (Sync Test)
              </Menu.Item>
            </Menu>
          </MenuTrigger>
          <Paragraph preset="t5" color="#dark-03" margin="2x 0 0 0">
            Click this button, then try right-clicking on any placement
            container below to test menu synchronization.
          </Paragraph>
        </Card>

        <Card ref={anchorRef1} border padding="3x">
          {rendered1}
          <Button
            data-menu-trigger
            size="small"
            theme={isOpen1 ? 'accent' : 'secondary'}
            onPress={() => open1({ onAction: handleAction })}
          >
            Edit Menu {isOpen1 ? '(Open)' : ''}
          </Button>
          <Paragraph preset="t5" color="#dark-03" margin="1x 0 0 0">
            Anchored menu with editing actions
          </Paragraph>
        </Card>

        <Card
          ref={targetRef3}
          border
          padding="3x"
          background={isOpen3 ? '#purple-10' : undefined}
        >
          {rendered3}
          <Paragraph preset="t5" color="#dark-03" margin="1x 0 0 0">
            Right-click to open context menu
          </Paragraph>
        </Card>
      </Flow>

      <Alert type="info" title="Try it out">
        <Flow gap="1x">
          <Text>1. Open any menu by clicking a button</Text>
          <Text>
            2. Try opening another menu - the first one will automatically close
          </Text>
          <Text>
            3. Right-click on the context menu card for a context menu
          </Text>
          <Text>4. Notice how only one menu can be open at any time</Text>
        </Flow>
      </Alert>
    </Flow>
  );
};

export const SubMenus = (props) => {
  const handleAction = (key) => {
    console.log('Action selected:', key);
  };

  const menu = (
    <Menu id="submenu-example" {...props} width="220px" onAction={handleAction}>
      <Menu.Item key="copy" hotkeys="Ctrl+C" icon={<CopyIcon />}>
        Copy
      </Menu.Item>
      <Menu.Item key="paste" hotkeys="Ctrl+V">
        Paste
      </Menu.Item>
      <Menu.Item key="cut" hotkeys="Ctrl+X">
        Cut
      </Menu.Item>

      {/* Basic submenu */}
      <Menu.SubMenuTrigger>
        <Menu.Item key="share" icon={<FolderIcon />}>
          Share
        </Menu.Item>
        <Menu onAction={handleAction}>
          <Menu.Item key="share-link">Copy link</Menu.Item>
          <Menu.Item key="share-email">Email</Menu.Item>
          <Menu.Item key="share-sms">SMS</Menu.Item>
        </Menu>
      </Menu.SubMenuTrigger>

      {/* Nested submenu with multiple levels */}
      <Menu.SubMenuTrigger>
        <Menu.Item key="export" icon={<EditIcon />}>
          Export
        </Menu.Item>
        <Menu onAction={handleAction}>
          <Menu.Item key="export-pdf">Export as PDF</Menu.Item>
          <Menu.Item key="export-image">Export as Image</Menu.Item>

          {/* Nested submenu */}
          <Menu.SubMenuTrigger>
            <Menu.Item key="export-formats">More formats</Menu.Item>
            <Menu onAction={handleAction}>
              <Menu.Item key="export-docx">DOCX Document</Menu.Item>
              <Menu.Item key="export-xlsx">Excel Spreadsheet</Menu.Item>
              <Menu.Item key="export-pptx">PowerPoint</Menu.Item>

              {/* Third level nesting */}
              <Menu.SubMenuTrigger>
                <Menu.Item key="export-advanced">Advanced</Menu.Item>
                <Menu onAction={handleAction}>
                  <Menu.Item key="export-custom">Custom Format</Menu.Item>
                  <Menu.Item key="export-batch">Batch Export</Menu.Item>
                  <Menu.Item key="export-cloud">Export to Cloud</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
            </Menu>
          </Menu.SubMenuTrigger>

          <Menu.Item key="export-raw">Export raw data</Menu.Item>
        </Menu>
      </Menu.SubMenuTrigger>

      {/* Submenu with sections */}
      <Menu.SubMenuTrigger>
        <Menu.Item key="settings" icon={<EditIcon />}>
          Settings
        </Menu.Item>
        <Menu onAction={handleAction}>
          <Menu.Section title="General">
            <Menu.Item key="preferences">Preferences</Menu.Item>
            <Menu.Item key="account">Account Settings</Menu.Item>
          </Menu.Section>
          <Menu.Section title="Display">
            <Menu.Item key="theme">Theme</Menu.Item>
            <Menu.Item key="layout">Layout</Menu.Item>
          </Menu.Section>
          <Menu.Section title="Advanced">
            <Menu.Item key="developer">Developer Tools</Menu.Item>
            <Menu.Item key="reset">Reset Settings</Menu.Item>
          </Menu.Section>
        </Menu>
      </Menu.SubMenuTrigger>

      <Menu.Item key="delete" icon={<CloseIcon />}>
        Delete
      </Menu.Item>
    </Menu>
  );

  return (
    <Space
      gap="10x"
      placeContent="start start"
      placeItems="start"
      height="500px"
    >
      {menu}

      <MenuTrigger>
        <Button
          size="small"
          icon={<MoreIcon />}
          aria-label="Open Context Menu with Submenus"
        >
          Menu with Submenus
        </Button>
        {menu}
      </MenuTrigger>
    </Space>
  );
};

SubMenus.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates submenu functionality with Menu.SubMenuTrigger. Supports unlimited nesting levels, keyboard navigation (arrow keys, Enter, Esc), and automatic chevron indicators. Submenus open on hover/arrow keys and close when focus leaves.',
    },
  },
};

export const SubMenuCustomization = () => {
  const handleAction = (key) => {
    console.log('SubMenu action:', key);
  };

  return (
    <Flow gap="4x" placeContent="start start" placeItems="start" padding="4x">
      <Title level={3} margin="0 0 2x 0">
        SubMenu Customization Options
      </Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 4x 0">
        SubMenuTrigger supports various customization options including
        placement, offset, and autoFocus behavior.
      </Paragraph>

      <Flow gap="3x" flexDirection="row" flexWrap="wrap">
        {/* Default placement */}
        <Card border padding="3x" minWidth="250px">
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            Default (right top)
          </Paragraph>
          <MenuTrigger>
            <Button size="small" icon={<MoreIcon />}>
              Default Placement
            </Button>
            <Menu width="200px" onAction={handleAction}>
              <Menu.Item key="action1">Action 1</Menu.Item>
              <Menu.SubMenuTrigger>
                <Menu.Item key="submenu1">Submenu Default</Menu.Item>
                <Menu onAction={handleAction}>
                  <Menu.Item key="sub1">Submenu Item 1</Menu.Item>
                  <Menu.Item key="sub2">Submenu Item 2</Menu.Item>
                  <Menu.Item key="sub3">Submenu Item 3</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
              <Menu.Item key="action2">Action 2</Menu.Item>
            </Menu>
          </MenuTrigger>
        </Card>

        {/* Custom placement */}
        <Card border padding="3x" minWidth="250px">
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            Custom Placement
          </Paragraph>
          <MenuTrigger>
            <Button size="small" icon={<MoreIcon />}>
              Left Placement
            </Button>
            <Menu width="200px" onAction={handleAction}>
              <Menu.Item key="action1">Action 1</Menu.Item>
              <Menu.SubMenuTrigger placement="left top">
                <Menu.Item key="submenu1">Submenu Left</Menu.Item>
                <Menu onAction={handleAction}>
                  <Menu.Item key="sub1">Submenu Item 1</Menu.Item>
                  <Menu.Item key="sub2">Submenu Item 2</Menu.Item>
                  <Menu.Item key="sub3">Submenu Item 3</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
              <Menu.Item key="action2">Action 2</Menu.Item>
            </Menu>
          </MenuTrigger>
        </Card>

        {/* Custom offset */}
        <Card border padding="3x" minWidth="250px">
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            Custom Offset
          </Paragraph>
          <MenuTrigger>
            <Button size="small" icon={<MoreIcon />}>
              Large Offset
            </Button>
            <Menu width="200px" onAction={handleAction}>
              <Menu.Item key="action1">Action 1</Menu.Item>
              <Menu.SubMenuTrigger offset={20}>
                <Menu.Item key="submenu1">Submenu +20px</Menu.Item>
                <Menu onAction={handleAction}>
                  <Menu.Item key="sub1">Submenu Item 1</Menu.Item>
                  <Menu.Item key="sub2">Submenu Item 2</Menu.Item>
                  <Menu.Item key="sub3">Submenu Item 3</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
              <Menu.Item key="action2">Action 2</Menu.Item>
            </Menu>
          </MenuTrigger>
        </Card>

        {/* Disabled submenu */}
        <Card border padding="3x" minWidth="250px">
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            Disabled Submenu
          </Paragraph>
          <MenuTrigger>
            <Button size="small" icon={<MoreIcon />}>
              With Disabled
            </Button>
            <Menu width="200px" onAction={handleAction}>
              <Menu.Item key="action1">Action 1</Menu.Item>
              <Menu.SubMenuTrigger disabled>
                <Menu.Item key="submenu1">Disabled Submenu</Menu.Item>
                <Menu onAction={handleAction}>
                  <Menu.Item key="sub1">Won't Open</Menu.Item>
                  <Menu.Item key="sub2">Disabled State</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
              <Menu.Item key="action2">Action 2</Menu.Item>
            </Menu>
          </MenuTrigger>
        </Card>
      </Flow>

      <Alert type="info" title="SubMenu Features">
        <Flow gap="1x">
          <Text>
            • <strong>Keyboard Navigation:</strong> Use arrow keys to navigate
            between menus
          </Text>
          <Text>
            • <strong>Auto-open:</strong> Right arrow or Enter opens submenus
          </Text>
          <Text>
            • <strong>Auto-close:</strong> Left arrow or Esc closes current
            submenu
          </Text>
          <Text>
            • <strong>Visual Indicator:</strong> Chevron (›) automatically added
            to submenu triggers
          </Text>
          <Text>
            • <strong>Unlimited Nesting:</strong> Create as many levels as
            needed
          </Text>
          <Text>
            • <strong>Custom Positioning:</strong> Control placement, offset,
            and flip behavior
          </Text>
        </Flow>
      </Alert>
    </Flow>
  );
};

export const ComprehensivePopoverSynchronization = () => {
  const MyMenuComponent = ({ onAction }) => (
    <Menu width="200px" onAction={onAction}>
      <Menu.Item key="option1" icon={<EditIcon />}>
        Edit Item
      </Menu.Item>
      <Menu.Item key="option2" icon={<CopyIcon />}>
        Copy Item
      </Menu.Item>
      <Menu.Item key="option3" icon={<CloseIcon />}>
        Delete Item
      </Menu.Item>
    </Menu>
  );

  const {
    anchorRef: anchorRef1,
    open: open1,
    isOpen: isOpen1,
    rendered: rendered1,
  } = useAnchoredMenu(MyMenuComponent, { placement: 'bottom start' });

  const handleAction = (key) => {
    console.log('Action selected:', key);
  };

  const {
    targetRef: targetRef2,
    open: open2,
    isOpen: isOpen2,
    rendered: rendered2,
  } = useContextMenu(
    MyMenuComponent,
    { placement: 'bottom start' },
    { onAction: handleAction },
  );

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4' },
  ];

  const comboBoxItems = [
    { id: 'item1', name: 'Item 1' },
    { id: 'item2', name: 'Item 2' },
    { id: 'item3', name: 'Item 3' },
    { id: 'item4', name: 'Item 4' },
  ];

  return (
    <Flow gap="4x" placeContent="start" padding="4x">
      <Title level={3} margin="0 0 2x 0">
        Complete Popover Synchronization Demo
      </Title>
      <Paragraph preset="t4" color="#dark-03" margin="0 0 4x 0">
        Only one popover can be open at a time across all components: Menu,
        Select, and ComboBox. Opening any popover automatically closes others.
      </Paragraph>

      <Flow gap="3x" flexDirection="row" flexWrap="wrap">
        {/* Regular MenuTrigger */}
        <Card border padding="3x" margin="0 0 3x 0" minWidth="200px">
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            MenuTrigger
          </Paragraph>
          <MenuTrigger>
            <Button size="small" icon={<MoreIcon />} aria-label="Open Menu">
              Click me
            </Button>
            <Menu width="220px">
              <Menu.Item key="sync-edit" hotkeys="Ctrl+E">
                Edit (Menu)
              </Menu.Item>
              <Menu.Item key="sync-duplicate" hotkeys="Ctrl+D">
                Duplicate (Menu)
              </Menu.Item>
              <Menu.Item key="sync-delete" hotkeys="Del">
                Delete (Menu)
              </Menu.Item>
            </Menu>
          </MenuTrigger>
          <Paragraph preset="t5" color="#dark-03" margin="2x 0 0 0">
            Standard menu trigger
          </Paragraph>
        </Card>

        {/* Anchored Menu */}
        <Card ref={anchorRef1} border padding="3x" minWidth="200px">
          {rendered1}
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            Anchored Menu
          </Paragraph>
          <Button
            size="small"
            theme={isOpen1 ? 'accent' : 'secondary'}
            onPress={() => open1({ onAction: handleAction })}
          >
            Edit Menu {isOpen1 ? '(Open)' : ''}
          </Button>
          <Paragraph preset="t5" color="#dark-03" margin="2x 0 0 0">
            useAnchoredMenu hook
          </Paragraph>
        </Card>

        {/* Context Menu */}
        <Card
          ref={targetRef2}
          border
          padding="3x"
          minWidth="200px"
          background={isOpen2 ? '#purple-10' : undefined}
        >
          {rendered2}
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            Context Menu
          </Paragraph>
          <Paragraph preset="t5" color="#dark-03" margin="0 0 2x 0">
            Right-click here
          </Paragraph>
          <Paragraph preset="t5" color="#dark-03" margin="2x 0 0 0">
            useContextMenu hook
          </Paragraph>
        </Card>

        {/* Select */}
        <Card border padding="3x" minWidth="200px">
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            Select
          </Paragraph>
          <Select
            label="Choose option"
            placeholder="Select an option"
            defaultSelectedKey="option1"
          >
            {selectOptions.map((option) => (
              <Select.Item key={option.value}>{option.label}</Select.Item>
            ))}
          </Select>
          <Paragraph preset="t5" color="#dark-03" margin="2x 0 0 0">
            Select component
          </Paragraph>
        </Card>

        {/* ComboBox */}
        <Card border padding="3x" minWidth="200px">
          <Paragraph preset="t3m" color="#dark" margin="0 0 2x 0">
            ComboBox
          </Paragraph>
          <ComboBox
            label="Search items"
            placeholder="Type to search..."
            items={comboBoxItems}
          >
            {(item) => <ComboBox.Item key={item.id}>{item.name}</ComboBox.Item>}
          </ComboBox>
          <Paragraph preset="t5" color="#dark-03" margin="2x 0 0 0">
            ComboBox component
          </Paragraph>
        </Card>
      </Flow>

      <Alert type="info" title="Test the synchronization">
        <Flow gap="1x">
          <Text>
            1. Click on any menu trigger, select dropdown, or combobox
          </Text>
          <Text>
            2. Then click on another component - the first popover will
            automatically close
          </Text>
          <Text>
            3. Right-click on the context menu card for a context menu
          </Text>
          <Text>
            4. Notice how only one popover can be open at any time across all
            components
          </Text>
          <Text>
            5. This ensures a clean UI where multiple overlays don't compete for
            attention
          </Text>
        </Flow>
      </Alert>
    </Flow>
  );
};
