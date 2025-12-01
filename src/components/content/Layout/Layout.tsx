import {
  Children,
  CSSProperties,
  ForwardedRef,
  forwardRef,
  isValidElement,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';

import {
  BaseProps,
  BLOCK_STYLES,
  BlockStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  extractStyles,
  filterBaseProps,
  FLOW_STYLES,
  FlowStyleProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';

import { LayoutProvider, useLayoutContext } from './LayoutContext';

const INNER_STYLE_KEYS = [
  ...BLOCK_STYLES,
  ...COLOR_STYLES,
  ...FLOW_STYLES,
] as const;

const LayoutElement = tasty({
  as: 'div',
  qa: 'Layout',
  styles: {
    position: 'relative',
    display: 'block',
    overflow: 'hidden',
    flexGrow: 1,
    placeSelf: 'stretch',
    gridArea: 'layout',

    Inner: {
      // Direct child selector required for nested layouts
      $: '>',
      position: 'absolute',
      inset: '$inset-top $inset-right $inset-bottom $inset-left',
      display: 'flex',
      flow: 'column',
      overflow: 'hidden',
      // Disable transition during panel resize for snappy feedback
      // Also disable transition when not ready to prevent initial animation
      transition: {
        '': 'inset $transition ease-out',
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
  /** Styles for wrapper and Inner sub-element */
  styles?: Styles;
  children?: ReactNode;
}

// Check if a child is a Layout.Panel
function isPanelElement(child: ReactNode): boolean {
  return (
    isValidElement(child) &&
    typeof child.type !== 'string' &&
    (child.type as { displayName?: string }).displayName === 'Layout.Panel'
  );
}

function LayoutInner(
  props: CubeLayoutProps & { forwardedRef?: ForwardedRef<HTMLDivElement> },
) {
  const layoutContext = useLayoutContext();

  const {
    isGrid,
    columns,
    rows,
    template,
    styles,
    children,
    style,
    forwardedRef,
    ...otherProps
  } = props;

  // Separate panels from other children
  const { panels, content } = useMemo(() => {
    const panelElements: ReactNode[] = [];
    const contentElements: ReactNode[] = [];

    Children.forEach(children, (child) => {
      if (isPanelElement(child)) {
        panelElements.push(child);
      } else {
        contentElements.push(child);
      }
    });

    return { panels: panelElements, content: contentElements };
  }, [children]);

  // Extract inner content styles using extractStyles
  const contentStyles = extractStyles(otherProps, INNER_STYLE_KEYS);

  // Extract outer wrapper styles
  const wrapperStyles = extractStyles(otherProps, OUTER_STYLES);

  // Handle grid mode
  if (isGrid) {
    contentStyles.display = 'grid';
  }

  if (columns) {
    contentStyles.gridColumns = columns;
  }

  if (rows) {
    contentStyles.gridRows = rows;
  }

  if (template) {
    contentStyles.gridTemplate = template;
  }

  // Merge styles
  const finalStyles: Styles = {
    ...wrapperStyles,
    ...styles,
    Inner: { ...contentStyles, ...(styles?.Inner as Styles) },
  };

  // Calculate inset values from panel sizes
  const panelSizes = layoutContext?.panelSizes ?? {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  };

  const isDragging = layoutContext?.isDragging ?? false;
  const isReady = layoutContext?.isReady ?? true;
  const markReady = layoutContext?.markReady;

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

  const insetStyle = useMemo(() => {
    const baseStyle: Record<string, string> = {
      '--inset-top': `${panelSizes.top - 1}px`,
      '--inset-right': `${panelSizes.right - 1}px`,
      '--inset-bottom': `${panelSizes.bottom - 1}px`,
      '--inset-left': `${panelSizes.left - 1}px`,
    };

    if (style) {
      return { ...baseStyle, ...style } as CSSProperties;
    }

    return baseStyle as CSSProperties;
  }, [panelSizes, style]);

  const mods = useMemo(
    () => ({ dragging: isDragging, 'not-ready': !isReady }),
    [isDragging, isReady],
  );

  return (
    <LayoutElement
      ref={forwardedRef}
      {...filterBaseProps(otherProps, { eventProps: true })}
      mods={mods}
      styles={finalStyles}
      style={insetStyle}
    >
      {/* Panels are rendered outside the Inner element */}
      {panels}
      {/* Other content goes inside the Inner element */}
      <div data-element="Inner">{content}</div>
    </LayoutElement>
  );
}

/**
 * Layout component provides a vertical flex layout with overflow-safe content.
 * Uses a two-element architecture (wrapper + content) to ensure content never overflows.
 */
function Layout(props: CubeLayoutProps, ref: ForwardedRef<HTMLDivElement>) {
  return (
    <LayoutProvider>
      <LayoutInner {...props} forwardedRef={ref} />
    </LayoutProvider>
  );
}

const _Layout = forwardRef(Layout);

_Layout.displayName = 'Layout';

export { _Layout as Layout };
