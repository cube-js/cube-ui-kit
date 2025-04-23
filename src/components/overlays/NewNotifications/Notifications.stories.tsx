import { BellFilled, BellOutlined, WechatFilled } from '@ant-design/icons';
import { Meta, StoryFn } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Key, useRef, useState } from 'react';

import { wait } from '../../../test';
import { Button } from '../../actions';
import { Content } from '../../content/Content';
import { Footer } from '../../content/Footer';
import { Header } from '../../content/Header';
import { Paragraph } from '../../content/Paragraph';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';
import { Flex } from '../../layout/Flex';
import { CloudLogo } from '../../other/CloudLogo/CloudLogo';
import { Dialog, DialogTrigger } from '../Dialog';

import { NotificationsDialog, NotificationsDialogTrigger } from './Dialog';
import { useNotificationsApi } from './hooks';
import { Notification } from './Notification';
import { NotificationsList } from './NotificationsList';
import { NotificationAction, NotificationView } from './NotificationView';
import { CubeNotificationProps } from './types';

export default {
  title: 'Overlays/Notifications',
  component: NotificationView,
  argTypes: {
    attributes: { table: { disable: true } },
    styles: { table: { disable: true } },
    timer: { table: { disable: true } },
    duration: { type: 'number' },
    id: { type: 'string' },
  },
  args: {
    header: 'Development mode available',
    description: 'Edit and test your schema without affecting the production.',
  },
  subcomponents: { NotificationAction },
} as Meta<CubeNotificationProps>;

const ActionTemplate: StoryFn<CubeNotificationProps> = ({ ...args }) => {
  const { notify } = useNotificationsApi();
  const idRef = useRef(0);

  return (
    <Button
      qa="ClickMeButton"
      onPress={() =>
        notify({
          ...args,
          header: args.header + ' ' + idRef.current++,
        } as CubeNotificationProps)
      }
    >
      Click Me!
    </Button>
  );
};
ActionTemplate.play = async ({ canvasElement }) => {
  const { getByTestId } = within(canvasElement);

  const button = getByTestId('ClickMeButton');
  await userEvent.click(button);

  const notification = getByTestId('FloatingNotification');

  await expect(notification).toBeInTheDocument();
};

export const DefaultAction = ActionTemplate.bind({});
DefaultAction.play = ActionTemplate.play;

export const NotifyAsComponent: StoryFn<CubeNotificationProps> = (args) => {
  return (
    <>
      <Notification.Success {...args} />
      <Notification.Danger {...args} />
      <Notification.Attention {...args} />
      <Notification
        actions={
          <>
            <NotificationAction>Check logs</NotificationAction>
            <NotificationAction>Upload updated Cube project</NotificationAction>
          </>
        }
        {...args}
      />
    </>
  );
};

export const StandaloneNotification: StoryFn<CubeNotificationProps> = (
  args,
) => <NotificationView {...args} />;

export const WithIcon: StoryFn<CubeNotificationProps> = (args) => {
  return (
    <>
      <NotificationView
        {...args}
        header=""
        icon={<BellOutlined style={{ display: 'flex', alignSelf: 'center' }} />}
      />
      <NotificationView
        {...args}
        icon={<BellOutlined style={{ display: 'flex', alignSelf: 'center' }} />}
      />
      <NotificationView
        {...args}
        icon={<BellOutlined style={{ display: 'flex', alignSelf: 'center' }} />}
        header=""
        actions={
          <>
            <NotificationAction>Test</NotificationAction>
            <NotificationAction>Alternative</NotificationAction>
          </>
        }
      />
    </>
  );
};

export const WithLongDescription = StandaloneNotification.bind({});
WithLongDescription.args = {
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eu consectetur consectetur, nisl nisl consectetur nisl, euismod nisl nisl euismod nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eu consectetur consectetur, nisl nisl consectetur nisl, euismod nisl nisl euismod nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eu consectetur consectetur, nisl nisl consectetur nisl, euismod nisl nisl euismod nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eu consectetur consectetur, nisl nisl consectetur nisl, euismod nisl nisl euismod nisl.',
};

