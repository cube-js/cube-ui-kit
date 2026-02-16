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

// ─── Notification Dismiss Context ────────────────────────────────────

interface NotificationDismissContextValue {
  dismiss: (reason: 'action') => void;
}

const NotificationDismissContext =
  createContext<NotificationDismissContextValue | null>(null);

export interface NotificationDismissProviderProps {
  notificationId: Key;
  onDismiss: (id: Key, reason: 'action') => void;
  children: ReactNode;
}

export function NotificationDismissProvider({
  notificationId,
  onDismiss,
  children,
}: NotificationDismissProviderProps) {
  const dismiss = useEvent(() => {
    onDismiss(notificationId, 'action');
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

  const handlePress = useEvent(() => {
    onPress?.();

    if (closeOnPress) {
      dismissCtx?.dismiss('action');
    }
  });

  return (
    <ItemAction type="secondary" isDisabled={isDisabled} onPress={handlePress}>
      {children}
    </ItemAction>
  );
}
