import { Mods, Styles, tasty } from '@tenphi/tasty';
import {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFocusWithin, useHover } from 'react-aria';

import {
  ITEM_RESTING_COLOR_VARIANTS,
  resolveItemVariant,
  ROW_STATE_ALIASES,
} from '../../data/item-themes';
import { CubeItemProps } from '../content/Item/Item';
import { DisplayTransition } from '../helpers/DisplayTransition/DisplayTransition';

import { ItemActionProvider } from './ItemActionContext';

/**
 * The sibling-actions layout shared by `ItemButton` and the field triggers
 * (`Select` / `Picker` / `FilterPicker`).
 *
 * A row's actions cannot live inside the row when the row is itself a button:
 * that nests a `<button>` in a `<button>`, and a press on an action activates
 * the row. So the run is rendered as a SIBLING, laid over the row's trailing
 * end, and the row reserves the space for it through `--actions-width` — which
 * this file measures — and `Item`'s own `actions` placeholder column.
 *
 * The run is pointer-transparent; only its children take presses. That is what
 * lets a picker put its non-interactive caret in the run and still have a click
 * on the caret reach the trigger underneath, and it stops the run's padding and
 * inter-action gaps from swallowing presses meant for the row.
 */
const ItemActionsWrapperElement = tasty({
  // Actions default to the `current` type, which paints from the inherited
  // `currentcolor` — but they are rendered as a SIBLING of the row here, not
  // inside it, so without this they would inherit the page color instead of the
  // row's. Harmless on the default theme (the two match) and plainly wrong on
  // any other: a `special` row would hand its actions the page's dark text to
  // tint with, on a dark purple surface. The variant carries the row's resting
  // color down so `currentcolor` means the same thing it does inside an `Item`.
  variants: ITEM_RESTING_COLOR_VARIANTS,
  styles: {
    // The row is the wrapper's own child, so the wrapper can read the one
    // interaction the row expresses as a COLOR change rather than a fill change.
    // Without it the label darkened under the finger while the caret and the
    // actions laid over the same row — which paint from the color this element
    // hands down — stayed at their resting tint. The variants restate it,
    // because that is where the colors keyed on it live.
    ...ROW_STATE_ALIASES,

    // The one layout the row does not want its actions centred in. A block
    // description stacks under the label and can make the row arbitrarily tall;
    // there the actions belong in the first line, beside the label, which is
    // what anchoring them to a `$size`-tall box at the top achieves. Every other
    // row — including one with an INLINE description — is a single band, and
    // centring is both what it wants and what survives a caller overriding the
    // height. Read off the row rather than plumbed through as a prop, because
    // `Item` is what decides the placement and it defaults by type.
    '@block-description': ':has(> [data-description="block"])',

    display: 'grid',
    position: 'relative',
    placeContent: 'stretch',
    placeItems: 'stretch',

    $size: {
      '': '$size-md',
      'size=xsmall': '$size-xs',
      'size=small': '$size-sm',
      'size=medium': '$size-md',
      'size=large': '$size-lg',
      'size=xlarge': '$size-xl',
    },

    Actions: {
      $: '>',
      position: 'absolute',
      // Both insets set, so the run's BOX spans the row and `placeItems: center`
      // puts the actions on its centre line. What sits in the box does not grow
      // with it — every child is a fixed `$action-size`, which is capped so a
      // large row does not get oversized buttons.
      inset: {
        '': '1bw right dock',
        'type=card': '(1bw + .5x) right dock',
        '@block-description': '1bw 1bw auto auto',
        'type=card & @block-description': '(1bw + .5x) (1bw + .5x) auto auto',
      },
      display: 'flex',
      gap: '1bw',
      placeItems: 'center',
      placeContent: 'center end',

      // The run lies OVER the row. Left opaque, its padding and the gaps between
      // its actions eat presses that belong to the row behind it, and a
      // non-interactive control inside it (a picker's caret) could never reach
      // its own trigger. The run itself is therefore transparent to the pointer
      // and its children opt back in — see `ActionsChild` — so a child that
      // wants to stay transparent, like that caret, only has to say so.
      pointerEvents: 'none',

      padding: '0 $side-padding',
      // Only where the run is top-anchored: there the box has no bottom to
      // measure from, so `$size` is what gives it one. Everywhere else the two
      // insets decide the height, and this floor would force the box back to
      // `$size` and re-anchor it at the top.
      height: {
        '': 'min 0',
        '@block-description': 'min ($size - 2bw)',
      },
      opacity: {
        '': 1,
        '!actions-shown': 0,
      },
      // The run slides in as it fades, but only where it was taking no space to
      // begin with. Where the space is reserved the run has a fixed place in the
      // layout, and sliding it would read as the actions drifting rather than
      // appearing.
      translate: {
        '': '0 0',
        '!actions-shown & !preserve-actions-space': '.5x 0',
      },
      transition: 'theme, translate',

      // Size for the action buttons
      '$action-size': 'min(max((2x + 2bw), ($size - 1x - 2bw)), (3x - 2bw))',
      // Side padding for the button
      '$side-padding': '(($size - $action-size - 2bw) / 2)',
    },

    // Whatever a caller put in the run: interactive again, so the transparency
    // above applies only to the space BETWEEN and AROUND the actions. `*`
    // because the run's content is the caller's — there is no element name to
    // key on.
    ActionsChild: {
      $: '>Actions>*',
      pointerEvents: {
        '': 'auto',
        '!actions-shown': 'none',
      },
    },

    // A non-interactive box in the run, the same size as an action so it lines
    // up with one. `$side-padding + $action-size / 2` collapses to
    // `($size - 2bw) / 2` — the centre of `Item`'s own `rightIcon` square — so a
    // caret moved out of that slot and into the run does not move on screen.
    ActionIcon: {
      $: '>Actions>',
      display: 'grid',
      placeItems: 'center',
      placeContent: 'center',
      flexShrink: 0,
      width: '$action-size',
      height: '$action-size',
      // The run's children are interactive by default; this one is not, and a
      // press on it belongs to the row underneath.
      pointerEvents: 'none',
      // `--icon-size` comes from the preset, and the run is outside the row that
      // sets one — so the box restates the ladder `Item` uses. The `m` weights a
      // non-`item` type picks carry the same icon size as their plain
      // counterparts, so weight is not a factor here.
      preset: {
        '': 't3',
        'size=xsmall': 't4',
        'size=xlarge': 't2',
      },
    },
  },
});

