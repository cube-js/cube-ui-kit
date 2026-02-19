import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement, ReactNode, useState } from 'react';

import { Button } from '../../actions/Button/Button';
import { Root } from '../../Root';

import { formatRelativeTime } from './format-relative-time';
import { Notification } from './Notification';
import { NotificationAction } from './NotificationAction';
import { NotificationItem } from './NotificationItem';
import { OverlayProvider } from './OverlayProvider';
import { PersistentNotificationsList } from './PersistentNotificationsList';
import { useNotifications } from './use-notifications';
import {
  useNotificationsCount,
  usePersistentNotifications,
} from './use-persistent-notifications';

import type { InternalNotification } from './types';

vi.mock('../../../_internal/hooks/use-warn');

// ─── Test Wrapper ────────────────────────────────────────────────────

function OverlayWrapper({ children }: { children: ReactNode }) {
  return (
    <Root>
      <OverlayProvider>{children}</OverlayProvider>
    </Root>
  );
}

function renderWithOverlay(ui: ReactElement) {
  return render(ui, { wrapper: OverlayWrapper });
}

// ─── Helper: mock notification ───────────────────────────────────────

function mockNotification(
  overrides: Partial<InternalNotification> = {},
): InternalNotification {
  return {
    internalId: 'mock-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDismissible: true,
    actions: <NotificationAction>OK</NotificationAction>,
    ...overrides,
  };
}

// ─── formatRelativeTime ──────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('should return "just now" for timestamps less than 1 minute ago', () => {
    expect(formatRelativeTime(Date.now())).toBe('just now');
    expect(formatRelativeTime(Date.now() - 30_000)).toBe('just now');
  });

  it('should return "N min ago" for timestamps 1-59 minutes ago', () => {
    expect(formatRelativeTime(Date.now() - 60_000)).toBe('1 min ago');
    expect(formatRelativeTime(Date.now() - 5 * 60_000)).toBe('5 min ago');
    expect(formatRelativeTime(Date.now() - 59 * 60_000)).toBe('59 min ago');
  });

  it('should return "N h ago" for timestamps 1-23 hours ago', () => {
    expect(formatRelativeTime(Date.now() - 60 * 60_000)).toBe('1 h ago');
    expect(formatRelativeTime(Date.now() - 3 * 60 * 60_000)).toBe('3 h ago');
    expect(formatRelativeTime(Date.now() - 23 * 60 * 60_000)).toBe('23 h ago');
  });

  it('should return "N d ago" for timestamps 1-6 days ago', () => {
    expect(formatRelativeTime(Date.now() - 24 * 60 * 60_000)).toBe('1 d ago');
    expect(formatRelativeTime(Date.now() - 6 * 24 * 60 * 60_000)).toBe(
      '6 d ago',
    );
  });

  it('should return "N w ago" for timestamps 1-4 weeks ago', () => {
    expect(formatRelativeTime(Date.now() - 7 * 24 * 60 * 60_000)).toBe(
      '1 w ago',
    );
    expect(formatRelativeTime(Date.now() - 21 * 24 * 60 * 60_000)).toBe(
      '3 w ago',
    );
  });

  it('should return "N mo ago" for timestamps 1-11 months ago', () => {
    expect(formatRelativeTime(Date.now() - 30 * 24 * 60 * 60_000)).toBe(
      '1 mo ago',
    );
    expect(formatRelativeTime(Date.now() - 90 * 24 * 60 * 60_000)).toBe(
      '3 mo ago',
    );
  });

  it('should return "N y ago" for timestamps 1+ years ago', () => {
    expect(formatRelativeTime(Date.now() - 365 * 24 * 60 * 60_000)).toBe(
      '1 y ago',
    );
    expect(formatRelativeTime(Date.now() - 730 * 24 * 60 * 60_000)).toBe(
      '2 y ago',
    );
  });

  it('should return "just now" for future timestamps', () => {
    expect(formatRelativeTime(Date.now() + 60_000)).toBe('just now');
  });
});

// ─── NotificationItem ────────────────────────────────────────────────

