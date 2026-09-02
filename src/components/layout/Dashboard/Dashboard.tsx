import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFocusWithin, useHover, useMove } from 'react-aria';
import { createPortal } from 'react-dom';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { CirclePlusIcon } from '../../../icons/CirclePlusIcon';
import { GripVerticalIcon } from '../../../icons/GripVerticalIcon';
import { SettingsIcon } from '../../../icons/SettingsIcon';
import { TrashIcon } from '../../../icons/TrashIcon';
import {
  mergeProps,
  useCombinedRefs,
  useLayoutEffect,
} from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { Button } from '../../actions/Button/Button';
import { Menu } from '../../actions/Menu/Menu';
import { Tab, Tabs } from '../../navigation/Tabs/Tabs';

import type { Key, PressEvent } from '@react-types/shared';
import type {
  CSSProperties,
  ForwardedRef,
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';

const DashboardElement = tasty({
  qa: 'Dashboard',
  styles: {
    position: 'relative',
    display: 'grid',
    gridColumns: 'minmax(0, 1fr)',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
});

const ContainerElement = tasty({
  qa: 'DashboardContainer',
  styles: {
    position: 'relative',
    display: 'grid',
    gridRows: {
      '': 'minmax(0, 1fr)',
      titled: 'auto minmax(0, 1fr)',
    },
    minWidth: 0,
    boxSizing: 'border-box',
    fill: false,
    border: false,
    radius: true,
    padding: {
      '': '1x',
      'depth=2': '5px',
      'depth=3': '2px',
    },
    margin: {
      '': '-8px',
      'depth=2': '-5px',
      'depth=3': '-2px',
    },
    shadow: {
      '': false,
      'editing & empty': '0 0 0 1px #dark.30',
      'editing & hovered': '0 0 0 1px #dark.30',
      'editing & resizing': '0 0 0 1px #dark.30',
      'editing & arriving': '0 0 0 1px #dark.30',
      dragging: '0 0 0 1px #dark.30',
      'editing & focus-visible': '0 0 0 2px #primary-text',
      'selected | moving': '0 0 0 2px #primary',
    },
    outline: 'none',
    zIndex: {
      '': 1,
      'hovered | dragging | arriving': 2,
      'focus-within | selected | moving | :has([data-selected])': 3,
    },
    cursor: {
      '': 'auto',
      movable: 'grab',
      moving: 'grabbing',
    },
    transition: 'shadow, theme',
    touchAction: {
      '': 'auto',
      movable: 'none',
    },
  },
});

const ContainerHeaderElement = tasty({
  styles: {
    display: 'flex',
    placeContent: 'space-between',
    alignItems: 'center',
    gap: '1x',
    minWidth: 0,
    padding: '0.5x 0.5x 1x',
    preset: 'h6',
    color: '#dark',
    userSelect: 'none',
  },
});

const ContentGridElement = tasty({
  qa: 'DashboardContainerContent',
  styles: {
    position: 'relative',
    display: 'grid',
    alignItems: 'stretch',
    minWidth: 0,
    boxSizing: 'border-box',
  },
});

const FreeCellsLayerElement = tasty({
  styles: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    display: 'grid',
    minWidth: 0,
    pointerEvents: 'none',
  },
});

const FreeCellElement = tasty({
  qa: 'DashboardFreeCell',
  styles: {
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    fill: '#primary.06',
    shadow: 'inset 0 0 0 1px #primary.12',
    radius: true,
    opacity: {
      '': 0,
      highlighted: 1,
    },
    transition: 'opacity 100ms ease-in-out, theme',
  },
});

const ADD_CELL_BUTTON_STYLES: Styles = {
  alignSelf: 'stretch',
  justifySelf: 'stretch',
  minWidth: 0,
  minHeight: 0,
  padding: 0,
  fill: {
    '': '#primary.06',
    'hovered | focused': '#primary.12',
    pressed: '#primary.18',
  },
  color: '#primary-text',
  border: '0',
  outline: {
    '': false,
    focused: false,
  },
  shadow: {
    '': 'inset 0 0 0 1px #primary.12',
    'hovered | focused': 'inset 0 0 0 1px #primary',
  },
  radius: true,
  transition: 'opacity 100ms ease-in-out, theme',
  visibility: {
    '': 'visible',
    '@parent(:has(> [data-dashboard-drop-covers-add-slot]))': 'hidden',
  },
};

const RootAddButtonElement = tasty(Button, {
  qa: 'DashboardRootAddButton',
  styles: {
    width: '100%',
    minHeight: '6x',
    padding: 0,
    fill: '#surface-2',
    border: '0',
    shadow: 'inset 0 0 0 1px #border',
    radius: true,
  },
});

const DropPlaceholderElement = tasty({
  qa: 'DashboardDropPlaceholder',
  styles: {
    position: 'absolute',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    zIndex: 4,
    fill: {
      '': '#primary.10',
      danger: '#danger.10',
    },
    shadow: {
      '': '0 0 0 1px #primary',
      danger: '0 0 0 1px #danger',
    },
    radius: true,
    transition: 'inset 80ms linear, width 80ms linear, height 80ms linear',
  },
});

const WidgetElement = tasty({
  qa: 'DashboardWidget',
  styles: {
    position: 'relative',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    outline: 'none',
    visibility: {
      '': 'visible',
      'add-slot & @parent(:has(> [data-dashboard-drop-covers-add-slot]))':
        'hidden',
    },
    zIndex: {
      '': 1,
      'hovered | focus-within': 2,
      selected: 3,
    },
    cursor: {
      '': 'auto',
      movable: 'grab',
      moving: 'grabbing',
    },
    touchAction: {
      '': 'auto',
      movable: 'none',
    },
  },
});

const WidgetSurfaceElement = tasty({
  styles: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fill: '#surface-2',
    radius: true,
    shadow: {
      '': false,
      card: '0 0 0 1px #border',
      hovered: '0 0 0 1px #dark.30',
      'focus-within': '0 0 0 2px #primary-text',
      'selected | moving': '0 0 0 2px #primary',
    },
    transition: 'shadow, theme',
  },
});

const NodeActionsElement = tasty({
  styles: {
    position: 'absolute',
    top: 0,
    right: '(-1 * $size-sm / 2)',
    zIndex: 6,
    display: 'flex',
    gap: '0.5x',
    transform: 'translateY(-50%)',
    opacity: {
      '': 0,
      selected: 1,
    },
    pointerEvents: {
      '': 'none',
      selected: 'auto',
    },
    transition: 'opacity 120ms ease-in-out',
  },
});

const CornerResizeGripElement = tasty({
  qa: 'DashboardResizeCornerGrip',
  styles: {
    width: '10px',
    height: '10px',
    boxSizing: 'border-box',
    borderRight: '2px solid #dark.40',
    borderBottom: '2px solid #dark.40',
    radius: '4px bottom-right',
  },
});

const ResizeHandleElement = tasty({
  qa: 'DashboardResizeHandle',
  as: 'button',
  styles: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    top: {
      '': 'auto',
      'axis=x': '50%',
    },
    zIndex: 5,
    display: 'grid',
    placeItems: 'center',
    width: {
      '': '3.5x',
      'axis=x': '2x',
    },
    height: {
      '': '3.5x',
      'axis=y': '2x',
    },
    padding: 0,
    transform: {
      '': 'translate(50%, 50%)',
      'axis=x': 'translate(50%, -50%)',
    },
    fill: '#surface',
    color: '#dark',
    border: '1bw #border',
    radius: 'round',
    shadow: '$item-shadow',
    cursor: {
      '': 'nwse-resize',
      'axis=x': 'col-resize',
      'axis=y': 'row-resize',
    },
    opacity: {
      '': 0,
      'selected | resizing': 1,
    },
    pointerEvents: {
      '': 'none',
      'selected | resizing': 'auto',
    },
    outline: {
      '': '1bw #primary-text.0',
      'focus-visible': '1bw #primary-text',
    },
    outlineOffset: '1bw',
    transition: 'opacity, theme',
    touchAction: 'none',

    Icon: {
      display: 'flex',
      placeContent: 'center',
      alignItems: 'center',
      lineHeight: 0,
      transform: {
        '': 'rotate(-45deg)',
        corner: 'none',
        'axis=x': 'rotate(0deg)',
        'axis=y': 'rotate(90deg)',
      },
    },
  },
});

const TopLevelResizeHandleElement = tasty(ResizeHandleElement, {
  styles: {
    left: '50%',
    right: 'auto',
    transform: 'translate(-50%, 50%)',
  },
});

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
export type DashboardPlacementChangeInput = 'pointer' | 'keyboard';

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

interface DashboardMetrics {
  rowHeight: number;
  columnGap: number;
  rowGap: number;
}

interface DashboardTreeContextValue {
  containerDepth: number;
  parentKind: DashboardParentKind;
  parentId: string | null;
  layoutParentId: string | null;
  parentColumns: number;
  parentRows: number;
  ancestorIds: string[];
}

interface DashboardNodeRegistration {
  parentId: string | null;
  ancestorIds: string[];
}

interface DashboardSelectionContextValue {
  selectionMode: DashboardSelectionMode;
  selectedKeys: ReadonlySet<string>;
  register: (id: string, registration: DashboardNodeRegistration) => () => void;
  select: (id: string, additive: boolean) => void;
}

interface DashboardEditingContextValue {
  isEditing: boolean;
  movingId: string | null;
  arrivingIds: ReadonlySet<string>;
  markArriving: (id: string) => void;
  startMoving: (id: string) => void;
  stopMoving: (id: string) => void;
}

interface DashboardAuthoringContextValue {
  addItems: readonly DashboardAddItemDefinition[];
  onAddItem?: (itemId: string, info: DashboardAddItemInfo) => void;
}

const DashboardMetricsContext = createContext<DashboardMetrics>({
  rowHeight: 80,
  columnGap: 16,
  rowGap: 16,
});

const DashboardTreeContext = createContext<DashboardTreeContextValue>({
  containerDepth: 0,
  parentKind: 'root',
  parentId: null,
  layoutParentId: null,
  parentColumns: 12,
  parentRows: 1,
  ancestorIds: [],
});

const DashboardSelectionContext = createContext<DashboardSelectionContextValue>(
  {
    selectionMode: 'none',
    selectedKeys: new Set(),
    register: () => () => {},
    select: () => {},
  },
);

const DashboardEditingContext = createContext<DashboardEditingContextValue>({
  isEditing: false,
  movingId: null,
  arrivingIds: new Set(),
  markArriving: () => {},
  startMoving: () => {},
  stopMoving: () => {},
});

const DashboardAuthoringContext = createContext<DashboardAuthoringContextValue>(
  {
    addItems: [],
  },
);

const INTERACTIVE_SELECTOR =
  'button,input,textarea,select,a,[role="button"],[role="menuitem"],' +
  '[role="checkbox"],[role="switch"],[role="tab"],[contenteditable="true"],' +
  '[data-dashboard-no-select],[data-dashboard-no-move]';

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

interface DashboardNodeBaseProps
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
  /** Shows a standard settings action after the container is selected. */
  onSettingsPress?: (event: PressEvent) => void;
  /** Accessible label for the container settings action. */
  settingsLabel?: string;
  /** Shows a standard delete action after the container is selected. */
  onDeletePress?: (event: PressEvent) => void;
  /** Accessible label for the container delete action. */
  deleteLabel?: string;
}

