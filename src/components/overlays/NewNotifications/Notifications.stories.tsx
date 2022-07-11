import { Meta, Story } from '@storybook/react';
import { Notification, NotificationAction } from './Notification';
import { CubeNotificationProps } from './types';
import { Button } from '../../actions';
import { useNotifications } from './NotificationsProvider';
import { NotificationsList } from './NotificationsList';
import { BellFilled } from '@ant-design/icons';
import { NotificationsDialog, NotificationsDialogTrigger } from './Dialog';
import { Key, useMemo, useState } from 'react';
import { action } from '@storybook/addon-actions';

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
  const { notify } = useNotifications();

  return <Button onPress={() => notify({ ...args })}>Click Me!</Button>;
};

export const DefaultAction = ActionTemplate.bind({});

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
        <NotificationAction key="edit" label="Edit">
          Activate
        </NotificationAction>,
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

export const ClosableNotification = StandaloneNotification.bind({});
ClosableNotification.args = { isClosable: true };

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

export const ComplexInteraction: Story<CubeNotificationProps> = (args) => {
  const [notifications, setNotifications] = useState<
    {
      id: Key;
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
      <ActionTemplate {...args} />

      <NotificationsDialogTrigger>
        <Button icon={<BellFilled />} type="clear" label="Open Notifications" />

        <NotificationsDialog
          onCloseNotificationInBar={(props) => {
            setNotifications((current) => [
              ...current,
              { id: props.id ?? Math.random(), type: props.type },
            ]);
            onCloseNotificationInBarAction(props);
          }}
        >
          <NotificationsList items={notifications}>
            {({ id, type }) => {
              if (type === 'attention') {
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
                  />
                );
              }

              if (type === 'success') {
                return (
                  <NotificationsList.Item
                    key={id}
                    header="Development mode available"
                    type="success"
                    {...args}
                  />
                );
              }

              return <NotificationsList.Item {...args} />;
            }}
          </NotificationsList>
        </NotificationsDialog>
      </NotificationsDialogTrigger>
    </>
  );
};
