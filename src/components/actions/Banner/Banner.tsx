import {
  IconAlertTriangle,
  IconCircleCheck,
  IconExclamationCircle,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react';
import { tasty } from '@tenphi/tasty';
import { ReactNode, useMemo } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { useI18n } from '../../../i18n';
import { CubeItemProps, Item } from '../../content/Item/Item';
import { Button, CubeButtonProps } from '../Button/Button';
import { CubeItemActionProps } from '../ItemAction/ItemAction';
import { useItemActionContext } from '../ItemActionContext';

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
  isDismissable?: boolean;
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
      whiteSpace: 'normal',
    },

    Actions: {
      gap: '1x',
    },
  },
});

// `invert` on the banner's OWN theme, which is the one pairing that gives a
// banner a filled action legible in both schemes.
//
// The obvious choice — `Item.Action`'s default `current` theme — cannot do it
// here, and the reason is specific rather than general. A banner labels itself
// `#white` in both schemes (see `BannerLinkElement` and `*_PRIMARY_STYLES`), so
// `currentcolor` inside one is white; and `#surface`, the page token both filled
// `current` flavours reach for, is ALSO white in light mode. Every arrangement
// of those two collapses:
//
//   theme=current type=primary   fill #current (white)  label #surface (white)
//   theme=current type=invert    fill #surface (white)  label #current (white)
//
// Both measure cr 1.00 in light on all four banner themes. The theme's own
// tokens have no such coincidence: `accent-text` is the dark end of the brand
// ramp and `#surface` is the page, so `<theme>.invert` measures 6.87–7.90 across
// the four themes in both schemes, and the chip still separates from the banner
// (cr ~1.5 light, ~2.4 dark, either side of the 1.48 a `primary` rim measures).
//
// The previous default was `current.outline`: label cr 4.3–5.0, but a chip only
// 1.06 off the banner, which is what an outline is meant to be. `invert` is the
// filled counterpart, for a banner whose action should read as the thing to
// press.
const BannerActionElement = tasty(Item.Action, {
  type: 'invert',
  styles: {
    preset: 't3m',
  },
});

const BannerLinkElement = tasty(Button, {
  type: 'link',
  size: 'inline',
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
  // The banner's theme, taken from the row that hosts the action. `Item.Action`
  // defaults its own `theme` to `current` and no longer reads this context for
  // styling, so the banner has to name it — which is the point here: `invert`
  // needs the brand ramp, and `current` is exactly what does not work inside a
  // banner. Falls back to the banner's own default theme when an action is
  // rendered outside one, rather than to `current`.
  const { theme } = useItemActionContext();

  return <BannerActionElement theme={theme ?? 'note'} {...props} />;
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
  const { t } = useI18n();

  const {
    theme = 'note',
    actions,
    isDismissable = false,
    onDismiss,
    children,
    icon,
    ...rest
  } = props;

  const onDismissEvent = useEvent(() => {
    onDismiss?.();
  });

  const defaultIcon = useMemo(() => DEFAULT_ICONS[theme], [theme]);

  const hasActions = !!(actions || isDismissable);

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
            {isDismissable && (
              <Item.Action
                icon={<IconX />}
                tooltip={t('banner.hideBanner', 'Hide banner')}
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
