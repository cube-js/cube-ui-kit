import type { PressEvent } from '@react-types/shared';
import type { AllBaseProps, ContainerStyleProps } from '@tenphi/tasty';
import type { ReactNode } from 'react';

export type DashboardParentKind =
  | 'root'
  | 'horizontal-stack'
  | 'vertical-stack'
  | 'grid'
  | 'tabs';

export type DashboardContainerKind = Exclude<DashboardParentKind, 'root'>;
export type DashboardAddItemKind = 'widget' | DashboardContainerKind;
export type DashboardSelectionMode = 'none' | 'single' | 'multiple';
export type DashboardPlacementChangeReason = 'move' | 'resize';
export type DashboardPlacementChangePhase = 'preview' | 'commit';
export type DashboardPlacementChangeInput = 'pointer' | 'keyboard' | 'command';

export interface DashboardPlacement {
  column: number;
  row: number;
  columns: number;
  rows: number;
}

export interface DashboardPlacementChangeItem {
  id: string;
  placement: DashboardPlacement;
}

export interface DashboardPlacementChangeInfo {
  reason: DashboardPlacementChangeReason;
  phase: DashboardPlacementChangePhase;
  input: DashboardPlacementChangeInput;
  /**
   * Siblings Dashboard moved out of the way so this landing fits — a Grid
   * occupant swapped into the vacated box, or the rest of a reordered stack.
   * Apply them alongside the landing; they are reported separately from `items`
   * so the grabbed selection stays distinguishable from the reflow around it.
   */
  displaced?: DashboardPlacementChangeItem[];
  /**
   * Set on a `preview` whose landing Dashboard could not arrange — the geometry
   * fits but the destination is occupied, and the matching placeholder is drawn
   * in danger colours. A blocked preview is reported rather than withheld so a
   * consumer can show its own message, but it must not be written to layout
   * state: the gesture will not commit it.
   */
  isBlocked?: boolean;
  /** Immediate layout owner before a cross-container move. */
  sourceParentId?: string | null;
  /** Immediate layout owner under the pointer during a cross-container move. */
  destinationParentId?: string | null;
  /** Atomic sibling group carried by this movement gesture. */
  items?: DashboardPlacementChangeItem[];
}

export interface DashboardAddItemDefinition {
  /** Stable item-type key reported to onAddItem. */
  id: string;
  /** Consumer-facing menu label. */
  name: ReactNode;
  /** Optional secondary menu copy. */
  description?: ReactNode;
  /** Optional menu icon. */
  icon?: ReactNode;
  /** Whether the item creates a widget or a nestable container. @default 'widget' */
  kind?: DashboardAddItemKind;
  /** Initial width used when testing the hovered cell. @default 1 */
  defaultColumns?: number;
  /** Initial height used when testing the hovered cell. @default 1 */
  defaultRows?: number;
  /** Minimum width accepted by the item. @default 1 */
  minColumns?: number;
  /** Maximum width accepted by the item. @default 12 */
  maxColumns?: number;
  /** Minimum height accepted by the item. @default 1 */
  minRows?: number;
  /** Maximum height accepted by the item. Defaults to the parent row count. */
  maxRows?: number;
  /** Consumer-controlled availability in addition to Dashboard's fit checks. */
  isDisabled?: boolean;
}

/** A consumer-supplied entry in a node's action menu. */
export interface DashboardNodeAction {
  /** Reported through `onMenuAction`. Must not collide with a built-in key. */
  id: string;
  name: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  isDisabled?: boolean;
}

/** Everything the size commands need to know about a node's room to grow. */
export interface DashboardSizeBounds {
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
  parentColumns: number;
  parentRows: number;
}

export interface DashboardAddItemInfo {
  parentId: string | null;
  parentKind: DashboardParentKind;
  parentDepth: number;
  placement: DashboardPlacement;
  /** Present when the target is one independent Dashboard.Tab layout slot. */
  tabsId?: string;
  /** Present when the target is one independent Dashboard.Tab layout slot. */
  tabId?: string;
}

export interface DashboardMetrics {
  rowHeight: number;
  columnGap: number;
  rowGap: number;
}

export interface DashboardTreeContextValue {
  containerDepth: number;
  parentKind: DashboardParentKind;
  parentId: string | null;
  layoutParentId: string | null;
  parentColumns: number;
  parentRows: number;
  ancestorIds: string[];
  /**
   * Stacks only: the span the parent's children already occupy on its axis.
   *
   * A stack child grows into what its siblings leave over, so it needs to know
   * the total — which only the parent can see. `0` everywhere else, where
   * occupancy is a question about positions rather than a running sum.
   */
  parentStackUsed: number;
}

export interface DashboardNodeRegistration {
  parentId: string | null;
  ancestorIds: string[];
}

export interface DashboardSelectionContextValue {
  selectionMode: DashboardSelectionMode;
  selectedKeys: ReadonlySet<string>;
  register: (id: string, registration: DashboardNodeRegistration) => () => void;
  select: (id: string, additive: boolean) => void;
}

export interface DashboardEditingContextValue {
  isEditing: boolean;
  movingId: string | null;
  arrivingIds: ReadonlySet<string>;
  markArriving: (id: string) => void;
  startMoving: (id: string) => void;
  stopMoving: (id: string) => void;
}

export interface DashboardAuthoringContextValue {
  addItems: readonly DashboardAddItemDefinition[];
  onAddItem?: (itemId: string, info: DashboardAddItemInfo) => void;
}

