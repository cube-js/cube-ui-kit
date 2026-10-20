import { getFocusableTreeWalker } from '@react-aria/focus';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  mergeStyles,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  RefCallback,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFocusRing, useHover, useMove } from 'react-aria';
import { createPortal } from 'react-dom';

import { useDebouncedValue } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import {
  mergeProps,
  useCombinedRefs,
  useLocalStorage,
} from '../../../utils/react';
import { focusProgrammatically } from '../../../utils/react/programmaticFocus';
import { extractStyles } from '../../../utils/styles';
import { DisplayTransition } from '../../helpers/DisplayTransition/DisplayTransition';
import { Dialog } from '../../overlays/Dialog';
import {
  CubeDialogContainerProps,
  DialogContainer,
} from '../../overlays/Dialog/DialogContainer';

import {
  LayoutContextReset,
  LayoutPanelContext,
  Side,
  useLayoutActionsContext,
  useLayoutRefsContext,
  useLayoutStateContext,
} from './LayoutContext';
import { LayoutPanelTransition } from './LayoutPanelTransition';
import { clampSize, getOppositeSide, resolveCssSize } from './utils';

// Resize handler dimensions
const HANDLER_WIDTH = 9;
// How far from panel edge to position handler's inner edge (centers the 3px track on the edge)
const HANDLER_OFFSET = 4;
// Extra inset added for resizable panels (to accommodate handler grab area)
const RESIZABLE_INSET_OFFSET = 2;

const PanelElement = tasty({
  as: 'div',
  qa: 'LayoutPanel',
  styles: {
    container: 'panel / inline-size',
    position: 'absolute',
    display: 'flex',
    // A closed `hideOnClose` panel keeps its content mounted out of the layout.
    hide: {
      '': false,
      hidden: true,
    },
    flow: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',

    '$content-padding': '1x',
    // Auto-border size for sub-components (panels are always vertical)
    '$layout-border-size': '1bw',

    // Position based on side prop
    top: {
      '': 0,
      'side=bottom': 'initial',
    },
    right: {
      '': 0,
      'side=left': 'initial',
    },
    bottom: {
      '': 0,
      'side=top': 'initial',
    },
    left: {
      '': 0,
      'side=right': 'initial',
    },

    // Size handling with CSS-level min/max clamping
    width: {
      '': '$min-size $panel-size $max-size',
      'side=top | side=bottom': '100%',
    },
    height: {
      '': '100%',
      'side=top | side=bottom': '$min-size $panel-size $max-size',
    },

    // Visual styling
    border: {
      '': false,
      'side=left': 'right',
      'side=right': 'left',
      'side=top': 'bottom',
      'side=bottom': 'top',
    },
    fill: '#surface',
    // The stacking context the transform used to create: z-indexed content
    // stays inside the panel, below its resize handle and an overlay backdrop.
    isolation: 'isolate',

    // Transition styles - offscreen mod controls slide animation.
    // `none` at rest, not a zero translate: any transform makes the panel the
    // containing block of its fixed descendants (drag previews, popups), which
    // then position against the panel and are clipped by its overflow. `none`
    // still animates to and from the offscreen translate.
    transform: {
      '': 'none',
      'offscreen & side=left': 'translateX(-100%)',
      'offscreen & side=right': 'translateX(100%)',
      'offscreen & side=top': 'translateY(-100%)',
      'offscreen & side=bottom': 'translateY(100%)',
    },
    transition: {
      '': 'none',
      'has-transition': 'transform $transition ease-out',
    },
  },
});

