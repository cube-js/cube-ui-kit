import {
  CaretDownOutlined,
  DeploymentUnitOutlined,
  FileDoneOutlined,
  // BellOutlined,
  LogoutOutlined,
  UsergroupAddOutlined,
  // AreaChartOutlined,
  // FolderOpenOutlined,
  // CloudOutlined,
  // BranchesOutlined,
  BulbOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import {
  Menu,
  MenuTrigger,
  Flex,
  Button,
  Text,
  Flow,
  Block,
  Avatar,
  Root,
  Space,
  SearchInput,
} from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';

const Layout = ({ children }) => <Root>{children}</Root>;

Layout.displayName = 'Root';

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

export const Default = ({ ...props }) => {
  const userHeader = (
    <>
      <Flow>
        <div>
          <Text color="dark" weight={600}>
            Artem Keydunov
          </Text>
        </div>
        <Block style={{ lineHeight: '14px' }}>
          <Text.Minor preset="t4m" style={{ lineHeight: '14px' }}>
            admin
          </Text.Minor>
        </Block>
      </Flow>
      <Avatar data-qa="TopBarInnerAvatar" size="5x">
        <Text transform="uppercase">AK</Text>
      </Avatar>
    </>
  );
  const menu = (
    <Menu id="menu" {...props} header={userHeader}>
      <Menu.Section>
        <Menu.Item key="red" icon={<DeploymentUnitOutlined />}>
          Deployments
        </Menu.Item>
        <Menu.Item key="orange" icon={<UsergroupAddOutlined />}>
          Team
        </Menu.Item>
        <Menu.Item key="yellow" icon={<FileDoneOutlined />}>
          Billing
        </Menu.Item>
      </Menu.Section>
      <Menu.Section>
        <Menu.Item key="violet" icon={<LogoutOutlined />}>
          Log out
        </Menu.Item>
      </Menu.Section>
    </Menu>
  );

  return (
    <Layout>
      <Space gap="10x" placeContent="start start" alignItems="start">
        {menu}

        <MenuTrigger>
          <Button type="neutral" padding={0} border={0}>
            <Space gap="1x">
              <Avatar size="4x">
                <Text transform="uppercase">AK</Text>
              </Avatar>
              <CaretDownOutlined
                style={{ color: 'rgba(var(--dark-color-rgb), .75)' }}
              />
            </Space>
          </Button>
          {menu}
        </MenuTrigger>
      </Space>
    </Layout>
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
    <Text nowrap color="#dark-03">
      Suff
    </Text>
  );

  return (
    <Layout>
      <Space gap="10x" placeContent="start start" alignItems="start">
        <Menu id="menu" {...props} header="Git Actions">
          <Menu.Item key="red">Merge to master</Menu.Item>
          <Menu.Item key="orange" mods={{ hovered: true }}>
            Merge to master
          </Menu.Item>
          <Menu.Item key="yellow" postfix="Suff">
            Merge to master
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
            Merge to master
          </Menu.Item>
          <Menu.Item key="purple" postfix={successIcon}>
            Merge to master
          </Menu.Item>
          <Menu.Item key="asdasd" postfix={<Flex gap="0.5x">{bulbIcon}</Flex>}>
            Merge to master
          </Menu.Item>
        </Menu>

        <Menu id="menu-search" {...props}>
          <Menu.Item key="red">
            <SearchInput
              margin="1.5x"
              isClearable
              placeholder="Search or select from list"
            />
          </Menu.Item>
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
      </Space>
    </Layout>
  );
};

export const PaymentDetails = (props) => {
  return (
    <Layout>
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
    </Layout>
  );
};