/**
 * A non-interactive box inside an actions run — a dropdown caret, a loading
 * spinner. It occupies an action's footprint so the run stays evenly spaced,
 * and it lets presses through to the row behind it.
 */
export function ItemActionIcon(props: { children: ReactNode }) {
  return <div data-element="ActionIcon">{props.children}</div>;
}

export interface ItemActionsWrapperProps {
  /**
   * The row or trigger the actions are laid over. Receives the resolved
   * visibility so it can reserve space for the run while it is shown.
   */
  children: (state: { showActions: boolean }) => ReactNode;
  /**
   * The run's content. Rendering the wrapper with an empty run is supported and
   * costs nothing — the measured width is 0 — which is how a trigger keeps its
   * markup stable across states that do and do not have trailing controls.
   */
  actions?: ReactNode;
  type?: string;
  theme?: string;
  /** `Item`'s size token, or a pixel number. */
  size?: CubeItemProps['size'];
  isDisabled?: boolean;
  disableActionsFocus?: boolean;
  /**
   * Hide the actions until the row is hovered, focused, or holds a pressed
   * control.
   * @default false
   */
  autoHideActions?: boolean;
  /**
   * Keep the run's width reserved while it is hidden, so the row does not
   * change size as the actions come and go. Only meaningful with
   * `autoHideActions`.
   *
   * It also keeps the run MOUNTED rather than transitioning it in and out:
   * an unmounted run cannot be measured, so a row that starts hidden would
   * have nothing to reserve.
   * @default false
   */
  preserveActionsSpace?: boolean;
  /** Extra modifiers for the wrapper, merged after the ones it derives itself. */
  mods?: Mods;
  /** Styles for the wrapper element — the one that is the row's layout box. */
  styles?: Styles;
  /** Props spread on the run's container, e.g. `data-trigger-action`. */
  actionsProps?: HTMLAttributes<HTMLDivElement>;
}

/**
 * Wraps a row in the sibling-actions layout and publishes `--actions-width` so
 * the row can reserve the space the run covers.
 */
