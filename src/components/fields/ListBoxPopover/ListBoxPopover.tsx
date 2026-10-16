import { getEventTarget, isFocusWithin } from '@react-aria/utils';
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
import { useInteractOutside, useOverlay, useOverlayPosition } from 'react-aria';

import { useEvent } from '../../../_internal/hooks/use-event';
import { useI18n } from '../../../i18n';
import { mergeProps } from '../../../utils/react';
import { mergeRefs } from '../../../utils/react/useCombinedRefs';
import { DisplayTransition } from '../../helpers';
import { useModalLayerRef } from '../../overlays/Modal/modal-containment';
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
  /** Space between options, in pixels. Defaults to a hairline (`1bw`). */
  listGap?: number;
  selectedKey?: Key | null;
  /**
   * `'multiple'` lets the list hold several selected options. The list then
   * reports the whole new selection on every toggle and never closes itself;
   * the caller decides what a toggle means. Defaults to `'single'`.
   */
  selectionMode?: 'single' | 'multiple';
  /** The selected keys in `'multiple'` mode. Ignored in `'single'` mode. */
  selectedKeys?: Key[];
  /** Whether options show a checkbox. Only applies in `'multiple'` mode. */
  isCheckable?: boolean;
  /**
   * Whether a click inside the element `triggerRef` points at closes the
   * popover, like any other outside click. Pass `false` when that element is
   * where the user keeps working with the list open, such as an input that
   * picks several options in a row. Only this popover is affected; others
   * still close. Defaults to `true`.
   */
  shouldCloseOnTriggerInteraction?: boolean;
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
  /**
   * Ids of the elements that name the field, read after `label` or
   * `ariaLabel`. Without either, they alone name the list, in place of the
   * generic "Options".
   */
  ariaLabelledby?: string;
  compositeFocusProps: {
    onFocus: (e: React.FocusEvent) => void;
    onBlur: (e: React.FocusEvent) => void;
  };
  /** Collection node filter applied to the ListBox. */
  filter?: (nodes: Iterable<any>) => Iterable<any>;
  size?: 'small' | 'medium' | 'large' | (string & {});
  /**
   * Label shown when the list is empty (no items / no filter results).
   * Forwarded to the inner ListBox.
   */
  emptyLabel?: ReactNode;
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

// The controls an outside press reaches: a button, a link, a form control,
// anything with `tabindex`, or something inside one.
const CONTROL_SELECTOR =
  'button, a[href], input, select, textarea, [tabindex], [contenteditable]:not([contenteditable="false"])';

// The layer a field sits in: a dialog, popover or tray, otherwise the page.
const LAYER_SELECTOR =
  '[role="dialog"], [role="alertdialog"], [data-overlay-layer]';

const DISABLED_SELECTOR = ':disabled, [aria-disabled="true"]';

