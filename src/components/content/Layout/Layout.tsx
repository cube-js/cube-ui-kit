import {
  CSSProperties,
  FocusEvent,
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  BaseProps,
  BlockStyleProps,
  ColorStyleProps,
  extractStyles,
  filterBaseProps,
  FlowStyleProps,
  INNER_STYLES,
  mergeStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { isDevEnv } from '../../../tasty/utils/is-dev-env';
import { useCombinedRefs } from '../../../utils/react';
import { Alert } from '../Alert';

import {
  LayoutProvider,
  useLayoutActionsContext,
  useLayoutRefsContext,
  useLayoutStateContext,
} from './LayoutContext';

const LayoutElement = tasty({
  as: 'div',
  qa: 'Layout',
  styles: {
    position: 'relative',
    display: 'block',
    overflow: 'hidden',
    flexGrow: 1,
    placeSelf: 'stretch',
    height: {
      '': 'auto',
      'auto-height': 'fixed 100%',
      collapsed: '6x',
    },

    '$content-padding': '1x',
    // Auto-border size for sub-components (set when layout is vertical)
    '$layout-border-size': {
      '': '0',
      vertical: '1bw',
    },

    Inner: {
      // .base-class[data-hover] > [data-element="Inner"] { ...}
      // Direct child selector required for nested layouts
      $: '>',
      zIndex: 0,
      container: 'layout / inline-size',
      position: 'absolute',
      inset: '$inset-top $inset-right $inset-bottom $inset-left',
      display: 'flex',
      flow: 'column',
      overflow: 'hidden',
      placeContent: 'stretch',
      placeItems: 'stretch',
      // Disable transition during panel resize for snappy feedback
      // Also disable transition when not ready to prevent initial animation
      // Only animate when has-transition is enabled (and not dragging/not-ready)
      transition: {
        '': 'none',
        'has-transition': 'inset $transition ease-out',
        'dragging | not-ready': 'none',
      },
    },
  },
});

export interface CubeLayoutProps
  extends BaseProps,
    OuterStyleProps,
    BlockStyleProps,
    ColorStyleProps,
    FlowStyleProps {
  /** Switch to grid display mode */
  isGrid?: boolean;
  /** Grid template columns (when isGrid=true) */
  columns?: Styles['gridColumns'];
  /** Grid template rows (when isGrid=true) */
  rows?: Styles['gridRows'];
  /** Grid template shorthand */
  template?: Styles['gridTemplate'];
  /** Padding for content areas (Layout.Content components). Default: '1x' */
  contentPadding?: Styles['padding'];
  /** Enable transition animation for Inner content when panels open/close */
  hasTransition?: boolean;
  /** Styles for wrapper and Inner sub-element */
  styles?: Styles;
  children?: ReactNode;
  /** Ref for the inner content element */
  innerRef?: ForwardedRef<HTMLDivElement>;
  /** Props to spread on the Inner sub-element */
  innerProps?: HTMLAttributes<HTMLDivElement>;
  /**
   * @internal Force show dev warning even in production (for storybook testing)
   */
  _forceShowDevWarning?: boolean;
}

function LayoutInner(
  props: CubeLayoutProps & { forwardedRef?: ForwardedRef<HTMLDivElement> },
) {
  const layoutActions = useLayoutActionsContext();
  const layoutState = useLayoutStateContext();
  const layoutRefs = useLayoutRefsContext();
  const localRef = useRef<HTMLDivElement>(null);
  const [isAutoHeight, setIsAutoHeight] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    isGrid,
    columns,
    rows,
    template,
    contentPadding,
    hasTransition = false,
    styles,
    children,
    style,
    forwardedRef,
    innerRef: innerRefProp,
    innerProps,
    _forceShowDevWarning,
    ...otherProps
  } = props;

  const combinedInnerRef = useCombinedRefs(innerRefProp);

  // Extract outer wrapper styles and inner content styles
  const outerStyles = extractStyles(otherProps, OUTER_STYLES);
  const innerStyles = extractStyles(otherProps, INNER_STYLES);

  // Calculate if the layout flow is vertical (for auto-border feature)
  // Default flow is 'column' (vertical), only horizontal when explicitly set to 'row'
  const isVertical = useMemo(() => {
    const flowFromProp = innerStyles?.flow;
    const flowFromStyles = (styles?.Inner as Record<string, unknown>)?.flow;
    const flowValue = flowFromProp ?? flowFromStyles;

    return typeof flowValue !== 'string' || !flowValue.startsWith('row');
  }, [innerStyles?.flow, styles?.Inner]);

  // Merge styles using the same pattern as LayoutPane
  const finalStyles = useMemo(() => {
    // Handle grid mode and grid properties
    const gridStyles: Styles = {};

    if (isGrid) {
      gridStyles.display = 'grid';
    }

    if (columns) {
      gridStyles.gridColumns = columns;
    }

    if (rows) {
      gridStyles.gridRows = rows;
    }

    if (template) {
      gridStyles.gridTemplate = template;
    }

    return mergeStyles(
      outerStyles,
      contentPadding != null ? { '$content-padding': contentPadding } : null,
      styles,
      { Inner: mergeStyles(innerStyles, gridStyles, styles?.Inner as Styles) },
    );
  }, [
    outerStyles,
    innerStyles,
    contentPadding,
    styles,
    isGrid,
    columns,
    rows,
    template,
  ]);

  // Calculate inset values from panel sizes
  const panelSizes = layoutState?.panelSizes ?? {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  };

  const isDragging = layoutState?.isDragging ?? false;
  const isReady = layoutState?.isReady ?? true;
  const markReady = layoutActions?.markReady;
  const dismissOverlayPanels = layoutActions?.dismissOverlayPanels;
  const hasOverlayPanels = layoutState?.hasOverlayPanels ?? false;

  // Mark layout as ready after first paint
  // Using useEffect + requestAnimationFrame ensures:
  // 1. Panels register in useLayoutEffect → correct insets before first paint
  // 2. First paint with not-ready=true (transition disabled)
  // 3. After paint completes → enables transitions for subsequent changes
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      markReady?.();
    });

    return () => cancelAnimationFrame(frameId);
  }, [markReady]);

  // Auto-height detection: if layout collapses to 0 height after initialization,
  // automatically set height to 100% to prevent invisible layout
  useEffect(() => {
    if (isReady && localRef.current && localRef.current.offsetHeight === 0) {
      setIsAutoHeight(true);
    }
  }, [isReady]);

  // Second check: if still 0 height after auto-height was applied,
  // show collapsed state with warning
  useEffect(() => {
    if (isAutoHeight && localRef.current) {
      // Use requestAnimationFrame to check after styles have been applied
      const frameId = requestAnimationFrame(() => {
        if (localRef.current && localRef.current.offsetHeight === 0) {
          setIsCollapsed(true);
        }
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [isAutoHeight]);

  const insetStyle = useMemo(() => {
    const baseStyle: Record<string, string> = {
      '--inset-top': `${panelSizes.top}px`,
      '--inset-right': `${panelSizes.right}px`,
      '--inset-bottom': `${panelSizes.bottom}px`,
      '--inset-left': `${panelSizes.left}px`,
    };

    if (style) {
      return { ...baseStyle, ...style } as CSSProperties;
    }

    return baseStyle as CSSProperties;
  }, [panelSizes, style]);

  const mods = useMemo(
    () => ({
      dragging: isDragging,
      'not-ready': !isReady,
      'has-transition': hasTransition,
      'auto-height': isAutoHeight && !isCollapsed,
      collapsed: isCollapsed,
      vertical: isVertical,
    }),
    [isDragging, isReady, hasTransition, isAutoHeight, isCollapsed, isVertical],
  );

  // Combine local ref with forwarded ref
  const setRefs = (element: HTMLDivElement | null) => {
    localRef.current = element;

    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  };

  // Show dev warning when collapsed and in dev mode (or forced for stories)
  const showDevWarning = isCollapsed && (_forceShowDevWarning || isDevEnv());

  // Handle focus entering the Inner element - dismiss overlay panels
  const handleInnerFocus = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      // Only dismiss if there are overlay panels
      if (!hasOverlayPanels) return;

      // Check if focus is coming from outside the Inner element
      const inner = e.currentTarget;
      const relatedTarget = e.relatedTarget as Node | null;

      // If relatedTarget is null or not inside the Inner element,
      // focus is entering from outside - dismiss overlay panels
      if (!relatedTarget || !inner.contains(relatedTarget)) {
        dismissOverlayPanels?.();
      }
    },
    [hasOverlayPanels, dismissOverlayPanels],
  );

  // Handle Escape key anywhere in the Layout - dismiss overlay panels
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (hasOverlayPanels && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        dismissOverlayPanels?.();
      }
    },
    [hasOverlayPanels, dismissOverlayPanels],
  );

  return (
    <LayoutElement
      ref={setRefs}
      {...filterBaseProps(otherProps, { eventProps: true })}
      mods={mods}
      styles={finalStyles}
      style={insetStyle}
      onKeyDown={hasOverlayPanels ? handleKeyDown : undefined}
    >
      {showDevWarning ? (
        <Alert theme="danger">
          <b>UIKit:</b> <b>&lt;Layout/&gt;</b> has collapsed to <b>0</b> height.
          Ensure the parent container has a defined height or use the{' '}
          <b>height</b> prop on <b>&lt;Layout/&gt;</b>.
        </Alert>
      ) : (
        <>
          {/* Container for panels to portal into - renders panels outside the Inner element */}
          <div
            ref={layoutRefs?.setPanelContainer}
            data-element="PanelContainer"
          />
          {/* All children go inside the Inner element - panels will portal themselves out */}
          <div
            ref={combinedInnerRef}
            data-element="Inner"
            onFocus={handleInnerFocus}
            {...innerProps}
          >
            {children}
          </div>
        </>
      )}
    </LayoutElement>
  );
}

/**
 * Layout component provides a vertical flex layout with overflow-safe content.
 * Uses a two-element architecture (wrapper + content) to ensure content never overflows.
 */
function Layout(props: CubeLayoutProps, ref: ForwardedRef<HTMLDivElement>) {
  const { hasTransition } = props;

  return (
    <LayoutProvider hasTransition={hasTransition}>
      <LayoutInner {...props} forwardedRef={ref} />
    </LayoutProvider>
  );
}

const _Layout = forwardRef(Layout);

_Layout.displayName = 'Layout';

export { _Layout as Layout };
