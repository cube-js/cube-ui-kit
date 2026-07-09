import { Key } from '@react-types/shared';
import { Styles, tasty } from '@tenphi/tasty';
import React, {
  CSSProperties,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useOverlay, useOverlayPosition } from 'react-aria';

import { useUIKitTranslation } from '../../../i18n';
import { mergeProps } from '../../../utils/react';
import { DisplayTransition } from '../../helpers';
import { Portal } from '../../portal';
import { ListBox } from '../ListBox/ListBox';

export interface ListBoxPopoverProps {
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement>;
  popoverRef: RefObject<HTMLDivElement>;
  listBoxRef: RefObject<HTMLDivElement>;
  direction: 'bottom' | 'top';
  shouldFlip: boolean;
  overlayOffset: number;
  containerPadding: number;
  /** Min width (px) for the overlay; usually the trigger's width. */
  comboBoxWidth?: number;
  /** Stable id used for the ListBox element and aria-controls wiring. */
  listBoxId: string;
  overlayStyles?: Styles;
  listBoxStyles?: Styles;
  optionStyles?: Styles;
  /** Substring to highlight within each option's (text) children. */
  optionHighlight?: string;
  sectionStyles?: Styles;
  headingStyles?: Styles;
  selectedKey?: Key | null;
  isDisabled?: boolean;
  disabledKeys?: Iterable<Key>;
  items?: Iterable<any>;
  children: ReactNode;
  /** Ref through which the ListBox exposes its internal list state. */
  listStateRef: RefObject<any>;
  onSelectionChange: (selection: Key | Key[] | null) => void;
  onClose: () => void;
  label?: ReactNode;
  ariaLabel?: string;
  compositeFocusProps: {
    onFocus: (e: React.FocusEvent) => void;
    onBlur: (e: React.FocusEvent) => void;
  };
  /** Collection node filter applied to the ListBox. */
  filter?: (nodes: Iterable<any>) => Iterable<any>;
  size?: 'small' | 'medium' | 'large' | (string & {});
  /**
   * Element to anchor the overlay to geometrically. Defaults to `triggerRef`.
   * Use this to anchor to something other than the trigger (e.g. the caret in
   * a textarea) while keeping `triggerRef` for outside-click/dismiss logic.
   */
  positionTargetRef?: RefObject<Element | null>;
  /**
   * Receives an imperative handle exposing `updatePosition()` so the caller can
   * force the overlay to re-anchor (e.g. when the caret moves).
   */
  positionApiRef?: RefObject<{ updatePosition: () => void } | null>;
}

const ListBoxPopoverWrapper = tasty({
  qa: 'ComboBoxOverlayWrapper',
  styles: {
    position: 'absolute',
    zIndex: 1000,
  },
});

const ListBoxPopoverElement = tasty({
  qa: 'ComboBoxOverlay',
  styles: {
    display: 'grid',
    gridRows: '1sf',
    gridColumns: '1sf',
    width: '$overlay-min-width max-content 50vw',
    height: 'initial max-content (50vh - 5x)',
    overflow: 'auto',
    fill: '#surface',
    radius: '1cr',
    shadow: true,
    padding: '0',
    border: '#border',
    hide: {
      '': false,
      hidden: true,
    },
    boxSizing: 'border-box',
    transition:
      'translate $transition ease-out, scale $transition ease-out, theme $transition ease-out',
    translate: {
      '': '0 0',
      'open & [data-placement="top"]': '0 0',
      '!open & [data-placement="top"]': '0 1x',
      'open & ([data-placement="bottom"] | ![data-placement])': '0 0',
      '!open & ([data-placement="bottom"] | ![data-placement])': '0 -1x',
    },
    transformOrigin: {
      '': 'top center',
      '[data-placement="top"]': 'bottom center',
    },
    scale: {
      '': '1 1',
      '!open': '1 .9',
    },
    opacity: {
      '': 1,
      '!open': 0.001,
    },

    '$overlay-min-width': 'min 30x',
  },
});