export function ItemActionsWrapper(props: ItemActionsWrapperProps) {
  const {
    children,
    actions,
    type = 'item',
    theme = 'default',
    size = 'medium',
    isDisabled,
    disableActionsFocus,
    autoHideActions = false,
    preserveActionsSpace = false,
    mods,
    styles,
    actionsProps,
  } = props;

  const actionsRef = useRef<HTMLDivElement>(null);
  const [actionsWidth, setActionsWidth] = useState(0);
  const [areActionsVisible, setAreActionsVisible] = useState(false);

  useLayoutEffect(() => {
    const el = actionsRef.current;

    if (!el) return;

    // An empty run still has the container's side padding, which would reserve
    // space inside the row for nothing. Nothing rendered means nothing to
    // reserve.
    const width = el.childElementCount ? Math.round(el.offsetWidth) : 0;

    if (width !== actionsWidth) {
      setActionsWidth(width);
    }
  }, [actions, areActionsVisible, actionsWidth]);

  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [hasPressed, setHasPressed] = useState(false);
  const { hoverProps, isHovered } = useHover({});
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  });

  // Watch for data-pressed attribute on any descendant element
  useLayoutEffect(() => {
    const actionsEl = actionsRef.current;

    if (!actionsEl || !autoHideActions) return;

    const checkPressed = () => {
      setHasPressed(actionsEl.querySelector('[data-pressed]') !== null);
    };

    const observer = new MutationObserver(checkPressed);

    observer.observe(actionsEl, {
      attributes: true,
      attributeFilter: ['data-pressed'],
      subtree: true,
    });

    checkPressed();

    return () => observer.disconnect();
  }, [areActionsVisible, autoHideActions]);

  const shouldShowActions =
    isHovered || isFocusWithin || hasPressed || !autoHideActions;

  // `disabled` is on the wrapper so its variant can paint the row's DISABLED
  // label color, not just the resting one. Actions default to the `current` type
  // and suppress their own fade when the disabled state is inherited — on the
  // grounds that the host already faded the color they paint from — so without
  // this the wrapper would hand them a full-strength color and a disabled button
  // would sit next to full-strength actions. See `ITEM_RESTING_COLOR_VARIANTS`.
  const finalMods = useMemo(() => {
    return {
      ...mods,
      ...(shouldShowActions ? { 'actions-shown': true } : null),
      ...(preserveActionsSpace ? { 'preserve-actions-space': true } : null),
      disabled: isDisabled,
    };
  }, [mods, shouldShowActions, preserveActionsSpace, isDisabled]);

  return (
    <ItemActionsWrapperElement
      {...hoverProps}
      // The same resolver `Item` uses, so the wrapper cannot land on a
      // different variant than the row it wraps.
      variant={resolveItemVariant(theme, type)}
      data-size={size}
      data-type={type}
      data-theme={theme}
      mods={finalMods}
      styles={styles}
      style={
        {
          '--actions-width':
            areActionsVisible || !autoHideActions || preserveActionsSpace
              ? `${actionsWidth}px`
              : '0px',
          ...(typeof size === 'number' && { '--size': `${size}px` }),
        } as CSSProperties
      }
    >
      {children({ showActions: shouldShowActions })}
      <ItemActionProvider
        type={type}
        theme={theme}
        disableActionsFocus={disableActionsFocus}
        isDisabled={isDisabled}
      >
        {autoHideActions && !preserveActionsSpace ? (
          <DisplayTransition
            exposeUnmounted
            isShown={shouldShowActions}
            onPhaseChange={(phase) => {
              setAreActionsVisible(phase !== 'unmounted');
            }}
          >
            {({ ref: transitionRef }) => {
              return (
                <div
                  {...focusWithinProps}
                  {...actionsProps}
                  ref={(node: any) => {
                    actionsRef.current = node;
                    transitionRef(node);
                  }}
                  data-element="Actions"
                >
                  {actions}
                </div>
              );
            }}
          </DisplayTransition>
        ) : (
          <div ref={actionsRef} {...actionsProps} data-element="Actions">
            {actions}
          </div>
        )}
      </ItemActionProvider>
    </ItemActionsWrapperElement>
  );
}
