import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  RefCallback,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFocusRing, useHover, useMove } from 'react-aria';

import { useDebouncedValue } from '../../../_internal/hooks';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  mergeStyles,
  Styles,
  tasty,
} from '../../../tasty';
import {
  mergeProps,
  useCombinedRefs,
  useLocalStorage,
} from '../../../utils/react';
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
  useLayoutStateContext,
} from './LayoutContext';
import { clampSize } from './utils';

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
    zIndex: 10,
    display: 'flex',
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

    // Size handling
    width: {
      '': '$panel-size',
      'side=top | side=bottom': '100%',
    },
    height: {
      '': '100%',
      'side=top | side=bottom': '$panel-size',
    },

    // Visual styling
    border: {
      'side=left': 'right',
      'side=right': 'left',
      'side=top': 'bottom',
      'side=bottom': 'top',
    },
    fill: '#white',

    // Transition styles - offscreen mod controls slide animation
    transform: {
      '': 'translateX(0) translateY(0)',
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
    zIndex: 11, // Above panel (zIndex: 10)

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
        '': '1bw #purple-text.0',
        'drag | focused': '1bw #purple-text',
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
        'hovered | drag | focused': '#purple-text',
        disabled: '#dark-04',
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
    zIndex: 9, // Below panel (10) but above content
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
        'aria-label': `Resize ${side} panel`,
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
   * - `overlay`: Panel with dismissable backdrop overlay
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
   * Whether the panel can be dismissed by clicking the overlay (overlay mode) or pressing Escape.
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
  /** Props passed to Dialog component when in dialog mode */
  dialogProps?: Omit<
    CubeDialogContainerProps,
    'isDismissable' | 'onDismiss' | 'isOpen'
  >;
  /** Padding for content areas inside the panel. Default: '1x' */
  contentPadding?: Styles['padding'];
  /** localStorage key for persisting panel size. When provided, size is stored and restored across instances. */
  sizeStorageKey?: string;
  /** Styles for the panel */
  styles?: Styles;
  children?: ReactNode;
}

function LayoutPanel(
  props: CubeLayoutPanelProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const layoutActions = useLayoutActionsContext();
  const layoutState = useLayoutStateContext();

  if (!layoutActions || !layoutState) {
    throw new Error('Layout.Panel must be a direct child of Layout component.');
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
    isDismissable = true,
    overlayStyles,
    // Deprecated prop - use mode="dialog" instead
    isDialog = false,
    isDialogOpen: providedIsDialogOpen,
    defaultIsDialogOpen = false,
    onDialogOpenChange,
    dialogProps,
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

  // Panel open state
  const [internalIsOpen, setInternalIsOpen] = useState(defaultIsOpen);
  const isOpen = providedIsOpen ?? internalIsOpen;

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

  // Clamp size to min/max constraints
  const clampValue = useCallback(
    (value: number) => clampSize(value, minSize, maxSize),
    [minSize, maxSize],
  );

  const setContextDragging = layoutActions.setDragging;

  const { moveProps } = useMove({
    onMoveStart() {
      if (!isResizable) return;
      setIsDragging(true);
      setContextDragging(true);
    },
    onMove(e) {
      if (!isResizable) return;

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
      prevProvidedSizeRef.current = providedSize;
      if (typeof providedSize === 'number' && !isDragging) {
        setSize(clampValue(providedSize));
      }
    }
  }, [providedSize, isDragging, clampValue]);

  // Register panel with layout context
  // Include handler outside portion (minus border overlap) for proper content inset
  // In sticky, overlay, and dialog modes, panel doesn't push content, so size is 0
  const effectivePanelSize = isOpen && mode === 'default' ? size : 0;
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

  const handleOpenChange = useCallback(
    (newIsOpen: boolean) => {
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

  const panelStyle = useMemo(
    () => ({
      '--panel-size': `${size}px`,
      '--min-size': typeof minSize === 'number' ? `${minSize}px` : minSize,
      '--max-size':
        maxSize != null
          ? typeof maxSize === 'number'
            ? `${maxSize}px`
            : maxSize
          : undefined,
    }),
    [size, minSize, maxSize],
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

  const renderPanelContent = (
    offscreen = false,
    transitionRef?: RefCallback<HTMLElement>,
  ) => {
    const showOverlay = isOverlayMode && !offscreen;

    return (
      <>
        {/* Overlay backdrop for overlay mode */}
        {isOverlayMode && (
          <OverlayBackdrop
            mods={{ visible: showOverlay }}
            styles={overlayStyles}
            aria-hidden="true"
            onClick={handleDismiss}
          />
        )}
        <PanelElement
          ref={(node: HTMLDivElement | null) =>
            panelRefCallback(node, transitionRef)
          }
          {...filterBaseProps(otherProps, { eventProps: true })}
          mods={{ ...panelMods, offscreen }}
          styles={finalStyles}
          style={panelStyle}
          data-side={side}
        >
          <LayoutPanelContext.Provider value={panelContextValue}>
            <LayoutContextReset>{children}</LayoutContextReset>
          </LayoutPanelContext.Provider>
        </PanelElement>
        {isResizable && (
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

  // Dialog mode
  if (isDialogMode) {
    return (
      <DialogContainer
        isOpen={dialogOpen}
        isDismissable={isDismissable}
        onDismiss={() => handleDialogOpenChange(false)}
        {...dialogProps}
      >
        <Dialog isDismissable={false}>
          <LayoutPanelContext.Provider value={dialogPanelContextValue}>
            <LayoutContextReset>{children}</LayoutContextReset>
          </LayoutPanelContext.Provider>
        </Dialog>
      </DialogContainer>
    );
  }

  // Panel with transition
  if (hasTransition) {
    return (
      <DisplayTransition isShown={isOpen} animateOnMount={false}>
        {({ isShown, ref: transitionRef }) =>
          renderPanelContent(!isShown, transitionRef)
        }
      </DisplayTransition>
    );
  }

  // Simple panel (no transition)
  if (!isOpen) return null;

  return renderPanelContent(false);
}

const _LayoutPanel = forwardRef(LayoutPanel);

_LayoutPanel.displayName = 'Layout.Panel';

export { _LayoutPanel as LayoutPanel };
