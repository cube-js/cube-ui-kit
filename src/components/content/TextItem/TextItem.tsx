import {
  BASE_STYLES,
  COLOR_STYLES,
  filterBaseProps,
  mergeStyles,
  Styles,
  tasty,
  TEXT_STYLES,
} from '@tenphi/tasty';
import {
  AnchorHTMLAttributes,
  forwardRef,
  ForwardRefExoticComponent,
  HTMLAttributes,
  Ref,
  RefAttributes,
  RefObject,
  useEffectEvent,
  useLayoutEffect,
} from 'react';
import { PositionProps } from 'react-aria';

import { extractStyles } from '../../../utils/styles';
import { highlightText } from '../highlightText';
import {
  CubeTextProps,
  TEXT_DEFAULT_STYLES,
  TEXT_PROP_MAP,
  useTextProps,
} from '../Text';
import { AutoTooltipValue, useAutoTooltip } from '../use-auto-tooltip';

const STYLE_LIST = [...BASE_STYLES, ...TEXT_STYLES, ...COLOR_STYLES] as const;

/**
 * TextItem truncates to one line with an ellipsis, so Text's `ellipsis` and
 * `nowrap` have nothing to switch.
 */
export interface CubeTextItemProps extends Omit<
  CubeTextProps,
  'ellipsis' | 'nowrap'
> {
  /**
   * String to highlight within children.
   * Only works when children is a plain string.
   */
  highlight?: string;
  /**
   * Whether highlight matching is case-sensitive.
   * @default false
   */
  highlightCaseSensitive?: boolean;
  /**
   * Custom styles for highlighted text.
   */
  highlightStyles?: Styles;
  /**
   * Tooltip content and configuration:
   * - string: simple tooltip text
   * - true: auto tooltip on overflow (shows children as tooltip when truncated)
   * - object: advanced configuration with optional auto property
   * @default true
   */
  tooltip?: AutoTooltipValue;
  /**
   * Default tooltip placement.
   * @default "top"
   */
  tooltipPlacement?: PositionProps['placement'];
}

const TEXT_ITEM_STYLES = {
  display: 'inline-block',
  verticalAlign: 'bottom',
  width: 'max 100%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} satisfies Styles;

const NATIVE_LINK_STYLES: Styles = {
  // The child native target takes presses while this span keeps hover
  // ownership for its truncation tooltip.
  position: { '': undefined, 'native-link': 'relative' },
  zIndex: { '': undefined, 'native-link': 1 },
};

const TextItemElement = tasty({
  as: 'span',
  styles: TEXT_DEFAULT_STYLES,
  variants: {
    plain: TEXT_ITEM_STYLES,
    table: mergeStyles(TEXT_ITEM_STYLES, { preset: 't3' }),
    nativePlain: mergeStyles(TEXT_ITEM_STYLES, NATIVE_LINK_STYLES),
    nativeTable: mergeStyles(TEXT_ITEM_STYLES, NATIVE_LINK_STYLES, {
      preset: 't3',
    }),
  },
});

const NativeTextLink = tasty({
  as: 'a',
  styles: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    outline: 0,
  },
});

interface TextItemWithNativeLinkProps extends CubeTextItemProps {
  nativeLinkProps?: AnchorHTMLAttributes<HTMLAnchorElement>;
}

const TEXT_ITEM_STYLE_KEYS = Object.keys(TEXT_ITEM_STYLES) as Array<
  keyof typeof TEXT_ITEM_STYLES
>;

/** Style merging copies state maps, so identity cannot recognize the defaults. */
function matchesNativeState(value: unknown, expected: string | number) {
  if (value == null || typeof value !== 'object' || Array.isArray(value))
    return false;

  const states = value as Record<string, unknown>;
  return (
    Object.keys(states).length === 2 &&
    Object.hasOwn(states, '') &&
    Object.hasOwn(states, 'native-link') &&
    states[''] === undefined &&
    states['native-link'] === expected
  );
}

function getStaticVariant(styles: Styles) {
  const count = Object.keys(styles).length;

  if (
    !TEXT_ITEM_STYLE_KEYS.every((key) => styles[key] === TEXT_ITEM_STYLES[key])
  ) {
    return;
  }

  if (count === TEXT_ITEM_STYLE_KEYS.length) return 'plain';
  if (count === TEXT_ITEM_STYLE_KEYS.length + 1 && styles.preset === 't3')
    return 'table';

  if (
    !matchesNativeState(styles.position, 'relative') ||
    !matchesNativeState(styles.zIndex, 1)
  ) {
    return;
  }

  if (count === TEXT_ITEM_STYLE_KEYS.length + 2) return 'nativePlain';
  if (count === TEXT_ITEM_STYLE_KEYS.length + 3 && styles.preset === 't3')
    return 'nativeTable';
}