describe('NotificationItem', () => {
  it('should render with title and description', () => {
    const { getByText } = render(
      <NotificationItem
        notification={mockNotification({
          title: 'Test title',
          description: 'Test description',
        })}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Test title')).toBeInTheDocument();
    expect(getByText('Test description')).toBeInTheDocument();
  });

  it('should render Dismiss action when isDismissible', () => {
    const { getByText } = render(
      <NotificationItem
        notification={mockNotification({ isDismissible: true })}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Dismiss')).toBeInTheDocument();
  });

  it('should not render Dismiss action when not isDismissible', () => {
    const { queryByText } = render(
      <NotificationItem
        notification={mockNotification({ isDismissible: false })}
        onDismiss={() => {}}
      />,
    );

    expect(queryByText('Dismiss')).not.toBeInTheDocument();
  });

  it('should auto-suppress default Dismiss when isDismiss action is present', () => {
    const { queryAllByText, getByText } = render(
      <NotificationItem
        notification={mockNotification({
          isDismissible: true,
          actions: (
            <>
              <NotificationAction isDismiss>Got it</NotificationAction>
              <NotificationAction onPress={() => {}}>View</NotificationAction>
            </>
          ),
        })}
        onDismiss={() => {}}
      />,
    );

    // Custom dismiss action should be present
    expect(getByText('Got it')).toBeInTheDocument();
    // Default "Dismiss" should NOT be auto-appended (detected via context)
    expect(queryAllByText('Dismiss')).toHaveLength(0);
  });

  it('should auto-append Dismiss when no isDismiss action is present', () => {
    const { getByText } = render(
      <NotificationItem
        notification={mockNotification({
          isDismissible: true,
          actions: (
            <NotificationAction onPress={() => {}}>View</NotificationAction>
          ),
        })}
        onDismiss={() => {}}
      />,
    );

    // Default "Dismiss" should be auto-appended
    expect(getByText('Dismiss')).toBeInTheDocument();
    expect(getByText('View')).toBeInTheDocument();
  });

  it('should call onDismiss with "close" reason when Dismiss is clicked', async () => {
    const onDismiss = vi.fn();

    const { getByText } = render(
      <NotificationItem
        notification={mockNotification({ id: 'test-1' })}
        onDismiss={onDismiss}
      />,
    );

    await act(async () => {
      getByText('Dismiss').click();
    });

    expect(onDismiss).toHaveBeenCalledWith('test-1', 'close');
  });

  it('should still close via action closeOnPress when isDismissible is false', async () => {
    const onDismiss = vi.fn();

    const { getByText, queryByText } = render(
      <NotificationItem
        notification={mockNotification({
          id: 'not-dismissible',
          isDismissible: false,
          actions: (
            <>
              <NotificationAction onPress={() => {}}>Accept</NotificationAction>
              <NotificationAction onPress={() => {}}>
                Decline
              </NotificationAction>
            </>
          ),
        })}
        onDismiss={onDismiss}
      />,
    );

    // No auto-appended "Dismiss" button
    expect(queryByText('Dismiss')).not.toBeInTheDocument();
    // Both actions are present
    expect(getByText('Accept')).toBeInTheDocument();
    expect(getByText('Decline')).toBeInTheDocument();

    // closeOnPress (default true) should still work — actions can close
    await act(async () => {
      getByText('Accept').click();
    });

    expect(onDismiss).toHaveBeenCalledWith('not-dismissible', 'action');
  });

  it('should have correct ARIA role for danger theme', () => {
    const { container } = render(
      <NotificationItem
        notification={mockNotification({ theme: 'danger' })}
        onDismiss={() => {}}
      />,
    );

    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('should have correct ARIA role for success theme', () => {
    const { container } = render(
      <NotificationItem
        notification={mockNotification({ theme: 'success' })}
        onDismiss={() => {}}
      />,
    );

    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('should have correct ARIA role for warning theme', () => {
    const { container } = render(
      <NotificationItem
        notification={mockNotification({ theme: 'warning' })}
        onDismiss={() => {}}
      />,
    );

    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('should have correct ARIA role for note theme', () => {
    const { container } = render(
      <NotificationItem
        notification={mockNotification({ theme: 'note' })}
        onDismiss={() => {}}
      />,
    );

    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('should have aria-atomic and aria-relevant attributes', () => {
    const { container } = render(
      <NotificationItem
        notification={mockNotification({ theme: 'success' })}
        onDismiss={() => {}}
      />,
    );

    const liveRegion = container.querySelector('[aria-atomic="true"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-relevant', 'additions text');
  });

  it('should be focusable with tabIndex 0', () => {
    const { container } = render(
      <NotificationItem
        notification={mockNotification()}
        onDismiss={() => {}}
      />,
    );

    const focusable = container.querySelector('[tabindex="0"]');
    expect(focusable).toBeInTheDocument();
  });
});

// ─── useNotifications ────────────────────────────────────────────────

describe('useNotifications', () => {
  function TestComponent() {
    const { notify, dismiss } = useNotifications();

    return (
      <div>
        <Button
          onPress={() =>
            notify({
              id: 'test-notif',
              theme: 'success',
              title: 'Test notification',
              description: 'Test description',
              actions: <NotificationAction>OK</NotificationAction>,
            })
          }
        >
          Show Notification
        </Button>
        <Button onPress={() => dismiss('test-notif')}>
          Dismiss Notification
        </Button>
      </div>
    );
  }

  it('should show notification when notify is called', async () => {
    const { getByRole, getByText } = renderWithOverlay(<TestComponent />);

    await act(async () => {
      getByRole('button', { name: 'Show Notification' }).click();
    });

    await waitFor(() => {
      expect(getByText('Test notification')).toBeInTheDocument();
    });
  });

  it('should dismiss notification when dismiss is called', async () => {
    const { getByRole, getByText, queryByText } = renderWithOverlay(
      <TestComponent />,
    );

    await act(async () => {
      getByRole('button', { name: 'Show Notification' }).click();
    });

    await waitFor(() => {
      expect(getByText('Test notification')).toBeInTheDocument();
    });

    await act(async () => {
      getByRole('button', { name: 'Dismiss Notification' }).click();
    });

    await waitFor(() => {
      expect(queryByText('Test notification')).not.toBeInTheDocument();
    });
  });

  it('should deduplicate notifications by id', async () => {
    function DedupeComponent() {
      const { notify } = useNotifications();

      return (
        <Button
          onPress={() =>
            notify({
              id: 'same-id',
              theme: 'success',
              title: 'Same notification',
              actions: <NotificationAction>OK</NotificationAction>,
            })
          }
        >
          Show
        </Button>
      );
    }

    const { getByRole, getAllByText } = renderWithOverlay(<DedupeComponent />);

    await act(async () => {
      getByRole('button', { name: 'Show' }).click();
    });
    await act(async () => {
      getByRole('button', { name: 'Show' }).click();
    });
    await act(async () => {
      getByRole('button', { name: 'Show' }).click();
    });

    await waitFor(() => {
      expect(getAllByText('Same notification')).toHaveLength(1);
    });
  });

  it('should show notification with no actions (dismiss only)', async () => {
    function NoActionsComponent() {
      const { notify } = useNotifications();

      return (
        <Button
          onPress={() =>
            notify({
              id: 'no-actions',
              theme: 'success',
              title: 'No actions',
            })
          }
        >
          Show
        </Button>
      );
    }

    const { getByRole, getByText } = renderWithOverlay(<NoActionsComponent />);

    await act(async () => {
      getByRole('button', { name: 'Show' }).click();
    });

    await waitFor(() => {
      expect(getByText('No actions')).toBeInTheDocument();
      // Default dismiss should still appear
      expect(getByText('Dismiss')).toBeInTheDocument();
    });
  });
});

// ─── Declarative Notification ────────────────────────────────────────

describe('Declarative Notification', () => {
  it('should render notification while mounted', async () => {
    const { getByText } = renderWithOverlay(
      <Notification
        id="test-declarative"
        theme="success"
        title="Mounted notification"
        actions={<NotificationAction>OK</NotificationAction>}
      />,
    );

    await waitFor(() => {
      expect(getByText('Mounted notification')).toBeInTheDocument();
    });
  });

  it('should remove notification when unmounted', async () => {
    const { queryByText, rerender } = renderWithOverlay(
      <Notification
        id="test-unmount"
        theme="success"
        title="Will unmount"
        actions={<NotificationAction>OK</NotificationAction>}
      />,
    );

    await waitFor(() => {
      expect(queryByText('Will unmount')).toBeInTheDocument();
    });

    rerender(
      <Root>
        <OverlayProvider>
          <div />
        </OverlayProvider>
      </Root>,
    );

    await waitFor(() => {
      expect(queryByText('Will unmount')).not.toBeInTheDocument();
    });
  });
});

// ─── NotificationAction ──────────────────────────────────────────────

describe('NotificationAction', () => {
  it('should render action button', () => {
    const { getByText } = render(
      <NotificationAction>Click me</NotificationAction>,
    );

    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('should call onPress when clicked', async () => {
    const onPress = vi.fn();

    const { getByText } = render(
      <NotificationAction onPress={onPress}>Click me</NotificationAction>,
    );

    await act(async () => {
      getByText('Click me').click();
    });

    expect(onPress).toHaveBeenCalled();
  });
});

// ─── isDismiss context detection ─────────────────────────────────────

describe('isDismiss context detection', () => {
  it('should auto-suppress default Dismiss when isDismiss action present', () => {
    const { queryAllByText, getByText } = render(
      <NotificationItem
        notification={mockNotification({
          isDismissible: true,
          actions: (
            <>
              <NotificationAction isDismiss>Got it</NotificationAction>
              <NotificationAction onPress={() => {}}>View</NotificationAction>
            </>
          ),
        })}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Got it')).toBeInTheDocument();
    expect(getByText('View')).toBeInTheDocument();
    // Default "Dismiss" should NOT be present
    expect(queryAllByText('Dismiss')).toHaveLength(0);
  });

  it('should show default Dismiss when no isDismiss action present', () => {
    const { getByText } = render(
      <NotificationItem
        notification={mockNotification({
          isDismissible: true,
          actions: (
            <NotificationAction onPress={() => {}}>View</NotificationAction>
          ),
        })}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Dismiss')).toBeInTheDocument();
    expect(getByText('View')).toBeInTheDocument();
  });

  it('should show default Dismiss when actions is omitted', () => {
    const { getByText } = render(
      <NotificationItem
        notification={mockNotification({
          isDismissible: true,
          actions: undefined,
        })}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Dismiss')).toBeInTheDocument();
  });
});

// ─── Persistent Notifications ────────────────────────────────────────

describe('Persistent Notifications', () => {
  function PersistentTestComponent() {
    const { notify } = useNotifications();
    const { items, count, remove, clear } = usePersistentNotifications();

    return (
      <div>
        <Button
          onPress={() =>
            notify({
              id: 'stored-1',
              mode: 'stored',
              theme: 'note',
              title: 'Stored notification',
              description: 'From server',
              actions: <button>View</button>,
            })
          }
        >
          Add Stored
        </Button>
        <Button onPress={clear}>Clear All</Button>
        <span data-qa="count">{count}</span>
        {items.map((item) => (
          <div key={String(item.id)} data-qa="persistent-item">
            {item.title}
            <button onClick={() => remove(item.id)}>Remove</button>
          </div>
        ))}
      </div>
    );
  }

  it('should store notification with mode "stored" in persistent list', async () => {
    const { getByRole, getByText } = renderWithOverlay(
      <PersistentTestComponent />,
    );

    await act(async () => {
      getByRole('button', { name: 'Add Stored' }).click();
    });

    await waitFor(() => {
      expect(getByText('Stored notification')).toBeInTheDocument();
    });
  });

  it('should not show stored notification in overlay', async () => {
    const { getByRole, container } = renderWithOverlay(
      <PersistentTestComponent />,
    );

    await act(async () => {
      getByRole('button', { name: 'Add Stored' }).click();
    });

    // The notification should be in the persistent list but not in the overlay
    const overlayNotification = container.querySelector(
      '[data-qa="Notification"]',
    );
    expect(overlayNotification).not.toBeInTheDocument();
  });

  it('should update count when stored notification is added', async () => {
    const { getByRole, getByText } = renderWithOverlay(
      <PersistentTestComponent />,
    );

    const countEl = getByText('0');
    expect(countEl).toBeInTheDocument();

    await act(async () => {
      getByRole('button', { name: 'Add Stored' }).click();
    });

    await waitFor(() => {
      expect(getByText('1')).toBeInTheDocument();
    });
  });

  it('should clear all persistent items', async () => {
    const { getByRole, getByText } = renderWithOverlay(
      <PersistentTestComponent />,
    );

    await act(async () => {
      getByRole('button', { name: 'Add Stored' }).click();
    });

    await waitFor(() => {
      expect(getByText('1')).toBeInTheDocument();
    });

    await act(async () => {
      getByRole('button', { name: 'Clear All' }).click();
    });

    await waitFor(() => {
      expect(getByText('0')).toBeInTheDocument();
    });
  });
});

// ─── record() method ─────────────────────────────────────────────────

describe('record() method', () => {
  function RecordTestComponent() {
    const { record } = useNotifications();
    const { items, count } = usePersistentNotifications();

    return (
      <div>
        <Button
          onPress={() =>
            record({
              id: 'recorded-1',
              theme: 'warning',
              title: 'Recorded notification',
              description: 'Via record()',
            })
          }
        >
          Record
        </Button>
        <span data-qa="count">{count}</span>
        {items.map((item) => (
          <div key={String(item.id)} data-qa="recorded-item">
            {item.title}
          </div>
        ))}
      </div>
    );
  }

  it('should store notification directly to persistent list', async () => {
    const { getByRole, getByText } = renderWithOverlay(<RecordTestComponent />);

    await act(async () => {
      getByRole('button', { name: 'Record' }).click();
    });

    await waitFor(() => {
      expect(getByText('Recorded notification')).toBeInTheDocument();
      expect(getByText('1')).toBeInTheDocument();
    });
  });

  it('should not show recorded notification in overlay', async () => {
    const { getByRole, container } = renderWithOverlay(<RecordTestComponent />);

    await act(async () => {
      getByRole('button', { name: 'Record' }).click();
    });

    const overlayNotification = container.querySelector(
      '[data-qa="Notification"]',
    );
    expect(overlayNotification).not.toBeInTheDocument();
  });
});

// ─── useNotificationsCount ───────────────────────────────────────────

describe('useNotificationsCount', () => {
  function CountComponent() {
    const { total, unread } = useNotificationsCount();

    return (
      <span>
        total:{total} unread:{unread}
      </span>
    );
  }

  it('should return 0/0 when no persistent items', () => {
    const { getByText } = renderWithOverlay(<CountComponent />);
    expect(getByText('total:0 unread:0')).toBeInTheDocument();
  });

  it('should count stored items as unread', async () => {
    function TestComponent() {
      const { record } = useNotifications();
      const { total, unread } = useNotificationsCount();

      return (
        <div>
          <Button
            onPress={() =>
              record({
                id: 'unread-1',
                theme: 'note',
                title: 'Unread',
              })
            }
          >
            Add
          </Button>
          <span data-qa="counts">
            total:{total} unread:{unread}
          </span>
        </div>
      );
    }

    const { getByRole, getByText } = renderWithOverlay(<TestComponent />);

    await act(async () => {
      getByRole('button', { name: 'Add' }).click();
    });

    await waitFor(() => {
      expect(getByText('total:1 unread:1')).toBeInTheDocument();
    });
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should mark as read after PersistentNotificationsList is visible for 2s', async () => {
      function TestComponent() {
        const { record } = useNotifications();
        const { total, unread } = useNotificationsCount();
        const [showList, setShowList] = useState(false);

        return (
          <div>
            <Button
              onPress={() =>
                record({
                  id: 'read-test',
                  theme: 'note',
                  title: 'Will be read',
                })
              }
            >
              Add
            </Button>
            <Button onPress={() => setShowList(true)}>Show List</Button>
            <span data-qa="counts">
              total:{total} unread:{unread}
            </span>
            {showList && <PersistentNotificationsList />}
          </div>
        );
      }

      const { getByRole, getByText } = renderWithOverlay(<TestComponent />);

      // Add a stored notification
      await act(async () => {
        getByRole('button', { name: 'Add' }).click();
      });

      await waitFor(() => {
        expect(getByText('total:1 unread:1')).toBeInTheDocument();
      });

      // Show the list — should NOT mark as read immediately
      await act(async () => {
        getByRole('button', { name: 'Show List' }).click();
      });

      // Still unread right after showing
      expect(getByText('total:1 unread:1')).toBeInTheDocument();

      // Advance past the 2s delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2100);
      });

      await waitFor(() => {
        expect(getByText('total:1 unread:0')).toBeInTheDocument();
      });
    });

    it('should mark new items as read when added while list is already visible', async () => {
      let recordCounter = 0;

      function TestComponent() {
        const { record } = useNotifications();
        const { total, unread } = useNotificationsCount();
        const [showList, setShowList] = useState(false);

        return (
          <div>
            <Button
              onPress={() => {
                recordCounter++;
                record({
                  id: `late-${recordCounter}`,
                  theme: 'note',
                  title: `Late notification ${recordCounter}`,
                });
              }}
            >
              Add
            </Button>
            <Button onPress={() => setShowList(true)}>Show List</Button>
            <span data-qa="counts">
              total:{total} unread:{unread}
            </span>
            {showList && <PersistentNotificationsList />}
          </div>
        );
      }

      const { getByRole, getByText } = renderWithOverlay(<TestComponent />);

      // Add first item and show the list
      await act(async () => {
        getByRole('button', { name: 'Add' }).click();
      });
      await act(async () => {
        getByRole('button', { name: 'Show List' }).click();
      });

      // Wait for the first batch to be marked as read
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2100);
      });

      await waitFor(() => {
        expect(getByText('total:1 unread:0')).toBeInTheDocument();
      });

      // Now add more items while the list is already visible
      await act(async () => {
        getByRole('button', { name: 'Add' }).click();
      });
      await act(async () => {
        getByRole('button', { name: 'Add' }).click();
      });

      // New items should be unread
      await waitFor(() => {
        expect(getByText('total:3 unread:2')).toBeInTheDocument();
      });

      // After another 2s, new items should be marked as read
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2100);
      });

      await waitFor(() => {
        expect(getByText('total:3 unread:0')).toBeInTheDocument();
      });
    });
  }); // end describe('with fake timers')
});

// ─── PersistentNotificationsList ─────────────────────────────────────

describe('PersistentNotificationsList', () => {
  it('should render empty state when no items', () => {
    const { getByText } = renderWithOverlay(
      <PersistentNotificationsList emptyState="Nothing here" />,
    );

    expect(getByText('Nothing here')).toBeInTheDocument();
  });

  it('should render default empty state', () => {
    const { getByText } = renderWithOverlay(<PersistentNotificationsList />);

    expect(getByText('No notifications')).toBeInTheDocument();
  });

  it('should have role="log" and aria-label', () => {
    const { container } = renderWithOverlay(<PersistentNotificationsList />);

    const listEl = container.querySelector('[role="log"]');
    expect(listEl).toBeInTheDocument();
    expect(listEl).toHaveAttribute('aria-label', 'Notifications');
  });

  it('should render items from context', async () => {
    function TestComponent() {
      const { record } = useNotifications();

      return (
        <div>
          <Button
            onPress={() => {
              record({
                id: '1',
                theme: 'success',
                title: 'First notification',
              });
              record({
                id: '2',
                theme: 'danger',
                title: 'Second notification',
              });
            }}
          >
            Add Items
          </Button>
          <PersistentNotificationsList />
        </div>
      );
    }

    const { getByRole, getByText } = renderWithOverlay(<TestComponent />);

    await act(async () => {
      getByRole('button', { name: 'Add Items' }).click();
    });

    await waitFor(() => {
      expect(getByText('First notification')).toBeInTheDocument();
      expect(getByText('Second notification')).toBeInTheDocument();
    });
  });

  it('should render ReactNode actions', async () => {
    function TestComponent() {
      const { record } = useNotifications();

      return (
        <div>
          <Button
            onPress={() =>
              record({
                id: '1',
                title: 'With actions',
                actions: <button>View details</button>,
              })
            }
          >
            Add
          </Button>
          <PersistentNotificationsList />
        </div>
      );
    }

    const { getByRole, getByText } = renderWithOverlay(<TestComponent />);

    await act(async () => {
      getByRole('button', { name: 'Add' }).click();
    });

    await waitFor(() => {
      expect(getByText('View details')).toBeInTheDocument();
    });
  });
});

// ─── Duration Defaults ───────────────────────────────────────────────

describe('Duration defaults', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-dismiss non-persistent notification after 5000ms', async () => {
    function TimerComponent() {
      const { notify } = useNotifications();

      return (
        <Button
          onPress={() =>
            notify({
              id: 'timer-test',
              theme: 'success',
              title: 'Auto dismiss',
              actions: <NotificationAction>OK</NotificationAction>,
            })
          }
        >
          Show
        </Button>
      );
    }

    const { getByRole, getByText, queryByText } = renderWithOverlay(
      <TimerComponent />,
    );

    await act(async () => {
      getByRole('button', { name: 'Show' }).click();
    });

    expect(getByText('Auto dismiss')).toBeInTheDocument();

    // Advance past the 5000ms default duration
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });

    await waitFor(() => {
      expect(queryByText('Auto dismiss')).not.toBeInTheDocument();
    });
  });
});

