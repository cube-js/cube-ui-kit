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

// `current.outline` — the `current` theme on `Item.Action`, given the outlined
// shape rather than the borderless default.
//
// `current` is the right color source: a banner labels itself `#white` in both
// schemas (see `BannerLinkElement` and `*_PRIMARY_STYLES`), so the action mixes
// its chip, border and label from that white — label cr 4.3-5.0 against every
// banner theme, with the chip a subtle 1.06 off the banner. That is what an
// action on a saturated surface should be: the banner carries the emphasis, the
// button just has to be findable.
//
// `outline` rather than `Item.Action`'s `clear` default because a banner action
// is a call to action, and `clear` paints nothing at rest — on a busy banner it
// reads as body text until hovered. The `#current.08` border is what makes it a
// button, which is why the old `border: '#clear'` override had to go: it was
// written when `outline` meant `note.outline` and friends, whose border is the
// opaque `#note-border` — a pale line built for a `#surface-2` chip on a light
// page and plainly wrong on a saturated banner. On the `current` theme the
// border IS the chip, and the 3% fill cannot carry one alone.
//
// `type="primary"` is deliberately not used. It would fill with the inherited
// white and punch `#current-fill` out of it, which defaults to `#surface` —
// white in light mode, so the label would collapse into its own chip. A banner
// that wants a filled action has to set `#current-fill` to its own surface
// color; see `CURRENT_PRIMARY_STYLES` in `item-themes`.
const BannerActionElement = tasty(Item.Action, {
  type: 'outline',
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