export interface CubeDashboardWidgetProps extends DashboardNodeBaseProps {
  /** Adds the widget's card shadow. @default false */
  isCard?: boolean;
  /** Shows the standard settings button when supplied. */
  onSettingsPress?: (event: PressEvent) => void;
  /** Accessible label for the settings button. Required with onSettingsPress. */
  settingsLabel?: string;
  /** Shows the standard delete button when supplied. */
  onDeletePress?: (event: PressEvent) => void;
  /** Accessible label for the delete button. */
  deleteLabel?: string;
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

interface DashboardNodeInteractionOptions {
  id: string;
  isContainer: boolean;
  isSelectable?: boolean;
}

function normalizeGap(gap: CubeDashboardProps['gap']): [number, number] {
  if (Array.isArray(gap)) return gap;
  const value = gap ?? 16;
  return [value, value];
}

function clampSpan(value: number | undefined, fallback: number): number {
  return Math.max(1, Math.min(12, Math.floor(value ?? fallback)));
}

function clampRows(value: number | undefined, fallback: number): number {
  return Math.max(1, Math.floor(value ?? fallback));
}

function clampOrigin(value: number | undefined): number {
  return Math.max(0, Math.min(11, Math.floor(value ?? 0)));
}

function clampRowOrigin(value: number | undefined): number {
  return Math.max(0, Math.floor(value ?? 0));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizePlacement(
  placement: DashboardPlacementProps,
  parentColumns: number,
  parentRows: number,
): DashboardPlacement {
  const columns = Math.min(
    clampSpan(placement.columns, parentColumns),
    parentColumns,
  );
  const rows = Math.min(clampRows(placement.rows, 1), parentRows);

  return {
    column: Math.min(clampOrigin(placement.column), parentColumns - columns),
    row: Math.min(clampRowOrigin(placement.row), parentRows - rows),
    columns,
    rows,
  };
}

function isSamePlacement(
  first: DashboardPlacement,
  second: DashboardPlacement,
): boolean {
  return (
    first.column === second.column &&
    first.row === second.row &&
    first.columns === second.columns &&
    first.rows === second.rows
  );
}

function getPlacementStyle(
  tree: DashboardTreeContextValue,
  placement: DashboardPlacementProps,
): CSSProperties {
  if (tree.parentKind === 'root') {
    return { gridColumn: '1 / -1' };
  }

  const columns = Math.min(
    clampSpan(placement.columns, tree.parentColumns),
    tree.parentColumns,
  );
  const rows = Math.min(clampRows(placement.rows, 1), tree.parentRows);

  if (tree.parentKind === 'horizontal-stack') {
    return {
      gridColumn: `span ${columns}`,
      gridRow: `1 / span ${rows}`,
    };
  }

  if (tree.parentKind === 'vertical-stack') {
    return {
      gridColumn: `1 / span ${columns}`,
      gridRow: `span ${rows}`,
    };
  }

  return {
    gridColumn: `${Math.min(clampOrigin(placement.column), tree.parentColumns - columns) + 1} / span ${columns}`,
    gridRow: `${Math.min(clampRowOrigin(placement.row), tree.parentRows - rows) + 1} / span ${rows}`,
  };
}

function getContentGridStyle(
  kind: DashboardContainerKind,
  columns: number,
  rows: number,
  metrics: DashboardMetrics,
): CSSProperties {
  return {
    gap: `${metrics.rowGap}px ${metrics.columnGap}px`,
    gridTemplateColumns: `repeat(${Math.max(1, Math.floor(columns))}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${Math.max(1, Math.floor(rows))}, minmax(${metrics.rowHeight}px, auto))`,
    gridAutoFlow: kind === 'horizontal-stack' ? 'row' : undefined,
  };
}

interface DashboardFreeCell {
  column: number;
  row: number;
}

function getDashboardChildPlacements(
  kind: DashboardContainerKind,
  children: ReactNode,
  columns: number,
  rows: number,
): DashboardPlacement[] {
  const childPlacements = Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const props = child.props as DashboardPlacementProps & {
      'data-dashboard-add-slot'?: unknown;
    };
    if (props['data-dashboard-add-slot'] !== undefined) return [];

    return [normalizePlacement(props, columns, rows)];
  });

  if (kind === 'horizontal-stack') {
    let nextColumn = 0;

    return childPlacements.map((placement) => {
      const next = { ...placement, column: nextColumn, row: 0 };
      nextColumn += placement.columns;

      return next;
    });
  }

  if (kind === 'vertical-stack') {
    let nextRow = 0;

    return childPlacements.map((placement) => {
      const next = { ...placement, column: 0, row: nextRow };
      nextRow += placement.rows;

      return next;
    });
  }

  return childPlacements;
}

function getDashboardFreeCells(
  kind: DashboardContainerKind,
  placements: DashboardPlacement[],
  columns: number,
  rows: number,
): DashboardFreeCell[] {
  if (kind === 'horizontal-stack') {
    const column = placements.reduce(
      (end, placement) => Math.max(end, placement.column + placement.columns),
      0,
    );

    return column < columns ? [{ column, row: 0 }] : [];
  }

  if (kind === 'vertical-stack') {
    const row = placements.reduce(
      (end, placement) => Math.max(end, placement.row + placement.rows),
      0,
    );

    return row < rows ? [{ column: 0, row }] : [];
  }

  if (kind === 'tabs') {
    return placements.length === 0 ? [{ column: 0, row: 0 }] : [];
  }

  const cells: DashboardFreeCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const isOccupied = placements.some(
        (placement) =>
          column >= placement.column &&
          column < placement.column + placement.columns &&
          row >= placement.row &&
          row < placement.row + placement.rows,
      );

      if (!isOccupied) cells.push({ column, row });
    }
  }

  return cells;
}

function getDashboardAddPlacement(
  definition: DashboardAddItemDefinition,
  cell: DashboardFreeCell,
  kind: DashboardContainerKind,
  placements: DashboardPlacement[],
  parentColumns: number,
  parentRows: number,
  parentDepth: number,
): DashboardPlacement | null {
  if (
    definition.isDisabled ||
    (kind === 'tabs' &&
      (!definition.kind ||
        definition.kind === 'widget' ||
        definition.kind === 'tabs')) ||
    (definition.kind && definition.kind !== 'widget' && parentDepth >= 3)
  ) {
    return null;
  }

  const minColumns = clampSpan(definition.minColumns, 1);
  const maxColumns = Math.max(
    minColumns,
    clampSpan(definition.maxColumns, parentColumns),
  );
  const minRows = clampRows(definition.minRows, 1);
  const maxRows = Math.max(minRows, clampRows(definition.maxRows, parentRows));
  let resolvedColumns = clamp(
    clampSpan(definition.defaultColumns, minColumns),
    minColumns,
    maxColumns,
  );
  let resolvedRows = clamp(
    clampRows(definition.defaultRows, minRows),
    minRows,
    maxRows,
  );

  if (kind === 'horizontal-stack') {
    resolvedRows = Math.min(parentRows, maxRows);
  } else if (kind === 'vertical-stack') {
    resolvedColumns = Math.min(parentColumns, maxColumns);
  } else if (kind === 'tabs') {
    resolvedColumns = parentColumns;
    resolvedRows = Math.min(parentRows, maxRows);
  }

  if (
    resolvedColumns < minColumns ||
    resolvedRows < minRows ||
    resolvedColumns > parentColumns ||
    resolvedRows > parentRows
  ) {
    return null;
  }

  const placement: DashboardPlacement = {
    column: kind === 'vertical-stack' || kind === 'tabs' ? 0 : cell.column,
    row: kind === 'horizontal-stack' || kind === 'tabs' ? 0 : cell.row,
    columns: resolvedColumns,
    rows: resolvedRows,
  };

  if (
    placement.column + placement.columns > parentColumns ||
    placement.row + placement.rows > parentRows
  ) {
    return null;
  }

  const isBlocked = placements.some((occupied) => {
    if (kind === 'horizontal-stack') {
      return !(
        placement.column + placement.columns <= occupied.column ||
        occupied.column + occupied.columns <= placement.column
      );
    }

    if (kind === 'vertical-stack') {
      return !(
        placement.row + placement.rows <= occupied.row ||
        occupied.row + occupied.rows <= placement.row
      );
    }

    return placementsOverlap(placement, occupied);
  });

  return isBlocked ? null : placement;
}

interface DashboardContainerContentProps {
  id: string;
  kind: DashboardContainerKind;
  columns: number;
  rows: number;
  depth: number;
  ancestorIds: string[];
  tabsId?: string;
  tabId?: string;
  children?: ReactNode;
}

function DashboardContainerContent({
  id,
  kind,
  columns,
  rows,
  depth,
  ancestorIds,
  tabsId,
  tabId,
  children,
}: DashboardContainerContentProps) {
  const { t } = useI18n();
  const metrics = useContext(DashboardMetricsContext);
  const editing = useContext(DashboardEditingContext);
  const authoring = useContext(DashboardAuthoringContext);
  const [isOwnHovered, setIsOwnHovered] = useState(false);
  const [activeCell, setActiveCell] = useState<DashboardFreeCell | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [openAddCell, setOpenAddCell] = useState<DashboardFreeCell | null>(
    null,
  );
  const openAddCellRef = useRef<DashboardFreeCell | null>(null);
  const placements = useMemo(
    () => getDashboardChildPlacements(kind, children, columns, rows),
    [children, columns, kind, rows],
  );
  const freeCells = useMemo(
    () => getDashboardFreeCells(kind, placements, columns, rows),
    [columns, kind, placements, rows],
  );
  const availableItems = useMemo(
    () =>
      kind === 'tabs'
        ? authoring.addItems.filter(
            (definition) =>
              definition.kind !== undefined &&
              definition.kind !== 'widget' &&
              definition.kind !== 'tabs',
          )
        : authoring.addItems.filter((definition) => definition.kind !== 'tabs'),
    [authoring.addItems, kind],
  );
  const rememberedActiveCell =
    activeCell &&
    freeCells.some(
      (cell) =>
        cell.column === activeCell.column && cell.row === activeCell.row,
    )
      ? activeCell
      : null;
  const resolvedActiveCell =
    kind === 'tabs' || kind === 'horizontal-stack' || kind === 'vertical-stack'
      ? freeCells[0] ?? null
      : rememberedActiveCell;
  const addButtonCell =
    openAddCell ?? resolvedActiveCell ?? freeCells[0] ?? null;
  const activePlacements = useMemo(
    () =>
      new Map(
        availableItems.map((definition) => [
          definition.id,
          addButtonCell
            ? getDashboardAddPlacement(
                definition,
                addButtonCell,
                kind,
                placements,
                columns,
                rows,
                depth,
              )
            : null,
        ]),
      ),
    [availableItems, columns, depth, kind, placements, addButtonCell, rows],
  );
  const disabledKeys = useMemo(
    () =>
      availableItems
        .filter((definition) => !activePlacements.get(definition.id))
        .map((definition) => definition.id),
    [activePlacements, availableItems],
  );
  const isPermanentAdd = kind === 'tabs';
  const isAuthoringVisible = isPermanentAdd || isOwnHovered || isAddMenuOpen;
  const hasAddTarget =
    !!addButtonCell && !!authoring.onAddItem && availableItems.length > 0;
  const isAddButtonVisible =
    hasAddTarget && (isPermanentAdd || isOwnHovered || isAddMenuOpen);

  const updateHover = useEvent((event: ReactPointerEvent<HTMLDivElement>) => {
    if (isAddMenuOpen) return;

    const target = event.target as HTMLElement;
    const content = event.currentTarget;
    const closestContent = target.closest('[data-dashboard-drop-target]');

    if (closestContent !== content) {
      setIsOwnHovered(false);
      return;
    }

    setIsOwnHovered(true);
    const freeCell = target.closest<HTMLElement>(
      '[data-dashboard-free-cell], [data-dashboard-add-slot]',
    );

    if (freeCell?.dataset.dashboardParentId === id) {
      const next = {
        column: Number(freeCell.dataset.dashboardColumn),
        row: Number(freeCell.dataset.dashboardRow),
      };
      setActiveCell((current) =>
        current?.column === next.column && current.row === next.row
          ? current
          : next,
      );
    }
  });
  const handlePointerLeave = useEvent(() => {
    setIsOwnHovered(false);
  });
  const lockAddCell = useEvent(() => {
    openAddCellRef.current = addButtonCell;
    setOpenAddCell(addButtonCell);
  });
  const handleAddMenuOpenChange = useEvent((isOpen: boolean) => {
    setIsAddMenuOpen(isOpen);

    if (isOpen) {
      lockAddCell();
    } else {
      setOpenAddCell(null);
    }
  });
  const handleAction = useEvent((key: Key) => {
    const itemId = String(key);
    const definition = availableItems.find((item) => item.id === itemId);
    const targetCell = openAddCellRef.current ?? addButtonCell;
    const placement =
      definition && targetCell
        ? getDashboardAddPlacement(
            definition,
            targetCell,
            kind,
            placements,
            columns,
            rows,
            depth,
          )
        : null;
    if (!placement) return;

    authoring.onAddItem?.(itemId, {
      parentId: id,
      parentKind: kind,
      parentDepth: depth,
      placement,
      ...(tabsId && { tabsId }),
      ...(tabId && { tabId }),
    });
    openAddCellRef.current = null;
  });
  const gridStyle = getContentGridStyle(kind, columns, rows, metrics);

  return (
    <ContentGridElement
      data-dashboard-drop-target=""
      data-dashboard-parent-id={id}
      data-dashboard-container-kind={kind}
      data-dashboard-columns={columns}
      data-dashboard-rows={rows}
      data-dashboard-depth={depth}
      data-dashboard-ancestor-ids={JSON.stringify(ancestorIds)}
      data-dashboard-tabs-id={tabsId}
      data-dashboard-tab-id={tabId}
      data-dashboard-own-hover={isOwnHovered || undefined}
      style={gridStyle}
      onPointerOver={updateHover}
      onPointerMove={updateHover}
      onPointerLeave={handlePointerLeave}
    >
      {editing.isEditing ? (
        <FreeCellsLayerElement aria-hidden="true" style={gridStyle}>
          {freeCells.map((cell) => (
            <FreeCellElement
              key={`${cell.column}:${cell.row}`}
              data-dashboard-free-cell=""
              data-dashboard-parent-id={id}
              data-dashboard-column={cell.column}
              data-dashboard-row={cell.row}
              data-highlighted={isAuthoringVisible || undefined}
              mods={{ highlighted: isAuthoringVisible }}
              style={
                kind === 'tabs'
                  ? { gridColumn: '1 / -1', gridRow: '1 / -1' }
                  : {
                      gridColumn: `${cell.column + 1} / span 1`,
                      gridRow: `${cell.row + 1} / span 1`,
                    }
              }
            />
          ))}
        </FreeCellsLayerElement>
      ) : null}
      {children}
      {editing.isEditing && hasAddTarget ? (
        <Menu.Trigger onOpenChange={handleAddMenuOpenChange}>
          <Button
            qa="DashboardAddButton"
            type="clear"
            icon={isAddButtonVisible ? <CirclePlusIcon /> : null}
            aria-label={t(
              'dashboard.addItem',
              'Add an item at column {{column}}, row {{row}} in {{container}}',
              {
                column: addButtonCell.column + 1,
                row: addButtonCell.row + 1,
                container: id,
              },
            )}
            data-dashboard-add-slot=""
            data-dashboard-parent-id={id}
            data-dashboard-column={addButtonCell.column}
            data-dashboard-row={addButtonCell.row}
            data-dashboard-columns={kind === 'tabs' ? columns : 1}
            data-dashboard-rows={kind === 'tabs' ? rows : 1}
            width="100%"
            height="100%"
            zIndex={3}
            opacity={isAddButtonVisible ? 1 : 0}
            aria-hidden={!isAddButtonVisible || undefined}
            tabIndex={isAddButtonVisible ? undefined : -1}
            styles={ADD_CELL_BUTTON_STYLES}
            onPressStart={lockAddCell}
            style={
              kind === 'tabs'
                ? {
                    gridColumn: '1 / -1',
                    gridRow: '1 / -1',
                    border: 0,
                    outline: 'none',
                  }
                : {
                    gridColumn: `${addButtonCell.column + 1} / span 1`,
                    gridRow: `${addButtonCell.row + 1} / span 1`,
                    border: 0,
                    outline: 'none',
                  }
            }
          />
          <Menu
            aria-label={t(
              'dashboard.addMenu',
              'Items available for {{container}}',
              { container: id },
            )}
            width="280px"
            disabledKeys={disabledKeys}
            onAction={handleAction}
          >
            {availableItems.map((definition) => (
              <Menu.Item
                key={definition.id}
                icon={definition.icon}
                description={definition.description}
                textValue={
                  typeof definition.name === 'string'
                    ? definition.name
                    : definition.id
                }
              >
                {definition.name}
              </Menu.Item>
            ))}
          </Menu>
        </Menu.Trigger>
      ) : null}
    </ContentGridElement>
  );
}

