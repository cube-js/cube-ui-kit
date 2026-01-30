import type { ReactNode } from 'react';
import type { BaseProps, OuterStyleProps, Styles } from '../../../tasty';
import type { CubeItemActionProps } from '../../actions/ItemAction';
import type { CubeMenuProps } from '../../actions/Menu';
import type { CubeItemProps } from '../../content/Item';

// =============================================================================
// Core Types
// =============================================================================

/** Visual appearance type for tabs */
export type TabType = 'default' | 'narrow' | 'file' | 'radio';

/** Position for TabPicker and scroll arrows */
export type TabsActionPosition = 'prefix' | 'suffix';

/**
 * Tab size options.
 * Radio type only supports 'medium' | 'large' (mapped to smaller Item sizes).
 */
export type TabSize = 'xsmall' | 'small' | 'medium' | 'large';

/**
 * Size mapping for radio type tabs.
 * Radio type uses smaller sizes similar to RadioGroup tabs mode.
 */
export const RADIO_SIZE_MAP: Record<'medium' | 'large', TabSize> = {
  medium: 'xsmall',
  large: 'medium',
};

// =============================================================================
// Shared Props Interfaces
// =============================================================================

/** Common props for panel rendering behavior */
export interface PanelBehaviorProps {
  /** If true, panel is rendered but hidden when not active. */
  prerender?: boolean;
  /** If true, once visited the panel stays in DOM. */
  keepMounted?: boolean;
}

/** Common props for QA attributes */
export interface QAProps {
  /** QA selector attribute. */
  qa?: string;
  /** Additional QA value attribute. */
  qaVal?: string;
}

// =============================================================================
// Tab Style Props
// =============================================================================

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
export interface TabStyleProps extends Omit<CubeItemProps, OmittedItemProps> {
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

// =============================================================================
// Component Props
// =============================================================================

/** Cache key type - primitives only for reliable comparison */
export type CacheKeyValue = string | number | boolean | null | undefined;

export interface CubeTabsProps
  extends BaseProps,
    OuterStyleProps,
    PanelBehaviorProps {
  /** Controlled active tab key. When provided, component is controlled. */
  activeKey?: string;
  /** Initial active tab key for uncontrolled mode. */
  defaultActiveKey?: string;
  /**
   * Visual appearance type for tabs.
   * - `default` - Standard tabs with selection indicator below (default)
   * - `narrow` - Same as default but with collapsed vertical padding on labels
   * - `file` - File-style tabs with border bottom highlight on selection, delimiter between tabs
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
  onChange?: (key: string) => void;
  /** Callback when tab delete button is clicked. Presence enables delete buttons. */
  onDelete?: (key: string) => void;
  /** Callback when a tab title is changed. Enables title editing on tabs with isEditable. */
  onTitleChange?: (key: string, newTitle: string) => void;
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
  onAction?: (action: string, tabKey: string) => void;
  /** Custom tasty styles for the tab bar container. */
  styles?: Styles;
  /** QA selector attribute. */
  qa?: string;
  /** Tab components or Tabs.List with Tabs.Panel. */
  children?: ReactNode;
  /**
   * Functional content renderer for optimized lazy evaluation.
   * When provided, panel content is only evaluated for the active tab,
   * while inactive tabs use cached content.
   */
  renderPanel?: (key: string) => ReactNode;
  /**
   * Cache keys for individual panels. Enables caching for specified panels.
   */
  panelCacheKeys?: Record<string | number, CacheKeyValue>;
  /**
   * Enable drag-and-drop tab reordering.
   * @default false
   */
  isReorderable?: boolean;
  /**
   * Controlled order of tab keys.
   * When provided, tabs are displayed in this order.
   */
  keyOrder?: string[];
  /**
   * Callback when tabs are reordered via drag-and-drop.
   */
  onReorder?: (newOrder: string[]) => void;
  /**
   * Whether to show a tab picker dropdown in the suffix area.
   * - `true` - always show the tab picker
   * - `false` - never show the tab picker (default)
   * - `'auto'` - show only when tabs overflow (has horizontal scroll)
   * @default false
   */
  showTabPicker?: boolean | 'auto';
  /**
   * Whether to show scroll arrow buttons in the suffix area.
   * - `true` - always show scroll arrows
   * - `false` - never show scroll arrows (default)
   * - `'auto'` - show only when tabs overflow (has horizontal scroll)
   * @default false
   */
  showScrollArrows?: boolean | 'auto';
  /**
   * Position of the tab picker dropdown.
   * - `'prefix'` - render in the prefix slot (before tab list)
   * - `'suffix'` - render in the suffix slot (after tab list)
   * @default 'suffix'
   */
  tabPickerPosition?: TabsActionPosition;
  /**
   * Position of the scroll arrow buttons.
   * - `'prefix'` - render in the prefix slot (before tab list)
   * - `'suffix'` - render in the suffix slot (after tab list)
   * @default 'suffix'
   */
  scrollArrowsPosition?: TabsActionPosition;
}

export interface CubeTabProps extends TabStyleProps, PanelBehaviorProps {
  /**
   * Unique identifier for the tab.
   * Auto-injected from the React `key` prop (converted to string).
   */
  id?: string;
  /** Content displayed in the tab button. */
  title: ReactNode;
  /** Panel content rendered when tab is active. */
  children?: ReactNode;
  /** Disables the tab (cannot be selected). */
  isDisabled?: boolean;
  /** Actions to render in the tab. Rendered before menu trigger if tab has menu. */
  actions?: ReactNode;
  /** Whether the tab title can be edited. Overrides the Tabs-level isEditable default. */
  isEditable?: boolean;
  /** Callback when this tab's title is changed. Overrides parent's onTitleChange. */
  onTitleChange?: (newTitle: string) => void;
  /**
   * Menu items to display in a dropdown menu on the tab.
   * Pass Menu.Item elements directly - they will be wrapped in a Menu internally.
   * Overrides the Tabs-level menu default. Set to `null` to disable menu.
   */
  menu?: ReactNode | null;
  /**
   * Props to customize the menu trigger button.
   * Overrides the Tabs-level menuTriggerProps default.
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
   */
  onAction?: (action: string) => void;
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
// Internal Types
// =============================================================================

/**
 * Internal representation of a parsed Tab.
 * Uses `content` instead of `children` to distinguish panel content.
 */
export interface ParsedTab extends Omit<CubeTabProps, 'id' | 'children'> {
  /** Tab key (always a string internally for React Aria compatibility) */
  key: string;
  /** Panel content extracted from Tab's children prop */
  content: ReactNode;
}

/**
 * Internal representation of a parsed TabPanel.
 */
export interface ParsedPanel
  extends Omit<CubeTabPanelProps, 'id' | 'children'> {
  /** Panel key (always a string internally for React Aria compatibility) */
  key: string;
  /** Panel content extracted from TabPanel's children prop */
  content: ReactNode;
}