// An enabled control apart from the field, in the field's own layer. A press
// anywhere else counts as blank space and keeps the field's focus and draft:
// on the field itself, on a dialog's surface, on a disabled control, or
// outside the field's layer, which stays open.
function isOutsideControl(el: Element, trigger: HTMLElement | null) {
  const control = el.closest(CONTROL_SELECTOR);

  if (
    control == null ||
    trigger == null ||
    control.contains(trigger) ||
    trigger.contains(control) ||
    control.matches(`${LAYER_SELECTOR}, ${DISABLED_SELECTOR}`)
  ) {
    return false;
  }

  const layer = trigger.closest(LAYER_SELECTOR);

  return layer == null || layer.contains(control);
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
  const { t } = useI18n();
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
    listGap,
    selectedKey,
    selectionMode = 'single',
    selectedKeys,
    isCheckable,
    shouldCloseOnTriggerInteraction = true,
    isDisabled,
    disabledKeys,
    items,
    children,
    listStateRef,
    onSelectionChange,
    onClose,
    label,
    ariaLabel,
    ariaLabelledby,
    compositeFocusProps,
    filter,
    size = 'medium',
    emptyLabel,
    positionTargetRef,
    positionApiRef,
  } = props;

  const mergedPopoverRef = popoverRef;

  // Opened inside a modal, the list stays readable while the modal hides the
  // page.
  const layerRef = useModalLayerRef();

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

  const getOutsidePressBehavior = (el: Element) => {
    const menuTriggerEl = el.closest('[data-popover-trigger]');
    if (menuTriggerEl) {
      return menuTriggerEl === triggerRef.current ? 'consume' : 'ignore';
    }
    if (
      (!shouldCloseOnTriggerInteraction && triggerRef.current?.contains(el)) ||
      el.closest('[data-popover-keep]')
    ) {
      return 'ignore';
    }
    // The press reaches an outside control, so a checkbox toggles, a text
    // field takes focus and a native Save button saves on the first click.
    // A UI Kit Button passes from any layer, unless it is disabled.
    const dismissEl = el.closest('[data-popover-dismiss]');

    if (
      isOutsideControl(el, triggerRef.current) ||
      (dismissEl != null && !dismissEl.matches(DISABLED_SELECTOR))
    ) {
      return 'pass';
    }
    return 'consume';
  };

  // Overlay behavior (dismiss on outside click, escape)
  const { overlayProps: overlayBehaviorProps } = useOverlay(
    {
      onClose,
      shouldCloseOnBlur: true,
      isOpen,
      isDismissable: true,
      shouldCloseOnInteractOutside: (el) => {
        const behavior = getOutsidePressBehavior(el);
        if (behavior === 'pass') {
          // Leave the control's press intact and close after its action.
          setTimeout(onClose, 0);
        }
        return behavior === 'consume';
      },
    },
    mergedPopoverRef as any,
  );

  const preserveOutsidePressFocus = useEvent((event: PointerEvent) => {
    if (
      (isFocusWithin(triggerRef.current) ||
        isFocusWithin(mergedPopoverRef.current)) &&
      getOutsidePressBehavior(getEventTarget(event) as Element) === 'consume'
    ) {
      event.preventDefault();
    }
  });

  // Aria now permits outside presses to move focus. A passed press moves it
  // to its control, and the field settles its draft on blur, as on Tab. A
  // consumed press, such as one on blank space or a dialog's backdrop, must
  // only dismiss this list: the field keeps focus and its draft.
  useInteractOutside({
    ref: mergedPopoverRef,
    isDisabled: !isOpen,
    onInteractOutsideStart: preserveOutsidePressFocus,
    onInteractOutside: preserveOutsidePressFocus,
  });

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
      {({ phase, isShown, isExiting, ref: transitionRef }) => {
        transitionRefHolder.current = transitionRef;
        return (
          <ListBoxPopoverWrapper
            {...mergeProps(
              { ...overlayPositionProps, style: positionStyle },
              overlayBehaviorProps,
              compositeFocusProps,
            )}
            ref={mergeRefs(mergedPopoverRef, layerRef)}
            style={positionStyle}
            // A press on the list while it fades out must not close the
            // overlay under it (CUB-5293) — see `Overlay`.
            data-react-aria-top-layer={isExiting || undefined}
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
                isBare
                ref={listBoxRef}
                disableSelectionToggle
                id={listBoxId}
                aria-label={
                  ariaLabel ||
                  (typeof label === 'string'
                    ? label
                    : ariaLabelledby
                      ? undefined
                      : t('listBoxPopover.options', 'Options'))
                }
                aria-labelledby={ariaLabelledby}
                // Left unset in single mode, as before this prop existed: an
                // explicit `'single'` switches on ListBox's no-toggle branch,
                // which changes what re-picking the selected option does.
                selectionMode={
                  selectionMode === 'multiple' ? 'multiple' : undefined
                }
                selectedKey={
                  selectionMode === 'single' ? selectedKey : undefined
                }
                selectedKeys={
                  selectionMode === 'multiple' ? selectedKeys : undefined
                }
                isCheckable={
                  selectionMode === 'multiple' ? isCheckable : undefined
                }
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
                listGap={listGap}
                stateRef={listStateRef}
                shape="popover"
                emptyLabel={emptyLabel}
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