// Handler is positioned as sibling to panel (in Fragment), relative to Layout
const ResizeHandlerElement = tasty({
  qa: 'PanelResizeHandler',
  styles: {
    position: 'absolute',

    // Handler size
    width: {
      '': '100%',
      horizontal: `${HANDLER_WIDTH}px`,
      'disabled & horizontal': '1bw',
    },
    height: {
      '': `${HANDLER_WIDTH}px`,
      horizontal: '100%',
      'disabled & !horizontal': '1bw',
    },

    // Position handler with direct offset (no centering needed)
    top: {
      '': 0,
      'side=top': `calc($panel-size - ${HANDLER_OFFSET}px)`,
      'side=bottom': 'initial',
    },
    bottom: {
      '': 0,
      'side=bottom': `calc($panel-size - ${HANDLER_OFFSET}px)`,
      'side=top': 'initial',
    },
    left: {
      '': 0,
      'side=left': `calc($panel-size - ${HANDLER_OFFSET}px)`,
      'side=right': 'initial',
    },
    right: {
      '': 0,
      'side=right': `calc($panel-size - ${HANDLER_OFFSET}px)`,
      'side=left': 'initial',
    },

    // Offscreen transforms only (no centering needed with direct offset positioning)
    transform: {
      '': 'translateX(0)',
      'offscreen & side=left': `translateX(calc(-1 * $panel-size - ${HANDLER_WIDTH - HANDLER_OFFSET}px))`,
      'offscreen & side=right': `translateX(calc($panel-size + ${HANDLER_WIDTH - HANDLER_OFFSET}px))`,
      'offscreen & side=top': `translateY(calc(-1 * $panel-size - ${HANDLER_WIDTH - HANDLER_OFFSET}px))`,
      'offscreen & side=bottom': `translateY(calc($panel-size + ${HANDLER_WIDTH - HANDLER_OFFSET}px))`,
    },

    cursor: {
      '': 'row-resize',
      horizontal: 'col-resize',
      disabled: 'not-allowed',
    },
    touchAction: {
      '': 'none',
      disabled: 'auto',
    },
    padding: 0,
    outline: 0,
    boxSizing: 'border-box',

    // Transition must match panel for synchronized animation
    transition: {
      '': 'theme',
      'has-transition': 'transform $transition ease-out, theme',
    },

    Track: {
      width: {
        '': 'initial',
        horizontal: '3px',
        'disabled & horizontal': '1px',
      },
      height: {
        '': '3px',
        horizontal: 'initial',
        'disabled & !horizontal': '1px',
      },
      position: 'absolute',
      inset: {
        '': '3px 0',
        horizontal: '0 3px',
        disabled: '0 0',
      },
      fill: {
        '': '#border',
        '(hovered | drag | focused) & !disabled': '#purple-03',
      },
      border: 0,
      transition: 'theme',
      outline: {
        '': '1bw #primary-text.0',
        'drag | focused': '1bw #primary-text',
      },
      outlineOffset: 1,
    },

    Drag: {
      display: 'grid',
      gap: '2bw',
      border: 0,
      flow: {
        '': 'row',
        horizontal: 'column',
      },
      gridColumns: {
        '': '3px 3px 3px 3px 3px',
        horizontal: 'auto',
      },
      gridRows: {
        '': 'auto',
        horizontal: '3px 3px 3px 3px 3px',
      },
      width: {
        '': 'auto',
        horizontal: '1px',
      },
      height: {
        '': '1px',
        horizontal: 'auto',
      },
      inset: {
        '': '4px 50% auto auto',
        horizontal: '50% 4px auto auto',
      },
      transform: {
        '': 'translate(-50%, 0)',
        horizontal: 'translate(0, -50%)',
      },
      position: 'absolute',
      transition: 'theme',
    },

    DragPart: {
      radius: true,
      fill: {
        '': '#dark-03',
        'hovered | drag | focused': '#primary-text',
        disabled: '#disabled-surface-text',
      },
    },
  },
});

// Overlay backdrop for overlay mode - covers the content area behind the panel
const OverlayBackdrop = tasty({
  qa: 'PanelOverlay',
  styles: {
    position: 'absolute',
    inset: 0,
    // fill: '#white.2',
    backdropFilter: 'invert(.15)',
    cursor: 'pointer',
    opacity: {
      '': 0,
      visible: 1,
    },
    pointerEvents: {
      '': 'none',
      visible: 'auto',
    },
    transition: 'opacity .15s ease-out',
  },
});

interface ResizeHandlerProps {
  side: Side;
  isDisabled?: boolean;
  mods?: Record<string, boolean>;
  moveProps: ReturnType<typeof useMove>['moveProps'];
  style?: Record<string, string | number | null | undefined>;
  onDoubleClick?: () => void;
}

