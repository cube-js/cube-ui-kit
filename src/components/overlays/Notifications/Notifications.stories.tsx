import { ReactNode, useRef, useState } from 'react';

import { Button } from '../../actions/Button/Button';
import { Text } from '../../content/Text';
import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';

import {
  Notification,
  NotificationAction,
  NotificationItem,
  OverlayProvider,
  PersistentNotificationsList,
  useNotifications,
  useNotificationsCount,
  usePersistentNotifications,
} from './index';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { InternalNotification } from './types';

// ─── Decorator wrapper (stable reference for HMR) ────────────────────

function WithOverlayProvider({ children }: { children: ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>;
}

// ─── Meta ────────────────────────────────────────────────────────────

const meta = {
  title: 'Overlays/Notification',
  component: NotificationItem,
  decorators: [
    (Story) => (
      <WithOverlayProvider>
        <Story />
      </WithOverlayProvider>
    ),
  ],
  argTypes: {
    /* Presentation */
    theme: {
      control: { type: 'radio' },
      options: ['success', 'danger', 'warning', 'note'],
      description: 'Visual theme of the notification',
    },
  },
} satisfies Meta<typeof NotificationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Helper: create a mock InternalNotification ──────────────────────

function mockNotification(
  overrides: Partial<InternalNotification> = {},
): InternalNotification {
  return {
    internalId: 'mock-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDismissible: true,
    actions: (
      <>
        <NotificationAction onPress={() => {}}>Open</NotificationAction>
        <NotificationAction isDismiss>Later</NotificationAction>
      </>
    ),
    ...overrides,
  };
}

// ─── Static Item Preview ─────────────────────────────────────────────

/**
 * Static NotificationItem preview showing all themes.
 */
export const AllTypes = () => (
  <Space gap="1x" flow="column">
    <NotificationItem
      notification={mockNotification({
        theme: 'success',
        title: 'Deployment completed',
        description: 'Version 1.4.2 is live.',
      })}
      onDismiss={() => {}}
    />
    <NotificationItem
      notification={mockNotification({
        theme: 'danger',
        title: 'Build failed',
        description: 'Check the logs for details.',
      })}
      onDismiss={() => {}}
    />
    <NotificationItem
      notification={mockNotification({
        theme: 'warning',
        title: 'Trial ends soon',
        description: 'Your trial ends in 2 days.',
      })}
      onDismiss={() => {}}
    />
    <NotificationItem
      notification={mockNotification({
        theme: 'note',
        title: 'New feature available',
        description: 'Try the new dashboard layout.',
      })}
      onDismiss={() => {}}
    />
  </Space>
);

// ─── Imperative API ──────────────────────────────────────────────────

/**
 * Using useNotifications hook to show notifications programmatically.
 */
export const ImperativeAPI = () => {
  const { notify } = useNotifications();

  return (
    <Space gap="1x">
      <Button
        onPress={() =>
          notify({
            id: `deploy:${Date.now()}`,
            theme: 'success',
            title: 'Deployment completed',
            description: 'Version 1.4.2 is live.',
            actions: (
              <>
                <Notification.Action onPress={() => alert('Opening logs')}>
                  View logs
                </Notification.Action>
                <Notification.Action
                  onPress={() => alert('Opening deployment')}
                >
                  Open
                </Notification.Action>
              </>
            ),
          })
        }
      >
        Success Notification
      </Button>
      <Button
        onPress={() =>
          notify({
            id: `error:${Date.now()}`,
            theme: 'danger',
            title: 'Build failed',
            description: 'Check the logs for details.',
            actions: (
              <Notification.Action onPress={() => alert('Opening logs')}>
                View logs
              </Notification.Action>
            ),
          })
        }
      >
        Danger Notification
      </Button>
      <Button
        onPress={() =>
          notify({
            id: `warn:${Date.now()}`,
            theme: 'warning',
            title: 'Trial ends soon',
            description: 'Your trial ends in 2 days.',
            actions: (
              <>
                <Notification.Action onPress={() => alert('View plans')}>
                  View plans
                </Notification.Action>
                <Notification.Action isDismiss>Later</Notification.Action>
              </>
            ),
          })
        }
      >
        Warning Notification
      </Button>
      <Button
        onPress={() =>
          notify({
            id: `note:${Date.now()}`,
            theme: 'note',
            title: 'New feature available',
            description: 'Try the new dashboard layout.',
            actions: (
              <Notification.Action onPress={() => alert('Try it')}>
                Try it
              </Notification.Action>
            ),
          })
        }
      >
        Note Notification
      </Button>
      <Button
        onPress={() =>
          notify({
            id: `dismiss-only:${Date.now()}`,
            theme: 'success',
            title: 'Saved successfully',
            description: 'No actions — only the default dismiss button.',
          })
        }
      >
        Dismiss Only (no actions)
      </Button>
    </Space>
  );
};

ImperativeAPI.parameters = {
  docs: {
    description: {
      story:
        'Use `useNotifications()` hook to show notifications programmatically with actions. When `actions` is omitted, only the default "Dismiss" button is shown.',
    },
  },
};

// ─── Declarative API ─────────────────────────────────────────────────

/**
 * Declarative Notification component - visible while mounted.
 */
export const DeclarativeNotification = () => {
  const [showNotification, setShowNotification] = useState(false);

  return (
    <Space gap="1x">
      <Button onPress={() => setShowNotification(!showNotification)}>
        {showNotification ? 'Hide Notification' : 'Show Notification'}
      </Button>
      {showNotification && (
        <Notification
          id="release:new-version"
          theme="warning"
          title="New release available"
          description="2.0.0 can be installed now."
          actions={
            <>
              <Notification.Action onPress={() => alert('Upgrade')}>
                Upgrade
              </Notification.Action>
              <Notification.Action isDismiss>Later</Notification.Action>
            </>
          }
        />
      )}
    </Space>
  );
};

DeclarativeNotification.parameters = {
  docs: {
    description: {
      story:
        'Declarative `<Notification>` component that shows while mounted and dismisses on unmount.',
    },
  },
};

// ─── Custom Dismiss Action ───────────────────────────────────────────

/**
 * Custom dismiss button with `isDismiss`.
 * When any `NotificationAction` has `isDismiss`, the auto-appended default
 * "Dismiss" button is suppressed automatically via context detection.
 */
export const CustomDismissAction = () => {
  const { notify } = useNotifications();

  return (
    <Space gap="1x">
      <Button
        onPress={() =>
          notify({
            id: `custom-dismiss:${Date.now()}`,
            theme: 'warning',
            title: 'Trial ends soon',
            description: 'Your trial expires in 2 days.',
            actions: (
              <>
                <Notification.Action onPress={() => alert('View plans')}>
                  View plans
                </Notification.Action>
                <Notification.Action isDismiss>Later</Notification.Action>
              </>
            ),
          })
        }
      >
        Custom Dismiss Label
      </Button>
      <Button
        onPress={() =>
          notify({
            id: `default-dismiss:${Date.now()}`,
            theme: 'success',
            title: 'Deployment completed',
            description:
              'No custom dismiss — default "Dismiss" button is auto-appended.',
            actions: (
              <Notification.Action onPress={() => alert('View')}>
                View
              </Notification.Action>
            ),
          })
        }
      >
        Default Dismiss
      </Button>
      <Button
        onPress={() =>
          notify({
            id: `consent:${Date.now()}`,
            theme: 'note',
            title: 'Cookie consent',
            description: 'We use cookies to improve your experience.',
            isDismissible: false,
            duration: null,
            actions: (
              <>
                <Notification.Action onPress={() => alert('Accepted!')}>
                  Accept
                </Notification.Action>
                <Notification.Action onPress={() => alert('Declined!')}>
                  Decline
                </Notification.Action>
              </>
            ),
          })
        }
      >
        Non-Dismissible (actions only)
      </Button>
    </Space>
  );
};

CustomDismissAction.parameters = {
  docs: {
    description: {
      story:
        'Use `<Notification.Action isDismiss>` to provide a custom dismiss button label — the default "Dismiss" is automatically suppressed via context detection. When `isDismissible: false`, the notification has no dismiss mechanism — only explicit actions with `onPress` handlers.',
    },
  },
};

// ─── Update by ID ────────────────────────────────────────────────────

/**
 * Updating a notification in-place by reusing the same id.
 */
export const UpdateById = () => {
  const { notify } = useNotifications();
  const [step, setStep] = useState(0);

  const handleClick = () => {
    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep === 1) {
      notify({
        id: 'sync:workspace-42',
        theme: 'warning',
        title: 'Sync in progress',
        description: 'Uploading metadata...',
        persistent: true,
        duration: null,
        actions: (
          <Notification.Action onPress={() => alert('Details')}>
            Details
          </Notification.Action>
        ),
      });
    } else {
      notify({
        id: 'sync:workspace-42',
        theme: 'success',
        title: 'Sync complete',
        description: 'All files are up to date.',
        persistent: true,
        actions: (
          <Notification.Action onPress={() => alert('Open')}>
            Open
          </Notification.Action>
        ),
      });
      setStep(0);
    }
  };

  return (
    <Button onPress={handleClick}>
      {step === 0 ? 'Start Sync' : 'Complete Sync'}
    </Button>
  );
};

