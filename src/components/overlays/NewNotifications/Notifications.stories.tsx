import { Meta, Story } from '@storybook/react';
import { Notification, NotificationAction } from './Notification';
import { CubeNotificationProps } from './types';
import { Button } from '../../actions';
import { useNotifications } from './NotificationsProvider';
import { NotificationsList } from './NotificationsList';
import { useRef } from 'react';
import { BellFilled } from '@ant-design/icons';
import {
  NotificationsDialog,
  NotificationsDialogTrigger,
} from './NotificationsDialog/NotificationsDialogTrigger';

export default {
  title: 'Overlays/Notifications',
  component: Notification,
  args: {
    header: 'Development mode available',
    description: 'Edit and test your schema without affecting the production.',
  },
  subcomponents: { NotificationAction: NotificationAction },
} as Meta<CubeNotificationProps>;

const ActionTemplate: Story<CubeNotificationProps> = (args) => {
  const pressesRef = useRef(0);
  const { notify } = useNotifications();

  return (
    <Button
      onPress={() => {
        notify({
          ...args,
          header: `Development mode available ${pressesRef.current++}`,
        });
      }}
    >
      Click Me!
    </Button>
  );
};

export const DefaultAction = ActionTemplate.bind({});

export const StandaloneNotification: Story<CubeNotificationProps> = (args) => {
  return <Notification {...args} />;
};

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
        <NotificationsList>
          <NotificationsList.Item {...args} />
          <NotificationsList.Item {...args} />
          <NotificationsList.Item {...args} />
          <NotificationsList.Item {...args} />
          <NotificationsList.Item {...args} />
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