export const AllTypes: StoryFn<CubeNotificationProps> = () => (
  <>
    <NotificationView
      type="success"
      header="Development mode available"
      description="Edit and test your schema without affecting the production."
      actions={[
        <NotificationAction key="edit">Activate</NotificationAction>,
        <NotificationAction key="test">
          Never show this again
        </NotificationAction>,
      ]}
    />
    <NotificationView
      type="attention"
      description="Edit and test your schema without affecting the production."
    />
    <NotificationView
      type="danger"
      header="Your Cube.js api is down"
      description="Please check your network connection."
      actions={<NotificationAction>Restart</NotificationAction>}
    />
  </>
);

export const WithActions = StandaloneNotification.bind({});
WithActions.args = {
  actions: (
    <>
      <NotificationAction>Activate</NotificationAction>
      <NotificationAction>Don't show this again</NotificationAction>
    </>
  ),
};

export const List: StoryFn<CubeNotificationProps> = (args) => (
  <NotificationsList>
    <NotificationsList.Item {...args} />
    <NotificationsList.Item {...args} />
    <NotificationsList.Item {...args} />
  </NotificationsList>
);

List.args = {
  actions: (
    <>
      <NotificationAction>Activate</NotificationAction>
      <NotificationAction>Don't show this again</NotificationAction>
    </>
  ),
};

export const NotificationsInModal: StoryFn<CubeNotificationProps> = (args) => {
  return (
    <NotificationsDialogTrigger>
      <Button icon={<BellFilled />} type="clear" label="Open Notifications" />

      <NotificationsDialog>
        <NotificationsList
          items={[
            { id: '1', type: 'update' },
            { id: '2', type: 'error' },
          ]}
        >
          {({ id, type }) => {
            if (type === 'update') {
              return (
                <NotificationsList.Item
                  key={id}
                  type="attention"
                  header="Update available"
                  description="Click to update your schema."
                  actions={
                    <>
                      <NotificationAction>Check logs</NotificationAction>
                      <NotificationAction>
                        Upload updated Cube project
                      </NotificationAction>
                    </>
                  }
                />
              );
            }
            if (type === 'error') {
              return (
                <NotificationsList.Item
                  key={id}
                  type="danger"
                  header="Error"
                  description="Click to view the error."
                  actions={<NotificationAction to="/">View</NotificationAction>}
                />
              );
            }

            return <NotificationsList.Item {...args} />;
          }}
        </NotificationsList>
      </NotificationsDialog>
    </NotificationsDialogTrigger>
  );
};

NotificationsInModal.args = {
  actions: (
    <>
      <NotificationAction>Activate</NotificationAction>
      <NotificationAction type="secondary">
        Don't show this again
      </NotificationAction>
    </>
  ),
};

NotificationsInModal.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await userEvent.click(canvas.getByRole('button'));
  await expect(canvas.getByRole('dialog')).toBeInTheDocument();
};

export const NotificationWithDialog: StoryFn<CubeNotificationProps> = (
  args,
) => (
  <DialogTrigger>
    <Button>Open Dialog</Button>

    <Dialog>
      <Header>
        <Title>Modal title</Title>
      </Header>
      <Content>
        <Paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus nec
          ante in ex ultricies faucibus ac quis turpis. Suspendisse nec interdum
          erat, rutrum dapibus ex. Proin rutrum auctor nisi, vitae congue nibh
          aliquam a. Vestibulum quis libero mattis, facilisis orci at, consequat
          metus. Quisque et molestie massa. Mauris eu volutpat magna, quis
          posuere leo. Suspendisse potenti. Morbi hendrerit rutrum purus, ac
          accumsan erat semper a. Donec vitae sem finibus, tincidunt nulla eget,
          accumsan nibh. Proin nec mi commodo, commodo ex ac, porttitor arcu.
          Nullam lacinia ex eget purus suscipit pellentesque. Curabitur
          vulputate sit amet velit eget lacinia. Sed bibendum, velit in lacinia
          imperdiet, nibh nisi mollis urna, nec porta elit odio et urna.
        </Paragraph>
      </Content>
      <Footer>
        <Button.Group>
          <Button type="primary">Action</Button>
          <Button>Cancel</Button>
        </Button.Group>
      </Footer>

      <Notification.Success {...args} />
      <Notification.Danger {...args} />
      <Notification.Attention {...args} />
    </Dialog>
  </DialogTrigger>
);