function DashboardRootAddControl({ row }: { row: number }) {
  const { t } = useI18n();
  const authoring = useContext(DashboardAuthoringContext);
  const containerItems = useMemo(
    () =>
      authoring.addItems.filter(
        (definition) =>
          definition.kind !== undefined && definition.kind !== 'widget',
      ),
    [authoring.addItems],
  );
  const disabledKeys = useMemo(
    () =>
      containerItems
        .filter((definition) => definition.isDisabled)
        .map((definition) => definition.id),
    [containerItems],
  );
  const handleAction = useEvent((key: Key) => {
    const itemId = String(key);
    const definition = containerItems.find((item) => item.id === itemId);
    if (!definition || definition.isDisabled) return;

    const minRows = clampRows(definition.minRows, 1);
    const maxRows = Math.max(
      minRows,
      clampRows(definition.maxRows, Math.max(12, minRows)),
    );
    const rows = clamp(
      clampRows(definition.defaultRows, minRows),
      minRows,
      maxRows,
    );

    authoring.onAddItem?.(itemId, {
      parentId: null,
      parentKind: 'root',
      parentDepth: 0,
      placement: { column: 0, row, columns: 12, rows },
    });
  });

  if (!authoring.onAddItem || containerItems.length === 0) return null;

  return (
    <Menu.Trigger>
      <RootAddButtonElement
        type="clear"
        icon={<CirclePlusIcon />}
        aria-label={t(
          'dashboard.addTopLevelContainer',
          'Add top-level dashboard container',
        )}
        data-dashboard-root-add-slot=""
        style={{ border: 0 }}
      />
      <Menu
        aria-label={t(
          'dashboard.addTopLevelMenu',
          'Top-level dashboard containers',
        )}
        width="280px"
        disabledKeys={disabledKeys}
        onAction={handleAction}
      >
        {containerItems.map((definition) => (
          <Menu.Item
            key={definition.id}
            icon={definition.icon}
            description={definition.description}
            textValue={
              typeof definition.name === 'string'
                ? definition.name
                : definition.id
            }
          >
            {definition.name}
          </Menu.Item>
        ))}
      </Menu>
    </Menu.Trigger>
  );
}

function useDashboardNodeInteraction({
  id,
  isContainer,
  isSelectable = true,
}: DashboardNodeInteractionOptions) {
  const tree = useContext(DashboardTreeContext);
  const selection = useContext(DashboardSelectionContext);
  const editing = useContext(DashboardEditingContext);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { hoverProps, isHovered } = useHover({});
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  });

  const containerDepth = isContainer
    ? tree.containerDepth + 1
    : tree.containerDepth;
  const canSelect = isSelectable && selection.selectionMode !== 'none';
  const isSelected = selection.selectedKeys.has(id);

  useLayoutEffect(() =>
    selection.register(id, {
      parentId: tree.parentId,
      ancestorIds: tree.ancestorIds,
    }),
  );

  const selectSelf = useEvent((additive = false) => {
    if (canSelect) selection.select(id, additive);
  });

  const onClick = useEvent((event: ReactMouseEvent<HTMLElement>) => {
    if (!canSelect) return;
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    event.stopPropagation();
    selectSelf(event.shiftKey || event.metaKey || event.ctrlKey);
  });

  const onKeyDown = useEvent((event: ReactKeyboardEvent<HTMLElement>) => {
    if (!canSelect || event.target !== event.currentTarget) return;
    if (event.key !== ' ' && event.key !== 'Spacebar') return;
    event.preventDefault();
    event.stopPropagation();
    selectSelf(selection.selectionMode === 'multiple');
  });

  const interactionProps = mergeProps(hoverProps, focusWithinProps, {
    onClick,
    onKeyDown,
  });

  return {
    tree,
    editing,
    containerDepth,
    canSelect,
    isSelected,
    isHovered,
    isFocusWithin,
    interactionProps,
    selectSelf,
  };
}

function isDashboardActionTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;

  return !!element?.closest?.(INTERACTIVE_SELECTOR);
}

function getSurfaceMoveProps(
  moveProps: ReturnType<typeof useMove>['moveProps'],
  canMove: boolean,
  focusRef: { current: HTMLElement | null },
  onPointerStart: (clientX: number, clientY: number) => void,
) {
  if (!canMove) return {};

  return {
    ...moveProps,
    ...(moveProps.onPointerDown && {
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        if (isDashboardActionTarget(event.target)) return;
        onPointerStart(event.clientX, event.clientY);
        focusRef.current?.focus({ preventScroll: true });
        moveProps.onPointerDown?.(event);
      },
    }),
    ...(moveProps.onMouseDown && {
      onMouseDown(event: ReactMouseEvent<HTMLElement>) {
        if (isDashboardActionTarget(event.target)) return;
        onPointerStart(event.clientX, event.clientY);
        focusRef.current?.focus({ preventScroll: true });
        moveProps.onMouseDown?.(event);
      },
    }),
    ...(moveProps.onTouchStart && {
      onTouchStart(event: ReactTouchEvent<HTMLElement>) {
        if (isDashboardActionTarget(event.target)) return;
        const touch = event.touches[0];
        if (touch) onPointerStart(touch.clientX, touch.clientY);
        moveProps.onTouchStart?.(event);
      },
    }),
    ...(moveProps.onKeyDown && {
      onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
        if (event.target !== event.currentTarget) return;
        moveProps.onKeyDown?.(event);
      },
    }),
  };
}

interface DashboardPlacementGesture {
  origin: DashboardPlacement;
  current: DashboardPlacement;
  currentItems: DashboardPlacementChangeItem[];
  sourceParentId: string | null;
  destinationParentId: string | null;
  deltaX: number;
  deltaY: number;
  pointerX: number;
  pointerY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  keyboardColumns: number;
  keyboardRows: number;
  columnStep: number;
  rowStep: number;
  input: DashboardPlacementChangeInput;
  canCommit: boolean;
  items: DashboardGestureItem[];
}

interface DashboardGestureItem {
  id: string;
  origin: DashboardPlacement;
  element: HTMLElement;
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
}

interface DashboardDropTarget {
  parentId: string | null;
  kind: DashboardParentKind;
  columns: number;
  rows: number;
  depth: number;
  rect: DOMRect;
  element: HTMLElement;
}

type DashboardDropStatus = 'valid' | 'danger';

interface DashboardDropPreview {
  id: string;
  target: HTMLElement;
  placement: DashboardPlacement;
  status: DashboardDropStatus;
  coversAddSlot: boolean;
  style: CSSProperties;
}

function parseDashboardAncestorIds(element: HTMLElement): string[] {
  const value = element.dataset.dashboardAncestorIds;
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function findDashboardDropTarget(
  node: HTMLElement,
  clientX: number,
  clientY: number,
  movingId: string,
  isContainer: boolean,
  maximumContainerParentDepth = 2,
): DashboardDropTarget | null {
  const root = node.closest<HTMLElement>('[data-dashboard-root]');
  if (!root) return null;

  const candidates = [
    root,
    ...Array.from(
      root.querySelectorAll<HTMLElement>('[data-dashboard-drop-target]'),
    ),
  ].flatMap((element) => {
    const rect = element.getBoundingClientRect();
    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return [];
    }

    const parentId = element.dataset.dashboardParentId || null;
    const kind = (element.dataset.dashboardContainerKind ??
      'root') as DashboardParentKind;
    const depth = Number(element.dataset.dashboardDepth ?? 0);
    const ancestorIds = parseDashboardAncestorIds(element);

    if (!isContainer && kind === 'root') return [];
    if (
      isContainer &&
      (depth > maximumContainerParentDepth ||
        parentId === movingId ||
        ancestorIds.includes(movingId))
    ) {
      return [];
    }

    return [
      {
        parentId,
        kind,
        columns: Math.max(1, Number(element.dataset.dashboardColumns ?? 12)),
        rows: Math.max(1, Number(element.dataset.dashboardRows ?? 1)),
        depth,
        rect,
        element,
      },
    ];
  });

  candidates.sort(
    (first, second) =>
      second.depth - first.depth ||
      first.rect.width * first.rect.height -
        second.rect.width * second.rect.height,
  );

  return candidates[0] ?? null;
}

function getCrossParentPlacement(
  target: DashboardDropTarget,
  gesture: DashboardPlacementGesture,
  minColumns: number,
  minRows: number,
  isContainer: boolean,
  metrics: DashboardMetrics,
): DashboardPlacement | null {
  if (target.kind === 'root') {
    if (!isContainer) return null;

    const siblingMidpoints = Array.from(target.element.children)
      .filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          child.dataset.dashboardNode === 'container' &&
          child.dataset.dashboardNodeId !== undefined,
      )
      .map((child) => {
        const rect = child.getBoundingClientRect();
        return rect.top + rect.height / 2;
      })
      .filter((midpoint) => Number.isFinite(midpoint));
    const pointerY = gesture.pointerY + gesture.deltaY;

    return {
      column: 0,
      row: siblingMidpoints.filter((midpoint) => midpoint < pointerY).length,
      columns: 12,
      rows: gesture.origin.rows,
    };
  }

  const grabbedItem = gesture.items[0];
  const columns = Math.min(
    target.kind === 'vertical-stack'
      ? grabbedItem.maxColumns
      : gesture.origin.columns,
    target.columns,
  );
  const rows = Math.min(
    target.kind === 'horizontal-stack'
      ? grabbedItem.maxRows
      : gesture.origin.rows,
    target.rows,
  );
  if (columns < minColumns || rows < minRows) return null;

  const columnWidth =
    (target.rect.width - metrics.columnGap * (target.columns - 1)) /
    target.columns;
  const columnStep = Math.max(1, columnWidth + metrics.columnGap);
  const rowStep = Math.max(1, metrics.rowHeight + metrics.rowGap);
  const desiredLeft = gesture.pointerX + gesture.deltaX - gesture.grabOffsetX;
  const desiredTop = gesture.pointerY + gesture.deltaY - gesture.grabOffsetY;
  const column = clamp(
    Math.round((desiredLeft - target.rect.left) / columnStep),
    0,
    target.columns - columns,
  );
  const row = clamp(
    Math.round((desiredTop - target.rect.top) / rowStep),
    0,
    target.rows - rows,
  );

  return {
    column: target.kind === 'vertical-stack' ? 0 : column,
    row: target.kind === 'horizontal-stack' ? 0 : row,
    columns,
    rows,
  };
}

