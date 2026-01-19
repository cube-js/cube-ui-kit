import { Key, Node } from '@react-types/shared';
import {
  Children,
  FocusEvent,
  ForwardedRef,
  forwardRef,
  isValidElement,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AriaTabListProps,
  AriaTabPanelProps,
  useTab,
  useTabList,
  useTabPanel,
  useTextField,
} from 'react-aria';
import {
  Item as CollectionItem,
  TabListState,
  useTabListState,
} from 'react-stately';

import { useEvent } from '../../../_internal/hooks';
import { CloseIcon } from '../../../icons';
import {
  BaseProps,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { chainRaf } from '../../../utils/raf';
import { ItemAction } from '../../actions/ItemAction';
import { CubeItemProps, Item } from '../../content/Item';
import { useTinyScrollbar } from '../../content/Layout/hooks/useTinyScrollbar';

// =============================================================================
// Types
// =============================================================================

/** Visual appearance type for tabs */
export type TabType = 'default' | 'file' | 'panel' | 'radio';

/** Tab size options */
export type TabSize = 'medium' | 'large';

/** Common props for panel rendering behavior */
interface PanelBehaviorProps {
  /** If true, panel is rendered but hidden when not active. */
  prerender?: boolean;
  /** If true, once visited the panel stays in DOM. */
  keepMounted?: boolean;
}

/** Common props for QA attributes */
interface QAProps {
  /** QA selector attribute. */
  qa?: string;
  /** Additional QA value attribute. */
  qaVal?: string;
}

/** Props from CubeItemProps that don't apply to Tab */
type OmittedItemProps =
  | 'id' // Tab has its own id as Key type
  | 'type' // Tab has its own TabType
  | 'size' // Tab has its own TabSize
  | 'theme' // Tabs have internal theming
  | 'shape' // Tabs have internal shape logic
  | 'icon' // Tabs don't support icons
  | 'rightIcon'
  | 'prefix' // Tabs don't support prefix/suffix
  | 'suffix'
  | 'description' // Tabs don't have descriptions
  | 'descriptionPlacement'
  | 'descriptionProps'
  | 'tooltip' // Tabs don't typically use tooltips
  | 'defaultTooltipPlacement'
  | 'hotkeys' // Tabs don't use hotkeys
  | 'keyboardShortcutProps'
  | 'loadingSlot' // Tabs don't use loading state
  | 'isLoading'
  | 'labelProps' // Tabs use title prop instead
  | 'labelRef'
  | 'level' // Tabs don't use heading levels
  | 'highlight' // Tabs don't use highlighting
  | 'highlightCaseSensitive'
  | 'highlightStyles'
  | 'variant' // Tabs have internal variant logic
  | 'htmlType' // Tab is always a button
  | 'isSelected' // Handled internally by state
  | 'preserveActionsSpace' // Set internally in TabButton
  | 'disableActionsFocus' // Not used in Tab
  | 'actions' // Tab has its own actions definition
  | 'showActionsOnHover'; // Tab has its own showActionsOnHover

/** Common styling props for tabs - inherits style props from CubeItemProps */
interface TabStyleProps extends Omit<CubeItemProps, OmittedItemProps> {
  /** Tab size. Large uses `t2m` preset, medium uses `t3m`. */
  size?: TabSize;
  /** Visual appearance type. */
  type?: TabType;
  /** Whether to show actions only on hover. */
  showActionsOnHover?: boolean;
}

export interface CubeTabsProps
  extends BaseProps,
    OuterStyleProps,
    PanelBehaviorProps {
  /** Controlled active tab key. When provided, component is controlled. */
  activeKey?: Key;
  /** Initial active tab key for uncontrolled mode. */
  defaultActiveKey?: Key;
  /**
   * Visual appearance type for tabs.
   * - `default` - Standard tabs with selection indicator below (default)
   * - `file` - File-style tabs with fill highlight on selection, delimiter between tabs
   * - `panel` - Panel-style tabs with border bottom highlight on selection, delimiter between tabs
   * - `radio` - Radio button style for tab selection
   * @default 'default'
   */
  type?: TabType;
  /** Tab size. Large uses `t2m` preset, medium uses `t3m`. */
  size?: TabSize;
  /** Accessible label for the tab list. */
  label?: string;
  /** Content rendered before the tab list. */
  prefix?: ReactNode;
  /** Content rendered after the tab list. */
  suffix?: ReactNode;
  /** Callback when active tab changes. */
  onChange?: (key: Key) => void;
  /** Callback when tab delete button is clicked. Presence enables delete buttons. */
  onDelete?: (key: Key) => void;
  /** Callback when a tab title is changed. Enables title editing on tabs with isEditable. */
  onTitleChange?: (key: Key, newTitle: string) => void;
  /** Whether to show tab actions only on hover. Can be overridden per-tab. */
  showActionsOnHover?: boolean;
  /** Custom tasty styles for the tab bar container. */
  styles?: Styles;
  /** QA selector attribute. */
  qa?: string;
  /** Tab components or Tabs.List with Tabs.Panel. */
  children?: ReactNode;
  /**
   * Functional content renderer for optimized lazy evaluation.
   * When provided, panel content is only evaluated for the active tab,
   * while inactive tabs use cached content. This prevents expensive
   * re-renders of tab content on every parent render.
   *
   * Use with tabs that have no children for maximum optimization.
   *
   * @param key - The key of the tab to render content for
   * @returns Panel content for the given tab
   *
   * @example
   * ```tsx
   * <Tabs
   *   renderPanel={(key) => {
   *     switch (key) {
   *       case 'tab1': return <ExpensiveComponent />;
   *       case 'tab2': return <AnotherExpensive />;
   *       default: return null;
   *     }
   *   }}
   * >
   *   <Tab key="tab1" title="Tab 1" />
   *   <Tab key="tab2" title="Tab 2" />
   * </Tabs>
   * ```
   */
  renderPanel?: (key: Key) => ReactNode;
  /**
   * Cache keys for individual panels. Enables caching for specified panels.
   *
   * By default (without cache keys), panels re-render on every Tabs render.
   * When a panel has a non-undefined cache key defined, its content is cached
   * and reused until the cache key changes.
   *
   * **Important:**
   * - Cache keys must be primitive values (string, number, boolean, null).
   * - Objects/arrays will cause cache misses on every render (reference comparison).
   * - Symbol tab keys are not supported for caching (use string keys instead).
   * - Setting a key to `undefined` is the same as not having it (no caching).
   *
   * @example
   * ```tsx
   * // Enable caching for specific panels with their dependencies as cache keys
   * <Tabs
   *   renderPanel={(key) => <Panel data={data[key]} />}
   *   panelCacheKeys={{
   *     tab1: data.tab1.version,  // Cached, invalidates when version changes
   *     tab2: data.tab2.version,  // Cached, invalidates when version changes
   *     // tab3 has no cache key - re-renders on every Tabs render
   *   }}
   * />
   * ```
   */
  panelCacheKeys?: Record<
    string | number,
    string | number | boolean | null | undefined
  >;
}

export interface CubeTabProps extends TabStyleProps, PanelBehaviorProps {
  /**
   * Unique identifier for the tab. Used for activeKey matching.
   * Auto-injected from the React `key` prop (converted to string).
   * Note: All keys are internally converted to strings for React Aria compatibility.
   */
  id?: string;
  /** Content displayed in the tab button. */
  title: ReactNode;
  /** Panel content rendered when tab is active. */
  children?: ReactNode;
  /** Disables the tab (cannot be selected). */
  isDisabled?: boolean;
  /** Actions to render in the tab (e.g., icons, buttons). Rendered before delete action if tab is deletable. */
  actions?: ReactNode;
  /** Whether the tab title can be edited. Requires onTitleChange on Tabs or Tab. */
  isEditable?: boolean;
  /** Callback when this tab's title is changed. Overrides parent's onTitleChange. */
  onTitleChange?: (newTitle: string) => void;
}

export interface CubeTabPanelProps extends PanelBehaviorProps, QAProps {
  /**
   * Panel identifier. Must match a Tab's id.
   * Auto-injected from the React `key` prop (converted to string).
   */
  id?: string;
  /** Panel content. */
  children?: ReactNode;
  /** Custom tasty styles for the panel container. */
  styles?: Styles;
}

export interface CubeTabListProps {
  /** Tab components. */
  children?: ReactNode;
}

/** Ref API for programmatic control of Tabs component */
export interface CubeTabsRef {
  /** The root DOM element of the Tabs component */
  element: HTMLDivElement | null;
  /** Start editing a tab's title by its key */
  startEditing: (key: Key) => void;
  /** Cancel the current editing session */
  cancelEditing: () => void;
}

// =============================================================================
// Styled Components
// =============================================================================

const TabsElement = tasty({
  styles: {
    display: 'flex',
    flow: 'row',
    placeItems: {
      '': 'end stretch',
      'type=radio | type=file | type=panel': 'stretch',
    },
    overflow: 'visible',
    border: {
      '': 0,
      '(type=default | type=file | type=panel) & has-panels': 'bottom',
    },
    width: {
      '': '100%',
      'type=radio': 'max-content',
    },
    padding: {
      '': 0,
      'type=radio': '.5x',
    },
    radius: {
      '': 0,
      'type=radio': '1cr',
    },
    fill: {
      '': '#clear',
      'type=radio': '#dark.06',
    },
    flexShrink: 0,
    flexGrow: 0,

    $transition: '$tab-transition',

    Prefix: {
      display: 'flex',
      placeItems: 'center',
      placeContent: 'center',
      flexShrink: 0,
      placeSelf: 'center',
    },

    Suffix: {
      display: 'flex',
      placeItems: 'center',
      placeContent: 'center',
      flexShrink: 0,
      placeSelf: 'center',
    },

    // Wrapper for scroll area and scrollbar (scrollbar is positioned relative to this)
    ScrollWrapper: {
      position: 'relative',
      display: 'flex',
      flexGrow: 1,
      flexShrink: 1,
      width: 'min 0',
      overflow: {
        '': 'hidden',
        'type=radio': 'visible',
      },
    },

    Scroll: {
      position: 'relative',
      display: 'block',
      overflow: {
        '': 'auto hidden',
        'type=radio': 'visible',
      },
      scrollbar: 'none',
      flexGrow: 1,
      width: '100%',
      // Add padding/margin for radio type to allow shadow to render outside
      padding: {
        '': 0,
        'type=radio': '.5x',
      },
      margin: {
        '': 0,
        'type=radio': '-.5x',
      },
      // Use multi-group fade with color tokens for smooth transitions
      fade: '2x left #tabs-fade-left #black, 2x right #tabs-fade-right #black',
      // ##name outputs --name-color (literal CSS property name)
      transition:
        '##tabs-fade-left $tab-transition ease-in, ##tabs-fade-right $tab-transition ease-in',

      // Transition transparent color: opaque (no fade) -> transparent (fade visible)
      '#tabs-fade-left': {
        '': 'rgb(0 0 0 / 1)',
        'fade-left': 'rgb(0 0 0 / 0)',
      },
      '#tabs-fade-right': {
        '': 'rgb(0 0 0 / 1)',
        'fade-right': 'rgb(0 0 0 / 0)',
      },
    },

    Container: {
      position: 'relative',
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: {
        '': 'auto',
        'type=radio': '1fr',
      },
      gap: {
        '': 0,
        'type=radio': '.5x',
      },
      placeContent: 'start',
      overflow: 'visible',
      width: {
        '': 'max-content',
        'type=radio': '100%',
      },
    },

    // Custom horizontal scrollbar (tiny) - positioned relative to ScrollWrapper
    ScrollbarH: {
      position: 'absolute',
      bottom: '1px',
      left: '$scrollbar-h-left',
      height: '1ow',
      width: '$scrollbar-h-width',
      radius: 'round',
      fill: '#dark.35',
      opacity: {
        '': 0,
        'focused | scrolling': 1,
      },
      transition: 'opacity 0.15s',
      pointerEvents: 'none',
    },
  },
});

const TabElement = tasty(Item, {
  as: 'button',
  styles: {
    radius: {
      '': false,
      'type=radio': true,
      'type=default': 'top',
    },
    color: {
      '': '#dark-02',
      'type=default & selected': '#purple-text',
    },
    fill: {
      '': '#clear',
      'type=file | type=panel': '#light',
      '(type=file | type=panel | type=radio) & selected': '#white',
    },
    border: {
      '': '0 #clear',
      'type=panel & selected': '1ow #purple bottom',
    },
    preset: {
      '': 't3m',
      'size=small | size=xsmall': 't4',
      'size=large | size=xlarge': 't2m',
    },
    shadow: {
      '': 'none',
      editing: 'inset 0 0 0 1bw #purple-text',
      'type=radio & selected': '$item-shadow',
    },
    Label: {
      placeSelf: {
        '': 'center start',
        'type=radio': 'center start',
        'type=radio & !has-prefix & !has-suffix & !has-icon & !has-right-icon':
          'center',
      },
    },
  },
});

const TabContainer = tasty({
  styles: {
    position: 'relative',
    display: 'grid',
    border: {
      '': 0,
      'type=file | type=panel': 'right',
    },
  },
});

// =============================================================================
// EditableTitle Component (inline title editing)
// =============================================================================

const EditableTitleInputElement = tasty({
  as: 'input',
  styles: {
    border: 0,
    padding: 0,
    margin: 0,
    fill: 'transparent',
    outline: 0,
    preset: 'inherit',
    color: 'inherit',
    width: 'initial $input-width 100%',
  },
});

const HiddenMeasure = tasty({
  styles: {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
    font: 'inherit',
    pointerEvents: 'none',
    height: 0,
    overflow: 'hidden',
  },
});

interface EditableTitleProps {
  title: ReactNode;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function EditableTitle({
  title,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEditing,
  onSubmit,
  onCancel,
}: EditableTitleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const justEnteredEditModeRef = useRef(false);

  // React Aria text field hook
  const { inputProps } = useTextField(
    {
      'aria-label': 'Edit tab title',
      value: editValue,
      onChange: onEditValueChange,
    },
    inputRef,
  );

  // Focus and select input when entering edit mode
  useLayoutEffect(() => {
    if (isEditing && inputRef.current) {
      const input = inputRef.current;

      // Set flag to ignore immediate blur events
      justEnteredEditModeRef.current = true;

      input.focus();
      // Use requestAnimationFrame to ensure selection happens after focus
      requestAnimationFrame(() => {
        input.select();
        // Clear the flag after focus is established (allow 2 frames for menu to fully close)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            justEnteredEditModeRef.current = false;
          });
        });
      });
    } else {
      justEnteredEditModeRef.current = false;
    }
  }, [isEditing]);

  // Measure text width and update input width
  useLayoutEffect(() => {
    if (isEditing && measureRef.current) {
      const width = measureRef.current.scrollWidth;

      setInputWidth(width);
    }
  }, [isEditing, editValue]);

  const handleKeyDown = useEvent((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === ' '
    ) {
      // Stop propagation to prevent tab navigation while editing
      e.stopPropagation();
    }
  });

  const handleBlur = useEvent(() => {
    // Ignore blur events immediately after entering edit mode (menu closing causes focus loss)
    if (justEnteredEditModeRef.current) {
      // Re-focus the input since something else stole focus
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return;
    }
    // Submit on blur (per user preference)
    onSubmit();
  });

  const handleDoubleClick = useEvent((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartEditing();
  });

  if (isEditing) {
    // Merge our handlers with React Aria's inputProps
    const mergedProps = {
      ...inputProps,
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        handleKeyDown(e);
        inputProps.onKeyDown?.(e);
      },
      onBlur: (e: FocusEvent<HTMLInputElement>) => {
        handleBlur();
        inputProps.onBlur?.(e);
      },
    };

    return (
      <>
        <HiddenMeasure ref={measureRef} aria-hidden="true">
          {editValue || ' '}
        </HiddenMeasure>
        <EditableTitleInputElement
          {...mergedProps}
          ref={inputRef}
          tokens={{ '$input-width': inputWidth ? `${inputWidth}px` : 'auto' }}
        />
      </>
    );
  }

  return <span onDoubleClick={handleDoubleClick}>{title}</span>;
}

