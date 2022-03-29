import { ModalProvider } from '@react-aria/overlays';
import {
  CaretDownOutlined,
  DeploymentUnitOutlined,
  FileDoneOutlined,
  BellOutlined,
  LogoutOutlined,
  UsergroupAddOutlined,
  AreaChartOutlined,
  FolderOpenOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import {
  Menu,
  Section,
  MenuTrigger,
  Item,
  Action,
  Button,
} from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Pickers/Menu',
  component: Menu,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    onPress: { action: 'press' },
    onAction: { action: 'action' },
  },
};

const Template = ({ icon, trigger, ...props }) => {
  const menu = (
    <Menu id="menu" {...props}>
      <Item key="red">Red</Item>
      <Item key="orange">Orange</Item>
      <Item key="yellow">Yellow</Item>
      <Item key="green">Green</Item>
      <Item key="blue">Blue</Item>
      <Item key="purple">Purple</Item>
      <Section aria-label="some">
        <Item key="violet">
          <Button
            type="neutral"
            icon={<LogoutOutlined />}
            styles={BUTTON_STYLES}
            onPress={logout}
          >
            Log out
          </Button>
        </Item>
      </Section>
    </Menu>
  );

  console.log('Template', { icon, trigger, ...props });

  if (trigger) {
    return (
      <ModalProvider>
        <MenuTrigger>
          <Action>Trigger Menu</Action>
          {menu}
        </MenuTrigger>
      </ModalProvider>
    );
  }

  return <ModalProvider>{menu}</ModalProvider>;
};

export const Default = Template.bind({});
Default.args = {};

export const WithTrigger = Template.bind({});
WithTrigger.args = { trigger: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };
