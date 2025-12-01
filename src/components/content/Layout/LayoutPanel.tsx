import React, {
  ForwardedRef,
  forwardRef,
  ReactNode,
  RefCallback,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHover, useMove } from 'react-aria';

import { useDebouncedValue } from '../../../_internal/hooks';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { DisplayTransition } from '../../helpers/DisplayTransition/DisplayTransition';
import { Dialog } from '../../overlays/Dialog';
import {
  CubeDialogContainerProps,
  DialogContainer,
} from '../../overlays/Dialog/DialogContainer';

import { LayoutContextReset, Side, useLayoutContext } from './LayoutContext';

// Handler width that extends beyond panel for easier grabbing
const HANDLER_WIDTH = 9;
// How much of the handler extends outside the panel
const HANDLER_OVERFLOW = 3;

const PanelElement = tasty({
  as: 'div',
  qa: 'LayoutPanel',
  styles: {
    position: 'absolute',
    zIndex: 10,
    display: 'flex',
    flow: 'column',
    overflow: 'hidden',

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

    // Position at the panel's resize edge (relative to Layout)
    top: {
      '': 0,
      'side=top': '$panel-size',
      'side=bottom': 'initial',
    },
    bottom: {
      '': 0,
      'side=bottom': '$panel-size',
      'side=top': 'initial',
    },
    left: {
      '': 0,
      'side=left': '$panel-size',
      'side=right': 'initial',
    },
    right: {
      '': 0,
      'side=right': '$panel-size',
      'side=left': 'initial',
    },

    // Center the handler on the edge
    transform: {
      'side=top': `translateY(-50%) translateY(-${HANDLER_OVERFLOW}px)`,
      'side=bottom': `translateY(50%) translateY(${HANDLER_OVERFLOW}px)`,
      'side=left': `translateX(-50%) translateX(-${HANDLER_OVERFLOW}px) translateX(4px)`,
      'side=right': `translateX(50%) translateX(${HANDLER_OVERFLOW}px) translateX(-4px)`,
      // Offscreen transforms - must match panel movement
      'offscreen & side=left': `translateX(-50%) translateX(-${HANDLER_OVERFLOW}px) translateX(-$panel-size)`,
      'offscreen & side=right': `translateX(50%) translateX(${HANDLER_OVERFLOW}px) translateX($panel-size)`,
      'offscreen & side=top': `translateY(-50%) translateY(-${HANDLER_OVERFLOW}px) translateY(-$panel-size)`,
      'offscreen & side=bottom': `translateY(50%) translateY(${HANDLER_OVERFLOW}px) translateY($panel-size)`,
    },

    cursor: {
      '': 'row-resize',
      horizontal: 'col-resize',
      disabled: 'not-allowed',
    },
    padding: 0,
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
        '': '#border-opaque',
        '(hovered | drag) & !disabled': '#purple-03',
      },
      transition: 'theme',
      outline: {
        '': '1bw #purple-text.0',
        drag: '1bw #purple-text',
      },
      outlineOffset: 1,
    },

    Drag: {
      display: 'grid',
      gap: '2bw',
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
        'hovered | drag': '#dark-02',
        disabled: '#dark-04',
      },
    },
  },
});

interface ResizeHandlerProps {
  side: Side;
  isDisabled?: boolean;
  mods?: Record<string, boolean>;
  moveProps: ReturnType<typeof useMove>['moveProps'];
  style?: Record<string, string | number | undefined>;
}

