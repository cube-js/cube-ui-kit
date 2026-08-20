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

// The accent a banner offers its `current`-themed actions, live and muted.
// Exported so the live/disabled pairing can be pinned by a test rather than by
// discipline — see `Banner.test.ts`.
// Keyed by `Record<BannerTheme, true>` rather than a loose array so the union
// and the map cannot drift: add a fifth `BannerTheme` and this stops compiling
// until it has an accent. A theme with no entry would fall through to the
// reader's `currentcolor` fallback and land back on the cr 1.00 this exists to
// avoid, which is not a failure worth leaving to review.
const BANNER_ACCENT_THEMES: Record<BannerTheme, true> = {
  note: true,
  danger: true,
  warning: true,
  success: true,
};

export const BANNER_ACTION_ACCENT: Record<string, string> = Object.fromEntries(
  (Object.keys(BANNER_ACCENT_THEMES) as BannerTheme[]).flatMap((theme) => [
    [`theme=${theme}`, `#${theme}-accent-text`],
    [`theme=${theme} & disabled`, `#${theme}-accent-text.4`],
  ]),
);

const BannerElement = tasty(Item, {
  styles: {
    width: '100%',

    Description: {
      textOverflow: 'ellipsis / 2',
      whiteSpace: 'normal',
    },

    Actions: {
      gap: '1x',
      // The color this banner OFFERS to `current`-themed children that cannot
      // use the inherited one. `Banner.Action` is `current.invert`: it writes
      // its label on a `#surface` pill, and a banner's inherited color is
      // `#white` — which IS `#surface` in light mode, so unaided it measures
      // cr 1.00. Handing down `accent-text` puts it at 6.87–7.90 in both
      // schemes, with the pill still 1.5 (light) / 2.4 (dark) off the banner.
      //
      // Declared here rather than on `Banner.Action` so the banner states its
      // color context once and its children stay theme-agnostic — the wrapper
      // is the natural place for it, and custom properties inherit. It is safe
      // for the dismiss button to sit in the same wrapper: that one is
      // `current.clear`, which paints from `#current` and never reads this, so
      // it keeps the `#white` that measures 4.62 against the banner where this
      // accent would measure 1.53.
      //
      // The disabled entries are not optional, and they are the whole contract:
      // a container that OFFERS a color owns that color in every state. The
      // reader gates its own fade on `!inherit-disabled` precisely because
      // something above is expected to have done it — true when the color is
      // inherited, and true here only if this map says so. Drop them and a
      // disabled banner keeps a full-strength `accent-text` label on a dead
      // chip: cr 5.69 light / 6.13 dark, reading live. At `.4` it lands on
      // 1.81 / 2.20, the same ~2:1 band every other disabled label in this file
      // is tuned to.
      '$current-accent': BANNER_ACTION_ACCENT,
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
  // No `theme`: it stays on `Item.Action`'s `current` default and takes its
  // color from the `--current-accent` the banner offers above.

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