UpdateById.parameters = {
  docs: {
    description: {
      story:
        'Calling `notify()` with the same `id` performs an in-place update. Timer resets when `title` changes.',
    },
  },
};

// ─── Persistent Notifications ────────────────────────────────────────

/**
 * Persistent notifications that move to the persistent list when dismissed
 * from the overlay (dismiss button, Escape, or timeout). Clicking a regular
 * action (not dismiss) fully removes the notification.
 */
export const PersistentNotifications = () => {
  const { notify, record } = useNotifications();
  const { count, clear } = usePersistentNotifications();
  const counterRef = useRef(0);

  return (
    <Flex gap="2x" flow="column" width="60x">
      <Space gap="1x">
        <Button
          onPress={() => {
            counterRef.current++;
            notify({
              id: `persistent:${counterRef.current}`,
              theme: 'success',
              title: `Deployment #${counterRef.current} completed`,
              description: 'Version is live.',
              persistent: true,
              actions: (
                <Notification.Action onPress={() => alert('View')}>
                  View
                </Notification.Action>
              ),
            });
          }}
        >
          Add Persistent Notification
        </Button>
        <Button
          onPress={() => {
            counterRef.current++;
            record({
              id: `stored:${counterRef.current}`,
              theme: 'warning',
              title: `Server alert #${counterRef.current}`,
              description: 'Check server health.',
              actions: (
                <Notification.Action
                  onPress={() =>
                    alert(`View details for stored:${counterRef.current}`)
                  }
                >
                  View details
                </Notification.Action>
              ),
            });
          }}
        >
          Add Stored Notification
        </Button>
        {count > 0 && <Button onPress={clear}>Clear All ({count})</Button>}
      </Space>

      <PersistentNotificationsList emptyState="No notifications yet. Click a button above to add some." />
    </Flex>
  );
};

