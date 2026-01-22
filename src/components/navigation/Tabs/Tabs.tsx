import { Key, Node } from '@react-types/shared';
import {
  Children,
  cloneElement,
  FocusEvent,
  ForwardedRef,
  forwardRef,
  isValidElement,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AriaTabListProps,
  AriaTabPanelProps,
  DragItem,
  DroppableCollectionReorderEvent,
  DropTarget,
  ListDropTargetDelegate,
  ListKeyboardDelegate,
  useDraggableCollection,
  useDraggableItem,
  useDropIndicator,
  useDroppableCollection,
  useFocus,
  useFocusRing,
  useFocusVisible,
  useHover,
  useTab,
  useTabList,
  useTabPanel,
  useTextField,
} from 'react-aria';
import {
  Item as CollectionItem,
  DraggableCollectionState,
  DroppableCollectionState,
  TabListState,
  useDraggableCollectionState,
  useDroppableCollectionState,
  useTabListState,
} from 'react-stately';

import { useEvent } from '../../../_internal/hooks';
import { CloseIcon, MoreIcon } from '../../../icons';
import {
  BaseProps,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { chainRaf } from '../../../utils/raf';
import { mergeProps } from '../../../utils/react';
import { CubeItemActionProps, ItemAction } from '../../actions/ItemAction';
import { ItemActionProvider } from '../../actions/ItemActionContext';
import { CubeMenuProps, Menu, MenuTrigger } from '../../actions/Menu';
import { useContextMenu } from '../../actions/use-context-menu';
import { CubeItemProps, Item } from '../../content/Item';
import { useTinyScrollbar } from '../../content/Layout/hooks/useTinyScrollbar';

// =============================================================================
// Types
// =============================================================================

/** Visual appearance type for tabs */
export type TabType = 'default' | 'file' | 'panel' | 'radio';

/**
 * Tab size options.
 * Radio type only supports 'medium' | 'large' (mapped to smaller Item sizes).
 */
export type TabSize = 'xsmall' | 'small' | 'medium' | 'large';

/**
 * Size mapping for radio type tabs.
 * Radio type uses smaller sizes similar to RadioGroup tabs mode.
 */
const RADIO_SIZE_MAP: Record<'medium' | 'large', TabSize> = {
  medium: 'xsmall',
  large: 'medium',
};

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
  /**
   * Tab size. Supports 'xsmall', 'small', 'medium', 'large'.
   * Radio type only supports 'medium' | 'large' (mapped to smaller Item sizes).
   */
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
  /**
   * Tab size. Supports 'xsmall', 'small', 'medium', 'large'.
   * Radio type only supports 'medium' | 'large' (mapped to smaller Item sizes).
   * @default 'medium'
   */
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
  /**
   * Whether tabs are editable by default.
   * Can be overridden per-tab via Tab's isEditable prop.
   * @default false
   */
  isEditable?: boolean;
  /**
   * Default menu items for all tabs.
   * Can be overridden per-tab via Tab's menu prop.
   * Set to `null` on individual Tab to disable menu for that tab.
   */
  menu?: ReactNode;
  /**
   * Default props for the menu trigger button.
   * Can be overridden per-tab via Tab's menuTriggerProps prop.
   * @default { icon: <MoreIcon /> }
   */
  menuTriggerProps?: Partial<CubeItemActionProps>;
  /**
   * Default props passed to the Menu component.
   * Can be overridden per-tab via Tab's menuProps prop.
   */
  menuProps?: Partial<CubeMenuProps<object>>;
  /**
   * Whether to show context menu on right-click for all tabs.
   * Can be overridden per-tab via Tab's contextMenu prop.
   * @default false
   */
  contextMenu?: boolean;
  /**
   * Callback when a menu action is triggered on any tab.
   * Called with the action key and the tab key.
   * Tab-level onAction is called first, then this.
   */
  onAction?: (action: Key, tabKey: Key) => void;
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
  /**
   * Enable drag-and-drop tab reordering.
   * When enabled, tabs can be dragged to reorder them.
   * @default false
   */
  isReorderable?: boolean;
  /**
   * Controlled order of tab keys.
   * When provided, tabs are displayed in this order.
   * Keys not in this array are appended at the end.
   */
  keyOrder?: Key[];
  /**
   * Callback when tabs are reordered via drag-and-drop.
   * Called with the new order of keys after a successful drop.
   */
  onReorder?: (newOrder: Key[]) => void;
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
  /** Actions to render in the tab (e.g., icons, buttons). Rendered before menu trigger if tab has menu. */
  actions?: ReactNode;
  /** Whether the tab title can be edited. Overrides the Tabs-level isEditable default. */
  isEditable?: boolean;
  /** Callback when this tab's title is changed. Overrides parent's onTitleChange. */
  onTitleChange?: (newTitle: string) => void;
  /**
   * Menu items to display in a dropdown menu on the tab.
   * Pass Menu.Item elements directly - they will be wrapped in a Menu internally.
   * Overrides the Tabs-level menu default. Set to `null` to disable menu.
   *
   * Predefined action keys (handled automatically before onAction is called):
   * - key="rename" - Enters inline title editing mode (requires isEditable)
   * - key="delete" - Deletes the tab (requires onDelete set on Tabs)
   *
   * Predefined actions support auto-labels: if no children provided, default
   * label is used (e.g., "Rename", "Delete").
   */
  menu?: ReactNode | null;
  /**
   * Props to customize the menu trigger button.
   * Overrides the Tabs-level menuTriggerProps default.
   * @default { icon: <MoreIcon /> }
   */
  menuTriggerProps?: Partial<CubeItemActionProps>;
  /**
   * Props passed to the Menu component.
   * Overrides the Tabs-level menuProps default.
   */
  menuProps?: Partial<CubeMenuProps<object>>;
  /**
   * Whether to show context menu on right-click.
   * Uses the same menu items as `menu` prop.
   * @default false
   */
  contextMenu?: boolean;
  /**
   * Callback when a menu action is triggered.
   * Called with the action key from Menu.Item.
   *
   * Note: Predefined actions ("rename", "delete") are handled automatically
   * before this callback is invoked. Then Tabs-level onAction is called.
   */
  onAction?: (action: Key) => void;
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

// =============================================================================
// Event handlers for actions to prevent event propagation to tab button
// =============================================================================

const ACTIONS_EVENT_HANDLERS = {
  onClick: (e: MouseEvent) => e.stopPropagation(),
  onPointerDown: (e: PointerEvent) => e.stopPropagation(),
  onPointerUp: (e: PointerEvent) => e.stopPropagation(),
  onMouseDown: (e: MouseEvent) => e.stopPropagation(),
  onMouseUp: (e: MouseEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
    }
  },
};

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
      'type=default & (hovered & !selected)': '#purple-text',
      'type=default & selected': '#purple-text',
    },
    fill: {
      '': '#clear',
      'type=file | type=panel': '#light',
      '(type=file | type=panel) & hovered': '#light.5',
      'type=radio & hovered': '#white.5',
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
      'focused & focus-visible': 'inset 0 0 0 1bw #purple-text',
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
    cursor: {
      '': 'default',
      draggable: 'grab',
      dragging: 'grabbing',
    },

    // Size variable for actions (same as ItemButton's ActionsWrapper)
    $size: {
      '': '$size-md',
      'size=xsmall': '$size-xs',
      'size=small': '$size-sm',
      'size=medium': '$size-md',
      'size=large': '$size-lg',
      'size=xlarge': '$size-xl',
    },

    // Actions rendered outside the button for accessibility
    Actions: {
      $: '>',
      position: 'absolute',
      inset: '1bw 1bw auto auto',
      display: 'flex',
      gap: '1bw',
      placeItems: 'center',
      placeContent: 'center end',
      pointerEvents: 'auto',
      height: 'min ($size - 2bw)',
      padding: '0 $side-padding',
      // Simple CSS opacity for show-on-hover
      opacity: {
        '': 1,
        'show-actions-on-hover': 0,
        'show-actions-on-hover & (active | :hover | :focus-within)': 1,
      },
      transition: 'opacity $transition',
      // Size variables (same as Item)
      '$action-size': 'min(max((2x + 2bw), ($size - 1x - 2bw)), (4x - 2bw))',
      '$side-padding': '(($size - $action-size - 2bw) / 2)',
    },
  },
});