const TabPanelElement = tasty({
  as: 'section',
  styles: {
    display: 'contents',
  },
});

const TabIndicatorElement = tasty({
  styles: {
    position: 'absolute',
    bottom: '0',
    left: 0,
    height: '1ow',
    fill: '#purple',
    transition: 'left, width',
    transitionDuration: '.2s',
    transitionTimingFunction: 'ease-out',
    pointerEvents: 'none',
  },
});

// =============================================================================
// Tab Indicator Hook
// =============================================================================

interface IndicatorStyle {
  left: number;
  width: number;
}

/**
 * Hook to track and animate tab indicator position.
 * Returns null if disabled (e.g., for non-default types).
 */
function useTabIndicator(
  containerRef: RefObject<HTMLElement | null>,
  selectedKey: Key | null,
  enabled: boolean,
): IndicatorStyle | null {
  const [style, setStyle] = useState<IndicatorStyle | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const updateIndicator = useCallback(() => {
    if (!enabled || !containerRef.current || selectedKey == null) {
      setStyle(null);

      return;
    }

    // Find the selected tab button within the container
    const selectedTab = containerRef.current.querySelector(
      '[aria-selected="true"]',
    ) as HTMLElement | null;

    if (!selectedTab) {
      setStyle(null);

      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const tabRect = selectedTab.getBoundingClientRect();

    // Only update if dimensions are valid (element has been painted)
    if (tabRect.width > 0) {
      setStyle({
        left:
          tabRect.left - containerRect.left + containerRef.current.scrollLeft,
        width: tabRect.width,
      });
    }
  }, [containerRef, selectedKey, enabled]);

  // Update on selectedKey change - use chainRaf to ensure DOM is fully painted
  useLayoutEffect(() => {
    // Cancel any pending RAF chain
    if (cancelRef.current) {
      cancelRef.current();
    }

    // Schedule update after 2 frames to ensure layout is complete
    cancelRef.current = chainRaf(() => {
      updateIndicator();
    }, 2);

    return () => {
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, [updateIndicator]);

  // Update on window resize
  useEffect(() => {
    if (!enabled) return;

    const handleResize = () => updateIndicator();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, updateIndicator]);

  return enabled ? style : null;
}

// =============================================================================
// Internal Types for parsed tabs
// =============================================================================

interface ParsedTab extends Omit<CubeTabProps, 'id' | 'children'> {
  /** Tab key (always a string internally) */
  key: string;
  content: ReactNode;
}

interface ParsedPanel extends Omit<CubeTabPanelProps, 'id' | 'children'> {
  /** Panel key (always a string internally) */
  key: string;
  content: ReactNode;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Checks if a child is a Tab component.
 */
function isTabElement(child: ReactNode): child is ReactElement<CubeTabProps> {
  return (
    isValidElement(child) &&
    typeof child.type === 'function' &&
    (child.type as any).displayName === 'CubeTab'
  );
}

/**
 * Checks if a child is a TabPanel component.
 */
function isTabPanelElement(
  child: ReactNode,
): child is ReactElement<CubeTabPanelProps> {
  return (
    isValidElement(child) &&
    typeof child.type === 'function' &&
    (child.type as any).displayName === 'CubeTabPanel'
  );
}

/**
 * Checks if a child is a TabList component.
 */
function isTabListElement(
  child: ReactNode,
): child is ReactElement<CubeTabListProps> {
  return (
    isValidElement(child) &&
    typeof child.type === 'function' &&
    (child.type as any).displayName === 'CubeTabList'
  );
}

/**
 * Extracts the raw key from a React child (strips the ".$" prefix added by Children.map).
 *
 * Note: All keys are converted to strings for React Aria compatibility.
 * This means numeric keys like `key={1}` become `"1"`.
 *
 * @returns The key as a string, or null if no key is present
 */
function getRawKey(child: ReactElement): string | null {
  if (child.key == null) return null;

  const keyStr = String(child.key);

  // React prefixes keys with ".$" in Children.map
  if (keyStr.startsWith('.$')) {
    return keyStr.slice(2);
  }

  return keyStr;
}

// =============================================================================
// Tab Component (for building items)
// =============================================================================

function Tab(_props: CubeTabProps): ReactElement | null {
  // This component is never rendered directly - it's used for configuration
  // The actual rendering happens in TabButton
  return null;
}

Tab.displayName = 'CubeTab';

// =============================================================================
// TabButton Component (renders individual tab)
// =============================================================================

/** Props for tab title editing functionality */
interface TabEditingProps {
  isEditing?: boolean;
  editValue?: string;
  onEditValueChange?: (value: string) => void;
  onStartEditing?: (key: Key, title: string) => void;
  onSubmitEditing?: (
    key: Key,
    newTitle: string,
    tabOnTitleChange?: (title: string) => void,
  ) => void;
  onCancelEditing?: () => void;
}

interface TabButtonProps extends TabEditingProps {
  item: Node<object>;
  state: TabListState<object>;
  tabData: ParsedTab;
  /** Parent-level type default */
  type?: TabType;
  /** Parent-level size default */
  size?: TabSize;
  onDelete?: (key: Key) => void;
  /** Parent-level showActionsOnHover default */
  showActionsOnHover?: boolean;
}

function TabButton({
  item,
  state,
  tabData,
  type,
  size,
  onDelete,
  showActionsOnHover: parentShowActionsOnHover,
  isEditing = false,
  editValue = '',
  onEditValueChange,
  onStartEditing,
  onSubmitEditing,
  onCancelEditing,
}: TabButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { tabProps } = useTab({ key: item.key }, state, ref);

  const isActive = state.selectedKey === item.key;
  const isDisabled = state.disabledKeys.has(item.key);
  const isDeletable = !!onDelete;
  const isEditable = tabData.isEditable ?? false;
  const effectiveType = tabData.type ?? type ?? 'default';

  const handleDelete = useEvent(() => {
    onDelete?.(item.key);
  });

  const handleStartEditing = useEvent(() => {
    if (!isEditable || isDisabled) return;

    const titleText =
      typeof tabData.title === 'string' ? tabData.title : String(item.key);

    onStartEditing?.(item.key, titleText);
  });

  const handleSubmitEditing = useEvent(() => {
    onSubmitEditing?.(item.key, editValue, tabData.onTitleChange);
  });

  const handleCancelEditing = useEvent(() => {
    onCancelEditing?.();
  });

  const handleEditValueChange = useEvent((value: string) => {
    onEditValueChange?.(value);
  });

  const mods = useMemo(
    () => ({
      type: effectiveType,
      active: isActive,
      deletable: isDeletable,
      disabled: isDisabled,
      editing: isEditing,
    }),
    [effectiveType, isActive, isDeletable, isDisabled, isEditing],
  );

  // Scroll active tab into view
  useEffect(() => {
    if (ref.current && isActive) {
      ref.current.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }, [isActive]);

  // Build actions for the tab (custom actions + delete button)
  const deleteAction = isDeletable ? (
    <ItemAction
      icon={<CloseIcon />}
      tooltip="Delete tab"
      onPress={handleDelete}
    />
  ) : null;

  // Combine tab's custom actions with delete action
  const actions =
    tabData.actions || deleteAction ? (
      <>
        {tabData.actions}
        {deleteAction}
      </>
    ) : undefined;

  // Determine effective size - map 'medium'/'large' to Item size values
  const isRadioType = effectiveType === 'radio';
  const isFileOrPanelType =
    effectiveType === 'file' || effectiveType === 'panel';

  const effectiveSize = tabData.size ?? size ?? 'medium';

  // For radio type, use smaller sizes like RadioGroup tabs mode
  let itemSize: 'xsmall' | 'small' | 'medium' | 'large';

  if (isRadioType) {
    // Map sizes similar to RadioGroup tabs mode
    if (effectiveSize === 'medium') {
      itemSize = 'xsmall';
    } else {
      // large -> medium
      itemSize = 'medium';
    }
  } else {
    itemSize = effectiveSize === 'large' ? 'large' : 'medium';
  }

  // Determine Item type prop
  let itemType: string | undefined =
    effectiveType === 'default' ? (isActive ? 'clear' : 'neutral') : 'neutral';

  // Determine shape - file/panel types use sharp edges
  const itemShape = isFileOrPanelType ? 'sharp' : undefined;

  // Determine showActionsOnHover - tab-level overrides parent-level
  const effectiveShowActionsOnHover =
    tabData.showActionsOnHover ?? parentShowActionsOnHover;

  // Render title with editing support if editable
  const titleContent = isEditable ? (
    <EditableTitle
      title={tabData.title}
      isEditing={isEditing}
      editValue={editValue}
      onEditValueChange={handleEditValueChange}
      onStartEditing={handleStartEditing}
      onSubmit={handleSubmitEditing}
      onCancel={handleCancelEditing}
    />
  ) : (
    tabData.title
  );

  // Extract tab-specific props and pass through the rest (style props) to the Item
  const {
    title: _title,
    content: _content,
    key: _key,
    isDisabled: _isDisabled,
    prerender: _prerender,
    keepMounted: _keepMounted,
    size: _size,
    type: _type,
    actions: _actions,
    showActionsOnHover: _showActionsOnHover,
    isEditable: _isEditable,
    onTitleChange: _onTitleChange,
    qa,
    qaVal,
    styles,
    ...itemStyleProps
  } = tabData;

  return (
    <TabContainer mods={mods}>
      <TabElement
        preserveActionsSpace
        showActionsOnHover={effectiveShowActionsOnHover}
        as="button"
        {...tabProps}
        {...itemStyleProps}
        ref={ref}
        qa={qa ?? `Tab-${String(item.key)}`}
        qaVal={qaVal}
        styles={styles}
        mods={mods}
        isSelected={isActive}
        isDisabled={isDisabled}
        size={itemSize}
        type={itemType}
        shape={itemShape}
        actions={actions}
      >
        {titleContent}
      </TabElement>
    </TabContainer>
  );
}

// =============================================================================
// TabPanelRenderer Component (renders panel content)
// =============================================================================

interface TabPanelRendererProps {
  tabKey: string;
  state: TabListState<object>;
  content: ReactNode;
  prerender?: boolean;
  keepMounted?: boolean;
  tabPrerender?: boolean;
  tabKeepMounted?: boolean;
  visitedKeys: Set<string>;
  panelStyles?: Styles;
  qa?: string;
  qaVal?: string;
}

function TabPanelRenderer({
  tabKey,
  state,
  content,
  prerender,
  keepMounted,
  tabPrerender,
  tabKeepMounted,
  visitedKeys,
  panelStyles,
  qa,
  qaVal,
}: TabPanelRendererProps) {
  const ref = useRef<HTMLElement>(null);
  const { tabPanelProps } = useTabPanel(
    { key: tabKey } as AriaTabPanelProps,
    state,
    ref,
  );

  const isActive = state.selectedKey === tabKey;

  // Determine effective prerender/keepMounted (tab-level overrides global)
  const effectivePrerender = tabPrerender ?? prerender;
  const effectiveKeepMounted = tabKeepMounted ?? keepMounted;

  // Determine if panel should render using shared utility
  if (
    !shouldRenderPanel(
      isActive,
      visitedKeys.has(tabKey),
      effectivePrerender,
      effectiveKeepMounted,
    )
  ) {
    return null;
  }

  return (
    <TabPanelElement
      {...tabPanelProps}
      ref={ref}
      qa={qa ?? 'TabPanel'}
      qaVal={qaVal ?? String(tabKey)}
      styles={panelStyles}
      style={{
        display: isActive ? 'contents' : 'none',
      }}
    >
      {content}
    </TabPanelElement>
  );
}

// =============================================================================
// Panel Rendering Utilities
// =============================================================================

/** Cache key type - primitives only for reliable comparison */
type CacheKeyValue = string | number | boolean | null | undefined;

/**
 * Determines if a panel should be rendered based on prerender/keepMounted settings.
 */
function shouldRenderPanel(
  isActive: boolean,
  wasVisited: boolean,
  effectivePrerender: boolean | undefined,
  effectiveKeepMounted: boolean | undefined,
): boolean {
  return (
    !!effectivePrerender || isActive || (!!effectiveKeepMounted && wasVisited)
  );
}

// =============================================================================
// CachedPanelRenderer Component (for renderPanel with content caching)
// =============================================================================

interface CachedPanelRendererProps {
  parsedTabs: ParsedTab[];
  explicitPanels: Map<string, ParsedPanel>;
  state: TabListState<object>;
  renderPanel: (key: Key) => ReactNode;
  panelCacheKeys?: Record<string | number, CacheKeyValue>;
  prerender: boolean;
  keepMounted: boolean;
  visitedKeys: Set<string>;
}

/**
 * Renders panels with optional content caching.
 * Only the content from renderPanel is cached - the TabPanelRenderer wrapper
 * is always rendered fresh so it can correctly determine the active state.
 *
 * Caching behavior:
 * - By default, panels re-render on every Tabs render (no caching)
 * - When a panel has a non-undefined cache key in `panelCacheKeys`, caching is enabled
 * - Cached content is reused until the cache key changes
 * - Setting a cache key to `undefined` is the same as not having it (no caching)
 */
function CachedPanelRenderer({
  parsedTabs,
  explicitPanels,
  state,
  renderPanel,
  panelCacheKeys,
  prerender,
  keepMounted,
  visitedKeys,
}: CachedPanelRendererProps) {
  // Cache for rendered content - stores { content, cacheKey } per panel
  const contentCacheRef = useRef<
    Map<string, { content: ReactNode; cacheKey: CacheKeyValue }>
  >(new Map());

  /**
   * Get the cache key for a panel.
   * Returns undefined if no cache key is defined or if set to undefined (no caching).
   */
  const getCacheKey = (key: string): CacheKeyValue | undefined => {
    if (!panelCacheKeys) return undefined;
    if (Object.prototype.hasOwnProperty.call(panelCacheKeys, key)) {
      const value = panelCacheKeys[key];
      // undefined means no caching
      return value;
    }
    return undefined;
  };

  /**
   * Check if a panel has caching enabled.
   * Only enabled when a non-undefined cache key is defined.
   */
  const hasCacheKey = (key: string): boolean => {
    if (!panelCacheKeys) return false;
    if (!Object.prototype.hasOwnProperty.call(panelCacheKeys, key))
      return false;
    // undefined value means no caching
    return panelCacheKeys[key] !== undefined;
  };

  // Clean up cache entries for removed tabs
  const currentTabKeys = useMemo(
    () => new Set(parsedTabs.map((t) => t.key)),
    [parsedTabs],
  );

  // Use effect to clean up stale cache entries when tabs change
  useEffect(() => {
    for (const key of contentCacheRef.current.keys()) {
      if (!currentTabKeys.has(key)) {
        contentCacheRef.current.delete(key);
      }
    }
  }, [currentTabKeys]);

  return (
    <>
      {parsedTabs.map((tab) => {
        const explicitPanel = explicitPanels.get(tab.key);
        const tabPrerender = explicitPanel?.prerender ?? tab.prerender;
        const tabKeepMounted = explicitPanel?.keepMounted ?? tab.keepMounted;
        const effectivePrerender = tabPrerender ?? prerender;
        const effectiveKeepMounted = tabKeepMounted ?? keepMounted;

        const isActive = state.selectedKey === tab.key;
        const wasVisited = visitedKeys.has(tab.key);

        if (
          !shouldRenderPanel(
            isActive,
            wasVisited,
            effectivePrerender,
            effectiveKeepMounted,
          )
        ) {
          return null;
        }

        // Check if this panel has caching enabled
        const isCachingEnabled = hasCacheKey(tab.key);
        let content: ReactNode;

        if (isCachingEnabled) {
          // Caching is enabled for this panel - check cache
          const currentCacheKey = getCacheKey(tab.key);
          const cached = contentCacheRef.current.get(tab.key);

          // Cache hit if keys match (currentCacheKey is guaranteed non-undefined here)
          if (cached !== undefined && cached.cacheKey === currentCacheKey) {
            // Cache hit - use cached content
            content = cached.content;
          } else {
            // Cache miss or key changed - compute fresh and cache
            content = renderPanel(tab.key);
            contentCacheRef.current.set(tab.key, {
              content,
              cacheKey: currentCacheKey!,
            });
          }
        } else {
          // No caching - always compute fresh
          content = renderPanel(tab.key);
          // Clear any stale cache entry
          contentCacheRef.current.delete(tab.key);
        }

        return (
          <TabPanelRenderer
            key={tab.key}
            tabKey={tab.key}
            state={state}
            content={content}
            prerender={prerender}
            keepMounted={keepMounted}
            tabPrerender={tabPrerender}
            tabKeepMounted={tabKeepMounted}
            visitedKeys={visitedKeys}
            panelStyles={explicitPanel?.styles}
            qa={explicitPanel?.qa}
            qaVal={explicitPanel?.qaVal}
          />
        );
      })}
    </>
  );
}

// =============================================================================
// TabPanel Component (for explicit panel API)
// =============================================================================

function TabPanel(_props: CubeTabPanelProps): ReactElement | null {
  // This component is never rendered directly - it's used for configuration
  return null;
}

TabPanel.displayName = 'CubeTabPanel';

// =============================================================================
// TabList Component (for explicit list API)
// =============================================================================

function TabList(_props: CubeTabListProps): ReactElement | null {
  // This component is never rendered directly - it's used for configuration
  return null;
}

TabList.displayName = 'CubeTabList';

// =============================================================================
// Main Tabs Component
// =============================================================================

function TabsComponent(props: CubeTabsProps, ref: ForwardedRef<CubeTabsRef>) {
  const {
    label = 'Tabs',
    defaultActiveKey,
    activeKey,
    size,
    type = 'default',
    onChange,
    onDelete,
    onTitleChange,
    showActionsOnHover,
    children,
    prefix,
    suffix,
    prerender = false,
    keepMounted = false,
    qa = 'Tabs',
    renderPanel,
    panelCacheKeys,
    ...otherProps
  } = props;

  // Extract outer styles (width, height, margin, etc.) and styles prop from props
  const combinedStyles = extractStyles(otherProps, OUTER_STYLES);

  // DOM element ref (separate from imperative handle ref)
  const elementRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track visited tabs for keepMounted functionality
  const visitedKeysRef = useRef<Set<string>>(new Set());

  // =========================================================================
  // Tab Title Editing State
  // =========================================================================
  const [editingKey, setEditingKey] = useState<Key | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = useCallback(
    (key: Key, currentTitle: string) => {
      // Also select the tab being edited
      onChange?.(key);
      chainRaf(() => {
        setEditingKey(key);
        setEditValue(currentTitle);
      }, 2);
    },
    [onChange],
  );

  const cancelEditing = useCallback(() => {
    setEditingKey(null);
    setEditValue('');
  }, []);

  const submitEditing = useCallback(
    (
      key: Key,
      newTitle: string,
      tabOnTitleChange?: (title: string) => void,
    ) => {
      const trimmed = newTitle.trim();

      if (trimmed) {
        // Tab-level callback takes precedence
        if (tabOnTitleChange) {
          tabOnTitleChange(trimmed);
        } else if (onTitleChange) {
          onTitleChange(key, trimmed);
        }
      }

      setEditingKey(null);
      setEditValue('');
    },
    [onTitleChange],
  );

  // Parse children to extract tabs and explicit panels
  const { parsedTabs, explicitPanels, hasAnyContent } = useMemo(() => {
    const childArray = Children.toArray(children);
    const tabs: ParsedTab[] = [];
    const panels = new Map<string, ParsedPanel>();
    let hasExplicitList = false;
    let tabChildren: ReactNode[] = [];

    // Check for explicit Tabs.List / Tabs.Panel structure
    for (const child of childArray) {
      if (isTabListElement(child)) {
        hasExplicitList = true;
        tabChildren = Children.toArray(child.props.children);
      } else if (isTabPanelElement(child)) {
        const key = getRawKey(child as ReactElement);

        if (key != null) {
          panels.set(key, {
            key,
            content: child.props.children,
            prerender: child.props.prerender,
            keepMounted: child.props.keepMounted,
            styles: child.props.styles,
            qa: child.props.qa,
            qaVal: child.props.qaVal,
          });
        }
      }
    }

    // If no explicit list, use direct Tab children
    if (!hasExplicitList) {
      tabChildren = childArray;
    }

    // Parse Tab elements
    let hasContent = panels.size > 0;

    for (const child of tabChildren) {
      if (isTabElement(child)) {
        // Get key from the element's key prop or id prop (convert to string)
        const key = getRawKey(child) ?? child.props.id;

        if (key != null) {
          const { id: _id, children: tabChildren, ...tabProps } = child.props;

          tabs.push({
            ...tabProps,
            key,
            content: tabChildren,
          });

          if (tabChildren != null) {
            hasContent = true;
          }
        }
      }
    }

    return {
      parsedTabs: tabs,
      explicitPanels: panels,
      hasAnyContent: hasContent,
    };
  }, [children]);

  // Clean up visitedKeys when tabs are removed
  const currentTabKeysSet = useMemo(
    () => new Set(parsedTabs.map((t) => t.key)),
    [parsedTabs],
  );

  useEffect(() => {
    for (const key of visitedKeysRef.current) {
      if (!currentTabKeysSet.has(key)) {
        visitedKeysRef.current.delete(key);
      }
    }
  }, [currentTabKeysSet]);

  // Create collection items for React Stately
  const collectionItems = useMemo(() => {
    return parsedTabs.map((tab) => (
      <CollectionItem
        key={tab.key}
        textValue={typeof tab.title === 'string' ? tab.title : String(tab.key)}
      >
        {tab.title}
      </CollectionItem>
    ));
  }, [parsedTabs]);

  // Create a lookup map for tab data
  const tabDataMap = useMemo(() => {
    const map = new Map<string, ParsedTab>();

    for (const tab of parsedTabs) {
      map.set(tab.key, tab);
    }

    return map;
  }, [parsedTabs]);

  // Expose ref API for programmatic control (separate from DOM ref)
  useImperativeHandle(
    ref,
    () => ({
      element: elementRef.current,
      startEditing: (key: Key) => {
        // Convert key to string for internal lookup
        const keyStr = String(key);
        const tabData = tabDataMap.get(keyStr);

        if (tabData?.isEditable && !tabData?.isDisabled) {
          const titleText =
            typeof tabData.title === 'string'
              ? tabData.title
              : String(tabData.key);

          startEditing(keyStr, titleText);
        }
      },
      cancelEditing,
    }),
    [tabDataMap, startEditing, cancelEditing],
  );

  // Determine disabled keys
  const disabledKeys = useMemo(() => {
    return new Set(
      parsedTabs.filter((tab) => tab.isDisabled).map((tab) => tab.key),
    );
  }, [parsedTabs]);

  // Handle selection change
  const handleSelectionChange = useEvent((key: Key) => {
    // Convert to string for internal tracking
    visitedKeysRef.current.add(String(key));
    onChange?.(key);
  });

  // Create aria props for useTabListState
  const ariaProps: AriaTabListProps<object> = useMemo(
    () => ({
      selectedKey: activeKey,
      defaultSelectedKey: defaultActiveKey,
      onSelectionChange: handleSelectionChange,
      disabledKeys,
      children: collectionItems,
      'aria-label': label,
    }),
    [
      activeKey,
      defaultActiveKey,
      handleSelectionChange,
      disabledKeys,
      collectionItems,
      label,
    ],
  );

  // Create state using useTabListState
  const state = useTabListState(ariaProps);

  // Track initial selected key for visited tabs
  useEffect(() => {
    if (state.selectedKey != null) {
      visitedKeysRef.current.add(String(state.selectedKey));
    }
  }, [state.selectedKey]);

  // Get tablist props from react-aria
  const { tabListProps } = useTabList(ariaProps, state, listRef);

  // Tab indicator for default type
  const indicatorStyle = useTabIndicator(
    listRef,
    state.selectedKey,
    type === 'default',
  );

  // Tiny scrollbar for horizontal scrolling (not for radio type)
  const isTinyScrollbar = type !== 'radio';
  const { handleHStyle, hasOverflowX, isScrolling, isAtStartX, isAtEndX } =
    useTinyScrollbar(scrollRef, isTinyScrollbar);

  const hasPanels = hasAnyContent || !!renderPanel;

  const mods = useMemo(
    () => ({
      type,
      deletable: !!onDelete,
      scrolling: isScrolling,
      'fade-left': !isAtStartX,
      'fade-right': !isAtEndX,
      'has-panels': hasPanels,
    }),
    [type, onDelete, isScrolling, isAtStartX, isAtEndX, hasPanels],
  );

  return (
    <>
      <TabsElement
        ref={elementRef}
        qa={qa}
        mods={mods}
        styles={combinedStyles}
        style={handleHStyle}
        data-size={size}
      >
        {prefix ? <div data-element="Prefix">{prefix}</div> : null}
        <div data-element="ScrollWrapper">
          <div ref={scrollRef} data-element="Scroll">
            <div {...tabListProps} ref={listRef} data-element="Container">
              {[...state.collection].map((item) => {
                // Convert item.key to string for internal lookup
                const tabData = tabDataMap.get(String(item.key));

                if (!tabData) return null;

                const isItemEditing = editingKey === item.key;

                return (
                  <TabButton
                    key={item.key}
                    item={item}
                    state={state}
                    tabData={tabData}
                    type={type}
                    size={size}
                    showActionsOnHover={showActionsOnHover}
                    isEditing={isItemEditing}
                    editValue={isItemEditing ? editValue : ''}
                    onDelete={onDelete}
                    onEditValueChange={setEditValue}
                    onStartEditing={startEditing}
                    onSubmitEditing={submitEditing}
                    onCancelEditing={cancelEditing}
                  />
                );
              })}
              {indicatorStyle && (
                <TabIndicatorElement
                  style={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                  }}
                />
              )}
            </div>
          </div>
          {isTinyScrollbar && hasOverflowX && <div data-element="ScrollbarH" />}
        </div>
        {suffix ? <div data-element="Suffix">{suffix}</div> : null}
      </TabsElement>
      {/* Functional panel rendering with content caching */}
      {renderPanel && (
        <CachedPanelRenderer
          parsedTabs={parsedTabs}
          explicitPanels={explicitPanels}
          state={state}
          renderPanel={renderPanel}
          panelCacheKeys={panelCacheKeys}
          prerender={prerender}
          keepMounted={keepMounted}
          visitedKeys={visitedKeysRef.current}
        />
      )}
      {/* Static panel rendering (traditional children-based approach) */}
      {!renderPanel &&
        hasAnyContent &&
        parsedTabs.map((tab) => {
          // Use explicit panel if provided, otherwise use tab's content
          const explicitPanel = explicitPanels.get(tab.key);
          const content = explicitPanel?.content ?? tab.content;

          if (content == null) return null;

          return (
            <TabPanelRenderer
              key={tab.key}
              tabKey={tab.key}
              state={state}
              content={content}
              prerender={prerender}
              keepMounted={keepMounted}
              tabPrerender={explicitPanel?.prerender ?? tab.prerender}
              tabKeepMounted={explicitPanel?.keepMounted ?? tab.keepMounted}
              visitedKeys={visitedKeysRef.current}
              panelStyles={explicitPanel?.styles}
              qa={explicitPanel?.qa}
              qaVal={explicitPanel?.qaVal}
            />
          );
        })}
    </>
  );
}

// =============================================================================
// Exports
// =============================================================================

const _Tabs = forwardRef(TabsComponent);

/**
 * Tabs component for organizing content into multiple panels.
 * Built with React Aria for full accessibility support.
 *
 * **Note:** Tab keys are internally converted to strings for React Aria compatibility.
 * When using `activeKey`, `onChange`, etc., be aware that numeric keys will be
 * converted to their string equivalents.
 *
 * @example
 * // Simple usage
 * <Tabs defaultActiveKey="tab1">
 *   <Tab key="tab1" title="Tab 1">Content 1</Tab>
 *   <Tab key="tab2" title="Tab 2">Content 2</Tab>
 * </Tabs>
 *
 * @example
 * // Tabs-only (no panels)
 * <Tabs activeKey={activeTab} onChange={setActiveTab}>
 *   <Tab key="overview" title="Overview" />
 *   <Tab key="settings" title="Settings" />
 * </Tabs>
 *
 * @example
 * // Explicit panels
 * <Tabs defaultActiveKey="tab1">
 *   <Tabs.List>
 *     <Tab key="tab1" title="Tab 1" />
 *     <Tab key="tab2" title="Tab 2" />
 *   </Tabs.List>
 *   <Tabs.Panel key="tab1">Content 1</Tabs.Panel>
 *   <Tabs.Panel key="tab2">Content 2</Tabs.Panel>
 * </Tabs>
 *
 * @example
 * // Optimized lazy rendering with renderPanel
 * <Tabs
 *   defaultActiveKey="tab1"
 *   renderPanel={(key) => {
 *     switch (key) {
 *       case 'tab1': return <ExpensiveComponent />;
 *       case 'tab2': return <AnotherExpensive />;
 *       default: return null;
 *     }
 *   }}
 * >
 *   <Tab key="tab1" title="Tab 1" />
 *   <Tab key="tab2" title="Tab 2" />
 * </Tabs>
 */
export const Tabs = Object.assign(_Tabs, {
  Tab,
  List: TabList,
  Panel: TabPanel,
});

export { Tab, TabList, TabPanel };