export interface CubeDashboardProps
  extends Omit<AllBaseProps, keyof ContainerStyleProps | 'children' | 'gap'>,
    Omit<ContainerStyleProps, 'gap'> {
  children?: ReactNode;
  /** Height of one row in every container, in pixels. @default 80 */
  rowHeight?: number;
  /** Shared horizontal/vertical gap, or a [horizontal, vertical] pair. @default 16 */
  gap?: number | [number, number];
  /** Reveals container editing chrome on hover. @default false */
  isEditing?: boolean;
  /** Whether dashboard nodes can be selected. @default 'multiple' */
  selectionMode?: DashboardSelectionMode;
  /** Controlled selected node ids. */
  selectedKeys?: string[];
  /** Initially selected node ids for uncontrolled usage. */
  defaultSelectedKeys?: string[];
  /** Called when the selection changes. */
  onSelectionChange?: (keys: string[]) => void;
  /** Item types offered by the empty-cell add menu while editing. */
  addItems?: readonly DashboardAddItemDefinition[];
  /** Called with the registered item type and exact hovered-cell placement. */
  onAddItem?: (itemId: string, info: DashboardAddItemInfo) => void;
}

export interface DashboardPlacementProps {
  /** Zero-based column origin inside the immediate parent. @default 0 */
  column?: number;
  /** Zero-based row origin inside the immediate parent. @default 0 */
  row?: number;
  /** Width in the immediate parent's available columns. @default 12 */
  columns?: number;
  /** Height/capacity in rows. @default 1 */
  rows?: number;
}

export interface DashboardNodeBaseProps
  extends Omit<
      AllBaseProps,
      keyof ContainerStyleProps | 'children' | 'id' | 'title'
    >,
    ContainerStyleProps,
    DashboardPlacementProps {
  id: string;
  children?: ReactNode;
  isSelectable?: boolean;
  'aria-label'?: string;
}

export interface CubeDashboardContainerProps extends DashboardNodeBaseProps {
  /** Optional accessible title. Only Tabs may render it above its tab list. */
  title?: ReactNode;
  /** Enables movement inside the immediate parent. @default false */
  isMovable?: boolean;
  /** Enables context-sensitive container resizing. @default false */
  isResizable?: boolean;
  /** Minimum container width in the immediate parent's columns. @default 1 */
  minColumns?: number;
  /** Maximum container width, clamped to the immediate parent. @default 12 */
  maxColumns?: number;
  /** Minimum container height in rows. Child occupancy may raise it. @default 1 */
  minRows?: number;
  /** Maximum container height in rows. Defaults to 12 at root and parent rows when nested. */
  maxRows?: number;
  /** Reports preview and committed move/resize placements, including cross-parent ids. */
  onPlacementChange?: (
    placement: DashboardPlacement,
    info: DashboardPlacementChangeInfo,
  ) => void;
  /** Accessible label for the resize handle. */
  resizeLabel?: string;
  /** Accessible label used while the movable container itself is focused. */
  moveLabel?: string;
  /** Adds a Settings entry to the container's action menu. */
  onSettingsPress?: () => void;
  /** Overrides the Settings entry's label. */
  settingsLabel?: string;
  /** Adds a Duplicate entry to the container's action menu. */
  onDuplicatePress?: () => void;
  /** Overrides the Duplicate entry's label. */
  duplicateLabel?: string;
  /** Adds a Delete entry to the container's action menu. */
  onDeletePress?: () => void;
  /** Overrides the Delete entry's label. */
  deleteLabel?: string;
  /** Product-specific entries appended to the container's action menu. */
  actions?: readonly DashboardNodeAction[];
  /** Called with the `id` of a consumer-supplied menu entry. */
  onMenuAction?: (key: string) => void;
}

export interface CubeDashboardWidgetProps extends DashboardNodeBaseProps {
  /** Adds the widget's card shadow. @default false */
  isCard?: boolean;
  /** Adds a Settings entry to the widget's action menu. */
  onSettingsPress?: () => void;
  /** Overrides the Settings entry's label. */
  settingsLabel?: string;
  /** Adds a Duplicate entry to the widget's action menu. */
  onDuplicatePress?: () => void;
  /** Overrides the Duplicate entry's label. */
  duplicateLabel?: string;
  /** Adds a Delete entry to the widget's action menu. */
  onDeletePress?: () => void;
  /** Overrides the Delete entry's label. */
  deleteLabel?: string;
  /** Product-specific entries appended to the widget's action menu. */
  actions?: readonly DashboardNodeAction[];
  /** Called with the `id` of a consumer-supplied menu entry. */
  onMenuAction?: (key: string) => void;
  /** Enables movement inside the immediate parent. @default false */
  isMovable?: boolean;
  /** Enables context-sensitive southeast/edge resizing. @default false */
  isResizable?: boolean;
  /** Minimum widget width in columns. @default 1 */
  minColumns?: number;
  /** Maximum widget width, clamped to the immediate parent. @default 12 */
  maxColumns?: number;
  /** Minimum widget height in rows. @default 1 */
  minRows?: number;
  /** Maximum widget height in rows. Defaults to the parent row count. */
  maxRows?: number;
  /** Reports preview and committed move/resize placements, including cross-parent ids. */
  onPlacementChange?: (
    placement: DashboardPlacement,
    info: DashboardPlacementChangeInfo,
  ) => void;
  /** Accessible label used while the movable widget itself is focused. */
  moveLabel?: string;
  /** Accessible label for the resize handle. */
  resizeLabel?: string;
}

export interface CubeDashboardTabsProps extends CubeDashboardContainerProps {
  activeKey?: string;
  defaultActiveKey?: string;
  onActiveChange?: (key: string) => void;
}

export interface CubeDashboardTabProps {
  id: string;
  title: ReactNode;
  children?: ReactNode;
  keepMounted?: boolean;
}

export interface DashboardNodeInteractionOptions {
  id: string;
  isContainer: boolean;
  isSelectable?: boolean;
}