/** Own the DOM ref outside the tooltip's render prop so Compiler can retain it. */
function TextItemContent({
  ref,
  labelRef,
  tooltipRef,
  onAppearanceCommit,
  nativeLinkProps,
  ...props
}: CubeTextProps & {
  ref?: Ref<HTMLElement>;
  labelRef: (element: HTMLElement | null) => void;
  tooltipRef?: RefObject<HTMLElement | null>;
  onAppearanceCommit?: () => void;
  nativeLinkProps?: AnchorHTMLAttributes<HTMLAnchorElement>;
}) {
  const handleRef = (element: HTMLElement | null) => {
    if (typeof ref === 'function') ref(element);
    else if (ref) ref.current = element;

    if (tooltipRef) tooltipRef.current = element;

    labelRef(element);
  };

  // Match tasty(Text)'s prop/style merge before Text applies its slot. A reset
  // here removes the TextItem default and restores Text's native default.
  const textProps = useTextProps({
    qa: 'TextItem',
    ...props,
    as: props.as ?? undefined,
    element: props.element || undefined,
    styles: mergeStyles(
      TEXT_ITEM_STYLES,
      nativeLinkProps ? NATIVE_LINK_STYLES : undefined,
      props.styles,
    ),
  });
  const variant = getStaticVariant(textProps.styles);

  const shouldMeasure = !!onAppearanceCommit;
  const refreshOverflow = useEffectEvent(() => onAppearanceCommit?.());

  // A fixed box can change its text width without a ResizeObserver delivery.
  // Queue after its props/slot commit, as the former ref reattachment did.
  useLayoutEffect(() => {
    if (shouldMeasure) refreshOverflow();
  }, [textProps, shouldMeasure]);

  // Reuse Tasty's static-style cache for common labels, with one native owner
  // across style/slot changes so a focused label never remounts for styling.
  return (
    <TextItemElement
      {...textProps}
      mods={{ ...textProps.mods, 'native-link': !!nativeLinkProps }}
      variant={variant}
      styles={variant ? undefined : textProps.styles}
      ref={handleRef}
    >
      {nativeLinkProps ? (
        <>
          {textProps.children}
          <NativeTextLink
            {...nativeLinkProps}
            data-element="NativeLink"
            aria-hidden={true}
            tabIndex={-1}
            children={undefined}
          />
        </>
      ) : (
        textProps.children
      )}
    </TextItemElement>
  );
}

export const TextItem = forwardRef<HTMLElement, CubeTextItemProps>(
  function TextItem(props, ref) {
    const {
      children,
      highlight,
      highlightCaseSensitive = false,
      highlightStyles,
      tooltip = true,
      tooltipPlacement = 'top',
      nativeLinkProps,
      ...restProps
    } = props as TextItemWithNativeLinkProps;

    // Extract style props (preset, color, etc.) to pass via styles prop
    const styles = extractStyles(restProps, STYLE_LIST, {}, TEXT_PROP_MAP);

    const {
      labelRef,
      renderWithTooltip,
      isAutoTooltipEnabled,
      scheduleOverflowCheck,
    } = useAutoTooltip({ tooltip, children });

    // Process children with highlight if applicable
    const processedChildren =
      typeof children === 'string' && highlight
        ? highlightText(
            children,
            highlight,
            highlightCaseSensitive,
            highlightStyles,
          )
        : children;

    const renderElement = (
      tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
      tooltipRef?: RefObject<HTMLElement>,
    ) => {
      return (
        <TextItemContent
          {...filterBaseProps(restProps, { eventProps: true })}
          {...tooltipTriggerProps}
          ref={ref}
          labelRef={labelRef}
          tooltipRef={tooltipRef}
          nativeLinkProps={nativeLinkProps}
          onAppearanceCommit={
            isAutoTooltipEnabled ? scheduleOverflowCheck : undefined
          }
          styles={styles}
        >
          {processedChildren}
        </TextItemContent>
      );
    };

    return renderWithTooltip(renderElement, tooltipPlacement);
  },
);

TextItem.displayName = 'TextItem';

/** @private Retains text hover ownership above a stretched native row link. */
export const TextItemWithNativeLink = TextItem as ForwardRefExoticComponent<
  TextItemWithNativeLinkProps & RefAttributes<HTMLElement>
>;