// ─── Update by ID ────────────────────────────────────────────────────

describe('Update by ID', () => {
  it('should update notification in-place when same id is used', async () => {
    function UpdateComponent() {
      const { notify } = useNotifications();

      return (
        <div>
          <Button
            onPress={() =>
              notify({
                id: 'update-test',
                theme: 'warning',
                title: 'Step 1',
                duration: null,
                actions: <NotificationAction>OK</NotificationAction>,
              })
            }
          >
            Show Step 1
          </Button>
          <Button
            onPress={() =>
              notify({
                id: 'update-test',
                theme: 'success',
                title: 'Step 2',
                duration: null,
                actions: <NotificationAction>OK</NotificationAction>,
              })
            }
          >
            Show Step 2
          </Button>
        </div>
      );
    }

    const { getByRole, getByText, queryByText } = renderWithOverlay(
      <UpdateComponent />,
    );

    await act(async () => {
      getByRole('button', { name: 'Show Step 1' }).click();
    });

    await waitFor(() => {
      expect(getByText('Step 1')).toBeInTheDocument();
    });

    await act(async () => {
      getByRole('button', { name: 'Show Step 2' }).click();
    });

    await waitFor(() => {
      expect(getByText('Step 2')).toBeInTheDocument();
      expect(queryByText('Step 1')).not.toBeInTheDocument();
    });
  });
});