export const ListBoxPopover = function ListBoxPopover(
  props: ListBoxPopoverProps,
) {
  const { t } = useUIKitTranslation();
  const {
    isOpen,
    triggerRef,
    popoverRef,
    listBoxRef,
    direction,
    shouldFlip,
    overlayOffset,
    containerPadding,
    comboBoxWidth,
    listBoxId,
    overlayStyles,
    listBoxStyles,
    optionStyles,
    optionHighlight,
    sectionStyles,
    headingStyles,
    selectedKey,
    isDisabled,
    disabledKeys,
    items,
    children,
    listStateRef,
    onSelectionChange,
    onClose,
    label,
    ariaLabel,
    compositeFocusProps,
    filter,
    size = 'medium',
    positionTargetRef,
    positionApiRef,
  } = props;

  const mergedPopoverRef = popoverRef;

  // Ref to the inner scrollable element (the visible popover). react-aria
  // measures this for its flip/shrink math and writes maxHeight onto the
  // overlay (positioning wrapper); we forward that maxHeight to this element
  // below so the scroll container actually shrinks instead of overflowing.
  const overlayScrollRef = useRef<HTMLDivElement | null>(null);

  // Overlay positioning — anchor to the explicit position target when given
  // (e.g. a caret anchor), otherwise to the trigger. `triggerRef` is still
  // used below for outside-click/dismiss behavior.
  const {
    overlayProps: overlayPositionProps,
    placement,
    updatePosition,
  } = useOverlayPosition({
    targetRef: (positionTargetRef ?? triggerRef) as any,
    overlayRef: mergedPopoverRef as any,
    scrollRef: overlayScrollRef as any,
    placement: `${direction} start` as any,
    shouldFlip,
    isOpen,
    offset: overlayOffset,
    containerPadding: containerPadding,
  });

  // Keep positioning (top/left/zIndex) on the wrapper, but split out the
  // available-space cap so it can be applied to the inner scroll element.
  const { maxHeight, maxWidth, ...positionStyle } =
    (overlayPositionProps.style ?? {}) as CSSProperties;

  // Expose updatePosition so callers can re-anchor on demand (e.g. caret move).
  useEffect(() => {
    if (positionApiRef) {
      positionApiRef.current = { updatePosition };
    }
    return () => {
      if (positionApiRef) {
        positionApiRef.current = null;
      }
    };
  }, [positionApiRef, updatePosition]);

  // Overlay behavior (dismiss on outside click, escape)
  const { overlayProps: overlayBehaviorProps } = useOverlay(
    {
      onClose,
      shouldCloseOnBlur: true,
      isOpen,
      isDismissable: true,
      shouldCloseOnInteractOutside: (el) => {
        const menuTriggerEl = el.closest('[data-popover-trigger]');
        if (!menuTriggerEl) {
          if (el.closest('[data-popover-keep]')) return false;
          // Plain interactive controls (Button, ItemButton) opt in via
          // `data-popover-dismiss` to dismiss us without losing their click
          // to useOverlay's stopPropagation. Schedule the close after the
          // click finishes so the button's onPress runs first.
          if (el.closest('[data-popover-dismiss]')) {
            setTimeout(onClose, 0);
            return false;
          }
          return true;
        }
        if (menuTriggerEl === triggerRef?.current) return true;
        return false;
      },
    },
    mergedPopoverRef as any,
  );

  // Extract primary placement direction for consistent styling
  const placementDirection = placement?.split(' ')[0] || direction;

  // Hold the DisplayTransition ref so we can bind the same node to both the
  // transition listener and our scroll ref via a single stable callback.
  const transitionRefHolder = useRef<
    ((node: HTMLElement | null) => void) | null
  >(null);
  const setScrollRef = useCallback((node: HTMLElement | null) => {
    overlayScrollRef.current = node as HTMLDivElement | null;
    transitionRefHolder.current?.(node);
  }, []);

  const overlayContent = (
    <DisplayTransition isShown={isOpen}>
      {({ phase, isShown, ref: transitionRef }) => {
        transitionRefHolder.current = transitionRef;
        return (
          <ListBoxPopoverWrapper
            {...mergeProps(
              { ...overlayPositionProps, style: positionStyle },
              overlayBehaviorProps,
              compositeFocusProps,
            )}
            ref={mergedPopoverRef}
            style={positionStyle}
          >
            <ListBoxPopoverElement
              ref={setScrollRef}
              data-placement={placementDirection}
              data-phase={phase}
              mods={{
                open: isShown,
                hidden: phase === 'unmounted',
              }}
              styles={overlayStyles}
              style={{
                '--overlay-min-width': comboBoxWidth
                  ? `${comboBoxWidth}px`
                  : undefined,
                maxHeight,
                maxWidth,
              }}
            >
              <ListBox
                ref={listBoxRef}
                focusOnHover
                disableSelectionToggle
                id={listBoxId}
                aria-label={
                  ariaLabel ||
                  (typeof label === 'string'
                    ? label
                    : t('listBoxPopover.options', 'Options'))
                }
                selectedKey={selectedKey}
                selectionMode="single"
                isDisabled={isDisabled}
                disabledKeys={disabledKeys}
                shouldUseVirtualFocus={true}
                items={items as any}
                filter={filter}
                styles={listBoxStyles}
                optionStyles={optionStyles}
                optionHighlight={optionHighlight}
                sectionStyles={sectionStyles}
                headingStyles={headingStyles}
                stateRef={listStateRef}
                size="medium"
                shape="popover"
                onSelectionChange={onSelectionChange}
              >
                {children as any}
              </ListBox>
            </ListBoxPopoverElement>
          </ListBoxPopoverWrapper>
        );
      }}
    </DisplayTransition>
  );

  return <Portal>{overlayContent}</Portal>;
};
