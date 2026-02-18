import {
  createContext,
  Key,
  ReactNode,
  useContext,
  useMemo,
  useRef,
} from 'react';

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
}

const NotificationDismissContext =
  createContext<NotificationDismissContextValue | null>(null);

export interface NotificationDismissProviderProps {
  notificationId: Key;
  onDismiss: (id: Key, reason: 'action' | 'close') => void;
  children: ReactNode;
}

export function NotificationDismissProvider({
  notificationId,
  onDismiss,
  children,
}: NotificationDismissProviderProps) {
  const dismiss = useEvent((reason: 'action' | 'close') => {
    onDismiss(notificationId, reason);
  });

  const value = useMemo(() => ({ dismiss }), [dismiss]);

  return (
    <NotificationDismissContext.Provider value={value}>
      {children}
    </NotificationDismissContext.Provider>
  );
}

// ─── Dismiss Action Detection Context ────────────────────────────────
//
// Allows NotificationCard to detect whether any child NotificationAction
// has `isDismiss` set, without requiring a separate `hasDismissAction` prop.
//
// Mechanism:
// - DismissActionDetector provides a ref via context and resets it each render.
// - NotificationAction writes to the ref during render when isDismiss is true.
// - DefaultDismissGuard reads the ref to decide whether to show the default button.
//
// This relies on React's left-to-right sibling render order: {actions}
// children render before <DefaultDismissGuard />, so the ref is populated
// before it's read. The ref is reset at the provider level each render,
// making it safe under StrictMode double-rendering.

export const DismissActionDetectedContext = createContext<ReturnType<
  typeof useRef<boolean>
> | null>(null);

// ─── NotificationAction Component ────────────────────────────────────

/**
 * Action button for use inside Notification components.
 * Wraps ItemAction with auto-dismiss behavior.
 *
 * - `closeOnPress` (default: true) — auto-dismisses the notification after `onPress`.
 * - An action with no `onPress` and `closeOnPress: true` acts as a dismiss-only action.
 * - `isDismiss` — marks this action as the dismiss button; when present, the default
 *   "Dismiss" button is auto-suppressed via context detection.
 * - Type (primary/secondary/etc.) is set automatically via ItemActionProvider context.
 */
export function NotificationAction({
  children,
  onPress,
  closeOnPress = true,
  isDisabled,
  isDismiss,
}: NotificationActionProps) {
  const dismissCtx = useContext(NotificationDismissContext);
  const dismissDetectedRef = useContext(DismissActionDetectedContext);

  // Register isDismiss during render (synchronous, before DefaultDismissGuard renders).
  // Safe under StrictMode: the ref is reset at the DismissActionDetector level each render.
  if (isDismiss && dismissDetectedRef) {
    dismissDetectedRef.current = true;
  }

  const actionInterceptor = useContext(NotificationActionInterceptorContext);

  const handlePress = useEvent(async () => {
    const result = await onPress?.();

    if (result === false) {
      return;
    }

    actionInterceptor?.();

    if (closeOnPress) {
      // isDismiss actions (dismiss button, Escape) use 'close' reason — the
      // notification moves to the persistent list.
      // Regular actions use 'action' reason — the notification is fully dismissed
      // and won't reappear.
      dismissCtx?.dismiss(isDismiss ? 'close' : 'action');
    }
  });

  return (
    <ItemAction type="secondary" isDisabled={isDisabled} onPress={handlePress}>
      {children}
    </ItemAction>
  );
}