NotificationWithDialog.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await userEvent.click(canvas.getByRole('button'));
  await expect(await canvas.findByRole('dialog')).toBeInTheDocument();
};

export const ComplexInteraction: StoryFn<CubeNotificationProps> = (args) => {
  const { notify } = useNotificationsApi();

  const [notifications, setNotifications] = useState<
    { id?: Key; type: CubeNotificationProps['type'] }[]
  >([
    { id: 'id1', type: 'attention' },
    { id: 'id2', type: 'danger' },
  ]);

  return (
    <Flex flow="column" height="100vh min">
      <Header
        display="flex"
        flow="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <CloudLogo />

        <NotificationsDialogTrigger
          onCloseNotificationInBar={(props) => {
            setNotifications((current) => [
              ...current,
              { type: props.type, ...props },
            ]);
          }}
        >
          <Button
            icon={<BellOutlined />}
            type="clear"
            label="Open Notifications"
          />

          <NotificationsDialog>
            {notifications.length > 0 ? (
              <NotificationsList
                items={notifications}
                onDismiss={(id) => {
                  setNotifications((current) =>
                    current.filter((item) => item.id !== id),
                  );
                }}
              >
                {({ id, type, ...props }) => {
                  if (type === 'attention') {
                    return (
                      <NotificationsList.Item
                        key={id}
                        type="attention"
                        header="Update available"
                        description="Click to update your schema."
                        actions={[
                          <NotificationAction key="upd">
                            Update
                          </NotificationAction>,
                          <NotificationAction key="hide">
                            Don't show this again
                          </NotificationAction>,
                        ]}
                        {...props}
                      />
                    );
                  }

                  if (type === 'danger') {
                    return (
                      <NotificationsList.Item
                        key={id}
                        type="danger"
                        header="Error"
                        description="Click to view the error."
                        actions={
                          <NotificationAction to="/">View</NotificationAction>
                        }
                        {...props}
                      />
                    );
                  }

                  if (type === 'success') {
                    return (
                      <NotificationsList.Item
                        key={id}
                        description="Development mode available"
                        type="success"
                        {...props}
                      />
                    );
                  }

                  return <NotificationsList.Item {...args} />;
                }}
              </NotificationsList>
            ) : (
              <Flex padding="5x 4x" textAlign="center" margin="auto">
                <Text.Minor>No notifications 🎉</Text.Minor>
              </Flex>
            )}
          </NotificationsDialog>
        </NotificationsDialogTrigger>
      </Header>

      <Flex justifyContent="center" margin="8x">
        <Button onPress={() => notify(args)}>Show notification</Button>
      </Flex>
    </Flex>
  );
};

ComplexInteraction.args = {
  actions: <NotificationAction>Test</NotificationAction>,
};
ComplexInteraction.parameters = {
  docs: { source: { type: 'code' } },
};

export const WithLongActions = ActionTemplate.bind({});
WithLongActions.args = {
  actions: (
    <>
      <NotificationAction>Lorem Ipsum dolor sit amet</NotificationAction>
      <NotificationAction>
        Alternative very long text haha Alternative very long text haha
      </NotificationAction>
    </>
  ),
};

WithLongActions.play = async ({ canvasElement }) => {
  const { getByRole, getByTestId } = within(canvasElement);

  await userEvent.click(getByRole('button'));
  const notification = getByTestId('FloatingNotification');

  await expect(notification).toBeInTheDocument();
};

export const WithWidget: StoryFn<CubeNotificationProps> = (args) => (
  <>
    <ActionTemplate {...args} />
    <Button
      icon={<WechatFilled />}
      size="large"
      style={{
        zIndex: 2147483000,
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        boxShadow:
          'rgb(0 0 0 / 6%) 0px 1px 6px 0px, rgb(0 0 0 / 16%) 0px 2px 32px 0px',
      }}
    />
  </>
);

WithWidget.play = ActionTemplate.play;

export const NotificationsQueue = ActionTemplate.bind({});
NotificationsQueue.play = async ({ canvasElement }) => {
  const timeouts = [780, 580, 480, 494, 743, 749, 680, 750, 569, 510];

  const { getByTestId } = within(canvasElement);
  const button = getByTestId('ClickMeButton');

  for await (const timeout of timeouts) {
    await userEvent.click(button);
    await wait(timeout);
  }
};