function ResizeHandler(props: ResizeHandlerProps) {
  const { side, isDisabled, mods, moveProps, style, onDoubleClick } = props;
  const { t } = useI18n();
  // One key per side: a translated sentence can't take the side as a word.
  const label = {
    left: t('layout.resizeLeftPanel', 'Resize left panel'),
    top: t('layout.resizeTopPanel', 'Resize top panel'),
    right: t('layout.resizeRightPanel', 'Resize right panel'),
    bottom: t('layout.resizeBottomPanel', 'Resize bottom panel'),
  }[side];
  const { hoverProps, isHovered } = useHover({});
  const { focusProps, isFocusVisible } = useFocusRing();
  const isHorizontal = side === 'left' || side === 'right';
  const localIsHovered = useDebouncedValue(isHovered, 150);

  return (
    <ResizeHandlerElement
      {...mergeProps(hoverProps, focusProps, moveProps, {
        mods: {
          hovered: localIsHovered,
          horizontal: isHorizontal,
          disabled: isDisabled,
          focused: isFocusVisible,
          side,
          ...mods,
        },
        style,
        tabIndex: isDisabled ? undefined : 0,
        role: 'separator',
        'aria-orientation': isHorizontal ? 'vertical' : 'horizontal',
        'aria-label': label,
        onDoubleClick: isDisabled ? undefined : onDoubleClick,
      })}
    >
      <div data-element="Track" />
      {!isDisabled && (
        <div data-element="Drag">
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
        </div>
      )}
    </ResizeHandlerElement>
  );
}

/** Panel rendering mode */
export type LayoutPanelMode = 'default' | 'sticky' | 'overlay' | 'dialog';

export interface CubeLayoutPanelProps extends BaseProps, ContainerStyleProps {
  /** Side of the layout where panel is positioned */
  side: Side;
  /**
   * Panel rendering mode:
   * - `default`: Standard panel that pushes content aside
   * - `sticky`: Panel floats over content without pushing it
   * - `overlay`: Panel with dismissable backdrop overlay; focus moves into it
   *   when it opens and back to the opener when it closes
   * - `dialog`: Panel renders as a modal dialog
   */
  mode?: LayoutPanelMode;
  /** Panel size (width for left/right, height for top/bottom) - controlled */
  size?: number | string;
  /** Default panel size for uncontrolled state */
  defaultSize?: number | string;
  /** Minimum panel size */
  minSize?: number | string;
  /** Maximum panel size */
  maxSize?: number | string;
  /** Enable resize functionality */
  isResizable?: boolean;
  /** Size change callback */
  onSizeChange?: (size: number) => void;
  /** Controlled open state */
  isOpen?: boolean;
  /** Default open state */
  defaultIsOpen?: boolean;
  /** Open state change callback */
  onOpenChange?: (isOpen: boolean) => void;
  /** Enable slide transition on open/close */
  hasTransition?: boolean;
  /**
   * Hide the closed panel instead of unmounting its content, so the content
   * keeps its state (an unsent draft, scroll position, a request in flight)
   * until the panel reopens. A hidden panel takes no space and no focus.
   * The content mounts once, even while the panel starts closed, so mount
   * effects and a native `autoFocus` do not run again on reopen. Content that
   * mounts while closed is hidden: `autoFocus` does nothing and measurements
   * read zero until the panel opens. In dialog mode the dialog is kept the
   * same way, and moves focus in and back to its opener itself, unless the
   * opener is gone by then (a menu item, for example);
   * `dialogProps.hideOnClose` takes precedence. Default: false
   */
  hideOnClose?: boolean;
  /**
   * Whether the panel can be dismissed by clicking the overlay (overlay mode), pressing Escape,
   * or, in overlay mode, moving focus into the main content.
   * Only applies to `overlay` and `dialog` modes. Default: true
   */
  isDismissable?: boolean;
  /** Styles for the overlay backdrop in overlay mode */
  overlayStyles?: Styles;
  /**
   * @deprecated Use `mode="dialog"` instead. Switch to dialog mode (renders panel inside Dialog)
   */
  isDialog?: boolean;
  /** Controlled dialog open state (used with mode="dialog") */
  isDialogOpen?: boolean;
  /** Default dialog open state */
  defaultIsDialogOpen?: boolean;
  /** Dialog open state change callback */
  onDialogOpenChange?: (isOpen: boolean) => void;
  /** Props passed to DialogContainer when in dialog mode */
  dialogProps?: Omit<
    CubeDialogContainerProps,
    'isDismissable' | 'onDismiss' | 'isOpen'
  >;
  /** Styles for the Dialog root in dialog mode, separate from inline panel styles. */
  dialogStyles?: Styles;
  /** Padding for content areas inside the panel. Default: '1x' */
  contentPadding?: Styles['padding'];
  /** localStorage key for persisting panel size. When provided, size is stored and restored across instances. */
  sizeStorageKey?: string;
  /** Styles for the panel */
  styles?: Styles;
  children?: ReactNode;
}