function placementsOverlap(
  first: DashboardPlacement,
  second: DashboardPlacement,
): boolean {
  return (
    first.column < second.column + second.columns &&
    first.column + first.columns > second.column &&
    first.row < second.row + second.rows &&
    first.row + first.rows > second.row
  );
}

function readDashboardNodePlacement(
  element: HTMLElement,
): DashboardPlacement | null {
  const column = Number(element.dataset.dashboardColumn);
  const row = Number(element.dataset.dashboardRow);
  const columns = Number(element.dataset.dashboardColumns);
  const rows = Number(element.dataset.dashboardRows);

  if (![column, row, columns, rows].every(Number.isFinite)) return null;

  return { column, row, columns, rows };
}

function getDashboardGestureItem(
  id: string,
  origin: DashboardPlacement,
  element: HTMLElement,
): DashboardGestureItem {
  const readConstraint = (
    value: string | undefined,
    fallback: number,
  ): number => {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    id,
    origin,
    element,
    minColumns: readConstraint(
      element.dataset.dashboardMinColumns,
      origin.columns,
    ),
    maxColumns: readConstraint(
      element.dataset.dashboardMaxColumns,
      origin.columns,
    ),
    minRows: readConstraint(element.dataset.dashboardMinRows, origin.rows),
    maxRows: readConstraint(element.dataset.dashboardMaxRows, origin.rows),
  };
}

function getDashboardDropSiblings(
  target: DashboardDropTarget,
  movingIds: ReadonlySet<string>,
): DashboardPlacement[] {
  return Array.from(target.element.children).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];
    if (!child.dataset.dashboardNode) return [];
    if (movingIds.has(child.dataset.dashboardNodeId ?? '')) return [];
    if (child.dataset.dashboardAddSlot !== undefined) return [];

    const placement = readDashboardNodePlacement(child);

    return placement ? [placement] : [];
  });
}

function canSwapGridBlocker(
  target: DashboardDropTarget,
  movedPlacement: DashboardPlacement,
  movingOrigin: DashboardPlacement,
  blockers: DashboardPlacement[],
  remaining: DashboardPlacement[],
): boolean {
  if (blockers.length !== 1) return false;
  const blocker = blockers[0];

  for (
    let row = movingOrigin.row;
    row <= movingOrigin.row + movingOrigin.rows - blocker.rows;
    row += 1
  ) {
    for (
      let column = movingOrigin.column;
      column <= movingOrigin.column + movingOrigin.columns - blocker.columns;
      column += 1
    ) {
      const candidate = {
        column,
        row,
        columns: blocker.columns,
        rows: blocker.rows,
      };

      if (
        candidate.column + candidate.columns <= target.columns &&
        candidate.row + candidate.rows <= target.rows &&
        !placementsOverlap(candidate, movedPlacement) &&
        !remaining.some((placement) => placementsOverlap(candidate, placement))
      ) {
        return true;
      }
    }
  }

  return false;
}

function getDashboardDropStatus(
  target: DashboardDropTarget,
  items: DashboardPlacementChangeItem[],
  movingIds: ReadonlySet<string>,
  sourceParentId: string | null,
  movingOrigins: DashboardPlacement[],
): DashboardDropStatus {
  if (target.kind === 'root') return 'valid';

  const siblings = getDashboardDropSiblings(target, movingIds);

  if (target.kind === 'horizontal-stack') {
    const usedColumns = siblings.reduce(
      (total, sibling) => total + sibling.columns,
      0,
    );
    const movingColumns = items.reduce(
      (total, item) => total + item.placement.columns,
      0,
    );

    return usedColumns + movingColumns <= target.columns &&
      items.every((item) => item.placement.rows <= target.rows)
      ? 'valid'
      : 'danger';
  }

  if (target.kind === 'vertical-stack') {
    const usedRows = siblings.reduce(
      (total, sibling) => total + sibling.rows,
      0,
    );
    const movingRows = items.reduce(
      (total, item) => total + item.placement.rows,
      0,
    );

    return usedRows + movingRows <= target.rows ? 'valid' : 'danger';
  }

  const blockers = siblings.filter((sibling) =>
    items.some((item) => placementsOverlap(sibling, item.placement)),
  );
  if (blockers.length === 0) return 'valid';
  if (target.parentId !== sourceParentId || items.length !== 1) return 'danger';

  const remaining = siblings.filter((sibling) => !blockers.includes(sibling));

  return canSwapGridBlocker(
    target,
    items[0].placement,
    movingOrigins[0],
    blockers,
    remaining,
  )
    ? 'valid'
    : 'danger';
}

function getDashboardDropPreviewStyle(
  target: DashboardDropTarget,
  placement: DashboardPlacement,
  movingElement: HTMLElement,
  metrics: DashboardMetrics,
  movingIds: ReadonlySet<string>,
): CSSProperties {
  if (target.kind === 'root') {
    const rootRect = target.element.getBoundingClientRect();
    const siblings = Array.from(target.element.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.dataset.dashboardNode === 'container' &&
        !movingIds.has(child.dataset.dashboardNodeId ?? ''),
    );
    const index = clamp(placement.row, 0, siblings.length);
    const previousRect = siblings[index - 1]?.getBoundingClientRect();
    const nextRect = siblings[index]?.getBoundingClientRect();
    const top = nextRect
      ? nextRect.top - rootRect.top
      : previousRect
        ? previousRect.bottom - rootRect.top + metrics.rowGap
        : 0;

    return {
      left: 0,
      top,
      width: rootRect.width,
      height: movingElement.getBoundingClientRect().height,
    };
  }

  return {
    inset: 0,
    gridColumn:
      target.kind === 'vertical-stack'
        ? '1 / -1'
        : `${placement.column + 1} / span ${placement.columns}`,
    gridRow:
      target.kind === 'horizontal-stack'
        ? `1 / span ${placement.rows}`
        : `${placement.row + 1} / span ${placement.rows}`,
  };
}

function getDashboardGestureItems(
  movingElement: HTMLElement,
  movingId: string,
  movingOrigin: DashboardPlacement,
  isSelected: boolean,
): DashboardGestureItem[] {
  const ownItem = getDashboardGestureItem(
    movingId,
    movingOrigin,
    movingElement,
  );
  if (!isSelected || !movingElement.parentElement) return [ownItem];

  const selectedSiblings = Array.from(
    movingElement.parentElement.children,
  ).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];
    const id = child.dataset.dashboardNodeId;
    if (!id || id === movingId || child.dataset.selected === undefined) {
      return [];
    }

    const origin = readDashboardNodePlacement(child);

    return origin ? [getDashboardGestureItem(id, origin, child)] : [];
  });

  return [ownItem, ...selectedSiblings];
}

function getDashboardGesturePlacements(
  target: DashboardDropTarget,
  gesture: DashboardPlacementGesture,
  grabbedPlacement: DashboardPlacement,
): DashboardPlacementChangeItem[] | null {
  if (gesture.items.length === 1) {
    return [{ id: gesture.items[0].id, placement: grabbedPlacement }];
  }

  if (target.kind === 'root') {
    if (
      gesture.items.some(
        (item) => item.element.dataset.dashboardNode !== 'container',
      )
    ) {
      return null;
    }

    return gesture.items.map((item, index) => ({
      id: item.id,
      placement: {
        ...item.origin,
        column: 0,
        row: grabbedPlacement.row + index,
        columns: 12,
      },
    }));
  }

  const columnDelta = grabbedPlacement.column - gesture.origin.column;
  const rowDelta = grabbedPlacement.row - gesture.origin.row;
  const placements = gesture.items.map((item) => ({
    id: item.id,
    placement: {
      ...item.origin,
      column:
        target.kind === 'vertical-stack' ? 0 : item.origin.column + columnDelta,
      row: target.kind === 'horizontal-stack' ? 0 : item.origin.row + rowDelta,
      columns: Math.min(
        target.kind === 'vertical-stack'
          ? item.maxColumns
          : item.origin.columns,
        target.columns,
      ),
      rows: Math.min(
        target.kind === 'horizontal-stack' ? item.maxRows : item.origin.rows,
        target.rows,
      ),
    },
  }));
  if (
    placements.some((item, index) => {
      const constraints = gesture.items[index];

      return (
        item.placement.columns < constraints.minColumns ||
        item.placement.rows < constraints.minRows
      );
    })
  ) {
    return null;
  }
  const minimumColumn = Math.min(
    ...placements.map((item) => item.placement.column),
  );
  const minimumRow = Math.min(...placements.map((item) => item.placement.row));
  const maximumColumn = Math.max(
    ...placements.map((item) => item.placement.column + item.placement.columns),
  );
  const maximumRow = Math.max(
    ...placements.map((item) => item.placement.row + item.placement.rows),
  );
  const groupColumns = maximumColumn - minimumColumn;
  const groupRows = maximumRow - minimumRow;

  if (groupColumns > target.columns || groupRows > target.rows) return null;

  const shiftColumn =
    minimumColumn < 0
      ? -minimumColumn
      : maximumColumn > target.columns
        ? target.columns - maximumColumn
        : 0;
  const shiftRow =
    minimumRow < 0
      ? -minimumRow
      : maximumRow > target.rows
        ? target.rows - maximumRow
        : 0;

  return placements.map((item) => ({
    ...item,
    placement: {
      ...item.placement,
      column: item.placement.column + shiftColumn,
      row: item.placement.row + shiftRow,
    },
  }));
}

function createDashboardDropPreviews(
  target: DashboardDropTarget,
  items: DashboardPlacementChangeItem[],
  gestureItems: DashboardGestureItem[],
  metrics: DashboardMetrics,
  sourceParentId: string | null,
): DashboardDropPreview[] {
  const movingIds = new Set(items.map((item) => item.id));
  const status = getDashboardDropStatus(
    target,
    items,
    movingIds,
    sourceParentId,
    gestureItems.map((item) => item.origin),
  );
  let rootOffset = 0;
  const addSlotPlacement = Array.from(target.element.children).flatMap(
    (child) => {
      if (!(child instanceof HTMLElement)) return [];
      if (child.dataset.dashboardAddSlot === undefined) return [];

      const placement = readDashboardNodePlacement(child);

      return placement ? [placement] : [];
    },
  )[0];

  return items.map((item) => {
    const gestureItem = gestureItems.find(
      (candidate) => candidate.id === item.id,
    );
    const style = getDashboardDropPreviewStyle(
      target,
      item.placement,
      gestureItem?.element ?? gestureItems[0].element,
      metrics,
      movingIds,
    );

    if (target.kind === 'root') {
      style.top = Number(style.top ?? 0) + rootOffset;
      rootOffset += Number(style.height ?? 0) + metrics.rowGap;
    }

    return {
      id: item.id,
      target: target.element,
      placement: item.placement,
      status,
      coversAddSlot:
        addSlotPlacement !== undefined &&
        placementsOverlap(item.placement, addSlotPlacement),
      style,
    };
  });
}

function useDashboardDropPreview() {
  const [preview, setPreview] = useState<DashboardDropPreview[]>([]);
  const updatePreview = useEvent((next: DashboardDropPreview[] | null) => {
    setPreview(next ?? []);
  });

  return [preview, updatePreview] as const;
}

function renderDashboardDropPreview(previews: DashboardDropPreview[]) {
  return previews.map((preview) =>
    createPortal(
      <DropPlaceholderElement
        key={preview.id}
        aria-hidden="true"
        data-dashboard-drop-status={preview.status}
        data-dashboard-drop-item-id={preview.id}
        data-dashboard-drop-covers-add-slot={preview.coversAddSlot || undefined}
        mods={{ danger: preview.status === 'danger' }}
        style={preview.style}
      />,
      preview.target,
      preview.id,
    ),
  );
}

interface DashboardChildMinimum {
  columns: number;
  rows: number;
}

function getDashboardDescendantContainerDepth(children: ReactNode): number {
  return Children.toArray(children).reduce<number>((maximumDepth, child) => {
    if (!isValidElement(child)) return maximumDepth;

    if (
      child.type === DashboardGrid ||
      child.type === DashboardHorizontalStack ||
      child.type === DashboardVerticalStack ||
      child.type === DashboardTabs
    ) {
      const descendantDepth = getDashboardDescendantContainerDepth(
        (child.props as { children?: ReactNode }).children,
      );
      return Math.max(maximumDepth, 1 + descendantDepth);
    }

    if (child.type === DashboardTab) {
      return Math.max(
        maximumDepth,
        getDashboardDescendantContainerDepth(
          (child.props as { children?: ReactNode }).children,
        ),
      );
    }

    return maximumDepth;
  }, 0);
}

