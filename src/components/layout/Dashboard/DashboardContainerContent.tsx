import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { CirclePlusIcon } from '../../../icons/CirclePlusIcon';
import { Button } from '../../actions/Button/Button';
import { Menu } from '../../actions/Menu/Menu';
import { useAnchoredMenu } from '../../actions/use-anchored-menu';

import {
  DashboardAuthoringContext,
  DashboardEditingContext,
  DashboardMetricsContext,
} from './context';
import {
  applyDashboardStackDistribution,
  getContainerChildMinimum,
  getDashboardAddPlacement,
  getDashboardChildPlacements,
  getDashboardFreeCells,
  getDashboardFreeRegion,
} from './occupancy';
import {
  clamp,
  clampRows,
  getContentGridStyle,
  isSamePlacement,
  pointToCell,
} from './placement';
import {
  ADD_CELL_BUTTON_STYLES,
  ContentGridElement,
  FreeCellElement,
  FreeCellsLayerElement,
  RootAddButtonElement,
} from './styles';

import type { FocusableRefValue, Key, PressEvent } from '@react-types/shared';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from 'react';
import type { DashboardFreeCell } from './occupancy';
import type {
  DashboardAddItemDefinition,
  DashboardContainerKind,
  DashboardPlacement,
} from './types';

/** Which arrow key grows the region on which axis, and in which direction. */
const REGION_KEYS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

