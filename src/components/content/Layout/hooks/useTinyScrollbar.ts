import {
  CSSProperties,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface TinyScrollbarState {
  hasOverflowY: boolean;
  hasOverflowX: boolean;
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
}

export interface TinyScrollbarResult {
  handleVStyle: CSSProperties;
  handleHStyle: CSSProperties;
  hasOverflowY: boolean;
  hasOverflowX: boolean;
  isScrolling: boolean;
  /** Whether scroll is at the start edge (top for Y, left for X) */
  isAtStartX: boolean;
  isAtStartY: boolean;
  /** Whether scroll is at the end edge (bottom for Y, right for X) */
  isAtEndX: boolean;
  isAtEndY: boolean;
}

const MIN_HANDLE_SIZE = 20;
const SCROLL_VISIBILITY_DURATION = 1000;
// Threshold to prevent overflow oscillation at boundary
const OVERFLOW_THRESHOLD = 2;

export function useTinyScrollbar(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): TinyScrollbarResult {
  const [scrollState, setScrollState] = useState<TinyScrollbarState>({
    hasOverflowY: false,
    hasOverflowX: false,
    scrollTop: 0,
    scrollLeft: 0,
    scrollHeight: 0,
    scrollWidth: 0,
    clientHeight: 0,
    clientWidth: 0,
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeFrameRef = useRef<number | null>(null);

  const updateScrollState = useCallback(() => {
    const element = ref.current;

    if (!element) return;

    const {
      scrollTop,
      scrollLeft,
      scrollHeight,
      scrollWidth,
      clientHeight,
      clientWidth,
    } = element;

    // Use threshold to prevent oscillation at overflow boundary
    const hasOverflowY = scrollHeight > clientHeight + OVERFLOW_THRESHOLD;
    const hasOverflowX = scrollWidth > clientWidth + OVERFLOW_THRESHOLD;

    setScrollState((prev) => {
      // Only update if values actually changed to prevent unnecessary re-renders
      if (
        prev.hasOverflowY === hasOverflowY &&
        prev.hasOverflowX === hasOverflowX &&
        prev.scrollTop === scrollTop &&
        prev.scrollLeft === scrollLeft &&
        prev.scrollHeight === scrollHeight &&
        prev.scrollWidth === scrollWidth &&
        prev.clientHeight === clientHeight &&
        prev.clientWidth === clientWidth
      ) {
        return prev; // Return same reference to skip re-render
      }

      return {
        hasOverflowY,
        hasOverflowX,
        scrollTop,
        scrollLeft,
        scrollHeight,
        scrollWidth,
        clientHeight,
        clientWidth,
      };
    });
  }, [ref]);

  useEffect(() => {
    if (!enabled) return;

    const element = ref.current;

    if (!element) return;

    // Initial update
    updateScrollState();

    // Show scrollbar briefly and hide after delay
    const showScrollbarBriefly = () => {
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Hide scrollbar after delay
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, SCROLL_VISIBILITY_DURATION);
    };

    // Listen for scroll events
    const handleScroll = () => {
      updateScrollState();
      showScrollbarBriefly();
    };

    // Show scrollbar briefly when mouse enters the container
    const handleMouseEnter = () => {
      showScrollbarBriefly();
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    element.addEventListener('mouseenter', handleMouseEnter);

    // ResizeObserver for content size changes
    // Uses requestAnimationFrame to coalesce updates and prevent cascading events
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        updateScrollState();
        showScrollbarBriefly();
      });
    });

    resizeObserver.observe(element);

    // Note: We intentionally don't observe children to prevent
    // cascading resize events in nested layouts

    return () => {
      element.removeEventListener('scroll', handleScroll);
      element.removeEventListener('mouseenter', handleMouseEnter);
      resizeObserver.disconnect();

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, [enabled, ref, updateScrollState]);

  // Calculate vertical handle position and size
  const calculateVHandle = useCallback(() => {
    const { scrollHeight, clientHeight, scrollTop, hasOverflowY } = scrollState;

    if (!hasOverflowY || !enabled) {
      return { top: 0, height: 0 };
    }

    const trackHeight = clientHeight - 2; // 1px padding on each end
    const ratio = clientHeight / scrollHeight;
    let handleHeight = Math.max(
      MIN_HANDLE_SIZE,
      Math.round(trackHeight * ratio),
    );
    const availableTrack = trackHeight - handleHeight;
    const scrollRatio =
      scrollHeight - clientHeight > 0
        ? scrollTop / (scrollHeight - clientHeight)
        : 0;
    const handleTop = 1 + Math.round(availableTrack * scrollRatio);

    return { top: handleTop, height: handleHeight };
  }, [scrollState, enabled]);

  // Calculate horizontal handle position and size
  const calculateHHandle = useCallback(() => {
    const { scrollWidth, clientWidth, scrollLeft, hasOverflowX } = scrollState;

    if (!hasOverflowX || !enabled) {
      return { left: 0, width: 0 };
    }

    const trackWidth = clientWidth - 2; // 1px padding on each end
    const ratio = clientWidth / scrollWidth;
    let handleWidth = Math.max(MIN_HANDLE_SIZE, Math.round(trackWidth * ratio));
    const availableTrack = trackWidth - handleWidth;
    const scrollRatio =
      scrollWidth - clientWidth > 0
        ? scrollLeft / (scrollWidth - clientWidth)
        : 0;
    const handleLeft = 1 + Math.round(availableTrack * scrollRatio);

    return { left: handleLeft, width: handleWidth };
  }, [scrollState, enabled]);

  const vHandle = calculateVHandle();
  const hHandle = calculateHHandle();

  // Calculate edge detection
  const {
    scrollTop,
    scrollLeft,
    scrollHeight,
    scrollWidth,
    clientHeight,
    clientWidth,
    hasOverflowY,
    hasOverflowX,
  } = scrollState;

  // For Y axis: at start if scrollTop is 0, at end if scrolled to bottom
  const isAtStartY = !hasOverflowY || scrollTop <= 0;
  const isAtEndY =
    !hasOverflowY || scrollTop >= scrollHeight - clientHeight - 1;

  // For X axis: at start if scrollLeft is 0, at end if scrolled to right
  const isAtStartX = !hasOverflowX || scrollLeft <= 0;
  const isAtEndX = !hasOverflowX || scrollLeft >= scrollWidth - clientWidth - 1;

  return {
    handleVStyle: {
      '--scrollbar-v-top': `${vHandle.top}px`,
      '--scrollbar-v-height': `${vHandle.height}px`,
    } as CSSProperties,
    handleHStyle: {
      '--scrollbar-h-left': `${hHandle.left}px`,
      '--scrollbar-h-width': `${hHandle.width}px`,
    } as CSSProperties,
    hasOverflowY: scrollState.hasOverflowY,
    hasOverflowX: scrollState.hasOverflowX,
    isScrolling,
    isAtStartX,
    isAtStartY,
    isAtEndX,
    isAtEndY,
  };
}