// ─── Stack Cap (Eviction) ────────────────────────────────────────────

describe('Stack Cap (Eviction)', () => {
  it('should evict oldest notification when cap is exceeded and always show newest', async () => {
    function CapComponent() {
      const { notify } = useNotifications();

      return (
        <div>
          {Array.from({ length: 7 }, (_, i) => (
            <Button
              key={i}
              onPress={() =>
                notify({
                  id: `q-${i}`,
                  theme: 'note',
                  title: `Notification ${i}`,
                  duration: null,
                  actions: <NotificationAction>OK</NotificationAction>,
                })
              }
            >
              {`Show ${i}`}
            </Button>
          ))}
        </div>
      );
    }

    const { getByRole, getByText, queryByText } = renderWithOverlay(
      <CapComponent />,
    );

    // Show 6 notifications (cap is 5)
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        getByRole('button', { name: `Show ${i}` }).click();
      });
    }

    // The newest (6th) should be visible
    await waitFor(() => {
      expect(getByText('Notification 5')).toBeInTheDocument();
    });

    // The oldest (1st) should have been evicted
    await waitFor(() => {
      expect(queryByText('Notification 0')).not.toBeInTheDocument();
    });

    // Notifications 1-5 should be visible (the 5 most recent)
    for (let i = 1; i <= 5; i++) {
      expect(getByText(`Notification ${i}`)).toBeInTheDocument();
    }
  });
});