function getContainerChildMinimum(
  kind: DashboardContainerKind,
  children: ReactNode,
  capacityColumns: number,
  capacityRows: number,
): DashboardChildMinimum {
  const directChildren =
    kind === 'tabs'
      ? Children.toArray(children).flatMap((tab) => {
          if (!isValidElement(tab)) return [];
          return Children.toArray(
            (tab.props as { children?: ReactNode }).children,
          );
        })
      : Children.toArray(children);
  const placements = directChildren.flatMap((child) => {
    if (!isValidElement(child)) return [];
    const props = child.props as DashboardPlacementProps & {
      'data-dashboard-add-slot'?: unknown;
    };
    if (props['data-dashboard-add-slot'] !== undefined) return [];

    return [normalizePlacement(props, capacityColumns, capacityRows)];
  });

  if (placements.length === 0) return { columns: 1, rows: 1 };

  if (kind === 'horizontal-stack') {
    return {
      columns: Math.min(
        capacityColumns,
        placements.reduce((total, placement) => total + placement.columns, 0),
      ),
      rows: Math.min(
        capacityRows,
        Math.max(...placements.map((placement) => placement.rows)),
      ),
    };
  }

  if (kind === 'vertical-stack') {
    return {
      columns: Math.min(
        capacityColumns,
        Math.max(...placements.map((placement) => placement.columns)),
      ),
      rows: Math.min(
        capacityRows,
        placements.reduce((total, placement) => total + placement.rows, 0),
      ),
    };
  }

  return {
    columns: Math.min(
      capacityColumns,
      Math.max(
        ...placements.map((placement) => placement.column + placement.columns),
      ),
    ),
    rows: Math.min(
      capacityRows,
      Math.max(
        ...placements.map((placement) => placement.row + placement.rows),
      ),
    ),
  };
}

function hasContainerLayoutChildren(
  kind: DashboardContainerKind,
  children: ReactNode,
): boolean {
  const directChildren =
    kind === 'tabs'
      ? Children.toArray(children).flatMap((tab) => {
          if (!isValidElement(tab)) return [];
          return Children.toArray(
            (tab.props as { children?: ReactNode }).children,
          );
        })
      : Children.toArray(children);

  return directChildren.some((child) => {
    if (!isValidElement(child)) return child !== null && child !== undefined;
    const props = child.props as { 'data-dashboard-add-slot'?: unknown };

    return props['data-dashboard-add-slot'] === undefined;
  });
}

interface DashboardContainerShellProps extends CubeDashboardContainerProps {
  kind: DashboardContainerKind;
  content: ReactNode;
}

const DashboardContainerShell = forwardRef(function DashboardContainerShell(
  props: DashboardContainerShellProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    title,
    kind,
    content,
    isSelectable,
    isMovable = false,
    isResizable = false,
    minColumns = 1,
    maxColumns = 12,
    minRows = 1,
    maxRows,
    onPlacementChange,
    moveLabel,
    resizeLabel,
    onSettingsPress,
    settingsLabel,
    onDeletePress,
    deleteLabel,
    column,
    row,
    columns,
    rows = 1,
    children,
    mods,
    styles: explicitStyles,
    style,
    'aria-label': ariaLabel,
    ...otherProps
  } = props;
  const { t } = useI18n();
  const metrics = useContext(DashboardMetricsContext);
  const localRef = useRef<HTMLDivElement>(null);
  const combinedRef = useCombinedRefs(ref, localRef);
  const moveSessionRef = useRef<DashboardPlacementGesture | null>(null);
  const resizeSessionRef = useRef<DashboardPlacementGesture | null>(null);
  const pointerStartRef = useRef({ clientX: 0, clientY: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dropPreview, updateDropPreview] = useDashboardDropPreview();
  const node = useDashboardNodeInteraction({
    id,
    isContainer: true,
    isSelectable,
  });

  useLayoutEffect(() => {
    node.editing.markArriving(id);
  }, [id, node.editing.markArriving]);

  if (node.containerDepth > 3) {
    throw new Error(
      `Dashboard container "${id}" exceeds the maximum nesting depth of 3.`,
    );
  }

  const extractedStyles = extractStyles(props, CONTAINER_STYLES);
  const styles: Styles = { ...extractedStyles, ...explicitStyles };
  const normalizedPlacement =
    node.tree.parentKind === 'root'
      ? {
          column: 0,
          row: clampRowOrigin(row),
          columns: 12,
          rows: clampRows(rows, 1),
        }
      : normalizePlacement(
          { column, row, columns, rows },
          node.tree.parentColumns,
          node.tree.parentRows,
        );
  const placementStyle = getPlacementStyle(node.tree, normalizedPlacement);
  const childMinimum = getContainerChildMinimum(
    kind,
    children,
    normalizedPlacement.columns,
    normalizedPlacement.rows,
  );
  const descendantContainerDepth =
    getDashboardDescendantContainerDepth(children);
  const isEmpty = !hasContainerLayoutChildren(kind, children);
  const columnLimit = node.tree.parentColumns;
  const rowLimit =
    node.tree.parentKind === 'root'
      ? Math.max(
          childMinimum.rows,
          clampRows(maxRows, Math.max(12, normalizedPlacement.rows)),
        )
      : node.tree.parentRows;
  const resolvedMinColumns = clamp(
    Math.max(clampSpan(minColumns, 1), childMinimum.columns),
    1,
    columnLimit,
  );
  const resolvedMaxColumns = clamp(
    clampSpan(maxColumns, columnLimit),
    resolvedMinColumns,
    columnLimit,
  );
  const resolvedMinRows = clamp(
    Math.max(clampRows(minRows, 1), childMinimum.rows),
    1,
    rowLimit,
  );
  const resolvedMaxRows = clamp(
    clampRows(maxRows, rowLimit),
    resolvedMinRows,
    rowLimit,
  );
  const canMove = isMovable && !!onPlacementChange;
  const canMoveColumns =
    canMove &&
    node.tree.parentKind !== 'root' &&
    node.tree.parentKind !== 'vertical-stack';
  const canMoveRows = canMove && node.tree.parentKind !== 'horizontal-stack';
  const canResizeColumns =
    isResizable &&
    !!onPlacementChange &&
    node.tree.parentKind !== 'root' &&
    node.tree.parentKind !== 'vertical-stack' &&
    resolvedMaxColumns > resolvedMinColumns;
  const canResizeRows =
    isResizable &&
    !!onPlacementChange &&
    node.tree.parentKind !== 'horizontal-stack' &&
    resolvedMaxRows > resolvedMinRows;
  const canResize = canResizeColumns || canResizeRows;
  const resizeAxis = canResizeColumns ? (canResizeRows ? 'both' : 'x') : 'y';
  const shouldRenderTitle = kind === 'tabs' && !!title;
  const label = ariaLabel ?? (typeof title === 'string' ? title : id);
  const baseProps = filterBaseProps(otherProps, {
    eventProps: true,
    labelable: true,
  });
  const reportPlacement = useEvent(
    (
      placement: DashboardPlacement,
      reason: DashboardPlacementChangeReason,
      phase: DashboardPlacementChangePhase,
      input: DashboardPlacementChangeInput,
      sourceParentId = node.tree.layoutParentId,
      destinationParentId = sourceParentId,
      items?: DashboardPlacementChangeItem[],
    ) => {
      onPlacementChange?.(placement, {
        reason,
        phase,
        input,
        ...(destinationParentId !== sourceParentId && {
          sourceParentId,
          destinationParentId,
        }),
        ...(items && items.length > 1 && { items }),
      });
    },
  );
  const createGesture = useEvent(
    (
      input: DashboardPlacementChangeInput,
      reason: DashboardPlacementChangeReason,
    ): DashboardPlacementGesture => {
      const parentWidth =
        localRef.current?.parentElement?.getBoundingClientRect().width ?? 0;
      const columnWidth =
        (parentWidth - metrics.columnGap * (node.tree.parentColumns - 1)) /
          node.tree.parentColumns +
        metrics.columnGap;
      const ownHeight = localRef.current?.getBoundingClientRect().height ?? 0;
      const ownRect = localRef.current?.getBoundingClientRect();
      const pointerX = pointerStartRef.current.clientX;
      const pointerY = pointerStartRef.current.clientY;
      const gestureItems =
        reason === 'move' && input === 'pointer' && localRef.current
          ? getDashboardGestureItems(
              localRef.current,
              id,
              normalizedPlacement,
              node.isSelected,
            )
          : localRef.current
            ? [
                getDashboardGestureItem(
                  id,
                  normalizedPlacement,
                  localRef.current,
                ),
              ]
            : [];

      return {
        origin: normalizedPlacement,
        current: normalizedPlacement,
        currentItems: gestureItems.map((item) => ({
          id: item.id,
          placement: item.origin,
        })),
        sourceParentId: node.tree.layoutParentId,
        destinationParentId: node.tree.layoutParentId,
        deltaX: 0,
        deltaY: 0,
        pointerX,
        pointerY,
        grabOffsetX: ownRect ? pointerX - ownRect.left : 0,
        grabOffsetY: ownRect ? pointerY - ownRect.top : 0,
        keyboardColumns: 0,
        keyboardRows: 0,
        columnStep: Math.max(1, columnWidth),
        rowStep: Math.max(
          1,
          reason === 'move' && node.tree.parentKind === 'root'
            ? ownHeight + metrics.rowGap
            : metrics.rowHeight + metrics.rowGap,
        ),
        input,
        canCommit: true,
        items: gestureItems,
      };
    },
  );
  const updateGestureDeltas = useEvent(
    (
      gesture: DashboardPlacementGesture,
      deltaX: number,
      deltaY: number,
      input: DashboardPlacementChangeInput,
    ) => {
      gesture.input = input;

      if (input === 'keyboard') {
        gesture.keyboardColumns += Math.sign(deltaX);
        gesture.keyboardRows += Math.sign(deltaY);
      } else {
        gesture.deltaX += deltaX;
        gesture.deltaY += deltaY;
      }

      return {
        columns:
          input === 'keyboard'
            ? gesture.keyboardColumns
            : Math.round(gesture.deltaX / gesture.columnStep),
        rows:
          input === 'keyboard'
            ? gesture.keyboardRows
            : Math.round(gesture.deltaY / gesture.rowStep),
      };
    },
  );
  const { moveProps } = useMove({
    onMoveStart(event) {
      if (!canMove) return;
      if (!node.isSelected) node.selectSelf(false);
      node.editing.startMoving(id);
      setIsMoving(true);
      updateDropPreview(null);
      moveSessionRef.current = createGesture(
        event.pointerType === 'keyboard' ? 'keyboard' : 'pointer',
        'move',
      );
    },
    onMove(event) {
      const gesture = moveSessionRef.current;
      if (!canMove || !gesture) return;
      const input = event.pointerType === 'keyboard' ? 'keyboard' : 'pointer';
      const delta = updateGestureDeltas(
        gesture,
        input === 'pointer' || canMoveColumns ? event.deltaX : 0,
        input === 'pointer' || canMoveRows ? event.deltaY : 0,
        input,
      );
      let nextPlacement: DashboardPlacement = {
        ...gesture.origin,
        column: canMoveColumns
          ? clamp(
              gesture.origin.column + delta.columns,
              0,
              node.tree.parentColumns - gesture.origin.columns,
            )
          : gesture.origin.column,
        row: canMoveRows
          ? node.tree.parentKind === 'root'
            ? Math.max(0, gesture.origin.row + delta.rows)
            : clamp(
                gesture.origin.row + delta.rows,
                0,
                node.tree.parentRows - gesture.origin.rows,
              )
          : gesture.origin.row,
      };
      let destinationParentId = gesture.sourceParentId;
      let currentItems: DashboardPlacementChangeItem[] = [
        { id, placement: nextPlacement },
      ];

      if (input === 'pointer' && localRef.current) {
        const target = findDashboardDropTarget(
          localRef.current,
          gesture.pointerX + gesture.deltaX,
          gesture.pointerY + gesture.deltaY,
          id,
          true,
          Math.max(0, 2 - descendantContainerDepth),
        );
        let preview: DashboardDropPreview[] | null = null;

        if (target) {
          if (target.parentId === gesture.sourceParentId) {
            currentItems =
              getDashboardGesturePlacements(target, gesture, nextPlacement) ??
              [];
            preview = currentItems.length
              ? createDashboardDropPreviews(
                  target,
                  currentItems,
                  gesture.items,
                  metrics,
                  gesture.sourceParentId,
                )
              : null;
          } else if (kind !== 'tabs' || target.kind === 'root') {
            const crossParentPlacement = getCrossParentPlacement(
              target,
              gesture,
              resolvedMinColumns,
              resolvedMinRows,
              true,
              metrics,
            );

            if (crossParentPlacement) {
              currentItems =
                getDashboardGesturePlacements(
                  target,
                  gesture,
                  crossParentPlacement,
                ) ?? [];
              if (currentItems.length) {
                nextPlacement =
                  currentItems.find((item) => item.id === id)?.placement ??
                  crossParentPlacement;
                destinationParentId = target.parentId;
                preview = createDashboardDropPreviews(
                  target,
                  currentItems,
                  gesture.items,
                  metrics,
                  gesture.sourceParentId,
                );
              }
            }
          }
        }

        updateDropPreview(preview);
        gesture.canCommit =
          !!preview?.length && preview.every((item) => item.status === 'valid');
        if (!preview?.length) return;
      } else {
        updateDropPreview(null);
        gesture.canCommit = true;
      }

      if (
        isSamePlacement(nextPlacement, gesture.current) &&
        destinationParentId === gesture.destinationParentId
      ) {
        return;
      }
      gesture.current = nextPlacement;
      gesture.currentItems = currentItems;
      gesture.destinationParentId = destinationParentId;
      reportPlacement(
        nextPlacement,
        'move',
        'preview',
        gesture.input,
        gesture.sourceParentId,
        destinationParentId,
        currentItems,
      );
    },
    onMoveEnd() {
      const gesture = moveSessionRef.current;
      moveSessionRef.current = null;
      node.editing.stopMoving(id);
      setIsMoving(false);
      updateDropPreview(null);
      if (
        !canMove ||
        !gesture ||
        !gesture.canCommit ||
        (isSamePlacement(gesture.current, gesture.origin) &&
          gesture.destinationParentId === gesture.sourceParentId)
      ) {
        return;
      }
      reportPlacement(
        gesture.current,
        'move',
        'commit',
        gesture.input,
        gesture.sourceParentId,
        gesture.destinationParentId,
        gesture.currentItems,
      );
    },
  });
  const surfaceMoveProps = getSurfaceMoveProps(
    moveProps,
    canMove,
    localRef,
    (clientX, clientY) => {
      pointerStartRef.current = { clientX, clientY };
    },
  );
  const { moveProps: resizeProps } = useMove({
    onMoveStart(event) {
      if (!canResize) return;
      node.selectSelf(false);
      setIsResizing(true);
      resizeSessionRef.current = createGesture(
        event.pointerType === 'keyboard' ? 'keyboard' : 'pointer',
        'resize',
      );
    },
    onMove(event) {
      const gesture = resizeSessionRef.current;
      if (!canResize || !gesture) return;
      gesture.input = event.pointerType === 'keyboard' ? 'keyboard' : 'pointer';

      if (gesture.input === 'keyboard') {
        gesture.keyboardColumns += canResizeColumns
          ? Math.sign(event.deltaX)
          : 0;
        gesture.keyboardRows += canResizeRows ? Math.sign(event.deltaY) : 0;
      } else {
        gesture.deltaX += canResizeColumns ? event.deltaX : 0;
        gesture.deltaY += canResizeRows ? event.deltaY : 0;
      }

      const columnDelta =
        gesture.input === 'keyboard'
          ? gesture.keyboardColumns
          : Math.round(gesture.deltaX / gesture.columnStep);
      const rowDelta =
        gesture.input === 'keyboard'
          ? gesture.keyboardRows
          : Math.round(gesture.deltaY / gesture.rowStep);
      const maxColumnsAtOrigin = Math.min(
        resolvedMaxColumns,
        node.tree.parentColumns - gesture.origin.column,
      );
      const maxRowsAtOrigin =
        node.tree.parentKind === 'root'
          ? resolvedMaxRows
          : Math.min(
              resolvedMaxRows,
              node.tree.parentRows - gesture.origin.row,
            );
      const nextPlacement: DashboardPlacement = {
        ...gesture.origin,
        columns: canResizeColumns
          ? clamp(
              gesture.origin.columns + columnDelta,
              resolvedMinColumns,
              maxColumnsAtOrigin,
            )
          : gesture.origin.columns,
        rows: canResizeRows
          ? clamp(
              gesture.origin.rows + rowDelta,
              resolvedMinRows,
              maxRowsAtOrigin,
            )
          : gesture.origin.rows,
      };

      if (isSamePlacement(nextPlacement, gesture.current)) return;
      gesture.current = nextPlacement;
      reportPlacement(nextPlacement, 'resize', 'preview', gesture.input);
    },
    onMoveEnd() {
      const gesture = resizeSessionRef.current;
      resizeSessionRef.current = null;
      setIsResizing(false);
      if (
        !canResize ||
        !gesture ||
        isSamePlacement(gesture.current, gesture.origin)
      ) {
        return;
      }
      reportPlacement(gesture.current, 'resize', 'commit', gesture.input);
    },
  });
  const handleSettingsPress = useEvent((event: PressEvent) => {
    node.selectSelf(false);
    onSettingsPress?.(event);
  });
  const handleDeletePress = useEvent((event: PressEvent) => {
    node.selectSelf(false);
    onDeletePress?.(event);
  });
  const resolvedMods = {
    ...mods,
    depth: String(node.containerDepth),
    titled: shouldRenderTitle,
    selected: node.isSelected,
    arriving: node.editing.arrivingIds.has(id),
    hovered: node.isHovered,
    'focus-within': node.isFocusWithin,
    editing: node.editing.isEditing,
    empty: isEmpty,
    dragging: node.editing.movingId !== null,
    movable: canMove,
    moving: isMoving,
    resizing: isResizing,
  };
  const ContainerResizeHandleElement =
    node.tree.parentKind === 'root'
      ? TopLevelResizeHandleElement
      : ResizeHandleElement;

  return (
    <ContainerElement
      {...mergeProps(baseProps, node.interactionProps, surfaceMoveProps)}
      ref={combinedRef}
      role="group"
      aria-label={moveLabel ?? label}
      aria-roledescription={t('dashboard.container', 'Dashboard container')}
      tabIndex={node.canSelect || canMove ? 0 : undefined}
      data-dashboard-node="container"
      data-dashboard-node-id={id}
      data-dashboard-depth={node.containerDepth}
      data-dashboard-column={normalizedPlacement.column}
      data-dashboard-row={normalizedPlacement.row}
      data-dashboard-columns={normalizedPlacement.columns}
      data-dashboard-rows={normalizedPlacement.rows}
      data-dashboard-min-columns={resolvedMinColumns}
      data-dashboard-max-columns={Math.max(
        resolvedMinColumns,
        clampSpan(maxColumns, 12),
      )}
      data-dashboard-min-rows={resolvedMinRows}
      data-dashboard-max-rows={
        maxRows === undefined
          ? Number.MAX_SAFE_INTEGER
          : Math.max(resolvedMinRows, clampRows(maxRows, resolvedMinRows))
      }
      data-selected={node.isSelected || undefined}
      data-arriving={node.editing.arrivingIds.has(id) || undefined}
      data-moving={isMoving || undefined}
      data-resizing={isResizing || undefined}
      data-dashboard-empty={isEmpty || undefined}
      mods={resolvedMods}
      styles={styles}
      style={{ ...placementStyle, ...style }}
    >
      {shouldRenderTitle ? (
        <ContainerHeaderElement data-dashboard-drag-handle="">
          {title}
        </ContainerHeaderElement>
      ) : null}
      {content}
      {onSettingsPress || onDeletePress ? (
        <NodeActionsElement
          aria-hidden={!node.isSelected || undefined}
          mods={resolvedMods}
          data-dashboard-container-actions=""
        >
          {onDeletePress ? (
            <Button
              size="small"
              theme="danger"
              radius="round"
              icon={<TrashIcon />}
              aria-label={
                deleteLabel ??
                t('dashboard.deleteContainer', 'Delete {{container}}', {
                  container: label,
                })
              }
              tabIndex={node.isSelected ? undefined : -1}
              onPress={handleDeletePress}
            />
          ) : null}
          {onSettingsPress ? (
            <Button
              size="small"
              type="primary"
              radius="round"
              icon={<SettingsIcon />}
              aria-label={
                settingsLabel ??
                t('dashboard.settingsContainer', 'Settings for {{container}}', {
                  container: label,
                })
              }
              tabIndex={node.isSelected ? undefined : -1}
              onPress={handleSettingsPress}
            />
          ) : null}
        </NodeActionsElement>
      ) : null}
      {canResize ? (
        <ContainerResizeHandleElement
          {...resizeProps}
          type="button"
          aria-label={
            resizeLabel ??
            t('dashboard.resizeContainer', 'Resize dashboard container')
          }
          data-dashboard-container-resize-handle=""
          data-dashboard-resize-axis={resizeAxis}
          data-dashboard-no-select=""
          aria-hidden={!node.isSelected || undefined}
          tabIndex={node.isSelected ? undefined : -1}
          mods={{
            ...resolvedMods,
            axis: resizeAxis,
            corner: resizeAxis === 'both',
          }}
        >
          <span data-element="Icon">
            {resizeAxis === 'both' ? (
              <CornerResizeGripElement />
            ) : (
              <GripVerticalIcon size="1.5x" />
            )}
          </span>
        </ContainerResizeHandleElement>
      ) : null}
      {renderDashboardDropPreview(dropPreview)}
    </ContainerElement>
  );
});