function ResizeHandler(props: ResizeHandlerProps) {
  const { side, isDisabled, mods, moveProps, style } = props;
  const { hoverProps, isHovered } = useHover({});
  const isHorizontal = side === 'left' || side === 'right';
  const localIsHovered = useDebouncedValue(isHovered, 150);

  return (
    <ResizeHandlerElement
      {...mergeProps(hoverProps, moveProps, {
        mods: {
          hovered: localIsHovered,
          horizontal: isHorizontal,
          disabled: isDisabled,
          side,
          ...mods,
        },
        style,
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

export interface CubeLayoutPanelProps extends BaseProps, ContainerStyleProps {
  /** Side of the layout where panel is positioned */
  side?: Side;
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
  /** Switch to dialog mode (renders panel inside Dialog) */
  isDialog?: boolean;
  /** Controlled dialog open state */
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
  /** Styles for the panel */
  styles?: Styles;
  children?: ReactNode;
}

function LayoutPanel(
  props: CubeLayoutPanelProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const layoutContext = useLayoutContext();

  if (!layoutContext) {
    throw new Error('Layout.Panel must be a direct child of Layout component.');
  }

  const {
    side = 'left',
    size: providedSize,
    defaultSize = 280,
    minSize = 200,
    maxSize,
    isResizable = false,
    onSizeChange,
    isOpen: providedIsOpen,
    defaultIsOpen = true,
    onOpenChange,
    hasTransition = false,
    isDialog = false,
    isDialogOpen: providedIsDialogOpen,
    defaultIsDialogOpen = false,
    onDialogOpenChange,
    dialogProps,
    children,
    styles,
    mods,
    ...otherProps
  } = props;

  const combinedRef = useCombinedRefs(ref);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isHorizontal = side === 'left' || side === 'right';

  // Panel open state
  const [internalIsOpen, setInternalIsOpen] = useState(defaultIsOpen);
  const isOpen = providedIsOpen ?? internalIsOpen;

  // Dialog open state
  const [internalIsDialogOpen, setInternalIsDialogOpen] =
    useState(defaultIsDialogOpen);
  const dialogOpen = providedIsDialogOpen ?? internalIsDialogOpen;

  // Resize state
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState<number>(() => {
    if (typeof providedSize === 'number') return providedSize;
    if (typeof defaultSize === 'number') return defaultSize;
    return 280;
  });

  const extractedStyles = extractStyles(otherProps, CONTAINER_STYLES);

  // Clamp size to min/max constraints
  const clampSize = useCallback(
    (value: number) => {
      let result = value;

      if (typeof maxSize === 'number') {
        result = Math.min(maxSize, result);
      }

      if (typeof minSize === 'number') {
        result = Math.max(minSize, result);
      }

      return Math.max(result, 0);
    },
    [minSize, maxSize],
  );

  const setContextDragging = layoutContext.setDragging;

  const { moveProps } = useMove({
    onMoveStart() {
      if (!isResizable) return;
      setIsDragging(true);
      setContextDragging(true);
    },
    onMove(e) {
      if (!isResizable) return;
      if (e.pointerType === 'keyboard') return;

      const delta = isHorizontal
        ? e.deltaX * (side === 'right' ? -1 : 1)
        : e.deltaY * (side === 'bottom' ? -1 : 1);

      setSize((currentSize) => clampSize(currentSize + delta));
    },
    onMoveEnd() {
      setIsDragging(false);
      setContextDragging(false);
      // Round to integer on release and notify parent
      setSize((currentSize) => {
        const finalSize = Math.round(clampSize(currentSize));
        // Call onSizeChange synchronously to ensure parent state is updated
        onSizeChange?.(finalSize);
        return finalSize;
      });
    },
  });

  // Sync provided size with internal state (only when not dragging)
  useEffect(() => {
    if (typeof providedSize === 'number' && !isDragging) {
      setSize(clampSize(providedSize));
    }
  }, [providedSize, isDragging, clampSize]);

  // Register panel with layout context
  // Include handler overflow in the effective size for proper content inset
  const effectivePanelSize = isOpen && !isDialog ? size : 0;
  const effectiveInsetSize = Math.round(
    effectivePanelSize +
      (isResizable && effectivePanelSize > 0 ? HANDLER_OVERFLOW : 0),
  );

  const { registerPanel, unregisterPanel, updatePanelSize, isReady } =
    layoutContext;

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

  const handleDialogOpenChange = useCallback(
    (newIsOpen: boolean) => {
      setInternalIsDialogOpen(newIsOpen);
      onDialogOpenChange?.(newIsOpen);
    },
    [onDialogOpenChange],
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
      '--max-size': typeof maxSize === 'number' ? `${maxSize}px` : maxSize,
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

  const renderPanelContent = (
    offscreen = false,
    transitionRef?: RefCallback<HTMLElement>,
  ) => (
    <>
      <PanelElement
        ref={(node: HTMLDivElement | null) =>
          panelRefCallback(node, transitionRef)
        }
        {...filterBaseProps(otherProps, { eventProps: true })}
        mods={{ ...panelMods, offscreen }}
        styles={{ ...extractedStyles, ...styles }}
        style={panelStyle}
        data-side={side}
      >
        <LayoutContextReset>{children}</LayoutContextReset>
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
        />
      )}
    </>
  );

  // Dialog mode
  if (isDialog) {
    return (
      <DialogContainer
        isOpen={dialogOpen}
        type="panel"
        onDismiss={() => handleDialogOpenChange(false)}
        {...dialogProps}
      >
        <Dialog isDismissable={false}>{children}</Dialog>
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