function matchesContainerSize(
  container: HTMLElement | null | undefined,
  isHorizontal: boolean,
  dimension: number,
) {
  return (
    (isHorizontal ? container?.offsetWidth : container?.offsetHeight) ===
    dimension
  );
}

function LayoutPanel(
  props: CubeLayoutPanelProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const layoutActions = useLayoutActionsContext();
  const layoutState = useLayoutStateContext();
  const layoutRefs = useLayoutRefsContext();

  if (!layoutActions || !layoutState || !layoutRefs) {
    throw new Error(
      'Layout.Panel must be used within a Layout component. ' +
        'Ensure your panel is rendered inside a <Layout> parent.',
    );
  }

  const {
    side = 'left',
    mode: modeProp,
    size: providedSize,
    defaultSize = 280,
    minSize = 200,
    maxSize,
    isResizable = false,
    onSizeChange,
    isOpen: providedIsOpen,
    defaultIsOpen = true,
    onOpenChange,
    hasTransition: hasTransitionProp,
    hideOnClose = false,
    isDismissable = true,
    overlayStyles,
    // Deprecated prop - use mode="dialog" instead
    isDialog = false,
    isDialogOpen: providedIsDialogOpen,
    defaultIsDialogOpen = false,
    onDialogOpenChange,
    dialogProps,
    dialogStyles,
    contentPadding,
    sizeStorageKey,
    children,
    styles,
    mods,
    ...otherProps
  } = props;

  // Resolve mode from prop or deprecated isDialog
  const mode: LayoutPanelMode = modeProp ?? (isDialog ? 'dialog' : 'default');
  const isDialogMode = mode === 'dialog';
  const isOverlayMode = mode === 'overlay';
  const isStickyMode = mode === 'sticky';

  // Use prop value if provided, otherwise fall back to context value
  const hasTransition = hasTransitionProp ?? layoutActions.hasTransition;

  const combinedRef = useCombinedRefs(ref);
  const prevProvidedSizeRef = useRef(providedSize);
  const isHorizontal = side === 'left' || side === 'right';

  // Natural boundary computation
  const { containerWidth, containerHeight } = layoutState;
  const { minContentSize } = layoutActions;
  const containerDimension = isHorizontal ? containerWidth : containerHeight;
  const oppositeSide = getOppositeSide(side);
  const oppositePanelSize = layoutState.panelSizes[oppositeSide];
  const ownInsetOffset = isResizable ? RESIZABLE_INSET_OFFSET : 0;
  const naturalMax = useMemo(
    () =>
      !isDialogMode && containerDimension > 0
        ? Math.max(
            0,
            containerDimension -
              oppositePanelSize -
              minContentSize -
              ownInsetOffset,
          )
        : Infinity,
    [
      isDialogMode,
      containerDimension,
      oppositePanelSize,
      minContentSize,
      ownInsetOffset,
    ],
  );

  // Panel open state
  const [internalIsOpen, setInternalIsOpen] = useState(defaultIsOpen);
  const isOpen = providedIsOpen ?? internalIsOpen;
  const isTransitionActive =
    hasTransition && !isDialogMode && layoutRefs.isPanelContainerReady;
  const [visualState, setVisualState] = useState({
    isShown: isOpen,
    isTransitionActive,
  });

  // A newly mounted DisplayTransition starts at the requested visibility.
  if (visualState.isTransitionActive !== isTransitionActive) {
    setVisualState({ isShown: isOpen, isTransitionActive });
  }
  const isPanelShown = isTransitionActive ? visualState.isShown : isOpen;

  // Dialog open state
  const [internalIsDialogOpen, setInternalIsDialogOpen] =
    useState(defaultIsDialogOpen);
  const dialogOpen = providedIsDialogOpen ?? internalIsDialogOpen;

  // Persistent size storage
  const [storedSize, setStoredSize] = useLocalStorage<number | null>(
    sizeStorageKey ?? null,
    null,
  );

  // Resize state
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState<number>(() => {
    const initialSize =
      typeof providedSize === 'number'
        ? providedSize
        : storedSize != null
          ? storedSize
          : typeof defaultSize === 'number'
            ? defaultSize
            : 280;

    return clampSize(initialSize, minSize, maxSize);
  });

  const extractedStyles = extractStyles(otherProps, CONTAINER_STYLES);

  // Merge styles with contentPadding support
  const finalStyles = useMemo(
    () =>
      mergeStyles(
        styles,
        contentPadding != null ? { '$content-padding': contentPadding } : null,
        extractedStyles,
      ),
    [extractedStyles, contentPadding, styles],
  );

  // Resolve user's maxSize to pixels for JS-level clamping.
  // Percentage bounds belong to the inline host, not the dialog's host.
  const resolvedMax = useMemo(() => {
    if (typeof maxSize === 'number') return maxSize;
    if (
      typeof maxSize === 'string' &&
      containerDimension > 0 &&
      (!isDialogMode || !maxSize.trim().endsWith('%'))
    ) {
      return resolveCssSize(maxSize, containerDimension);
    }
    return undefined;
  }, [maxSize, containerDimension, isDialogMode]);

  // Effective max combines user's maxSize with natural boundary
  const effectiveMax = useMemo(() => {
    const values: number[] = [];
    if (resolvedMax != null) values.push(resolvedMax);
    if (Number.isFinite(naturalMax)) values.push(naturalMax);
    return values.length > 0 ? Math.min(...values) : undefined;
  }, [resolvedMax, naturalMax]);

  // Clamp size to min/max constraints (including natural boundaries)
  const clampValue = useCallback(
    (value: number) => clampSize(value, minSize, undefined, effectiveMax),
    [minSize, effectiveMax],
  );

  const setContextDragging = layoutActions.setDragging;

  const { moveProps } = useMove({
    onMoveStart() {
      if (!isResizable || isDialogMode) return;
      setIsDragging(true);
      setContextDragging(true);
    },
    onMove(e) {
      if (!isResizable || isDialogMode) return;

      let delta: number;

      if (e.pointerType === 'keyboard') {
        // Keyboard resize: 10px per step, 50px with Shift
        const step = e.shiftKey ? 50 : 10;
        // For keyboard, deltaX/deltaY are direction indicators (-1, 0, 1)
        const rawDelta = isHorizontal ? e.deltaX : e.deltaY;
        const direction = side === 'right' || side === 'bottom' ? -1 : 1;
        delta = rawDelta * step * direction;
      } else {
        // Pointer resize: use exact delta values
        delta = isHorizontal
          ? e.deltaX * (side === 'right' ? -1 : 1)
          : e.deltaY * (side === 'bottom' ? -1 : 1);
      }

      setSize((currentSize) => clampValue(currentSize + delta));
    },
    onMoveEnd() {
      setIsDragging(false);
      setContextDragging(false);
      if (isDialogMode && !isDragging) return;
      // Round to integer on release and notify parent
      setSize((currentSize) => {
        const finalSize = Math.round(clampValue(currentSize));
        // Call onSizeChange synchronously to ensure parent state is updated
        onSizeChange?.(finalSize);
        // Persist to localStorage if key is provided
        setStoredSize(finalSize);
        return finalSize;
      });
    },
  });

  // Sync provided size with internal state (only when providedSize actually changes)
  // This prevents resetting size when only isDragging changes (which would cause a flash)
  useEffect(() => {
    if (prevProvidedSizeRef.current !== providedSize) {
      if (
        !isDialogMode &&
        !matchesContainerSize(
          layoutRefs.panelContainerRef.current?.parentElement,
          isHorizontal,
          containerDimension,
        )
      ) {
        return;
      }

      prevProvidedSizeRef.current = providedSize;
      if (typeof providedSize === 'number' && !isDragging) {
        setSize(clampValue(providedSize));
      }
    }
  }, [
    providedSize,
    isDragging,
    clampValue,
    isDialogMode,
    isHorizontal,
    containerDimension,
    layoutRefs.panelContainerRef,
  ]);

  // Dialogs retain inline size; only inline panels follow the host's bounds.
  const applyInlineBounds = useEffectEvent(() => {
    if (
      !matchesContainerSize(
        layoutRefs.panelContainerRef.current?.parentElement,
        isHorizontal,
        containerDimension,
      )
    ) {
      return;
    }

    setSize((prev) => {
      const clamped = clampValue(prev);

      if (clamped !== prev) {
        onSizeChange?.(Math.round(clamped));
        setStoredSize(Math.round(clamped));
      }

      return clamped;
    });
  });

  useEffect(() => {
    if (!isDialogMode && !isDragging && containerDimension > 0) {
      // In an iframe ResizeObserver can precede responsive mode delivery.
      // Let that mode settle before shrinking and persisting the inline size.
      const frame = requestAnimationFrame(() => applyInlineBounds());
      return () => cancelAnimationFrame(frame);
    }
  }, [
    isDialogMode,
    isDragging,
    clampValue,
    containerDimension,
    isHorizontal,
    layoutRefs.panelContainerRef,
  ]);

  // Register panel with layout context
  // Include handler outside portion (minus border overlap) for proper content inset
  // In sticky, overlay, and dialog modes, panel doesn't push content, so size is 0
  // NOTE: We intentionally use `size` (not `clampValue(size)`) here to avoid a feedback
  // loop. `clampValue` depends on the opposite panel's context size, so clamping here
  // would create a period-2 oscillation through shared context. CSS --max-size handles
  // visual clamping immediately; the auto-shrink effect converges `size` state.
  const effectivePanelSize = isPanelShown && mode === 'default' ? size : 0;
  const effectiveInsetSize = Math.round(
    effectivePanelSize +
      (isResizable && effectivePanelSize > 0 ? RESIZABLE_INSET_OFFSET : 0),
  );

  const { registerPanel, unregisterPanel, updatePanelSize } = layoutActions;
  const { isReady } = layoutState;

  // Track the last reported size to prevent unnecessary updates
  const lastSizeRef = useRef<number>(effectiveInsetSize);

  // Register on mount, unregister on unmount
  // Using useLayoutEffect ensures registration happens before browser paint
  useLayoutEffect(() => {
    registerPanel(side, lastSizeRef.current);

    return () => {
      unregisterPanel(side);
    };
  }, [side, registerPanel, unregisterPanel]);

  // Update size when it changes (after initial mount)
  // Using useLayoutEffect ensures size updates happen before browser paint
  useLayoutEffect(() => {
    if (lastSizeRef.current !== effectiveInsetSize) {
      lastSizeRef.current = effectiveInsetSize;
      updatePanelSize(side, effectiveInsetSize);
    }
  }, [side, effectiveInsetSize, updatePanelSize]);

  // One close per task: a consumer that moves focus into the main content in
  // `onOpenChange(false)` would otherwise dismiss the still-registered panel
  // a second time.
  const closeRequestedRef = useRef(false);

  const handleOpenChange = useCallback(
    (newIsOpen: boolean) => {
      if (!newIsOpen) {
        if (closeRequestedRef.current) return;

        closeRequestedRef.current = true;
        queueMicrotask(() => {
          closeRequestedRef.current = false;
        });
      }

      setInternalIsOpen(newIsOpen);
      onOpenChange?.(newIsOpen);
    },
    [onOpenChange],
  );

  // Dismiss handler for overlay mode (click on overlay)
  const handleDismiss = useCallback(() => {
    if (isDismissable) {
      handleOpenChange(false);
    }
  }, [isDismissable, handleOpenChange]);

  // Register overlay panel with Layout context for coordinated dismissal
  const { registerOverlayPanel } = layoutActions;

  useEffect(() => {
    // Only register if in overlay mode, open, and dismissable
    if (isOverlayMode && isOpen && isDismissable) {
      const unregister = registerOverlayPanel(() => handleOpenChange(false));
      return unregister;
    }
  }, [
    isOverlayMode,
    isOpen,
    isDismissable,
    registerOverlayPanel,
    handleOpenChange,
  ]);

  // Overlay focus: move into the panel on open, back to the opener on close.
  // Declared after the registration effect on purpose: its cleanup then runs
  // after the panel unregisters, so a restore into the main content dismisses
  // nothing.
  const openerRef = useRef<Element | null>(null);
  const panelNodeRef = useRef<HTMLDivElement | null>(null);
  // Focus as the panel shows (its contents may mount now), before a native
  // `autoFocus` inside them moves it (see OpenerProbe).
  const mountFocusRef = useRef<Element | null>(null);

  // A panel open on the Layout's first render leaves page focus alone.
  const recordOpener = useEffectEvent(() => {
    const active =
      mountFocusRef.current ??
      panelNodeRef.current?.ownerDocument.activeElement ??
      null;

    mountFocusRef.current = null;

    openerRef.current =
      isOverlayMode && isReady && !panelNodeRef.current?.contains(active)
        ? active
        : null;
  });

  const moveFocusIn = useEffectEvent(() => {
    const panel = panelNodeRef.current;
    const opener = openerRef.current;

    const active = panel?.ownerDocument.activeElement;

    // Focus already moved elsewhere as the panel opened, such as to a field
    // with `autoFocus` inside it: leave it there. Focus another overlay panel just
    // returned, as it closed in the same commit, does not count.
    if (
      !panel ||
      !opener ||
      (active !== opener && active !== lastReturnedFocus)
    ) {
      return;
    }

    const target =
      getFocusableTreeWalker(panel, { tabbable: true }).nextNode() ??
      getFocusableTreeWalker(panel).nextNode();

    // The panel enters translated offscreen, so focus must not scroll.
    focusProgrammatically(target as HTMLElement | null, {
      preventScroll: true,
    });
  });

  // Return focus only if it is still in the panel or was lost with it; focus
  // the user or the consumer moved elsewhere stays there.
  const returnFocus = useEffectEvent(() => {
    const opener = openerRef.current;
    const panel = panelNodeRef.current;

    openerRef.current = null;

    if (
      !isOverlayMode ||
      !(opener instanceof HTMLElement) ||
      !opener.isConnected ||
      opener === opener.ownerDocument.body
    ) {
      return;
    }

    const active = opener.ownerDocument.activeElement;

    if (
      active != null &&
      active !== opener.ownerDocument.body &&
      !panel?.contains(active)
    ) {
      return;
    }

    focusProgrammatically(opener, { preventScroll: true });
    lastReturnedFocus = opener;
    queueMicrotask(() => {
      lastReturnedFocus = null;
    });
  });

  useLayoutEffect(() => {
    if (isOpen) recordOpener();
  }, [isOpen]);

  // Passive, so a menu item that refocuses itself while closing its menu has
  // done so before focus moves in.
  useEffect(() => {
    if (!isOpen) return;

    moveFocusIn();

    return () => returnFocus();
  }, [isOpen]);

  const handleDialogOpenChange = useCallback(
    (newIsOpen: boolean) => {
      setInternalIsDialogOpen(newIsOpen);
      onDialogOpenChange?.(newIsOpen);
    },
    [onDialogOpenChange],
  );

  // Panel context value for child components (like LayoutPanelHeader)
  const panelContextValue = useMemo(
    () => ({
      onOpenChange: handleOpenChange,
      isOpen,
    }),
    [handleOpenChange, isOpen],
  );

  // Dialog mode context value - uses dialog state instead of panel state
  const dialogPanelContextValue = useMemo(
    () => ({
      onOpenChange: handleDialogOpenChange,
      isOpen: dialogOpen,
    }),
    [handleDialogOpenChange, dialogOpen],
  );

  const panelMods = useMemo(
    () => ({
      side,
      drag: isDragging,
      horizontal: isHorizontal,
      // Only enable transition after layout is ready to prevent initial animation
      'has-transition': hasTransition && isReady,
      ...mods,
    }),
    [side, isDragging, isHorizontal, hasTransition, isReady, mods],
  );

  // Build --max-size CSS variable combining user maxSize and natural boundary
  const maxSizeCss = useMemo(() => {
    const parts: string[] = [];

    if (maxSize != null) {
      parts.push(typeof maxSize === 'number' ? `${maxSize}px` : maxSize);
    }

    if (containerDimension > 0 && Number.isFinite(naturalMax)) {
      parts.push(`${naturalMax}px`);
    }

    if (parts.length === 0) return undefined;
    return parts.length === 1 ? parts[0] : `min(${parts.join(', ')})`;
  }, [maxSize, naturalMax, containerDimension]);

  const panelStyle = useMemo(
    () => ({
      '--panel-size': `${size}px`,
      '--min-size': typeof minSize === 'number' ? `${minSize}px` : minSize,
      '--max-size': maxSizeCss,
    }),
    [size, minSize, maxSizeCss],
  );

  // Combine refs for panel element
  const panelRefCallback = useCallback(
    (node: HTMLDivElement | null, transitionRef?: RefCallback<HTMLElement>) => {
      // Update the combined ref
      (combinedRef as { current: HTMLDivElement | null }).current = node;
      // Call transition ref if provided
      transitionRef?.(node);
    },
    [combinedRef],
  );

  // Reset to default size on double-click
  const handleResetSize = useCallback(() => {
    const resetSize =
      typeof defaultSize === 'number' ? defaultSize : parseInt(defaultSize, 10);
    const clampedSize = clampValue(resetSize || 280);
    setSize(clampedSize);
    onSizeChange?.(clampedSize);
    setStoredSize(clampedSize);
  }, [defaultSize, clampValue, onSizeChange, setStoredSize]);

  // `isHidden` keeps the element tree of an open panel, so content never remounts.
  // Without a transition, a rendered closed panel is a hidden one.
  const renderPanelContent = (
    offscreen = false,
    transitionRef?: RefCallback<HTMLElement>,
    isHidden = !isOpen,
  ) => {
    const showOverlay = isOverlayMode && !offscreen;

    return (
      <>
        {/* Mounted only while shown, so an open from hidden reads live focus. */}
        {isOverlayMode && !isHidden && <OpenerProbe focusRef={mountFocusRef} />}
        {/* Overlay backdrop for overlay mode */}
        {isOverlayMode && !isHidden && (
          <OverlayBackdrop
            mods={{ visible: showOverlay }}
            styles={overlayStyles}
            aria-hidden="true"
            onClick={handleDismiss}
          />
        )}
        <PanelElement
          ref={(node: HTMLDivElement | null) => {
            // Kept after detach: StrictMode detaches refs before it replays
            // the effects that still need the panel.
            if (node) panelNodeRef.current = node;
            panelRefCallback(node, transitionRef);
          }}
          {...filterBaseProps(otherProps, { eventProps: true })}
          mods={{ ...panelMods, offscreen, hidden: isHidden }}
          styles={finalStyles}
          style={panelStyle}
          data-side={side}
        >
          <LayoutPanelContext.Provider value={panelContextValue}>
            <LayoutContextReset>{children}</LayoutContextReset>
          </LayoutPanelContext.Provider>
        </PanelElement>
        {isResizable && !isHidden && (
          <ResizeHandler
            side={side}
            isDisabled={!isResizable}
            mods={{
              drag: isDragging,
              offscreen,
              'has-transition': hasTransition && isReady,
            }}
            moveProps={moveProps}
            style={panelStyle}
            onDoubleClick={handleResetSize}
          />
        )}
      </>
    );
  };

  // Dialog mode - uses its own portal via DialogContainer
  if (isDialogMode) {
    return (
      <DialogContainer
        isOpen={dialogOpen}
        isDismissable={isDismissable}
        hideOnClose={hideOnClose}
        onDismiss={() => handleDialogOpenChange(false)}
        {...dialogProps}
      >
        <Dialog isDismissable={false} styles={dialogStyles}>
          <LayoutPanelContext.Provider value={dialogPanelContextValue}>
            <LayoutContextReset>{children}</LayoutContextReset>
          </LayoutPanelContext.Provider>
        </Dialog>
      </DialogContainer>
    );
  }

  // Wait for portal container to be ready before rendering
  if (!layoutRefs.isPanelContainerReady) {
    return null;
  }

  const portalContainer = layoutRefs.panelContainerRef.current!;

  // Panel with transition - portal to panel container
  if (hasTransition) {
    return createPortal(
      <DisplayTransition
        isShown={isOpen}
        animateOnMount={false}
        exposeUnmounted={hideOnClose}
        onToggle={(isShown) => setVisualState({ isShown, isTransitionActive })}
      >
        {({ phase, isShown, isExiting, ref: transitionRef }) => {
          const isHidden = phase === 'unmounted';

          return (
            <LayoutPanelTransition
              isShown={isShown}
              isExiting={isExiting}
              isHidden={isHidden}
            >
              {renderPanelContent(!isShown, transitionRef, isHidden)}
            </LayoutPanelTransition>
          );
        }}
      </DisplayTransition>,
      portalContainer,
    );
  }

  // Simple panel (no transition) - portal to panel container
  if (!isOpen && !hideOnClose) return null;

  return createPortal(renderPanelContent(false), portalContainer);
}

// Focus another overlay panel returned in the current task.
let lastReturnedFocus: Element | null = null;

// Rendered before the panel's contents, so its layout effect reads focus
// before React applies a native `autoFocus` inside them.
function OpenerProbe({ focusRef }: { focusRef: { current: Element | null } }) {
  useLayoutEffect(() => {
    focusRef.current = document.activeElement;
  }, [focusRef]);

  return null;
}

const _LayoutPanel = forwardRef(LayoutPanel);

_LayoutPanel.displayName = 'Layout.Panel';

export { _LayoutPanel as LayoutPanel };