function DashboardContainer(
  kind: Exclude<DashboardContainerKind, 'tabs'>,
  props: CubeDashboardContainerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { id, columns, rows = 1, children } = props;
  const tree = useContext(DashboardTreeContext);
  const containerDepth = tree.containerDepth + 1;
  const resolvedColumns =
    tree.parentKind === 'root'
      ? 12
      : Math.min(clampSpan(columns, tree.parentColumns), tree.parentColumns);
  const resolvedRows =
    tree.parentKind === 'root'
      ? clampRows(rows, 1)
      : Math.min(clampRows(rows, 1), tree.parentRows);
  const childTree = useMemo<DashboardTreeContextValue>(
    () => ({
      containerDepth,
      parentKind: kind,
      parentId: id,
      layoutParentId: id,
      parentColumns: resolvedColumns,
      parentRows: resolvedRows,
      ancestorIds: [...tree.ancestorIds, id],
    }),
    [containerDepth, id, kind, resolvedColumns, resolvedRows, tree.ancestorIds],
  );

  const content = (
    <DashboardTreeContext.Provider value={childTree}>
      <DashboardContainerContent
        id={id}
        kind={kind}
        columns={resolvedColumns}
        rows={resolvedRows}
        depth={containerDepth}
        ancestorIds={[...tree.ancestorIds, id]}
      >
        {children}
      </DashboardContainerContent>
    </DashboardTreeContext.Provider>
  );

  return (
    <DashboardContainerShell
      {...props}
      ref={ref}
      kind={kind}
      content={content}
    />
  );
}

export const DashboardHorizontalStack = forwardRef(
  function DashboardHorizontalStack(
    props: CubeDashboardContainerProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    return DashboardContainer('horizontal-stack', props, ref);
  },
);
DashboardHorizontalStack.displayName = 'DashboardHorizontalStack';

export const DashboardVerticalStack = forwardRef(
  function DashboardVerticalStack(
    props: CubeDashboardContainerProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    return DashboardContainer('vertical-stack', props, ref);
  },
);
DashboardVerticalStack.displayName = 'DashboardVerticalStack';

export const DashboardGrid = forwardRef(function DashboardGrid(
  props: CubeDashboardContainerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return DashboardContainer('grid', props, ref);
});
DashboardGrid.displayName = 'DashboardGrid';

