import type { Key } from '@react-types/shared';
import type { BaseProps, OuterStyleProps, Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type { SizeName } from '../../../tokens/sizes';
import type { CubeItemActionProps } from '../../actions/ItemAction';
import type { CubeMenuProps } from '../../actions/Menu';
import type { CubeItemProps } from '../Item/Item';

/** Selection cardinality, mirroring React Aria/Stately's `selectionMode`. */
export type TreeSelectionMode = 'none' | 'single' | 'multiple';

/**
 * How the tree row `menu` is exposed.
 *
 * - `false` (default) — no menu at all.
 * - `true` — render the overflow `⋮` trigger inside `actions` AND open
 *   the same menu on right-click / Shift+F10.
 * - `'context-only'` — right-click / Shift+F10 only; no `⋮` trigger.
 *
 * Mirrors `TabContextMenu` from `Tabs` so consumers see the same API
 * across components.
 */
export type TreeContextMenu = boolean | 'context-only';

/**
 * A single node in the `treeData` array.
 *
 * Mirrors AntD's `DataNode` shape but renames boolean flags to the
 * `is*` convention used throughout `@cube-dev/ui-kit`.
 */
export interface CubeTreeNodeData {
  /** Unique identifier of the node. */
  key: string;
  /** Visible label (any `ReactNode`). */
  title: ReactNode;
  /** Children. Pass `undefined` together with `isLeaf={false}` for lazy nodes. */
  children?: CubeTreeNodeData[];
  /** Force leaf rendering (no expand toggle, no `loadData` call). */
  isLeaf?: boolean;
  /** Disable interactions on this row (focus / select / expand / check). */
  isDisabled?: boolean;
  /** Disable only the checkbox of this row. */
  isCheckboxDisabled?: boolean;
  /**
   * Per-node `isCheckable` override.
   *
   * - `undefined` (default): inherits the tree-level `isCheckable`.
   * - `false`: hide the checkbox for this row even when the tree is `isCheckable`.
   */
  isCheckable?: boolean;
  /**
   * Per-node menu override (Menu.Item children). Wins over the
   * tree-level `menu` prop. Pass `null` to disable the menu for this
   * specific row when the tree provides a default `menu`.
   */
  menu?: ReactNode | null;
  /** Per-node `contextMenu` override. */
  contextMenu?: TreeContextMenu;
  /**
   * Per-node `onAction` override. Called before the tree-level
   * `onAction` with the action key from `Menu.Item`.
   */
  onAction?: (action: string) => void;
}

/** Info passed as the second argument to `onCheck`. */
export interface TreeOnCheckInfo {
  /** Whether the toggled node ended up checked. */
  checked: boolean;
  /** The toggled node. */
  node: CubeTreeNodeData;
  /** All currently checked nodes (flat). */
  checkedNodes: CubeTreeNodeData[];
  /** Keys of nodes in indeterminate state. */
  halfCheckedKeys: Key[];
}

/** Info passed as the second argument to `onExpand`. */
export interface TreeOnExpandInfo {
  /** Whether the toggled node ended up expanded. */
  expanded: boolean;
  /** The toggled node. */
  node: CubeTreeNodeData;
}

/** Info passed as the second argument to `onSelect`. */
export interface TreeOnSelectInfo {
  /** Whether the toggled node ended up selected. */
  selected: boolean;
  /** The toggled node. */
  node: CubeTreeNodeData;
  /** All currently selected nodes (flat). */
  selectedNodes: CubeTreeNodeData[];
}

/** Current visual/interaction state of a tree node, passed as the second argument to `itemProps`. */
export interface TreeNodeState {
  isExpanded: boolean;
  isSelected: boolean;
  isChecked: boolean;
  isIndeterminate: boolean;
  isLeaf: boolean;
}

/** Props that can be customized per tree node via `itemProps`. */
export type TreeItemProps = Partial<
  Pick<
    CubeItemProps,
    | 'prefix'
    | 'suffix'
    | 'actions'
    | 'autoHideActions'
    | 'preserveActionsSpace'
    | 'description'
    | 'descriptionPlacement'
    | 'rightIcon'
    | 'tooltip'
    | 'highlight'
    | 'highlightCaseSensitive'
    | 'highlightStyles'
  >
>;

/** Argument shape for the `loadData` callback. */
export interface TreeLoadDataNode {
  key: Key;
  children?: CubeTreeNodeData[];
}

/**
 * Public props for the `Tree` component.
 *
 * Designed to be a drop-in (modulo `is*` renames) for the AntD `Tree`
 * `treeData` API, scoped to the v1 feature set.
 */
export interface CubeTreeProps extends BaseProps, OuterStyleProps {
  /** Hierarchical data describing the tree. */
  treeData: CubeTreeNodeData[];

  /** Render a checkbox in front of every (eligible) row. */
  isCheckable?: boolean;

  /** Allow row selection. Sugar for `selectionMode="none"` when `false`. */
  isSelectable?: boolean;

  /** Selection cardinality. Defaults to `'single'`. */
  selectionMode?: TreeSelectionMode;

  /** Row size. Defaults to `'medium'`. */
  size?: SizeName;

  /**
   * Visual shape of the tree container.
   * - `default` — no border or radius
   * - `card` — rounded corners with a border
   * @default "default"
   */
  shape?: 'default' | 'card';

  /** Padding (px) around the tree content. Applied via the virtualizer for vertical and CSS for horizontal. @default 4 */
  containerPadding?: number;

  /** Disable the entire tree. */
  isDisabled?: boolean;

  /** Default expanded keys (uncontrolled). */
  defaultExpandedKeys?: string[];
  /** Controlled expanded keys. */
  expandedKeys?: string[];
  /**
   * Auto-expand parents of currently expanded keys.
   *
   * Useful while filtering: passing matched leaf keys with this flag will
   * keep their parents expanded as well.
   */
  autoExpandParent?: boolean;

  /** Default checked keys (uncontrolled). */
  defaultCheckedKeys?: string[];
  /**
   * Controlled checked keys.
   *
   * Accepts either an array of keys or AntD's `{ checked, halfChecked }` shape.
   */
  checkedKeys?: string[] | { checked: string[]; halfChecked?: string[] };

  /** Default selected keys (uncontrolled). */
  defaultSelectedKeys?: string[];
  /** Controlled selected keys. */
  selectedKeys?: string[];

  /**
   * Fixed height in pixels. When omitted, the tree fills the available
   * vertical space and scrolls internally.
   */
  height?: number;

  /**
   * Async loader called the first time a non-leaf node with no `children`
   * is expanded. The consumer is expected to merge new children into
   * `treeData` (typical AntD pattern).
   */
  loadData?: (node: TreeLoadDataNode) => Promise<void>;

  /** Called when a node is expanded or collapsed. */
  onExpand?: (expandedKeys: Key[], info: TreeOnExpandInfo) => void;

  /**
   * Called when a node is checked or unchecked.
   *
   * The first argument is `Key[]` by default; pass `checkedKeys` as
   * `{ checked, halfChecked }` to receive the same shape back.
   */
  onCheck?: (
    checked: Key[] | { checked: Key[]; halfChecked: Key[] },
    info: TreeOnCheckInfo,
  ) => void;

  /** Called when row selection changes. */
  onSelect?: (selectedKeys: Key[], info: TreeOnSelectInfo) => void;

  /**
   * Customize Item props per tree node.
   *
   * Accepts a static object (applied to every row) or a callback that
   * receives the node data and returns props for that row.
   *
   * Supported props: `prefix`, `suffix`, `actions`, `autoHideActions`,
   * `preserveActionsSpace`, `description`, `descriptionPlacement`,
   * `rightIcon`, `tooltip`, `highlight`, `highlightCaseSensitive`,
   * `highlightStyles`.
   *
   * The `icon` slot is reserved for the expand/collapse toggle.
   * Use `prefix` for custom node icons.
   */
  itemProps?:
    | TreeItemProps
    | ((data: CubeTreeNodeData, state: TreeNodeState) => TreeItemProps);

  /** Override styles for `[data-element="Row"]` (per-row root). */
  rowStyles?: Styles;

  /** Accessible label for the tree. Defaults to `"Tree"`. */
  ariaLabel?: string;

  /** QA selector. */
  qa?: string;

  /**
   * When `true`, activating a non-leaf row toggles its expansion
   * instead of selecting it. Useful for file-tree UX where only
   * leaves are selectable. Folder rows remain focusable for keyboard
   * navigation, and the chevron toggle keeps working independently.
   *
   * Activation rules for folder rows:
   *   - Mouse click → expand / collapse.
   *   - `Enter` → expand / collapse (always, including in `isCheckable`
   *     trees — `Enter` is not a checkbox key).
   *   - `Space` → expand / collapse in non-checkable trees; in
   *     `isCheckable` trees `Space` toggles the row's checkbox instead.
   *
   * Leaf rows are unaffected and continue to select normally.
   * @default false
   */
  expandOnFolderClick?: boolean;

  /**
   * Per-tree default menu items (Menu.Item children) shown on every
   * row that doesn't override via `data.menu`.
   *
   * Accepts a static `ReactNode` (applied to every row) or a callback
   * that receives the row data and the derived state and returns the
   * menu content. Return `null` to hide the menu for that row.
   */
  menu?:
    | ReactNode
    | ((data: CubeTreeNodeData, state: TreeNodeState) => ReactNode | null);

  /**
   * Where the menu is exposed. Same semantics as `Tabs#contextMenu`:
   * - `false` (default) — no menu at all.
   * - `true` — render an overflow `⋮` trigger inside `actions` AND
   *   open the same menu on right-click / Shift+F10.
   * - `'context-only'` — right-click / Shift+F10 only; no `⋮` trigger.
   *
   * Per-node `data.contextMenu` wins when provided.
   * @default false
   */
  contextMenu?: TreeContextMenu;

  /**
   * Called when a menu action is triggered on any row. Receives the
   * action key (with the React `.$` prefix stripped) and the row key.
   * Per-node `data.onAction` is called first.
   */
  onAction?: (action: string, key: Key) => void;

  /** Forwarded to every per-row `MenuTrigger`. */
  menuTriggerProps?: Partial<CubeItemActionProps>;

  /**
   * Forwarded to every per-row `Menu` (both the overflow `⋮` menu and
   * the right-click context menu).
   *
   * If `onAction` is provided here, it is **chained with** the
   * tree-level `onAction` and per-node `data.onAction` (it does not
   * override them) and receives the same normalized action key.
   */
  menuProps?: Partial<CubeMenuProps<object>>;
}
