import {
  forwardRef,
  HTMLAttributes,
  RefObject,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { OverlayProps } from 'react-aria';

import {
  BASE_STYLES,
  COLOR_STYLES,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
  TEXT_STYLES,
} from '../../../tasty';
import { highlightText } from '../highlightText';
import { CubeTextProps, Text, TEXT_PROP_MAP } from '../Text';
import { AutoTooltipValue, useAutoTooltip } from '../use-auto-tooltip';

const STYLE_LIST = [...BASE_STYLES, ...TEXT_STYLES, ...COLOR_STYLES] as const;

export interface CubeTextItemProps extends CubeTextProps {
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
  tooltipPlacement?: OverlayProps['placement'];
}

const TextItemElement = tasty(Text, {
  qa: 'TextItem',
  styles: {
    display: 'inline-block',
    verticalAlign: 'bottom',
    width: 'max 100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export const TextItem = forwardRef<HTMLElement, CubeTextItemProps>(
  function TextItem(props, ref) {
    const {
      children,
      highlight,
      highlightCaseSensitive = false,
      highlightStyles,
      tooltip = true,
      tooltipPlacement = 'top',
      ...restProps
    } = props;

    // Extract style props (preset, color, etc.) to pass via styles prop
    const styles = extractStyles(restProps, STYLE_LIST, {}, TEXT_PROP_MAP);

    const { labelRef, renderWithTooltip } = useAutoTooltip({
      tooltip,
      children,
    });

    // Process children with highlight if applicable
    const processedChildren = useMemo(() => {
      if (typeof children === 'string' && highlight) {
        return highlightText(
          children,
          highlight,
          highlightCaseSensitive,
          highlightStyles,
        );
      }
      return children;
    }, [children, highlight, highlightCaseSensitive, highlightStyles]);

    // Store tooltip ref in a mutable ref to avoid recreating the callback
    const tooltipRefRef = useRef<RefObject<HTMLElement> | undefined>(undefined);
    // Track the current DOM element so we can populate new tooltip refs immediately
    const elementRef = useRef<HTMLElement | null>(null);

    // Create a stable ref callback that won't change between renders
    // This prevents infinite loops when React detaches/attaches refs during commit
    const handleRef = useCallback(
      (element: HTMLElement | null) => {
        // Track the element for immediate tooltip ref population
        elementRef.current = element;
        // Set component forwarded ref
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          (ref as any).current = element;
        }
        // Set tooltip ref
        if (tooltipRefRef.current) {
          (tooltipRefRef.current as any).current = element;
        }
        // Set label ref for overflow detection
        labelRef(element);
      },
      [ref, labelRef],
    );

    const renderElement = (
      tooltipTriggerProps?: HTMLAttributes<HTMLElement>,
      tooltipRef?: RefObject<HTMLElement>,
    ) => {
      // Store tooltip ref for the stable callback to use
      tooltipRefRef.current = tooltipRef;

      // When a new tooltipRef is provided (e.g., tooltip just activated),
      // immediately populate it with the existing element since handleRef
      // won't be called again (its reference is stable and the DOM element hasn't changed)
      if (tooltipRef && elementRef.current) {
        (tooltipRef as any).current = elementRef.current;
      }

      return (
        <TextItemElement
          {...filterBaseProps(restProps, { eventProps: true })}
          {...tooltipTriggerProps}
          ref={handleRef}
          styles={styles}
        >
          {processedChildren}
        </TextItemElement>
      );
    };

    return renderWithTooltip(renderElement, tooltipPlacement);
  },
);

TextItem.displayName = 'TextItem';