const DropIndicatorElement = tasty({
  styles: {
    zIndex: 10,
    position: 'absolute',
    pointerEvents: 'none',
    opacity: {
      '': 0,
      'drop-target': 1,
    },
    fill: '#purple',
    width: '.5x',
    top: 0,
    bottom: 0,
    left: {
      '': 'auto',
      before: '-2px',
    },
    right: {
      '': 'auto',
      after: '-2px',
    },
  },
});

// =============================================================================
// DropIndicator Component (visual indicator for drag-and-drop)
// =============================================================================

interface TabDropIndicatorProps {
  target: DropTarget;
  dropState: DroppableCollectionState;
  position: 'before' | 'after';
}

function TabDropIndicator({
  target,
  dropState,
  position,
}: TabDropIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { dropIndicatorProps, isHidden, isDropTarget } = useDropIndicator(
    { target },
    dropState,
    ref,
  );

  if (isHidden) {
    return null;
  }

  return (
    <DropIndicatorElement
      ref={ref}
      role="option"
      {...dropIndicatorProps}
      mods={{
        'drop-target': isDropTarget,
        after: position === 'after',
        before: position === 'before',
      }}
    />
  );
}

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

/**
 * Internal representation of a parsed Tab.
 * Uses `content` instead of `children` to distinguish from the Tab component's
 * children prop and to clarify that this is panel content, not React children.
 */