export interface DashboardContainerContentProps {
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

interface AddItemsMenuProps {
  label: string;
  items: readonly DashboardAddItemDefinition[];
  disabledKeys: string[];
  onAction: (key: Key) => void;
}

/**
 * The insertion menu, as a standalone component so `useAnchoredMenu` can render
 * it without a `Menu.Trigger` wrapping the add button.
 *
 * The button cannot be a press trigger: a region gesture ends wherever the
 * pointer stopped — possibly outside the button, which has been resizing under
 * it — and it has to open from the keyboard too. Both routes call `open()`.
 */
function AddItemsMenu({
  label,
  items,
  disabledKeys,
  onAction,
}: AddItemsMenuProps) {
  return (
    <Menu
      aria-label={label}
      width="280px"
      disabledKeys={disabledKeys}
      onAction={onAction}
    >
      {items.map((definition) => (
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
  );
}

export function DashboardContainerContent({
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
  const gridRef = useRef<HTMLDivElement>(null);
  const [isOwnHovered, setIsOwnHovered] = useState(false);
  const [activeCell, setActiveCell] = useState<DashboardFreeCell | null>(null);
  const [openAddCell, setOpenAddCell] = useState<DashboardFreeCell | null>(
    null,
  );
  const openAddCellRef = useRef<DashboardFreeCell | null>(null);
  /** The area the add button currently claims, `null` while it is one cell. */
  const [addRegion, setAddRegion] = useState<DashboardPlacement | null>(null);
  const addRegionRef = useRef<DashboardPlacement | null>(null);
  const isClaimingRef = useRef(false);
  /** Set by an Escape that abandons a claim, so the release does not open. */
  const isAbandonedRef = useRef(false);
  /** Tears down a live claim's window listeners, including on unmount. */
  const stopClaimRef = useRef<(() => void) | null>(null);
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
  /**
   * How far this stack's current children could be squeezed, on its own axis.
   *
   * A stack always fills itself, so its children's drawn spans say nothing
   * about whether there is room for one more — only their floor does. It is
   * what decides whether the stack offers an insertion point at all, and which
   * catalog items that insertion point can seat.
   */
  const stackFloor = useMemo(() => {
    const isHorizontal = kind === 'horizontal-stack';
    if (!isHorizontal && kind !== 'vertical-stack') return 0;

    const floor = getContainerChildMinimum(kind, children, columns, rows);

    return isHorizontal ? floor.columns : floor.rows;
  }, [children, columns, kind, rows]);
  const isStack = kind === 'horizontal-stack' || kind === 'vertical-stack';
  /**
   * A stack being authored gets a narrow track past its last child to hold the
   * insertion point, for as long as its children could make room for one.
   */
  const hasStackAddTrack =
    isStack &&
    editing.isEditing &&
    stackFloor < (kind === 'horizontal-stack' ? columns : rows);
  // A stack's children are re-spanned to the space it actually has before
  // anything else looks at them, so placements, free cells and the rendered
  // tree all describe the same layout.
  const layoutChildren = useMemo(
    () => applyDashboardStackDistribution(kind, children, columns, rows),
    [children, columns, kind, rows],
  );
  const placements = useMemo(
    () => getDashboardChildPlacements(kind, layoutChildren, columns, rows),
    [columns, kind, layoutChildren, rows],
  );
  const freeCells = useMemo(
    () =>
      isStack && !hasStackAddTrack
        ? []
        : getDashboardFreeCells(kind, placements, columns, rows, stackFloor),
    [columns, hasStackAddTrack, isStack, kind, placements, rows, stackFloor],
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
  /**
   * A one-cell region is indistinguishable from no region at all, and has to
   * stay that way: as a demand it would disable every item whose minimum is
   * larger than a cell, which is most of a real catalog.
   */
  const claimedRegion =
    addRegion && (addRegion.columns > 1 || addRegion.rows > 1)
      ? addRegion
      : undefined;
  /** Only a grid has more than one insertion point to drag across. */
  const canClaimRegion = kind === 'grid';
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
                claimedRegion,
                stackFloor,
              )
            : null,
        ]),
      ),
    [
      availableItems,
      claimedRegion,
      columns,
      depth,
      kind,
      placements,
      addButtonCell,
      rows,
      stackFloor,
    ],
  );
  const disabledKeys = useMemo(
    () =>
      availableItems
        .filter((definition) => !activePlacements.get(definition.id))
        .map((definition) => definition.id),
    [activePlacements, availableItems],
  );
  const buttonPlacement: DashboardPlacement | null = !addButtonCell
    ? null
    : claimedRegion ?? { ...addButtonCell, columns: 1, rows: 1 };

  const handleAction = useEvent((key: Key) => {
    const itemId = String(key);
    const definition = availableItems.find((item) => item.id === itemId);
    const region = addRegionRef.current;
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
            region && (region.columns > 1 || region.rows > 1)
              ? region
              : undefined,
            stackFloor,
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

  const addMenu = useAnchoredMenu<AddItemsMenuProps>(
    AddItemsMenu,
    { placement: 'bottom start' },
    {
      label: t('dashboard.addMenu', 'Items available for {{container}}', {
        container: id,
      }),
      items: availableItems,
      disabledKeys,
      onAction: handleAction,
    },
  );
  const isAddMenuOpen = addMenu.isOpen;

  const updateHover = useEvent((event: ReactPointerEvent<HTMLDivElement>) => {
    // The claimed area must not follow the pointer's incidental hovers: both an
    // open menu and a live region gesture own the target cell.
    if (isAddMenuOpen || isClaimingRef.current) return;

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
    // A claim drag routinely crosses the container's edge; hiding the control
    // there would erase the area the pointer is still choosing.
    if (isClaimingRef.current) return;

    setIsOwnHovered(false);
  });
  const lockAddCell = useEvent(() => {
    openAddCellRef.current = addButtonCell;
    setOpenAddCell(addButtonCell);
  });
  const setRegion = useEvent((next: DashboardPlacement | null) => {
    addRegionRef.current = next;
    setAddRegion((current) =>
      current && next && isSamePlacement(current, next) ? current : next,
    );
  });
  const openAddMenu = useEvent(() => {
    // `usePress` does not cancel a press on Escape, so the abandoned claim's
    // own release still arrives here. Escape means "never mind", not "open the
    // menu on one cell".
    if (isAbandonedRef.current) {
      isAbandonedRef.current = false;
      return;
    }

    lockAddCell();
    addMenu.open();
  });

  /**
   * Press-and-drag across free cells to claim the area before choosing what
   * goes in it. The button itself grows to the claimed area, so the affordance
   * shows the outcome rather than describing it.
   *
   * Hung off `onPressStart` rather than a DOM `pointerdown`, because `Button`
   * filters raw event props out; the press gives no coordinates, but none are
   * needed until the first move, which the window listener below reads
   * directly.
   */
  const startRegionClaim = useEvent((event: PressEvent) => {
    const anchor = addButtonCell;
    const grid = gridRef.current;
    const isPointer =
      event.pointerType !== 'keyboard' && event.pointerType !== 'virtual';
    if (!canClaimRegion || !anchor || !grid || !isPointer) return;

    // Freeze the target cell and the free-cell set for the gesture: nothing is
    // inserted mid-drag, so the layout they describe cannot change.
    const cells = freeCells;
    lockAddCell();
    isClaimingRef.current = true;
    setRegion({ ...anchor, columns: 1, rows: 1 });

    const stop = () => {
      isClaimingRef.current = false;
      stopClaimRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKeyDown);
    };

    function onPointerMove(pointer: PointerEvent) {
      const cell = pointToCell(
        { x: pointer.clientX, y: pointer.clientY },
        grid!.getBoundingClientRect(),
        columns,
        rows,
        metrics,
      );

      setRegion(getDashboardFreeRegion(anchor!, cell, cells, columns, rows));
    }

    function onPointerUp() {
      stop();
      openAddMenu();
    }

    function onCancel() {
      isAbandonedRef.current = true;
      stop();
      setRegion(null);
    }

    function onKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key !== 'Escape') return;
      keyEvent.preventDefault();
      onCancel();
    }

    stopClaimRef.current = stop;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKeyDown);
  });

  // A container removed mid-claim would otherwise leave its window listeners
  // running for the rest of the session.
  useEffect(() => () => stopClaimRef.current?.(), []);

  /**
   * Shift+arrows are the same claim, without a pointer.
   *
   * Bound on the content grid rather than the button for the same reason as the
   * press above — the raw handler would not survive `Button`'s prop filter — and
   * gated on the add slot so a widget's own arrow keys are untouched.
   */
  const handleRegionKeyDown = useEvent(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const anchor = addButtonCell;
      const [columnDelta, rowDelta] = REGION_KEYS[event.key] ?? [0, 0];
      if (
        !canClaimRegion ||
        !anchor ||
        !event.shiftKey ||
        (!columnDelta && !rowDelta) ||
        (event.target as HTMLElement).dataset?.dashboardAddSlot === undefined
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const current = addRegionRef.current ?? {
        ...anchor,
        columns: 1,
        rows: 1,
      };
      const far = {
        column: clamp(
          current.column + current.columns - 1 + columnDelta,
          anchor.column,
          columns - 1,
        ),
        row: clamp(
          current.row + current.rows - 1 + rowDelta,
          anchor.row,
          rows - 1,
        ),
      };

      lockAddCell();
      setRegion(getDashboardFreeRegion(anchor, far, freeCells, columns, rows));
    },
  );

  // The dummy trigger `useAnchoredMenu` renders deliberately restores no focus,
  // so the add button reclaims it — but only when the closing action left focus
  // on nothing, since an item that opened a panel has already claimed it.
  const wasAddMenuOpenRef = useRef(false);
  useEffect(() => {
    if (isAddMenuOpen) {
      wasAddMenuOpenRef.current = true;
      return;
    }
    if (!wasAddMenuOpenRef.current) return;

    wasAddMenuOpenRef.current = false;
    setOpenAddCell(null);
    setRegion(null);

    const anchor = addMenu.anchorRef.current;
    if (anchor && document.activeElement === document.body) anchor.focus();
  }, [addMenu.anchorRef, isAddMenuOpen, setRegion]);

  // `Button` hands back react-spectrum's focusable ref; the popover needs the
  // DOM node it wraps.
  const anchorRef = addMenu.anchorRef;
  const setAnchor = useCallback(
    (value: FocusableRefValue<HTMLElement> | null) => {
      anchorRef.current = value ? value.UNSAFE_getDOMNode() : null;
    },
    [anchorRef],
  );

  const isPermanentAdd = kind === 'tabs';
  const isAuthoringVisible = isPermanentAdd || isOwnHovered || isAddMenuOpen;
  const hasAddTarget =
    !!addButtonCell && !!authoring.onAddItem && availableItems.length > 0;
  const isAddButtonVisible =
    hasAddTarget && (isPermanentAdd || isOwnHovered || isAddMenuOpen);
  const gridStyle = getContentGridStyle(
    kind,
    columns,
    rows,
    metrics,
    hasStackAddTrack,
  );

  return (
    <ContentGridElement
      ref={gridRef}
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
      onKeyDown={handleRegionKeyDown}
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
      {layoutChildren}
      {editing.isEditing && hasAddTarget && buttonPlacement ? (
        <>
          <Button
            ref={setAnchor}
            qa="DashboardAddButton"
            type="clear"
            icon={isAddButtonVisible ? <CirclePlusIcon /> : null}
            aria-label={
              claimedRegion
                ? t(
                    'dashboard.addItemRegion',
                    'Add an item filling {{columns}} by {{rows}} cells from column {{column}}, row {{row}} in {{container}}',
                    {
                      columns: claimedRegion.columns,
                      rows: claimedRegion.rows,
                      column: claimedRegion.column + 1,
                      row: claimedRegion.row + 1,
                      container: id,
                    },
                  )
                : t(
                    'dashboard.addItem',
                    'Add an item at column {{column}}, row {{row}} in {{container}}',
                    {
                      column: buttonPlacement.column + 1,
                      row: buttonPlacement.row + 1,
                      container: id,
                    },
                  )
            }
            aria-haspopup="menu"
            aria-expanded={isAddMenuOpen}
            data-dashboard-add-slot=""
            data-dashboard-parent-id={id}
            data-dashboard-column={buttonPlacement.column}
            data-dashboard-row={buttonPlacement.row}
            data-dashboard-columns={
              kind === 'tabs' ? columns : buttonPlacement.columns
            }
            data-dashboard-rows={kind === 'tabs' ? rows : buttonPlacement.rows}
            width="100%"
            height="100%"
            opacity={isAddButtonVisible ? 1 : 0}
            aria-hidden={!isAddButtonVisible || undefined}
            tabIndex={isAddButtonVisible ? undefined : -1}
            styles={ADD_CELL_BUTTON_STYLES}
            onPress={openAddMenu}
            onPressStart={startRegionClaim}
            style={
              kind === 'tabs'
                ? {
                    gridColumn: '1 / -1',
                    gridRow: '1 / -1',
                    border: 0,
                    outline: 'none',
                  }
                : {
                    gridColumn: `${buttonPlacement.column + 1} / span ${buttonPlacement.columns}`,
                    gridRow: `${buttonPlacement.row + 1} / span ${buttonPlacement.rows}`,
                    border: 0,
                    outline: 'none',
                  }
            }
          />
          {addMenu.rendered}
        </>
      ) : null}
    </ContentGridElement>
  );
}

export function DashboardRootAddControl({ row }: { row: number }) {
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
