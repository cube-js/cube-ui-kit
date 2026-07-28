import { FocusableRefValue } from '@react-types/shared';
import { BaseProps, mergeStyles, Styles, tasty } from '@tenphi/tasty';
import {
  ForwardedRef,
  forwardRef,
  isValidElement,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';

import { useI18n } from '../../../i18n';
import { InfoCircleIcon } from '../../../icons/index';
import { CubeItemActionProps, ItemAction } from '../../actions/ItemAction';
import { CubeUseActionProps } from '../../actions/use-action';
import { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';
import { ItemBadge } from '../ItemBadge';

export type CubeInfoBadgeTooltipConfig = Omit<
  CubeTooltipProviderProps,
  'children'
>;

export interface CubeInfoBadgeProps
  extends Omit<BaseProps, 'children'>,
    Partial<
      Pick<
        CubeUseActionProps,
        'to' | 'onPress' | 'navigationOptions' | 'target' | 'label'
      >
    > {
  /**
   * Tooltip content. Either the content itself or a configuration object
   * `{ title, ...tooltipProps }` for advanced setups (placement, delay, etc.).
   */
  tooltip: ReactNode | CubeInfoBadgeTooltipConfig;
  /**
   * Text appended to the tooltip content. Defaults to a "learn more" hint when
   * the badge is interactive (`to` or `onPress` is provided). Pass `null` or an
   * empty string to opt out.
   */
  tooltipSuffix?: ReactNode;
  /** Icon to render. @default <InfoCircleIcon /> */
  icon?: ReactNode;
  /**
   * Size of the badge. `inline` matches the line height of the surrounding
   * text, which makes the badge blend into labels and paragraphs.
   * @default "inline"
   */
  size?: 'inline' | 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | number;
  /** @default "clear" */
  type?: 'primary' | 'outline' | 'clear' | (string & {});
  /** @default "default" */
  theme?: 'default' | 'danger' | 'success' | 'special' | (string & {});
  isLoading?: boolean;
  isDisabled?: boolean;
  styles?: Styles;
}

const SIZE_TOKENS: Record<string, string> = {
  inline: '(1lh + 2bw)',
  xsmall: '$size-xs',
  small: '$size-sm',
  medium: '$size-md',
  large: '$size-lg',
  xlarge: '$size-xl',
};

/**
 * The info badge is a leaf element that is often placed inside a bigger click
 * target: a field `<label>`, a switch row, a table header, a list item. Neither
 * the tooltip nor the optional navigation should ever activate that container,
 * so the events that would do so are contained here.
 *
 * The guard sits *above* the badge, so the badge's own handlers (including
 * `usePress`, which fires `onPress` from the `click` event) run first and stay
 * intact. `preventDefault` on click is what stops an enclosing `<label>` from
 * forwarding activation to its control — `stopPropagation` alone can't.
 *
 * `pointerup` / `mouseup` are intentionally left alone: `usePress` finishes a
 * press through document-level listeners for those events.
 */
const GUARD_HANDLERS = {
  onClick: (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  },
  onPointerDown: (event: PointerEvent) => event.stopPropagation(),
  onMouseDown: (event: MouseEvent) => event.stopPropagation(),
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
    }
  },
  onKeyUp: (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
    }
  },
};

/**
 * `display: contents` keeps the guard out of the layout entirely while staying
 * in the event path, so the badge remains a direct flex/grid/inline child of
 * whatever contains it.
 */
const GuardElement = tasty({
  as: 'span',
  styles: { display: 'contents' },
});

// Soft → strong on interaction, mirroring the link styles: the badge reads as a
// quiet brand-colored hint at rest and gains contrast once it's engaged.
const INFO_STYLES: Styles = {
  color: {
    '': '#primary-text-soft',
    'hovered | focused': '#primary-text',
    pressed: '#primary-text',
  },
};

function isTooltipConfig(
  value: ReactNode | CubeInfoBadgeTooltipConfig,
): value is CubeInfoBadgeTooltipConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isValidElement(value) &&
    !Array.isArray(value)
  );
}

/**
 * An informational icon with a tooltip. Renders as a plain badge by default and
 * upgrades to a link / button when `to` or `onPress` is provided.
 */
export const InfoBadge = forwardRef(function InfoBadge(
  allProps: CubeInfoBadgeProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const { t } = useI18n();

  const {
    tooltip,
    tooltipSuffix,
    icon = <InfoCircleIcon />,
    size = 'inline',
    type = 'clear',
    theme = 'default',
    to,
    onPress,
    navigationOptions,
    target,
    label,
    qa = 'InfoBadge',
    styles,
    ...rest
  } = allProps;

  const isInteractive = to != null || onPress != null;

  const { title, tooltipProps } = useMemo(() => {
    if (isTooltipConfig(tooltip)) {
      const { title, ...tooltipProps } = tooltip;

      return { title, tooltipProps };
    }

    return { title: tooltip, tooltipProps: {} };
  }, [tooltip]);

  const suffix =
    tooltipSuffix === undefined
      ? isInteractive
        ? t('infoBadge.learnMore', 'Click to learn more.')
        : null
      : tooltipSuffix;

  const finalTooltip = useMemo(
    () => ({
      ...tooltipProps,
      title: suffix ? (
        <>
          {title} {suffix}
        </>
      ) : (
        title
      ),
    }),
    [tooltipProps, title, suffix],
  );

  // The accessible name is the tooltip text itself when it's plain text. Rich
  // tooltip content can't serve as a label, so fall back to a generic one.
  const ariaLabel =
    label ??
    rest['aria-label'] ??
    (typeof title === 'string'
      ? title
      : t('infoBadge.ariaLabel', 'More information'));

  const finalStyles = useMemo(() => {
    const sizeToken =
      typeof size === 'number' ? `${size}px` : SIZE_TOKENS[size] ?? size;

    return mergeStyles(
      {
        $size: sizeToken,
        // The badge is standalone rather than part of an `Item` action row, so
        // it shouldn't reserve the row's side padding as an outer margin.
        '$side-padding': 0,
        verticalAlign: 'middle',
      },
      // Only the default look is brand-tinted; explicit themes and filled
      // types bring their own colors.
      theme === 'default' && type === 'clear' ? INFO_STYLES : null,
      styles,
    );
  }, [size, theme, type, styles]);

  // `ItemAction` exposes a react-spectrum focusable ref; unwrap it so that `ref`
  // points at the DOM node whether or not the badge is interactive.
  const actionRef = useCallback(
    (value: FocusableRefValue<HTMLElement> | null) => {
      const element = value ? value.UNSAFE_getDOMNode() : null;

      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    },
    [ref],
  );

  const sharedProps = {
    ...rest,
    qa,
    icon,
    type,
    theme,
    styles: finalStyles,
    'aria-label': ariaLabel,
    tooltip: finalTooltip as CubeItemActionProps['tooltip'],
  };

  return (
    <GuardElement {...GUARD_HANDLERS}>
      {isInteractive ? (
        <ItemAction
          ref={actionRef}
          to={to}
          onPress={onPress}
          navigationOptions={navigationOptions}
          target={target}
          {...sharedProps}
        />
      ) : (
        <ItemBadge ref={ref as ForwardedRef<HTMLDivElement>} {...sharedProps} />
      )}
    </GuardElement>
  );
});

export type { CubeInfoBadgeProps as InfoBadgeProps };