// ─── Owner Cleanup ───────────────────────────────────────────────────

describe('Owner cleanup', () => {
  it('should dismiss owned notifications when component unmounts', async () => {
    function OwnerComponent() {
      const { notify } = useNotifications();

      return (
        <Button
          onPress={() =>
            notify({
              id: 'owned-1',
              theme: 'success',
              title: 'Owned notification',
              duration: null,
              actions: <NotificationAction>OK</NotificationAction>,
            })
          }
        >
          Show
        </Button>
      );
    }

    function ParentComponent() {
      const [showOwner, setShowOwner] = useState(true);

      return (
        <div>
          {showOwner && <OwnerComponent />}
          <Button onPress={() => setShowOwner(false)}>Unmount Owner</Button>
        </div>
      );
    }

    const { getByRole, getByText, queryByText } = renderWithOverlay(
      <ParentComponent />,
    );

    // Show notification
    await act(async () => {
      getByRole('button', { name: 'Show' }).click();
    });

    await waitFor(() => {
      expect(getByText('Owned notification')).toBeInTheDocument();
    });

    // Unmount the owner component
    await act(async () => {
      getByRole('button', { name: 'Unmount Owner' }).click();
    });

    // Wait for deferred cleanup (setTimeout(0))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await waitFor(() => {
      expect(queryByText('Owned notification')).not.toBeInTheDocument();
    });
  });
});