export const DashboardWidget = forwardRef(function DashboardWidget(
  props: CubeDashboardWidgetProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    children,
    isCard = false,
    isSelectable,
    onSettingsPress,
    settingsLabel,
    onDeletePress,
    deleteLabel,
    isMovable = false,
    isResizable = false,
    minColumns = 1,
    maxColumns = 12,
    minRows = 1,
    maxRows,
    onPlacementChange,
    moveLabel,
    resizeLabel,
    column,
    row,
    columns,
    rows,
    mods,
    styles: explicitStyles,
    style,
    'aria-label': ariaLabel,
    ...otherProps
  } = props;
  const { t } = useI18n();
  const metrics = useContext(DashboardMetricsContext);
  const localRef = useRef<HTMLDivElement>(null);
  const combinedRef = useCombinedRefs(ref, localRef);
  const moveSessionRef = useRef<DashboardPlacementGesture | null>(null);
  const resizeSessionRef = useRef<DashboardPlacementGesture | null>(null);
  const pointerStartRef = useRef({ clientX: 0, clientY: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dropPreview, updateDropPreview] = useDashboardDropPreview();
  const node = useDashboardNodeInteraction({
    id,
    isContainer: false,
    isSelectable,
  });

  if (node.tree.parentKind === 'root') {
    throw new Error(
      `Dashboard.Widget "${id}" must be placed inside a Dashboard container.`,
    );
  }

  const resolvedMinColumns = clamp(
    clampSpan(minColumns, 1),
    1,
    node.tree.parentColumns,
  );
  const resolvedMaxColumns = clamp(
    clampSpan(maxColumns, node.tree.parentColumns),
    resolvedMinColumns,
    node.tree.parentColumns,
  );
  const resolvedMinRows = Math.min(clampRows(minRows, 1), node.tree.parentRows);
  const resolvedMaxRows = clamp(
    clampRows(maxRows, node.tree.parentRows),
    resolvedMinRows,
    node.tree.parentRows,
  );
  const normalizedPlacement = normalizePlacement(
    {
      column,
      row,
      columns: clamp(
        clampSpan(columns, node.tree.parentColumns),
        resolvedMinColumns,
        resolvedMaxColumns,
      ),
      rows: clamp(clampRows(rows, 1), resolvedMinRows, resolvedMaxRows),
    },
    node.tree.parentColumns,
    node.tree.parentRows,
  );
  const canMove = isMovable && !!onPlacementChange;
  const canMoveColumns = canMove && node.tree.parentKind !== 'vertical-stack';
  const canMoveRows = canMove && node.tree.parentKind !== 'horizontal-stack';
  const canResizeColumns =
    isResizable &&
    !!onPlacementChange &&
    node.tree.parentKind !== 'vertical-stack' &&
    resolvedMaxColumns > resolvedMinColumns;
  const canResizeRows =
    isResizable &&
    !!onPlacementChange &&
    node.tree.parentKind !== 'horizontal-stack' &&
    resolvedMaxRows > resolvedMinRows;
  const canResize = canResizeColumns || canResizeRows;
  const resizeAxis = canResizeColumns ? (canResizeRows ? 'both' : 'x') : 'y';

  const extractedStyles = extractStyles(props, CONTAINER_STYLES);
  const styles: Styles = { ...extractedStyles, ...explicitStyles };
  const placementStyle = getPlacementStyle(node.tree, normalizedPlacement);
  const baseProps = filterBaseProps(otherProps, {
    eventProps: true,
    labelable: true,
  });
  const resolvedLabel = ariaLabel ?? id;
  const isAddSlot =
    (
      props as CubeDashboardWidgetProps & {
        'data-dashboard-add-slot'?: unknown;
      }
    )['data-dashboard-add-slot'] !== undefined;
  const resolvedMods = {
    ...mods,
    'add-slot': isAddSlot,
    card: isCard,
    selected: node.isSelected,
    hovered: node.isHovered,
    'focus-within': node.isFocusWithin,
    editing: node.editing.isEditing,
    dragging: node.editing.movingId !== null,
    movable: canMove,
    moving: isMoving,
    resizing: isResizing,
  };
  const reportPlacement = useEvent(
    (
      placement: DashboardPlacement,
      reason: DashboardPlacementChangeReason,
      phase: DashboardPlacementChangePhase,
      input: DashboardPlacementChangeInput,
      sourceParentId = node.tree.layoutParentId,
      destinationParentId = sourceParentId,
      items?: DashboardPlacementChangeItem[],
    ) => {
      onPlacementChange?.(placement, {
        reason,
        phase,
        input,
        ...(destinationParentId !== sourceParentId && {
          sourceParentId,
          destinationParentId,
        }),
        ...(items && items.length > 1 && { items }),
      });
    },
  );
  const createGesture = useEvent(
    (input: DashboardPlacementChangeInput): DashboardPlacementGesture => {
      const parentWidth =
        localRef.current?.parentElement?.getBoundingClientRect().width ?? 0;
      const columnWidth =
        (parentWidth - metrics.columnGap * (node.tree.parentColumns - 1)) /
          node.tree.parentColumns +
        metrics.columnGap;
      const ownRect = localRef.current?.getBoundingClientRect();
      const pointerX = pointerStartRef.current.clientX;
      const pointerY = pointerStartRef.current.clientY;
      const gestureItems =
        input === 'pointer' && localRef.current
          ? getDashboardGestureItems(
              localRef.current,
              id,
              normalizedPlacement,
              node.isSelected,
            )
          : localRef.current
            ? [
                getDashboardGestureItem(
                  id,
                  normalizedPlacement,
                  localRef.current,
                ),
              ]
            : [];

      return {
        origin: normalizedPlacement,
        current: normalizedPlacement,
        currentItems: gestureItems.map((item) => ({
          id: item.id,
          placement: item.origin,
        })),
        sourceParentId: node.tree.layoutParentId,
        destinationParentId: node.tree.layoutParentId,
        deltaX: 0,
        deltaY: 0,
        pointerX,
        pointerY,
        grabOffsetX: ownRect ? pointerX - ownRect.left : 0,
        grabOffsetY: ownRect ? pointerY - ownRect.top : 0,
        keyboardColumns: 0,
        keyboardRows: 0,
        columnStep: Math.max(1, columnWidth),
        rowStep: Math.max(1, metrics.rowHeight + metrics.rowGap),
        input,
        canCommit: true,
        items: gestureItems,
      };
    },
  );
  const updateGestureDeltas = useEvent(
    (
      gesture: DashboardPlacementGesture,
      deltaX: number,
      deltaY: number,
      input: DashboardPlacementChangeInput,
    ) => {
      gesture.input = input;

      if (input === 'keyboard') {
        gesture.keyboardColumns += Math.sign(deltaX);
        gesture.keyboardRows += Math.sign(deltaY);
      } else {
        gesture.deltaX += deltaX;
        gesture.deltaY += deltaY;
      }

      return {
        columns:
          input === 'keyboard'
            ? gesture.keyboardColumns
            : Math.round(gesture.deltaX / gesture.columnStep),
        rows:
          input === 'keyboard'
            ? gesture.keyboardRows
            : Math.round(gesture.deltaY / gesture.rowStep),
      };
    },
  );
  const { moveProps } = useMove({
    onMoveStart(event) {
      if (!canMove) return;
      if (!node.isSelected) node.selectSelf(false);
      node.editing.startMoving(id);
      setIsMoving(true);
      updateDropPreview(null);
      moveSessionRef.current = createGesture(
        event.pointerType === 'keyboard' ? 'keyboard' : 'pointer',
      );
    },
    onMove(event) {
      const gesture = moveSessionRef.current;
      if (!canMove || !gesture) return;
      const input = event.pointerType === 'keyboard' ? 'keyboard' : 'pointer';
      const delta = updateGestureDeltas(
        gesture,
        input === 'pointer' || canMoveColumns ? event.deltaX : 0,
        input === 'pointer' || canMoveRows ? event.deltaY : 0,
        input,
      );
      let nextPlacement: DashboardPlacement = {
        ...gesture.origin,
        column: canMoveColumns
          ? clamp(
              gesture.origin.column + delta.columns,
              0,
              node.tree.parentColumns - gesture.origin.columns,
            )
          : gesture.origin.column,
        row: canMoveRows
          ? clamp(
              gesture.origin.row + delta.rows,
              0,
              node.tree.parentRows - gesture.origin.rows,
            )
          : gesture.origin.row,
      };
      let destinationParentId = gesture.sourceParentId;
      let currentItems: DashboardPlacementChangeItem[] = [
        { id, placement: nextPlacement },
      ];

      if (input === 'pointer' && localRef.current) {
        const target = findDashboardDropTarget(
          localRef.current,
          gesture.pointerX + gesture.deltaX,
          gesture.pointerY + gesture.deltaY,
          id,
          false,
        );
        let preview: DashboardDropPreview[] | null = null;

        if (target) {
          if (target.parentId === gesture.sourceParentId) {
            currentItems =
              getDashboardGesturePlacements(target, gesture, nextPlacement) ??
              [];
            preview = currentItems.length
              ? createDashboardDropPreviews(
                  target,
                  currentItems,
                  gesture.items,
                  metrics,
                  gesture.sourceParentId,
                )
              : null;
          } else {
            const crossParentPlacement = getCrossParentPlacement(
              target,
              gesture,
              resolvedMinColumns,
              resolvedMinRows,
              false,
              metrics,
            );

            if (crossParentPlacement) {
              currentItems =
                getDashboardGesturePlacements(
                  target,
                  gesture,
                  crossParentPlacement,
                ) ?? [];
              if (currentItems.length) {
                nextPlacement =
                  currentItems.find((item) => item.id === id)?.placement ??
                  crossParentPlacement;
                destinationParentId = target.parentId;
                preview = createDashboardDropPreviews(
                  target,
                  currentItems,
                  gesture.items,
                  metrics,
                  gesture.sourceParentId,
                );
              }
            }
          }
        }

        updateDropPreview(preview);
        gesture.canCommit =
          !!preview?.length && preview.every((item) => item.status === 'valid');
        if (!preview?.length) return;
      } else {
        updateDropPreview(null);
        gesture.canCommit = true;
      }

      if (
        isSamePlacement(nextPlacement, gesture.current) &&
        destinationParentId === gesture.destinationParentId
      ) {
        return;
      }
      gesture.current = nextPlacement;
      gesture.currentItems = currentItems;
      gesture.destinationParentId = destinationParentId;
      reportPlacement(
        nextPlacement,
        'move',
        'preview',
        gesture.input,
        gesture.sourceParentId,
        destinationParentId,
        currentItems,
      );
    },
    onMoveEnd() {
      const gesture = moveSessionRef.current;
      moveSessionRef.current = null;
      node.editing.stopMoving(id);
      setIsMoving(false);
      updateDropPreview(null);
      if (
        !canMove ||
        !gesture ||
        !gesture.canCommit ||
        (isSamePlacement(gesture.current, gesture.origin) &&
          gesture.destinationParentId === gesture.sourceParentId)
      ) {
        return;
      }
      reportPlacement(
        gesture.current,
        'move',
        'commit',
        gesture.input,
        gesture.sourceParentId,
        gesture.destinationParentId,
        gesture.currentItems,
      );
    },
  });
  const surfaceMoveProps = getSurfaceMoveProps(
    moveProps,
    canMove,
    localRef,
    (clientX, clientY) => {
      pointerStartRef.current = { clientX, clientY };
    },
  );
  const { moveProps: resizeProps } = useMove({
    onMoveStart(event) {
      if (!canResize) return;
      node.selectSelf(false);
      setIsResizing(true);
      resizeSessionRef.current = createGesture(
        event.pointerType === 'keyboard' ? 'keyboard' : 'pointer',
      );
    },
    onMove(event) {
      const gesture = resizeSessionRef.current;
      if (!canResize || !gesture) return;
      const delta = updateGestureDeltas(
        gesture,
        canResizeColumns ? event.deltaX : 0,
        canResizeRows ? event.deltaY : 0,
        event.pointerType === 'keyboard' ? 'keyboard' : 'pointer',
      );
      const maxColumnsAtOrigin = Math.min(
        resolvedMaxColumns,
        node.tree.parentColumns - gesture.origin.column,
      );
      const maxRowsAtOrigin = Math.min(
        resolvedMaxRows,
        node.tree.parentRows - gesture.origin.row,
      );
      const nextPlacement: DashboardPlacement = {
        ...gesture.origin,
        columns: canResizeColumns
          ? clamp(
              gesture.origin.columns + delta.columns,
              resolvedMinColumns,
              maxColumnsAtOrigin,
            )
          : gesture.origin.columns,
        rows: canResizeRows
          ? clamp(
              gesture.origin.rows + delta.rows,
              resolvedMinRows,
              maxRowsAtOrigin,
            )
          : gesture.origin.rows,
      };

      if (isSamePlacement(nextPlacement, gesture.current)) return;
      gesture.current = nextPlacement;
      reportPlacement(nextPlacement, 'resize', 'preview', gesture.input);
    },
    onMoveEnd() {
      const gesture = resizeSessionRef.current;
      resizeSessionRef.current = null;
      setIsResizing(false);
      if (
        !canResize ||
        !gesture ||
        isSamePlacement(gesture.current, gesture.origin)
      ) {
        return;
      }
      reportPlacement(gesture.current, 'resize', 'commit', gesture.input);
    },
  });
  const handleSettingsPress = useEvent((event: PressEvent) => {
    node.selectSelf(false);
    onSettingsPress?.(event);
  });
  const handleDeletePress = useEvent((event: PressEvent) => {
    node.selectSelf(false);
    onDeletePress?.(event);
  });

  return (
    <WidgetElement
      {...mergeProps(baseProps, node.interactionProps, surfaceMoveProps)}
      ref={combinedRef}
      role="group"
      aria-label={moveLabel ?? resolvedLabel}
      aria-roledescription={t(
        canMove ? 'dashboard.movableWidget' : 'dashboard.widget',
        canMove ? 'Movable dashboard widget' : 'Dashboard widget',
      )}
      tabIndex={node.canSelect || canMove ? 0 : undefined}
      data-dashboard-node="widget"
      data-dashboard-node-id={id}
      data-dashboard-column={normalizedPlacement.column}
      data-dashboard-row={normalizedPlacement.row}
      data-dashboard-columns={normalizedPlacement.columns}
      data-dashboard-rows={normalizedPlacement.rows}
      data-dashboard-min-columns={clampSpan(minColumns, 1)}
      data-dashboard-max-columns={Math.max(
        clampSpan(minColumns, 1),
        clampSpan(maxColumns, 12),
      )}
      data-dashboard-min-rows={clampRows(minRows, 1)}
      data-dashboard-max-rows={
        maxRows === undefined
          ? Number.MAX_SAFE_INTEGER
          : Math.max(clampRows(minRows, 1), clampRows(maxRows, 1))
      }
      data-selected={node.isSelected || undefined}
      data-moving={isMoving || undefined}
      data-resizing={isResizing || undefined}
      mods={resolvedMods}
      style={{ ...placementStyle, ...style }}
    >
      <WidgetSurfaceElement mods={resolvedMods} styles={styles}>
        {children}
      </WidgetSurfaceElement>
      {onSettingsPress || onDeletePress ? (
        <NodeActionsElement
          aria-hidden={!node.isSelected || undefined}
          mods={resolvedMods}
          data-dashboard-widget-actions=""
        >
          {onDeletePress ? (
            <Button
              size="small"
              theme="danger"
              radius="round"
              icon={<TrashIcon />}
              aria-label={
                deleteLabel ??
                t('dashboard.deleteWidget', 'Delete {{widget}}', {
                  widget: resolvedLabel,
                })
              }
              tabIndex={node.isSelected ? undefined : -1}
              onPress={handleDeletePress}
            />
          ) : null}
          {onSettingsPress ? (
            <Button
              size="small"
              type="primary"
              radius="round"
              icon={<SettingsIcon />}
              aria-label={settingsLabel ?? resolvedLabel}
              tabIndex={node.isSelected ? undefined : -1}
              onPress={handleSettingsPress}
            />
          ) : null}
        </NodeActionsElement>
      ) : null}
      {canResize ? (
        <ResizeHandleElement
          {...resizeProps}
          type="button"
          aria-label={
            resizeLabel ??
            t('dashboard.resizeWidget', 'Resize dashboard widget')
          }
          data-dashboard-resize-handle=""
          data-dashboard-resize-axis={resizeAxis}
          data-dashboard-no-select=""
          aria-hidden={!node.isSelected || undefined}
          tabIndex={node.isSelected ? undefined : -1}
          mods={{
            ...resolvedMods,
            axis: resizeAxis,
            corner: resizeAxis === 'both',
          }}
        >
          <span data-element="Icon">
            {resizeAxis === 'both' ? (
              <CornerResizeGripElement />
            ) : (
              <GripVerticalIcon size="1.5x" />
            )}
          </span>
        </ResizeHandleElement>
      ) : null}
      {renderDashboardDropPreview(dropPreview)}
    </WidgetElement>
  );
});