PersistentNotifications.parameters = {
  docs: {
    description: {
      story:
        'Persistent notifications remain in the list after timeout dismissal. Stored notifications go directly to the list without overlay.',
    },
  },
};

// ─── Persistent Count Badge ──────────────────────────────────────────

/**
 * Using useNotificationsCount for badge display with unread tracking.
 */
export const UnreadCountBadge = () => {
  const { record } = useNotifications();
  const { total, unread } = useNotificationsCount();
  const { remove, clear } = usePersistentNotifications();
  const [showList, setShowList] = useState(false);
  const counterRef = useRef(0);

  return (
    <Flex gap="2x" flow="column" width="60x">
      <Space gap="1x">
        <Button
          onPress={() => {
            counterRef.current++;
            record({
              id: `count-demo:${counterRef.current}`,
              theme: 'note',
              title: `Notification #${counterRef.current}`,
              description: 'A stored notification.',
            });
          }}
        >
          Add Stored
        </Button>
        <Button onPress={() => setShowList(!showList)}>
          {showList ? 'Hide List' : 'Show List'}
          {unread > 0 && ` (${unread} unread)`}
        </Button>
        {total > 0 && <Button onPress={clear}>Clear All ({total})</Button>}
      </Space>
      <Text>
        Total: <strong>{total}</strong> · Unread: <strong>{unread}</strong>
      </Text>
      {showList && (
        <PersistentNotificationsList
          emptyState="No notifications"
          onDismissItem={(item) => remove(item.id)}
        />
      )}
    </Flex>
  );
};

UnreadCountBadge.parameters = {
  docs: {
    description: {
      story:
        'Use `useNotificationsCount()` for total and unread counts. Unread count resets when `PersistentNotificationsList` renders (after 2s delay).',
    },
  },
};

// ─── Multiple Notifications (Stack Cap) ──────────────────────────────

/**
 * Demonstrates the 5-item visible cap for notifications.
 */
export const StackCap = () => {
  const { notify } = useNotifications();
  const counterRef = useRef(0);

  return (
    <Space gap="1x">
      <Button
        onPress={() => {
          counterRef.current++;
          notify({
            id: `stack:${counterRef.current}`,
            theme: (['success', 'danger', 'warning', 'note'] as const)[
              counterRef.current % 4
            ],
            title: `Notification ${counterRef.current}`,
            description: `This is notification number ${counterRef.current}`,
            actions: (
              <Notification.Action onPress={() => alert('Details')}>
                Details
              </Notification.Action>
            ),
          });
        }}
      >
        Add Notification
      </Button>
    </Space>
  );
};

StackCap.parameters = {
  docs: {
    description: {
      story:
        'Maximum 5 notifications are visible at once. Excess notifications are queued and shown as earlier ones are dismissed.',
    },
  },
};