// ─── Keyboard Navigation ─────────────────────────────────────────────

describe('Keyboard navigation', () => {
  it('should dismiss notification on Escape key', async () => {
    const onDismiss = vi.fn();

    const { container } = render(
      <NotificationItem
        notification={mockNotification({
          id: 'keyboard-test',
          isDismissible: true,
        })}
        onDismiss={onDismiss}
      />,
    );

    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement;
    expect(focusable).toBeInTheDocument();

    await act(async () => {
      focusable.focus();
    });

    await userEvent.keyboard('{Escape}');

    expect(onDismiss).toHaveBeenCalledWith('keyboard-test', 'close');
  });

  it('should not dismiss on Escape when not isDismissible', async () => {
    const onDismiss = vi.fn();

    const { container } = render(
      <NotificationItem
        notification={mockNotification({
          id: 'no-dismiss',
          isDismissible: false,
        })}
        onDismiss={onDismiss}
      />,
    );

    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement;

    await act(async () => {
      focusable.focus();
    });

    await userEvent.keyboard('{Escape}');

    expect(onDismiss).not.toHaveBeenCalled();
  });
});

// ─── dismiss() with unknown id ───────────────────────────────────────

describe('Error handling', () => {
  it('should silently no-op when dismissing unknown id', () => {
    function NoopComponent() {
      const { dismiss } = useNotifications();

      return (
        <Button onPress={() => dismiss('nonexistent-id')}>
          Dismiss Unknown
        </Button>
      );
    }

    const { getByRole } = renderWithOverlay(<NoopComponent />);

    // Should not throw
    expect(() => {
      act(() => {
        getByRole('button', { name: 'Dismiss Unknown' }).click();
      });
    }).not.toThrow();
  });
});

