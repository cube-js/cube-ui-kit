// @ts-nocheck
// NOTE: Type checking is disabled in this Storybook file to prevent
// noisy errors from complex generic typings that do not affect runtime behaviour.
import { expect, userEvent, waitFor, within } from '@storybook/test';
import {
  IconBook,
  IconBulb,
  IconCircleCheckFilled,
  IconPlus,
  IconReload,
} from '@tabler/icons-react';
import { useState } from 'react';

import { Icon, MoreIcon } from '../../../icons';
import {
  AlertDialog,
  Button,
  DialogContainer,
  DirectionIcon,
  Flex,
  Menu,
  MenuTrigger,
  Space,
  Text,
  TooltipProvider,
} from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';

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
  const onSelectionChange = (key) => {
    setSelectedKeys(key);
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
  const onSelectionChange = (key) => {
    setSelectedKeys(key);
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
  const onSelectionChange = (key) => {
    setSelectedKeys(key);
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
  const onSelectionChange = (key) => {
    setSelectedKeys(key);
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
  const onSelectionChange = (key) => {
    setSelectedKeys(key);
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
  const onSelectionChange = (key) => {
    setSelectedKeys(key);
  };

  return (
    <div style={{ padding: '20px', width: '340px' }}>
      <Menu
        id="menu"
        {...props}
        selectionIcon="checkbox"
        selectionMode="single"
        selectedKeys={selectedKeys}
        header="Custom Icons"
        onSelectionChange={onSelectionChange}
      >
        <Menu.Item
          key="red"
          wrapper={(item) => (
            <TooltipProvider title="Color description" placement="right">
              {item}
            </TooltipProvider>
          )}
          icon={<IconReload />}
        >
          #16C7B3AE-000113-000113
        </Menu.Item>
        <Menu.Item
          key="orange"
          wrapper={(item) => (
            <TooltipProvider title="Color description" placement="right">
              {item}
            </TooltipProvider>
          )}
          icon={<IconBook />}
        >
          #16C7B3AE
        </Menu.Item>
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
