import { expect } from '@storybook/jest';
import { Key, useMemo, useState } from 'react';
import { action } from '@storybook/addon-actions';
import { Meta, Story } from '@storybook/react';
import { BellFilled, BellOutlined } from '@ant-design/icons';
import { Button } from '../../actions';
import { Notification, NotificationAction } from './Notification';
import { CubeNotificationProps } from './types';
import { useNotificationsApi } from './hooks';
import { NotificationsList } from './NotificationsList';
import { NotificationsDialog, NotificationsDialogTrigger } from './Dialog';
import { Header } from '../../content/Header';
import { CloudLogo } from '../../other/CloudLogo/CloudLogo';
import { Flex } from '../../layout/Flex';
import { userEvent, within } from '@storybook/testing-library';

export default {
  title: 'Overlays/Notifications',
  component: Notification,
  args: {
    header: 'Development mode available',
    description: 'Edit and test your schema without affecting the production.',
  },
  subcomponents: { Action: NotificationAction },
} as Meta<CubeNotificationProps>;

const ActionTemplate: Story<CubeNotificationProps> = (args) => {
  const { notify } = useNotificationsApi();

  return <Button onPress={() => notify({ ...args })}>Click Me!</Button>;
};

export const DefaultAction = ActionTemplate.bind({});
DefaultAction.play = async ({ canvasElement }) => {
  const { getByRole, getByTestId } = within(canvasElement);

  const button = getByRole('button');
  await userEvent.click(button);

  const notification = getByTestId('floating-notification');

  await expect(notification).toBeInTheDocument();
};

export const StandaloneNotification: Story<CubeNotificationProps> = (args) => (
  <Notification {...args} />
);

export const AllTypes: Story<CubeNotificationProps> = () => (
  <>
    <Notification
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
    <Notification
      type="attention"
      description="Edit and test your schema without affecting the production."
    />
    <Notification
      type="danger"
      header="Your Cube.js api is down"
      actions={<NotificationAction>Restart</NotificationAction>}
    />
  </>
);

export const WithActions = StandaloneNotification.bind({});
WithActions.args = {
  actions: (
    <>
      <NotificationAction>Activate</NotificationAction>
      <NotificationAction type="secondary">
        Don't show this again
      </NotificationAction>
    </>
  ),
};

export const List: Story<CubeNotificationProps> = (args) => (
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
      <NotificationAction type="secondary">
        Don't show this again
      </NotificationAction>
    </>
  ),
};

export const NotificationsInModal: Story<CubeNotificationProps> = (args) => {
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
                      <NotificationAction>Update</NotificationAction>
                      <NotificationAction type="secondary">
                        Don't show this again
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

export const ComplexInteraction: Story<CubeNotificationProps> = (args) => {
  const { notify } = useNotificationsApi();

  const [notifications, setNotifications] = useState<
    {
      id?: Key;
      type: CubeNotificationProps['type'];
    }[]
  >([
    { id: '1', type: 'attention' },
    { id: '2', type: 'danger' },
  ]);

  const onCloseNotificationInBarAction = useMemo(
    () => action('onCloseNotificationInBar'),
    [],
  );

  return (
    <>
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
              { id: props.id, type: props.type, ...props },
            ]);
            onCloseNotificationInBarAction(props);
          }}
        >
          <Button
            icon={<BellOutlined />}
            type="clear"
            label="Open Notifications"
          />

          <NotificationsDialog>
            <NotificationsList items={notifications}>
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
                      header="Development mode available"
                      type="success"
                      {...props}
                    />
                  );
                }

                return <NotificationsList.Item {...args} />;
              }}
            </NotificationsList>
          </NotificationsDialog>
        </NotificationsDialogTrigger>
      </Header>

      <Flex justifyContent="center" margin="8x">
        <Button onPress={() => notify(args)}>Show notification</Button>
      </Flex>
    </>
  );
};

ComplexInteraction.args = {
  actions: <NotificationAction>Test</NotificationAction>,
};
