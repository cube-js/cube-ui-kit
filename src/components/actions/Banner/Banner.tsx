import {
  IconAlertTriangle,
  IconCircleCheck,
  IconExclamationCircle,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react';
import { ReactNode, useMemo } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { tasty } from '../../../tasty';
import { CubeItemProps, Item } from '../../content/Item/Item';
import { CubeButtonProps } from '../Button/Button';
import { CubeItemActionProps } from '../ItemAction/ItemAction';
import { Link } from '../Link/Link';

export type BannerTheme = 'danger' | 'warning' | 'note' | 'success';

export type BannerProps = Omit<CubeItemProps, 'type' | 'size' | 'theme'> & {
  /**
   * The visual theme of the banner.
   * @default 'note'
   */
  theme?: BannerTheme;
  /**
   * Controls whether the banner can be dismissed by the user.
   * @default false
   */
  isDismissible?: boolean;
  /**
   * Callback fired when the dismiss button is clicked.
   */
  onDismiss?: () => void;
};

export type BannerActionProps = Omit<CubeItemActionProps, 'preset' | 'type'>;

export type BannerLinkProps = Omit<CubeButtonProps, 'type' | 'size' | 'color'>;

const DEFAULT_ICONS: Record<BannerTheme, ReactNode> = {
  danger: <IconExclamationCircle />,
  warning: <IconAlertTriangle />,
  note: <IconInfoCircle />,
  success: <IconCircleCheck />,
};

const BannerElement = tasty(Item, {
  styles: {
    width: '100%',

    Description: {
      textOverflow: 'ellipsis / 2',
      textWrap: 'initial',
    },

    Actions: {
      gap: '1x',
    },
  },
});

const BannerActionElement = tasty(Item.Action, {
  type: 'outline',
  styles: {
    preset: 't3m',
    border: '#clear',
  },
});

const BannerLinkElement = tasty(Link, {
  styles: {
    color: '#white',
    textDecoration: 'underline',
  },
});

/**
 * Sub-component for action buttons within a Banner.
 * Automatically styled to match the banner's theme.
 */
export function BannerAction(props: BannerActionProps) {
  return <BannerActionElement {...props} />;
}

/**
 * Sub-component for inline links within Banner content.
 * Styled with white color and underline to stand out against the banner background.
 */
export function BannerLink(props: BannerLinkProps) {
  return <BannerLinkElement {...props} />;
}

/**
 * Banner displays prominent messages and notifications to users.
 * Supports different themes (danger, warning, note, success) with appropriate icons.
 * Use Banner.Action for action buttons and Banner.Link for inline links.
 */
export function Banner(props: BannerProps) {
  const {
    theme = 'note',
    actions,
    isDismissible = false,
    onDismiss,
    children,
    icon,
    ...rest
  } = props;

  const onDismissEvent = useEvent(() => {
    onDismiss?.();
  });

  const defaultIcon = useMemo(() => DEFAULT_ICONS[theme], [theme]);

  const hasActions = !!(actions || isDismissible);

  return (
    <BannerElement
      qa="Banner"
      role="status"
      type="primary"
      theme={theme}
      size="large"
      icon={icon ?? defaultIcon}
      {...rest}
      actions={
        hasActions ? (
          <>
            {actions}
            {isDismissible && (
              <Item.Action
                icon={<IconX />}
                tooltip="Hide banner"
                onPress={onDismissEvent}
              />
            )}
          </>
        ) : undefined
      }
    >
      {children}
    </BannerElement>
  );
}

Banner.Action = BannerAction;
Banner.Link = BannerLink;