interface ParsedTab extends Omit<CubeTabProps, 'id' | 'children'> {
  /** Tab key (always a string internally for React Aria compatibility) */
  key: string;
  /** Panel content extracted from Tab's children prop */
  content: ReactNode;
}

/**
 * Internal representation of a parsed TabPanel.
 * Uses `content` instead of `children` for consistency with ParsedTab.
 */
interface ParsedPanel extends Omit<CubeTabPanelProps, 'id' | 'children'> {
  /** Panel key (always a string internally for React Aria compatibility) */
  key: string;
  /** Panel content extracted from TabPanel's children prop */
  content: ReactNode;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generic helper to check if a child is a specific component by displayName.
 */
function isComponentElement<T>(
  child: ReactNode,
  displayName: string,
): child is ReactElement<T> {
  return (
    isValidElement(child) &&
    typeof child.type === 'function' &&
    (child.type as any).displayName === displayName
  );
}

/** Checks if a child is a Tab component. */
const isTabElement = (child: ReactNode): child is ReactElement<CubeTabProps> =>
  isComponentElement<CubeTabProps>(child, 'CubeTab');

/** Checks if a child is a TabPanel component. */
const isTabPanelElement = (
  child: ReactNode,
): child is ReactElement<CubeTabPanelProps> =>
  isComponentElement<CubeTabPanelProps>(child, 'CubeTabPanel');

/** Checks if a child is a TabList component. */
const isTabListElement = (
  child: ReactNode,
): child is ReactElement<CubeTabListProps> =>
  isComponentElement<CubeTabListProps>(child, 'CubeTabList');

/**
 * Extracts the raw key from a React element, stripping the ".$" prefix
 * that React adds via Children.map/toArray.
 *
 * Note: All keys are converted to strings for React Aria compatibility.
 * This means numeric keys like `key={1}` become `"1"`.
 *
 * @returns The key as a string, or null if no key is present
 */
function getRawKey(element: ReactElement): string | null {
  if (element.key == null) return null;
  const keyStr = String(element.key);
  // React prefixes keys with ".$" in Children.map/toArray
  return keyStr.startsWith('.$') ? keyStr.slice(2) : keyStr;
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
  /** Parent-level isEditable default */
  parentIsEditable?: boolean;
  /** Parent-level menu default */
  parentMenu?: ReactNode;
  /** Parent-level menuTriggerProps default */
  parentMenuTriggerProps?: Partial<CubeItemActionProps>;
  /** Parent-level menuProps default */
  parentMenuProps?: Partial<CubeMenuProps<object>>;
  /** Parent-level contextMenu default */
  parentContextMenu?: boolean;
  /** Parent-level onAction callback */
  parentOnAction?: (action: Key, tabKey: Key) => void;
  /** Drag state for reorderable tabs */
  dragState?: DraggableCollectionState;
  /** Drop state for reorderable tabs */
  dropState?: DroppableCollectionState;
  /** Whether this is the last tab (for drop indicator) */
  isLastTab?: boolean;
}

/**
 * Process menu items for predefined action keys (rename, delete).
 * Auto-adds labels and disables items when requirements aren't met.
 */
interface MenuItemLikeProps {
  children?: ReactNode;
  isDisabled?: boolean;
  theme?: string;
}

function processMenuItems(
  children: ReactNode,
  effectiveIsEditable: boolean,
  isDeletable: boolean,
): ReactNode {
  // Use Children.toArray to avoid key prefixing that Children.map does
  return Children.toArray(children).map((child) => {
    if (!isValidElement(child)) return child;

    const childKey = getRawKey(child);
    const childProps = child.props as MenuItemLikeProps;

    // Handle predefined action keys
    if (childKey === 'rename') {
      return cloneElement(child as ReactElement<MenuItemLikeProps>, {
        children: childProps.children ?? 'Rename',
        isDisabled: childProps.isDisabled ?? !effectiveIsEditable,
      });
    }
    if (childKey === 'delete') {
      return cloneElement(child as ReactElement<MenuItemLikeProps>, {
        children: childProps.children ?? 'Delete',
        theme: childProps.theme ?? 'danger',
        isDisabled: childProps.isDisabled ?? !isDeletable,
      });
    }

    // Recursively process Menu.Section children
    if (childProps.children && typeof childProps.children !== 'string') {
      return cloneElement(child as ReactElement<MenuItemLikeProps>, {
        children: processMenuItems(
          childProps.children,
          effectiveIsEditable,
          isDeletable,
        ),
      });
    }

    return child;
  });
}

/**
 * Check if menu children is empty (null, undefined, or empty fragment)
 */
function isMenuEmpty(menu: ReactNode): boolean {
  if (menu === null || menu === undefined) return true;

  const children = Children.toArray(menu);

  return children.length === 0;
}

function TabButton({
  item,
  state,
  tabData,
  type,
  size,
  onDelete,
  showActionsOnHover: parentShowActionsOnHover,
  parentIsEditable,
  parentMenu,
  parentMenuTriggerProps,
  parentMenuProps,
  parentContextMenu,
  parentOnAction,
  isEditing = false,
  editValue = '',
  onEditValueChange,
  onStartEditing,
  onSubmitEditing,
  onCancelEditing,
  dragState,
  dropState,
  isLastTab,
}: TabButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { tabProps } = useTab({ key: item.key }, state, ref);

  // Measure actions width for proper space allocation in Item
  const [actionsWidth, setActionsWidth] = useState(0);

  // Drag-and-drop support - only enable when both states are provided
  const isDraggable = !!dragState && !!dropState;

  // useDraggableItem must be called unconditionally (Rules of Hooks)
  // When dragState is undefined, we pass a minimal mock state to satisfy the hook
  const mockDragState = {
    collection: state.collection,
    selectionManager: state.selectionManager,
    isDragging: () => false,
    getKeysForDrag: () => new Set<Key>(),
    isDisabled: false,
    startDrag: () => {},
    endDrag: () => {},
  } as DraggableCollectionState;

  const dragResult = useDraggableItem(
    { key: item.key },
    dragState ?? mockDragState,
  );
  const effectiveDragProps = isDraggable ? dragResult.dragProps : {};
  const isDragging = isDraggable && dragResult.isDragging;

  // Controlled state for menu trigger (enables keyboard opening with Shift+F10)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hover, focus, and focus-visible state handling
  const { hoverProps, isHovered } = useHover({});
  const [isFocused, setIsFocused] = useState(false);
  const { focusProps } = useFocus({ onFocusChange: setIsFocused });
  const { isFocusVisible } = useFocusVisible();

  // Suppress focus-visible when restoring focus after editing
  const [suppressFocusVisible, setSuppressFocusVisible] = useState(false);
  const effectiveFocusVisible = isFocusVisible && !suppressFocusVisible;

  const isActive = state.selectedKey === item.key;
  const isDisabled = state.disabledKeys.has(item.key);
  const isDeletable = !!onDelete;

  // Compute effective values - Tab-level overrides Tabs-level
  const effectiveIsEditable = tabData.isEditable ?? parentIsEditable ?? false;
  const effectiveMenu =
    tabData.menu === null ? null : tabData.menu ?? parentMenu;
  const effectiveMenuTriggerProps = {
    ...parentMenuTriggerProps,
    ...tabData.menuTriggerProps,
  };
  const effectiveMenuProps = { ...parentMenuProps, ...tabData.menuProps };
  const effectiveContextMenu =
    tabData.contextMenu ?? parentContextMenu ?? false;
  const effectiveType = tabData.type ?? type ?? 'default';

  // Delete button shown only if onDelete is set AND no menu
  const showDeleteButton = isDeletable && isMenuEmpty(effectiveMenu);

  // Process menu items for auto-labels and disabled states (computed early for use in handlers)
  const processedMenu =
    effectiveMenu && !isMenuEmpty(effectiveMenu)
      ? processMenuItems(effectiveMenu, effectiveIsEditable, isDeletable)
      : null;

  const handleDelete = useEvent(() => {
    onDelete?.(item.key);
  });

  const handleStartEditing = useEvent(() => {
    if (!effectiveIsEditable || isDisabled) return;

    const titleText =
      typeof tabData.title === 'string' ? tabData.title : String(item.key);

    onStartEditing?.(item.key, titleText);
  });

  const handleSubmitEditing = useEvent(() => {
    onSubmitEditing?.(item.key, editValue, tabData.onTitleChange);
    // Suppress focus-visible and restore focus to the tab button after editing
    setSuppressFocusVisible(true);
    requestAnimationFrame(() => {
      ref.current?.focus();
    });
  });

  const handleCancelEditing = useEvent(() => {
    onCancelEditing?.();
    // Suppress focus-visible and restore focus to the tab button after editing
    setSuppressFocusVisible(true);
    requestAnimationFrame(() => {
      ref.current?.focus();
    });
  });

  const handleEditValueChange = useEvent((value: string) => {
    onEditValueChange?.(value);
  });

  // Handle menu actions - predefined actions first, then callbacks
  const handleMenuAction = useEvent((action: Key) => {
    // Strip the ".$" prefix that React adds via Children.toArray/map
    const actionStr = String(action);
    const normalizedAction = actionStr.startsWith('.$')
      ? actionStr.slice(2)
      : actionStr;

    // Handle predefined actions first (only if requirements are met)
    if (normalizedAction === 'rename' && effectiveIsEditable) {
      handleStartEditing();
    }
    if (normalizedAction === 'delete' && isDeletable) {
      onDelete?.(item.key);
    }
    // Call Tab-level onAction first (with normalized action)
    tabData.onAction?.(normalizedAction);
    // Then call Tabs-level onAction with tab key (with normalized action)
    parentOnAction?.(normalizedAction, item.key);
  });

  // Keyboard handler for accessibility shortcuts (WAI-ARIA Tabs Pattern)
  // - Shift+F10: Opens context menu (standard desktop convention)
  // - Delete: Deletes the tab (optional per ARIA spec)
  const handleKeyDown = useEvent((e: KeyboardEvent) => {
    // Reset focus-visible suppression on any keyboard interaction
    if (suppressFocusVisible) {
      setSuppressFocusVisible(false);
    }

    // Shift+F10 opens the menu (standard context menu shortcut)
    if (e.key === 'F10' && e.shiftKey && processedMenu) {
      e.preventDefault();
      e.stopPropagation();
      setIsMenuOpen(true);
    }

    // Delete key for direct tab deletion (ARIA Tabs pattern optional feature)
    if (e.key === 'Delete' && isDeletable) {
      e.preventDefault();
      onDelete?.(item.key);
    }
  });

  const mods = useMemo(
    () => ({
      type: effectiveType,
      active: isActive,
      deletable: isDeletable,
      disabled: isDisabled,
      editing: isEditing,
      hovered: isHovered,
      focused: isFocused,
      'focus-visible': effectiveFocusVisible,
      draggable: isDraggable,
      dragging: isDragging,
    }),
    [
      effectiveType,
      isActive,
      isDeletable,
      isDisabled,
      isEditing,
      isHovered,
      isFocused,
      effectiveFocusVisible,
      isDraggable,
      isDragging,
    ],
  );

  // Scroll active tab into view
  useEffect(() => {
    if (ref.current && isActive) {
      ref.current.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }, [isActive]);

  // Build menu element - onAction AFTER spread so it's not overridden
  const menuElement = processedMenu ? (
    <Menu {...effectiveMenuProps} onAction={handleMenuAction}>
      {processedMenu}
    </Menu>
  ) : null;

  // Use the useContextMenu hook for context menu handling
  const contextMenu = useContextMenu<HTMLDivElement, CubeMenuProps<object>>(
    Menu,
    { placement: 'bottom start' },
    {
      ...effectiveMenuProps,
      onAction: handleMenuAction,
      children: processedMenu,
    },
  );

  // Build menu trigger action with controlled state for keyboard accessibility
  const menuAction = menuElement ? (
    <MenuTrigger isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <ItemAction
        tabIndex={-1}
        icon={<MoreIcon />}
        {...effectiveMenuTriggerProps}
      />
      {menuElement}
    </MenuTrigger>
  ) : null;

  // Build delete button (only shown when no menu)
  const deleteAction = showDeleteButton ? (
    <ItemAction
      tabIndex={-1}
      icon={<CloseIcon />}
      tooltip="Delete tab"
      onPress={handleDelete}
    />
  ) : null;

  // Order: custom actions → menu trigger → delete button
  const actions =
    tabData.actions || menuAction || deleteAction ? (
      <>
        {tabData.actions}
        {menuAction}
        {deleteAction}
      </>
    ) : undefined;

  // Measure actions width to pass to Item for proper space allocation
  useLayoutEffect(() => {
    if (actions && actionsRef.current) {
      const width = Math.round(actionsRef.current.offsetWidth);

      if (width !== actionsWidth) {
        setActionsWidth(width);
      }
    }
  }, [actions, actionsWidth]);

  // Determine effective size
  // Radio type only supports medium/large and maps to smaller Item sizes
  const effectiveSize = tabData.size ?? size ?? 'medium';
  const itemSize =
    effectiveType === 'radio'
      ? RADIO_SIZE_MAP[effectiveSize === 'large' ? 'large' : 'medium']
      : effectiveSize;

  // Determine Item type prop
  const itemType =
    effectiveType === 'default' ? (isActive ? 'clear' : 'neutral') : 'neutral';

  // Determine shape - file/panel types use sharp edges
  const isFileOrPanelType =
    effectiveType === 'file' || effectiveType === 'panel';
  const itemShape = isFileOrPanelType ? 'sharp' : undefined;

  // Determine showActionsOnHover - tab-level overrides parent-level
  const effectiveShowActionsOnHover =
    tabData.showActionsOnHover ?? parentShowActionsOnHover;

  // Render title with editing support if editable
  const titleContent = effectiveIsEditable ? (
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
    menu: _menu,
    menuTriggerProps: _menuTriggerProps,
    menuProps: _menuProps,
    contextMenu: _contextMenu,
    onAction: _onAction,
    qa,
    qaVal,
    styles,
    ...itemStyleProps
  } = tabData;

  // Use the hook's targetRef when context menu is enabled, otherwise use local containerRef
  const effectiveContainerRef =
    effectiveContextMenu && processedMenu
      ? contextMenu.targetRef
      : containerRef;

  // ARIA: indicate popup menu presence (WAI-ARIA Tabs pattern)
  const ariaProps = processedMenu ? { 'aria-haspopup': 'menu' as const } : {};

  // Mods for TabContainer (includes show-actions-on-hover for CSS targeting)
  const containerMods = {
    ...mods,
    'show-actions-on-hover': effectiveShowActionsOnHover,
  };

  return (
    <TabContainer
      ref={effectiveContainerRef}
      data-size={itemSize}
      mods={containerMods}
      tokens={{ '$actions-width': `${actionsWidth}px` }}
      {...effectiveDragProps}
    >
      {/* Drop indicator before this tab */}
      {isDraggable && dropState && (
        <TabDropIndicator
          target={{ type: 'item', key: item.key, dropPosition: 'before' }}
          dropState={dropState}
          position="before"
        />
      )}
      <TabElement
        preserveActionsSpace
        showActionsOnHover={effectiveShowActionsOnHover}
        as="button"
        {...mergeProps(tabProps, hoverProps, focusProps, {
          onKeyDown: handleKeyDown,
        })}
        {...ariaProps}
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
        actions={actions ? true : undefined}
      >
        {titleContent}
      </TabElement>
      {/* Actions rendered outside the button for accessibility (no nested interactive elements) */}
      {actions && (
        <div
          ref={actionsRef}
          data-element="Actions"
          {...ACTIONS_EVENT_HANDLERS}
        >
          <ItemActionProvider
            type={itemType}
            theme="default"
            isDisabled={isDisabled}
          >
            {actions}
          </ItemActionProvider>
        </div>
      )}
      {effectiveContextMenu && processedMenu && contextMenu.rendered}
      {/* Drop indicator after the last tab */}
      {isDraggable && dropState && isLastTab && (
        <TabDropIndicator
          target={{ type: 'item', key: item.key, dropPosition: 'after' }}
          dropState={dropState}
          position="after"
        />
      )}
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
 * Renders panels with content caching for `renderPanel`.
 *
 * Core principle: `renderPanel` is only called when the tab is active
 * (or once on mount for `prerender`). Inactive panels use cached content.
 *
 * Caching behavior:
 * - `keepMounted=true`: Cache content after first activation, reuse while inactive
 * - `prerender=true`: Call `renderPanel` once on mount, reuse until active again
 * - `panelCacheKeys`: Adds cache-key-based invalidation (lazy - only when active)
 * - No caching props: Only active panel is rendered, unmount when inactive
 *
 * Cache invalidation is lazy: changing a cache key for an inactive panel
 * does NOT trigger `renderPanel` - it only re-executes when the tab becomes active.
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

  /** Get the cache key for a panel. Returns undefined if not defined. */
  const getCacheKey = (key: string): CacheKeyValue => panelCacheKeys?.[key];

  /** Check if a panel has a defined (non-undefined) cache key. */
  const hasCacheKey = (key: string): boolean =>
    panelCacheKeys != null &&
    key in panelCacheKeys &&
    panelCacheKeys[key] !== undefined;

  /**
   * Determine if we should call renderPanel for this tab.
   *
   * Rules:
   * 1. No cache exists + panel is visible → call renderPanel (first render/visit)
   * 2. Active + panelCacheKeys entry + cache key matches → use cache
   * 3. Active + panelCacheKeys entry + cache key changed → call renderPanel
   * 4. Active + no panelCacheKeys entry → always call renderPanel (no content caching)
   * 5. Inactive + cache exists → use cache, don't call renderPanel
   *
   * Key insight: panelCacheKeys enables content caching.
   * keepMounted/prerender only control DOM mounting, not content caching.
   * But we always need to populate cache on first render when panel becomes visible.
   */
  const shouldCallRenderPanel = (
    tabKey: string,
    isActive: boolean,
  ): boolean => {
    const cached = contentCacheRef.current.get(tabKey);

    // No cache exists - always need to populate on first render
    // (This function is only called for visible panels, so we always render)
    if (!cached) {
      return true;
    }

    // Cache exists
    if (isActive) {
      // If panelCacheKeys has an entry for this panel, use cache-key-based invalidation
      if (hasCacheKey(tabKey)) {
        const currentCacheKey = getCacheKey(tabKey);
        // Cache is valid if key matches
        return cached.cacheKey !== currentCacheKey;
      }

      // No panelCacheKeys entry = always re-render when active (no content caching)
      return true;
    }

    // Inactive with cache - use cache, don't re-render
    return false;
  };

  // Clean up cache entries for removed tabs
  const currentTabKeys = useMemo(
    () => new Set(parsedTabs.map((t) => t.key)),
    [parsedTabs],
  );

  // Clean up stale cache entries when tabs are removed
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

        // Determine if panel should be in DOM (visibility)
        if (
          !shouldRenderPanel(
            isActive,
            wasVisited,
            effectivePrerender,
            effectiveKeepMounted,
          )
        ) {
          // Panel not in DOM - clear cache if no caching strategy
          if (!effectiveKeepMounted && !effectivePrerender) {
            contentCacheRef.current.delete(tab.key);
          }
          return null;
        }

        // Determine if we need to call renderPanel
        let content: ReactNode;
        const needsRender = shouldCallRenderPanel(tab.key, isActive);

        if (needsRender) {
          // Call renderPanel and cache the result
          content = renderPanel(tab.key);
          const currentCacheKey = getCacheKey(tab.key);
          contentCacheRef.current.set(tab.key, {
            content,
            cacheKey: currentCacheKey,
          });
        } else {
          // Use cached content
          const cached = contentCacheRef.current.get(tab.key);
          content = cached?.content ?? null;
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

function TabsComponent(
  props: CubeTabsProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
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
    isEditable: parentIsEditable,
    menu: parentMenu,
    menuTriggerProps: parentMenuTriggerProps,
    menuProps: parentMenuProps,
    contextMenu: parentContextMenu,
    onAction: parentOnAction,
    children,
    prefix,
    suffix,
    prerender = false,
    keepMounted = false,
    qa = 'Tabs',
    renderPanel,
    panelCacheKeys,
    isReorderable = false,
    keyOrder,
    onReorder,
    ...otherProps
  } = props;

  // Extract outer styles (width, height, margin, etc.) and styles prop from props
  const combinedStyles = extractStyles(otherProps, OUTER_STYLES);

  // DOM element refs
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
          const { id: _id, children: tabContent, ...tabProps } = child.props;

          tabs.push({
            ...tabProps,
            key,
            content: tabContent,
          });

          if (tabContent != null) {
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

  // Order tabs according to keyOrder if provided (used for both collection and rendering)
  const orderedParsedTabs = useMemo(() => {
    if (!keyOrder || keyOrder.length === 0) {
      return parsedTabs;
    }

    // Create a map for quick lookup
    const tabMap = new Map<string, ParsedTab>();

    for (const tab of parsedTabs) {
      tabMap.set(tab.key, tab);
    }

    // Build ordered array based on keyOrder
    const ordered: ParsedTab[] = [];

    for (const key of keyOrder) {
      const tab = tabMap.get(String(key));

      if (tab) {
        ordered.push(tab);
        tabMap.delete(String(key));
      }
    }

    // Append any tabs not in keyOrder (in their original order)
    for (const tab of parsedTabs) {
      if (tabMap.has(tab.key)) {
        ordered.push(tab);
      }
    }

    return ordered;
  }, [parsedTabs, keyOrder]);

  // Create collection items for React Stately (in the ordered order)
  const collectionItems = useMemo(() => {
    return orderedParsedTabs.map((tab) => (
      <CollectionItem
        key={tab.key}
        textValue={typeof tab.title === 'string' ? tab.title : String(tab.key)}
      >
        {tab.title}
      </CollectionItem>
    ));
  }, [orderedParsedTabs]);

  // Create a lookup map for tab data
  const tabDataMap = useMemo(() => {
    const map = new Map<string, ParsedTab>();

    for (const tab of parsedTabs) {
      map.set(tab.key, tab);
    }

    return map;
  }, [parsedTabs]);

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

  // Convert keys to strings for React Aria compatibility
  // (all internal tab keys are strings via getRawKey)
  const selectedKey = activeKey != null ? String(activeKey) : undefined;
  const defaultSelectedKey =
    defaultActiveKey != null ? String(defaultActiveKey) : undefined;

  // Create aria props for useTabListState
  const ariaProps: AriaTabListProps<object> = useMemo(
    () => ({
      selectedKey,
      defaultSelectedKey,
      onSelectionChange: handleSelectionChange,
      disabledKeys,
      children: collectionItems,
      'aria-label': label,
    }),
    [
      selectedKey,
      defaultSelectedKey,
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

  // ==========================================================================
  // Drag-and-Drop State (only when isReorderable is true)
  // ==========================================================================

  // Handle reorder event from drag-and-drop
  const handleReorder = useEvent((e: DroppableCollectionReorderEvent) => {
    if (!onReorder) return;

    const currentKeys = orderedParsedTabs.map((t) => t.key);
    const { target, keys: movableKeys } = e;
    const { dropPosition, key: targetKey } = target;
    const movableKey = [...movableKeys][0] as string;

    const movableIndex = currentKeys.indexOf(movableKey);
    const targetIndex = currentKeys.indexOf(String(targetKey));

    if (movableIndex === -1 || targetIndex === -1) return;

    // Reorder keys
    const newKeys =
      movableIndex !== targetIndex
        ? currentKeys.reduce((arr, key, i) => {
            // Skip the key we are moving
            if (i === movableIndex) {
              return arr;
            }

            // Insert the movable key at the target position
            if (i === targetIndex) {
              if (dropPosition === 'before') {
                arr.push(movableKey);
                arr.push(key);
              } else if (dropPosition === 'after') {
                arr.push(key);
                arr.push(movableKey);
              } else {
                arr.push(key);
              }
            } else {
              arr.push(key);
            }

            return arr;
          }, [] as string[])
        : currentKeys;

    onReorder(newKeys);
  });

  // Get items for draggable collection
  const getItems = useCallback(
    (keys: Set<Key>): DragItem[] => {
      return [...keys].map((key) => {
        const item = state.collection.getItem(key);

        return {
          'text/plain': item?.textValue || String(key),
        };
      });
    },
    [state.collection],
  );

  // Setup drag state for the collection
  const dragState = useDraggableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    getItems,
    getAllowedDropOperations: () => ['move'],
  });

  // Actually enable the draggable collection hook only when isReorderable
  useDraggableCollection(
    isReorderable
      ? {
          getItems,
          getAllowedDropOperations: () => ['move'],
        }
      : { getItems: () => [], getAllowedDropOperations: () => [] },
    dragState,
    listRef,
  );

  // Setup drop state for the collection
  const dropState = useDroppableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    onReorder: handleReorder,
  });

  const { collectionProps } = useDroppableCollection(
    isReorderable
      ? {
          keyboardDelegate: new ListKeyboardDelegate(
            state.collection,
            state.disabledKeys,
            listRef,
          ),
          dropTargetDelegate: new ListDropTargetDelegate(
            state.collection,
            listRef,
            { orientation: 'horizontal' },
          ),
          onReorder: handleReorder,
        }
      : {
          keyboardDelegate: undefined as any,
          dropTargetDelegate: undefined as any,
        },
    dropState,
    listRef,
  );

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
        ref={ref}
        qa={qa}
        mods={mods}
        styles={combinedStyles}
        style={handleHStyle}
        data-size={size}
      >
        {prefix ? <div data-element="Prefix">{prefix}</div> : null}
        <div data-element="ScrollWrapper">
          <div ref={scrollRef} data-element="Scroll">
            <div
              {...mergeProps(
                tabListProps,
                isReorderable ? collectionProps : {},
              )}
              ref={listRef}
              data-element="Container"
            >
              {/* Render tabs in order (respecting keyOrder if provided) */}
              {orderedParsedTabs.map((tab, index) => {
                const item = state.collection.getItem(tab.key);

                if (!item) return null;

                const isItemEditing = editingKey === item.key;
                const isLastTab = index === orderedParsedTabs.length - 1;

                return (
                  <TabButton
                    key={item.key}
                    item={item}
                    state={state}
                    tabData={tab}
                    type={type}
                    size={size}
                    showActionsOnHover={showActionsOnHover}
                    parentIsEditable={parentIsEditable}
                    parentMenu={parentMenu}
                    parentMenuTriggerProps={parentMenuTriggerProps}
                    parentMenuProps={parentMenuProps}
                    parentContextMenu={parentContextMenu}
                    parentOnAction={parentOnAction}
                    isEditing={isItemEditing}
                    editValue={isItemEditing ? editValue : ''}
                    dragState={isReorderable ? dragState : undefined}
                    dropState={isReorderable ? dropState : undefined}
                    isLastTab={isLastTab}
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
