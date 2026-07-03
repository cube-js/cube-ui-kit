import { createContext, Key, ReactNode, useContext, useMemo } from 'react';

import { useEvent } from '../../../_internal';
import { ItemAction } from '../../actions/ItemAction/ItemAction';

import type { NotificationActionProps } from './types';

// ─── Notification Action Interceptor Context ─────────────────────────

/**
 * Optional callback invoked BEFORE any action's onPress handler.
 * Provided by PersistentNotificationsList so the parent (e.g. popover)
 * can close itself when an action is triggered.
 */
const NotificationActionInterceptorContext = createContext<(() => void) | null>(
  null,
);

export { NotificationActionInterceptorContext };

// ─── Notification Dismiss Context ────────────────────────────────────

interface NotificationDismissContextValue {
  dismiss: (reason: 'action' | 'close') => void;
  restore: () => void;
}

const NotificationDismissContext =
  createContext<NotificationDismissContextValue | null>(null);

export interface NotificationDismissProviderProps {
  notificationId: Key;
  onDismiss: (id: Key, reason: 'action' | 'close') => void;
  onRestore?: (id: Key) => void;
  children: ReactNode;
}

export function NotificationDismissProvider({
  notificationId,
  onDismiss,
  onRestore,
  children,
}: NotificationDismissProviderProps) {
  const dismiss = useEvent((reason: 'action' | 'close') => {
    onDismiss(notificationId, reason);
  });

  const restore = useEvent(() => {
    onRestore?.(notificationId);
  });

  const value = useMemo(() => ({ dismiss, restore }), [dismiss, restore]);

  return (
    <NotificationDismissContext.Provider value={value}>
      {children}
    </NotificationDismissContext.Provider>
  );
}

// ─── NotificationAction Component ────────────────────────────────────

/**
 * Action button for use inside Notification components.
 * Wraps ItemAction with auto-dismiss behavior.
 *
 * - `closeOnPress` (default: true) — auto-dismisses the notification after `onPress`.
 * - An action with no `onPress` and `closeOnPress: true` acts as a dismiss-only action.
 * - `isDismiss` — marks this action as the dismiss button; when present, the default
 *   "Dismiss" button is auto-suppressed (detected statically from the actions tree
 *   by NotificationCard).
 * - Type (primary/outline/clear/etc.) is set automatically via ItemActionProvider context.
 */
export function NotificationAction({
  children,
  onPress,
  closeOnPress = true,
  isDisabled,
  isDismiss,
}: NotificationActionProps) {
  const dismissCtx = useContext(NotificationDismissContext);
  const actionInterceptor = useContext(NotificationActionInterceptorContext);

  const handlePress = useEvent(async () => {
    actionInterceptor?.();

    if (closeOnPress || actionInterceptor) {
      // Dismiss immediately so the notification hides before the async action
      // completes (e.g. opening a confirmation dialog).
      // isDismiss actions use 'close' reason — the notification moves to the
      // persistent list. Regular actions use 'action' reason — the notification
      // is fully dismissed and won't reappear.
      // When an actionInterceptor is present (persistent list), always dismiss
      // regardless of closeOnPress — all actions remove the item permanently.
      dismissCtx?.dismiss(isDismiss ? 'close' : 'action');
    }

    const result = await onPress?.();

    if (result === false && (closeOnPress || actionInterceptor)) {
      // The async action signalled cancellation — restore the notification.
      dismissCtx?.restore();
    }
  });

  return (
    <ItemAction
      isSelected
      type="outline"
      isDisabled={isDisabled}
      onPress={handlePress}
    >
      {children}
    </ItemAction>
  );
}
