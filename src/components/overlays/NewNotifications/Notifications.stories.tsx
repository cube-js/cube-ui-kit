import { Meta, Story } from '@storybook/react';
import { Notification } from './Notification';
import { CubeNotificationProps } from './types';
import { Button } from '../../actions';
import { useNotifications } from './use-notifications';
import { NotificationsList } from './NotificationsList';

export default {
  title: 'Overlays/Notifications',
  component: Notification,
  args: {
    header: 'Development mode available',
    description: 'Edit and test your schema without affecting the production.',
  },
  subcomponents: { NotificationAction: Notification.Action },
} as Meta<CubeNotificationProps>;

const ActionTemplate: Story<CubeNotificationProps> = (args) => {
  const { notify } = useNotifications();

  return (
    <Button
      onPress={() => {
        notify({ ...args });
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
      <Notification.Action>Activate</Notification.Action>
      <Notification.Action type="secondary">
        Don't show this again
      </Notification.Action>
    </>
  ),
};

export const List: Story<CubeNotificationProps> = (args) => {
  return (
    <NotificationsList>
      <NotificationsList.Item {...args} />
      <NotificationsList.Item {...args} />
      <NotificationsList.Item {...args} />
    </NotificationsList>
  );
};