// ─── Persistent notification on timeout ──────────────────────────────

describe('Persistent notification on timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should move persistent notification to persistent list after timeout', async () => {
    function PersistentTimeoutComponent() {
      const { notify } = useNotifications();
      const { items, count } = usePersistentNotifications();

      return (
        <div>
          <Button
            onPress={() =>
              notify({
                id: 'persist-timeout',
                theme: 'success',
                title: 'Persistent on timeout',
                persistent: true,
                actions: <NotificationAction>OK</NotificationAction>,
              })
            }
          >
            Show
          </Button>
          <span data-qa="persist-count">{count}</span>
          {items.map((item) => (
            <div key={String(item.id)} data-qa="persist-item">
              {item.title}
            </div>
          ))}
        </div>
      );
    }

    const { getByRole, getByText, queryByText } = renderWithOverlay(
      <PersistentTimeoutComponent />,
    );

    await act(async () => {
      getByRole('button', { name: 'Show' }).click();
    });

    expect(getByText('Persistent on timeout')).toBeInTheDocument();
    // Count should be 0 (not yet in persistent list)
    expect(getByText('0')).toBeInTheDocument();

    // Advance past the default persistent duration (10000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10100);
    });

    // After timeout, it should be in the persistent list
    await waitFor(() => {
      expect(getByText('1')).toBeInTheDocument();
    });
  });
});

// ─── Timer reset on in-place update ──────────────────────────────────