export function DashboardTab(
  _props: CubeDashboardTabProps,
): ReactElement | null {
  return null;
}

DashboardTab.displayName = 'DashboardTab';

function isDashboardTab(
  child: ReactNode,
): child is ReactElement<CubeDashboardTabProps> {
  return (
    isValidElement(child) &&
    (child.type === DashboardTab ||
      (child.type as { displayName?: string }).displayName ===
        DashboardTab.displayName)
  );
}

function isDashboardTabLayoutContainer(child: ReactNode): boolean {
  if (!isValidElement(child)) return false;

  const displayName = (child.type as { displayName?: string }).displayName;

  return (
    child.type === DashboardGrid ||
    child.type === DashboardHorizontalStack ||
    child.type === DashboardVerticalStack ||
    displayName === DashboardGrid.displayName ||
    displayName === DashboardHorizontalStack.displayName ||
    displayName === DashboardVerticalStack.displayName
  );
}

export const DashboardTabs = forwardRef(function DashboardTabs(
  props: CubeDashboardTabsProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    children,
    rows = 1,
    activeKey,
    defaultActiveKey,
    onActiveChange,
    ...containerProps
  } = props;
  const tree = useContext(DashboardTreeContext);

  if (tree.parentKind !== 'root') {
    throw new Error(
      `Dashboard.Tabs "${id}" is only allowed directly inside Dashboard.`,
    );
  }

  const tabs = Children.toArray(children).filter(isDashboardTab);
  const content = (
    <Tabs
      activeKey={activeKey}
      defaultActiveKey={defaultActiveKey ?? tabs[0]?.props.id}
      onChange={onActiveChange}
      keepMounted
      label={
        props['aria-label'] ??
        (typeof props.title === 'string' ? props.title : id)
      }
      height="100%"
      barStyles={{ borderBottom: '1bw #border', marginBottom: '1x' }}
    >
      {tabs.map((tab) => {
        const tabLayoutId = `${id}:${tab.props.id}`;
        const tabLayoutChildren = Children.toArray(tab.props.children);

        if (
          tabLayoutChildren.length > 1 ||
          tabLayoutChildren.some(
            (child) => !isDashboardTabLayoutContainer(child),
          )
        ) {
          throw new Error(
            `Dashboard.Tab "${tab.props.id}" inside "${id}" accepts one Grid, HorizontalStack, or VerticalStack layout container only.`,
          );
        }

        const tabTree: DashboardTreeContextValue = {
          containerDepth: 1,
          parentKind: 'tabs',
          parentId: tabLayoutId,
          layoutParentId: tabLayoutId,
          parentColumns: 12,
          parentRows: Math.max(1, Math.floor(rows)),
          ancestorIds: [...tree.ancestorIds, id],
        };

        return (
          <Tab
            key={tab.props.id}
            title={tab.props.title}
            keepMounted={tab.props.keepMounted ?? true}
          >
            <DashboardTreeContext.Provider value={tabTree}>
              <DashboardContainerContent
                id={tabLayoutId}
                kind="tabs"
                columns={12}
                rows={Math.max(1, Math.floor(rows))}
                depth={1}
                ancestorIds={[...tree.ancestorIds, id]}
                tabsId={id}
                tabId={tab.props.id}
              >
                {tab.props.children}
              </DashboardContainerContent>
            </DashboardTreeContext.Provider>
          </Tab>
        );
      })}
    </Tabs>
  );

  return (
    <DashboardContainerShell
      {...containerProps}
      ref={ref}
      id={id}
      rows={rows}
      kind="tabs"
      content={content}
      children={children}
    />
  );
});

const DashboardRoot = forwardRef(function DashboardRoot(
  props: CubeDashboardProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    rowHeight = 80,
    gap = 16,
    isEditing = false,
    selectionMode = 'multiple',
    selectedKeys: controlledSelectedKeys,
    defaultSelectedKeys = [],
    onSelectionChange,
    addItems = [],
    onAddItem,
    styles: explicitStyles,
    style,
    ...otherProps
  } = props;
  const [columnGap, rowGap] = normalizeGap(gap);
  const [uncontrolledSelectedKeys, setUncontrolledSelectedKeys] =
    useState<string[]>(defaultSelectedKeys);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [arrivingIds, setArrivingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const acceptsArrivalsRef = useRef(false);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const registrationsRef = useRef(new Map<string, DashboardNodeRegistration>());
  const isControlled = controlledSelectedKeys !== undefined;
  const selectedKeys =
    selectionMode === 'none'
      ? []
      : controlledSelectedKeys ?? uncontrolledSelectedKeys;
  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const commitSelection = useEvent((next: string[]) => {
    if (!isControlled) setUncontrolledSelectedKeys(next);
    onSelectionChange?.(next);
  });

  const register = useEvent(
    (id: string, registration: DashboardNodeRegistration) => {
      registrationsRef.current.set(id, registration);
      return () => {
        const current = registrationsRef.current.get(id);
        if (current === registration) registrationsRef.current.delete(id);
      };
    },
  );

  const select = useEvent((id: string, additive: boolean) => {
    if (selectionMode === 'none') return;
    const registration = registrationsRef.current.get(id);
    if (!registration) return;

    if (selectionMode === 'single' || !additive) {
      commitSelection([id]);
      return;
    }

    const current = new Set(selectedKeySet);
    if (current.has(id)) {
      current.delete(id);
      commitSelection([...current]);
      return;
    }

    for (const selectedId of current) {
      const selected = registrationsRef.current.get(selectedId);
      if (!selected) continue;

      if (registration.ancestorIds.includes(selectedId)) {
        return;
      }

      if (selected.parentId !== registration.parentId) {
        return;
      }

      if (selected.ancestorIds.includes(id)) {
        current.delete(selectedId);
      }
    }

    current.add(id);
    commitSelection([...current]);
  });
  const handleRootClick = useEvent((event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-dashboard-node]')) return;
    if (selectedKeySet.size > 0) commitSelection([]);
  });
  const startMoving = useEvent((id: string) => setMovingId(id));
  const stopMoving = useEvent((id: string) => {
    setMovingId((current) => (current === id ? null : current));
  });
  const markArriving = useEvent((id: string) => {
    if (!acceptsArrivalsRef.current) return;

    if (arrivalTimerRef.current !== null) {
      clearTimeout(arrivalTimerRef.current);
    }
    setArrivingIds((current) => new Set(current).add(id));
    arrivalTimerRef.current = setTimeout(() => {
      setArrivingIds(new Set());
      arrivalTimerRef.current = null;
    }, 1000);
  });

  useLayoutEffect(() => {
    acceptsArrivalsRef.current = true;

    return () => {
      acceptsArrivalsRef.current = false;
      if (arrivalTimerRef.current !== null) {
        clearTimeout(arrivalTimerRef.current);
      }
    };
  }, []);

  const metrics = useMemo<DashboardMetrics>(
    () => ({
      rowHeight: Math.max(1, rowHeight),
      columnGap: Math.max(0, columnGap),
      rowGap: Math.max(0, rowGap),
    }),
    [columnGap, rowGap, rowHeight],
  );
  const selection = useMemo<DashboardSelectionContextValue>(
    () => ({
      selectionMode,
      selectedKeys: selectedKeySet,
      register,
      select,
    }),
    [register, select, selectedKeySet, selectionMode],
  );
  const editing = useMemo<DashboardEditingContextValue>(
    () => ({
      isEditing,
      movingId,
      arrivingIds,
      markArriving,
      startMoving,
      stopMoving,
    }),
    [arrivingIds, isEditing, markArriving, movingId, startMoving, stopMoving],
  );
  const authoring = useMemo<DashboardAuthoringContextValue>(
    () => ({ addItems, onAddItem }),
    [addItems, onAddItem],
  );
  const rootTree = useMemo<DashboardTreeContextValue>(
    () => ({
      containerDepth: 0,
      parentKind: 'root',
      parentId: null,
      layoutParentId: null,
      parentColumns: 12,
      parentRows: 1,
      ancestorIds: [],
    }),
    [],
  );
  const extractedStyles = extractStyles(props, CONTAINER_STYLES);
  const styles: Styles = { ...extractedStyles, ...explicitStyles };
  const baseProps = filterBaseProps(otherProps, {
    eventProps: true,
    labelable: true,
  });

  return (
    <DashboardMetricsContext.Provider value={metrics}>
      <DashboardSelectionContext.Provider value={selection}>
        <DashboardEditingContext.Provider value={editing}>
          <DashboardAuthoringContext.Provider value={authoring}>
            <DashboardTreeContext.Provider value={rootTree}>
              <DashboardElement
                {...mergeProps(baseProps, { onClick: handleRootClick })}
                ref={ref}
                styles={styles}
                style={{ gap: `${metrics.rowGap}px`, ...style }}
                data-editing={isEditing || undefined}
                data-dragging={movingId !== null || undefined}
                data-dashboard-root=""
                data-dashboard-drop-target=""
                data-dashboard-parent-id=""
                data-dashboard-container-kind="root"
                data-dashboard-columns={12}
                data-dashboard-rows={Math.max(1, Children.count(children))}
                data-dashboard-depth={0}
                data-dashboard-ancestor-ids="[]"
              >
                {children}
                {isEditing ? (
                  <DashboardRootAddControl row={Children.count(children)} />
                ) : null}
              </DashboardElement>
            </DashboardTreeContext.Provider>
          </DashboardAuthoringContext.Provider>
        </DashboardEditingContext.Provider>
      </DashboardSelectionContext.Provider>
    </DashboardMetricsContext.Provider>
  );
});

export const Dashboard = Object.assign(DashboardRoot, {
  HorizontalStack: DashboardHorizontalStack,
  VerticalStack: DashboardVerticalStack,
  Grid: DashboardGrid,
  Tabs: DashboardTabs,
  Tab: DashboardTab,
  Widget: DashboardWidget,
});
