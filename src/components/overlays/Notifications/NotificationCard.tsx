import { Key, ReactNode, useContext, useRef } from 'react';

import { tasty } from '../../../tasty';
import { ItemActionProvider } from '../../actions/ItemActionContext';
import { Block } from '../../Block';
import { Item } from '../../content/Item/Item';
import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';
import { getThemeIcon } from '../Toast/useToast';

import {
  DismissActionDetectedContext,
  NotificationAction,
  NotificationDismissProvider,
} from './NotificationAction';

import type { DismissReason, NotificationType } from './types';

// ─── Styled Components ──────────────────────────────────────────────

const StyledItem = tasty(Item, {
  styles: {
    width: 'max min((100vw - 4x), 50x)',
    shadow: '$card-shadow',
    transition: 'theme, inset',

    Description: {
      preset: 't4',
    },
  },
});

// ─── Dismiss Action Detection ────────────────────────────────────────

/**
 * Provides a ref via context that NotificationAction children write to
 * during render when `isDismiss` is set. The ref is reset each render.
 */
function DismissActionDetector({ children }: { children: ReactNode }) {
  const ref = useRef(false);

  // Reset each render so detection is fresh
  ref.current = false;

  return (
    <DismissActionDetectedContext.Provider value={ref}>
      {children}
    </DismissActionDetectedContext.Provider>
  );
}

/**
 * Renders the default "Dismiss" button only if no sibling NotificationAction
 * has `isDismiss` set. Reads from DismissActionDetectedContext ref which is
 * populated by actions that rendered before this component (left-to-right order).
 */
function AutoDismissButton() {
  const dismissDetectedRef = useContext(DismissActionDetectedContext);

  if (dismissDetectedRef?.current) return null;

  return <NotificationAction isDismiss>Dismiss</NotificationAction>;
}

// ─── ActionsSection ─────────────────────────────────────────────────

interface ActionsSectionProps {
  actions?: ReactNode;
  theme?: NotificationType;
  /**
   * Whether to show the auto-appended "Dismiss" button.
   * Controlled by `isDismissible` on the notification.
   *
   * When false, no default "Dismiss" button is rendered, but actions with
   * `closeOnPress` (default `true`) can still close the notification via
   * the dismiss context.
   */
  showAutoDismiss: boolean;
  /** Whether the dismiss context is available (notificationId + onDismiss present) */
  hasDismissContext: boolean;
  notificationId?: Key;
  onDismiss?: (id: Key, reason: DismissReason) => void;
}

/**
 * Extracted sub-component for the actions area of a notification card.
 *
 * The dismiss provider is always rendered when `hasDismissContext` is true,
 * so any action with `closeOnPress` can close the notification — regardless
 * of `isDismissible`. The `showAutoDismiss` flag only controls the
 * auto-appended "Dismiss" button.
 */
function ActionsSection({
  actions,
  theme,
  showAutoDismiss,
  hasDismissContext,
  notificationId,
  onDismiss,
}: ActionsSectionProps) {
  const actionsContent = (
    <Space placeContent="end" gap="1x" flexGrow={1}>
      {actions}
      {showAutoDismiss && <AutoDismissButton />}
    </Space>
  );

  const wrappedContent = showAutoDismiss ? (
    <DismissActionDetector>{actionsContent}</DismissActionDetector>
  ) : (
    actionsContent
  );

  return (
    <ItemActionProvider type="card" theme={theme}>
      {hasDismissContext ? (
        <NotificationDismissProvider
          notificationId={notificationId!}
          onDismiss={onDismiss!}
        >
          {wrappedContent}
        </NotificationDismissProvider>
      ) : (
        wrappedContent
      )}
    </ItemActionProvider>
  );
}

// ─── NotificationCard ────────────────────────────────────────────────

export interface NotificationCardProps {
  qa?: string;
  /** Notification theme */
  theme?: NotificationType;
  /** Primary text */
  title?: ReactNode;
  /** Secondary text */
  description?: ReactNode;
  /** Custom icon override (theme default used if omitted) */
  icon?: ReactNode;
  /** Action buttons rendered below description */
  actions?: ReactNode;
  /**
   * Whether the notification shows the default dismiss UI (auto-appended
   * "Dismiss" button and Escape key). Default: true.
   *
   * When false, no default "Dismiss" button is rendered and Escape does
   * nothing, but actions with `closeOnPress` (default) can still close
   * the notification.
   */
  isDismissible?: boolean;
  /** Notification id */
  notificationId?: Key;
  /** Called when the notification is dismissed */
  onDismiss?: (id: Key, reason: DismissReason) => void;
  /** Suffix content (e.g. timestamp) */
  suffix?: ReactNode;
}

/**
 * Shared presentational card used by both overlay NotificationItem
 * and PersistentNotificationListItem.
 */
export function NotificationCard({
  qa = 'Notification',
  theme,
  title,
  description,
  icon: providedIcon,
  actions,
  isDismissible = true,
  notificationId,
  onDismiss,
  suffix,
}: NotificationCardProps) {
  const icon = getThemeIcon(theme, providedIcon);

  const hasDismissContext = notificationId != null && onDismiss != null;
  const showAutoDismiss = isDismissible && hasDismissContext;
  const hasActions = !!(actions || showAutoDismiss);

  const descriptionContent: ReactNode =
    description || hasActions ? (
      <Flex flow="row wrap" gap="0.5x 1x" placeItems="center stretch">
        {description && <Block>{description}</Block>}
        {hasActions && (
          <ActionsSection
            actions={actions}
            theme={theme}
            showAutoDismiss={showAutoDismiss}
            hasDismissContext={hasDismissContext}
            notificationId={notificationId}
            onDismiss={onDismiss}
          />
        )}
      </Flex>
    ) : undefined;

  return (
    <StyledItem
      qa={qa}
      type="card"
      theme={theme}
      icon={icon}
      description={descriptionContent}
      suffix={suffix}
    >
      {title}
    </StyledItem>
  );
}
