import { useState } from 'react';
import {
  BulbOutlined,
  CheckCircleFilled,
  MoreOutlined,
} from '@ant-design/icons';
import {
  Menu,
  MenuTrigger,
  Flex,
  Button,
  Text,
  Root,
  Space,
} from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';
import { action } from '@storybook/addon-actions';

export default {
  title: 'UIKit/Pickers/Menu',
  component: Menu,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    onAction: { action: 'action' },
  },
};

const MenuTemplate = (props) => {
  return (
    <Root>
      <Menu id="menu" {...props} width="340px">
        <Menu.Item key="1" onPress={action('Item 1')}>
          Item 1
        </Menu.Item>
        <Menu.Item key="2" onPress={action('Item 2')}>
          Item 2
        </Menu.Item>
        <Menu.Item key="3" onPress={action('Item 3')}>
          Item 3
        </Menu.Item>
        <Menu.Item key="4" onPress={action('Item 4')}>
          Item 4
        </Menu.Item>
      </Menu>
    </Root>
  );
};

export const Default = ({ ...props }) => {
  const menu = (
    <Menu id="menu" {...props} width="220px">
      <Menu.Item key="red" postfix="Ctr+C" onPress={action('Ctr+C')}>
        Copy
      </Menu.Item>
      <Menu.Item key="orange" postfix="Ctr+V" onPress={action('Ctr+C')}>
        Paste
      </Menu.Item>
      <Menu.Item key="yellow" postfix="Ctr+X" onPress={action('Ctr+C')}>
        Cut
      </Menu.Item>
    </Menu>
  );

  return (
    <Root>
      <Space
        gap="10x"
        placeContent="start start"
        alignItems="start"
        height="400px"
      >
        {menu}

        <MenuTrigger>
          <Button
            size="small"
            icon={<MoreOutlined />}
            aria-label="Open Context Menu"
          />
          {menu}
        </MenuTrigger>
      </Space>
    </Root>
  );
};

export const Sections = (props) => {
  return (
    <Root>
      <div style={{ padding: '20px', width: '340px' }}>
        <Menu id="menu-search" {...props}>
          <Menu.Section title="Line Items">
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
    </Root>
  );
};

export const GitActions = (props) => {
  const bulbIcon = (
    <Text>
      <BulbOutlined />
    </Text>
  );
  const successIcon = (
    <Text color="#success">
      <CheckCircleFilled />
    </Text>
  );
  const stuffText = (
    <Text nowrap color="inherit">
      Suff
    </Text>
  );

  return (
    <Root>
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
              <Flex gap="0.5x">
                {successIcon}
                {stuffText}
              </Flex>
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
    </Root>
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

export const PaymentDetails = (props) => {
  return (
    <Root>
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
    </Root>
  );
};