describe('Timer reset on update', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reset timer when title changes via in-place update', async () => {
    function TimerResetComponent() {
      const { notify } = useNotifications();

      return (
        <div>
          <Button
            onPress={() =>
              notify({
                id: 'timer-reset',
                theme: 'note',
                title: 'Original title',
                duration: 5000,
                actions: <NotificationAction>OK</NotificationAction>,
              })
            }
          >
            Show
          </Button>
          <Button
            onPress={() =>
              notify({
                id: 'timer-reset',
                theme: 'note',
                title: 'Updated title',
                duration: 5000,
                actions: <NotificationAction>OK</NotificationAction>,
              })
            }
          >
            Update
          </Button>
        </div>
      );
    }

    const { getByRole, getByText, queryByText } = renderWithOverlay(
      <TimerResetComponent />,
    );

    // Show original notification
    await act(async () => {
      getByRole('button', { name: 'Show' }).click();
    });

    expect(getByText('Original title')).toBeInTheDocument();

    // Wait 4 seconds (almost expired)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    // Update the title — should reset the 5s timer
    await act(async () => {
      getByRole('button', { name: 'Update' }).click();
    });

    await waitFor(() => {
      expect(getByText('Updated title')).toBeInTheDocument();
    });

    // Wait another 4 seconds — would have expired if timer wasn't reset
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    // Should still be visible (timer was reset)
    expect(getByText('Updated title')).toBeInTheDocument();

    // Wait past the full 5s from the update
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Now it should be dismissed
    await waitFor(() => {
      expect(queryByText('Updated title')).not.toBeInTheDocument();
    });
  });
});

// ─── maxPersistentNotifications cap ──────────────────────────────────

describe('maxPersistentNotifications cap', () => {
  it('should enforce max cap on persistent items', async () => {
    function CapTestComponent() {
      const { record } = useNotifications();
      const { count } = usePersistentNotifications();

      return (
        <div>
          <Button
            onPress={() => {
              for (let i = 0; i < 5; i++) {
                record({
                  id: `cap-${Date.now()}-${i}`,
                  theme: 'note',
                  title: `Item ${i}`,
                });
              }
            }}
          >
            Add 5
          </Button>
          <span data-qa="count">{count}</span>
        </div>
      );
    }

    // Use a low max for testing
    const { getByRole, getByText } = render(
      <Root>
        <OverlayProvider maxPersistentNotifications={3}>
          <CapTestComponent />
        </OverlayProvider>
      </Root>,
    );

    await act(async () => {
      getByRole('button', { name: 'Add 5' }).click();
    });

    // Should be capped at 3
    await waitFor(() => {
      expect(getByText('3')).toBeInTheDocument();
    });
  });
});

// ─── Stored notification dismiss removes from persistent list ────────

describe('Stored notification handle dismiss', () => {
  it('should remove stored notification from persistent list when dismiss() is called', async () => {
    let handleRef: { dismiss: () => void } | null = null;

    function DismissStoredComponent() {
      const { record } = useNotifications();
      const { count } = usePersistentNotifications();

      return (
        <div>
          <Button
            onPress={() => {
              handleRef = record({
                id: 'dismiss-stored',
                theme: 'note',
                title: 'Stored to dismiss',
              });
            }}
          >
            Record
          </Button>
          <Button
            onPress={() => {
              handleRef?.dismiss();
            }}
          >
            Dismiss Handle
          </Button>
          <span data-qa="count">{count}</span>
        </div>
      );
    }

    const { getByRole, getByText } = renderWithOverlay(
      <DismissStoredComponent />,
    );

    // Record a stored notification
    await act(async () => {
      getByRole('button', { name: 'Record' }).click();
    });

    await waitFor(() => {
      expect(getByText('1')).toBeInTheDocument();
    });

    // Dismiss via handle
    await act(async () => {
      getByRole('button', { name: 'Dismiss Handle' }).click();
    });

    await waitFor(() => {
      expect(getByText('0')).toBeInTheDocument();
    });
  });
});

// ─── Timestamp refresh ───────────────────────────────────────────────

describe('Timestamp refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should refresh relative timestamps while list is visible', async () => {
    function TimestampComponent() {
      const { record } = useNotifications();

      return (
        <div>
          <Button
            onPress={() =>
              record({
                id: 'ts-test',
                theme: 'note',
                title: 'Timestamp test',
              })
            }
          >
            Add
          </Button>
          <PersistentNotificationsList />
        </div>
      );
    }

    const { getByRole, getByText } = renderWithOverlay(<TimestampComponent />);

    await act(async () => {
      getByRole('button', { name: 'Add' }).click();
    });

    await waitFor(() => {
      expect(getByText('just now')).toBeInTheDocument();
    });

    // Advance time by 2 minutes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    });

    // After a 10s refresh interval tick, the timestamp should update
    await waitFor(() => {
      expect(getByText('2 min ago')).toBeInTheDocument();
    });
  });
});
