import { useCollator } from '@react-aria/i18n';
import { SelectionManager } from '@react-stately/selection';
import { useControlledState } from '@react-stately/utils';
import { CONTAINER_STYLES } from '@tenphi/tasty';
import { forwardRef, useMemo, useRef, useState } from 'react';
import { useMultipleSelectionState } from 'react-stately';

import { useEvent, useWarn } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { useCombinedRefs } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { clampPage, getPageInfo } from '../../navigation/Pagination';
import { DraggableCollection } from '../../shared/DraggableCollection';
import { ItemTableFooter } from '../ItemTable/ItemTableFooter';
import { RowCollection } from '../TableBase/RowCollection';
import {
  buildTableTree,
  flattenTableTree,
  reindexTableTree,
  sortTableTree,
} from '../TableBase/table-tree';
import { TableView } from '../TableBase/TableView';
import { selectionRowKey } from '../TableBase/types';
import { useCellSelection } from '../TableBase/use-cell-selection';
import {
  getDraggableColumnKeys,
  isColumnDraggable,
  useColumnOrder,
} from '../TableBase/use-column-order';
import { useContainerWidth } from '../TableBase/use-container-width';
import {
  freezeColumnWidths,
  getColumnText,
  useTableColumns,
} from '../TableBase/use-table-columns';
import { ROW_NUMBER_COLUMN_KEY } from '../TableBase/use-table-selection';
import { compareByColumn } from '../TableBase/use-table-sort';
import { useTableSorts } from '../TableBase/use-table-sorts';
import { useTableStorage } from '../TableBase/use-table-storage';
import { useTableTreeState } from '../TableBase/use-table-tree-state';

import type { Key } from '@react-types/shared';
import type { ForwardedRef, ReactElement } from 'react';
import type {
  CubeTableColumnLayout,
  CubeTableRowSection,
} from '../TableBase/types';
import type { CubeDataTableColumn, CubeDataTableProps } from './types';

/** Wide enough for five digits at the dense default. */
const ROW_NUMBER_WIDTH = 56;

const EMPTY_WIDTHS: Record<string, number> = {};

function defaultGetRowKey<T>(rowKey: string) {
  return (row: T, index: number): Key => {
    const value = (row as any)?.[rowKey];

    return value == null ? index : (value as Key);
  };
}

/**
 * A grid for query results.
 *
 * The same engine as `ItemTable` — one `TableView`, one column layout, one
 * value pipeline — with the defaults an analytical grid wants rather than a
 * list's: denser type, banded rows, resizable columns, multi-column sort, and
 * rows pinned for totals.
 *
 * It knows nothing about Cube. Measures, dimensions, pivots and drill-downs
 * reach it as ordinary columns, `render` output and `column.header.menu`
 * content, which is what keeps the ~34 kB of Cloud's column-header menu in
 * Cloud.
 */
function DataTable<T = any>(
  props: CubeDataTableProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    data,
    columns,
    rowKey = 'id',
    getRowKey,
    getRowChildren,
    treeColumnKey,
    expandedKeys,
    defaultExpandedKeys,
    onExpand,
    pinnedTopRows,
    pinnedBottomRows,
    isLoading = false,
    loadingIndicator = 'overlay',
    skeletonRowCount,
    error,
    emptyLabel,
    noResultsLabel,
    isFiltered,
    shape = 'plain',
    // Denser than `ItemTable`'s `medium`: a result grid is read as a block, and
    // more rows on screen is the point of it.
    size = 'small',
    rowSize,
    rowHeight,
    headerHeight,
    isStriped = true,
    isHeaderHidden,
    isHeaderSticky,
    showRowNumbers = false,
    sortMode,
    sorts: sortsProp,
    defaultSorts,
    onSortsChange,
    paginationMode = 'client',
    page: pageProp,
    defaultPage,
    onPageChange,
    pageSize: pageSizeProp,
    defaultPageSize = 100,
    onPageSizeChange,
    pageSizeOptions,
    total: totalProp,
    totalPages,
    hasNextPage,
    summary = true,
    autoHidePagination = true,
    footerStart,
    footerCenter,
    footerEnd,
    cellSelectionMode = 'range',
    isCellSelectable,
    selectedCellRange,
    defaultSelectedCellRange,
    onCellRangeChange,
    isRowMoveAnimated,
    isResizable = true,
    columnWidths: columnWidthsProp,
    defaultColumnWidths,
    onColumnResize,
    isColumnReorderable = false,
    columnOrder,
    defaultColumnOrder,
    onColumnOrderChange,
    columnContextMenu,
    onColumnMenuAction,
    columnMenuTriggerProps,
    columnMenuProps,
    isVirtualized,
    virtualizeThreshold,
    overscan,
    getRowProps,
    storageKey,
    styles,
    headerStyles,
    headerCellStyles,
    bodyStyles,
    rowStyles,
    cellStyles,
    footerStyles,
    ariaLabel,
    qa,
    mods,
    ...rest
  } = props;

  const localRef = useRef<HTMLDivElement>(null);
  const rootRef = useCombinedRefs(ref, localRef);
  const [scrollerEl, setScrollerEl] = useState<HTMLElement | null>(null);
  const containerWidth = useContainerWidth(scrollerEl);

  const resolvedGetRowKey = useMemo(
    () => getRowKey ?? defaultGetRowKey<T>(rowKey),
    [getRowKey, rowKey],
  );

  const treeModel = useMemo(
    () =>
      getRowChildren
        ? buildTableTree(data, getRowChildren, resolvedGetRowKey)
        : null,
    [data, getRowChildren, resolvedGetRowKey],
  );

  useWarn(treeModel != null && treeModel.duplicateKeys.length > 0, {
    key: ['data-table-tree-duplicate-keys'],
    args: [
      'DataTable:',
      'Tree row keys must be unique across the complete hierarchy. Duplicate rows were ignored.',
    ],
  });
  useWarn(treeModel != null && treeModel.cyclicKeys.length > 0, {
    key: ['data-table-tree-cyclic-keys'],
    args: [
      'DataTable:',
      'Tree data contains a cycle. Cyclic descendants were ignored.',
    ],
  });

  const storage = useTableStorage(storageKey);

  /**
   * `dataType` is presentational, so it is folded into the column here rather
   * than reaching the renderer: `number` right-aligns and takes tabular figures
   * so digits line up down the column.
   */
  const resolvedColumns = useMemo(
    () =>
      columns.map((column) => {
        const isNumeric = column.dataType === 'number';

        return {
          ...column,
          align: column.align ?? (isNumeric ? 'end' : 'start'),
          cellStyles: isNumeric
            ? {
                fontVariantNumeric: 'tabular-nums',
                ...(typeof column.cellStyles === 'object'
                  ? column.cellStyles
                  : null),
              }
            : column.cellStyles,
        } as CubeDataTableColumn<T>;
      }),
    [columns],
  );

  // Applied to the SOURCE columns, before `useTableColumns`, so hidden-column
  // filtering, structural injection and pinned hoisting all still happen
  // downstream and `columnOrder` can never fight `pin`.
  const columnOrderState = useColumnOrder<T>({
    columns: resolvedColumns,
    columnOrder,
    defaultColumnOrder,
    onColumnOrderChange,
    storage,
  });
  const orderedColumns = columnOrderState.columns;

  const resolvedTreeColumnKey = useMemo(() => {
    if (!treeModel) return undefined;
    const visibleColumns = orderedColumns.filter((column) => !column.isHidden);
    return visibleColumns.some((column) => column.key === treeColumnKey)
      ? treeColumnKey
      : visibleColumns[0]?.key;
  }, [treeModel, orderedColumns, treeColumnKey]);

  useWarn(
    treeModel != null &&
      treeColumnKey != null &&
      resolvedTreeColumnKey !== treeColumnKey,
    {
      key: ['data-table-tree-column-invalid', treeColumnKey],
      args: [
        'DataTable:',
        '`treeColumnKey` must identify a visible data column. Falling back to the first visible column.',
      ],
    },
  );

  const {
    sorts,
    sortedRows,
    toggleSort,
    setColumnSort,
    mode: resolvedSortMode,
  } = useTableSorts<T>({
    columns: orderedColumns,
    rows: treeModel ? treeModel.roots.map((node) => node.row) : data,
    mode: treeModel ? 'server' : sortMode,
    sorts: sortsProp,
    defaultSorts,
    onSortsChange,
  });

  const collator = useCollator({ numeric: true, sensitivity: 'base' });
  const treeSortMode = treeModel
    ? sortMode ??
      (orderedColumns.some((column) => column.isSortable) ? 'client' : 'off')
    : resolvedSortMode;
  const processedTreeRoots = useMemo(() => {
    const roots = treeModel?.roots ?? [];
    if (treeSortMode !== 'client' || !sorts.length) return roots;

    const active = sorts
      .map((sort) => ({
        sort,
        column: orderedColumns.find((column) => column.key === sort.columnKey),
      }))
      .filter((entry) => entry.column != null);

    return sortTableTree(roots, (a, b) => {
      for (const { sort, column } of active) {
        const result = compareByColumn(
          column!,
          collator,
          a.row,
          a.sourceIndex,
          b.row,
          b.sourceIndex,
        );
        if (result !== 0) {
          return result * (sort.direction === 'asc' ? 1 : -1);
        }
      }
      return a.siblingIndex - b.siblingIndex;
    });
  }, [treeModel, treeSortMode, sorts, orderedColumns, collator]);

  const [pageSize, setPageSizeState] = useControlledState<number>(
    pageSizeProp as number,
    (pageSizeProp === undefined && storage.has('pageSize')
      ? storage.initial.pageSize ?? defaultPageSize
      : defaultPageSize) as number,
    onPageSizeChange as (value: number) => void,
  );
  const [page, setPageState] = useControlledState<number>(
    pageProp as number,
    defaultPage ?? 1,
    onPageChange as (value: number) => void,
  );

  const isPaginated = paginationMode !== 'off';
  const isServerPaginated = paginationMode === 'server';
  const total = isServerPaginated
    ? totalProp ?? 0
    : treeModel
      ? processedTreeRoots.length
      : sortedRows.length;

  const pageInfo = getPageInfo({
    page,
    pageSize,
    total,
    totalPages: isServerPaginated ? totalPages : undefined,
  });

  const setPage = useEvent((next: number) =>
    setPageState(clampPage(next, pageInfo.totalPages)),
  );
  const setPageSize = useEvent((next: number) => {
    setPageSizeState(next);
    setPageState(1);

    if (pageSizeProp === undefined) storage.write({ pageSize: next });
  });

  const flatVisibleRows =
    paginationMode === 'client'
      ? sortedRows.slice(
          (pageInfo.page - 1) * pageSize,
          pageInfo.page * pageSize,
        )
      : sortedRows;

  const pageTreeRoots = useMemo(
    () =>
      reindexTableTree(
        paginationMode === 'client'
          ? processedTreeRoots.slice(
              (pageInfo.page - 1) * pageSize,
              pageInfo.page * pageSize,
            )
          : processedTreeRoots,
      ),
    [processedTreeRoots, paginationMode, pageInfo.page, pageSize],
  );

  const treeState = useTableTreeState<T>({
    roots: pageTreeRoots,
    allNodesByKey: treeModel?.byKey ?? new Map(),
    expandedKeys,
    defaultExpandedKeys,
    getTextValue: (node) => {
      const column = orderedColumns.find(
        (entry) => entry.key === resolvedTreeColumnKey,
      );
      return column
        ? getColumnText(column, node.row, node.sourceIndex) ?? String(node.key)
        : String(node.key);
    },
    onExpand,
    ariaLabel,
  });

  const visibleTreeEntries = treeModel ? treeState.visibleEntries : [];
  const visibleRows = treeModel
    ? visibleTreeEntries.map((entry) => entry.row)
    : flatVisibleRows;
  const visibleRowKeys = treeModel
    ? visibleTreeEntries.map((entry) => entry.key)
    : undefined;

  const [ownColumnWidths, setOwnColumnWidths] = useState<
    Record<string, number>
  >(
    () =>
      (columnWidthsProp === undefined && storage.has('columnWidths')
        ? storage.initial.columnWidths ?? defaultColumnWidths
        : defaultColumnWidths) ?? EMPTY_WIDTHS,
  );
  const [draftColumnWidths, setDraftColumnWidths] = useState<Record<
    string,
    number
  > | null>(null);
  const draftRef = useRef<Record<string, number> | null>(null);

  const baseColumnWidths = columnWidthsProp ?? ownColumnWidths;
  const columnWidths = draftColumnWidths ?? baseColumnWidths;

  /**
   * The resolved widths, for the freeze below. A ref because `layout` is
   * computed *after* this handler is defined, and `useEvent` only reads it when
   * the drag actually runs.
   */
  const layoutRef = useRef<CubeTableColumnLayout<T> | null>(null);

  const handleColumnResize = useEvent((key: string, width: number) => {
    // First move of a drag freezes every column, so this changes exactly one
    // width instead of re-splitting the flex pool. See `freezeColumnWidths`.
    const base =
      draftRef.current ??
      freezeColumnWidths(layoutRef.current, baseColumnWidths);

    draftRef.current = { ...base, [key]: Math.round(width) };
    setDraftColumnWidths(draftRef.current);
  });

  const handleColumnResizeEnd = useEvent((key: string) => {
    const next = draftRef.current ?? baseColumnWidths;

    if (columnWidthsProp === undefined) {
      setOwnColumnWidths(next);
      storage.write({ columnWidths: next });
    }

    onColumnResize?.(key, next[key], next);
    draftRef.current = null;
    setDraftColumnWidths(null);
  });

  const leadingColumns = useMemo(
    () =>
      showRowNumbers
        ? [{ key: ROW_NUMBER_COLUMN_KEY, width: ROW_NUMBER_WIDTH }]
        : undefined,
    [showRowNumbers],
  );

  const layout = useTableColumns<T>({
    columns: orderedColumns,
    containerWidth,
    columnWidths,
    leadingColumns,
  });

  layoutRef.current = layout;

  const { t } = useI18n();

  // Every row a range can reach, in the order they appear on screen. Pinned rows
  // are in it: a total is a figure like any other, and having to copy it
  // separately from the column it sums is the wrong trade.
  //
  // The keys are built here rather than inside the hook so they cannot disagree
  // with the ones the renderer stamps — a pinned row is keyed by its own index
  // within its group, exactly as `renderPinnedRow` keys it.
  const selectionRows = useMemo(
    () => [
      ...(pinnedTopRows ?? []),
      ...visibleRows,
      ...(pinnedBottomRows ?? []),
    ],
    [pinnedTopRows, visibleRows, pinnedBottomRows],
  );
  const selectionRowKeys = useMemo(
    () => [
      // Section-qualified, matching what the renderer stamps: the same record
      // is routinely pinned at both edges, and one flat key space collapsed the
      // two into whichever came first.
      ...(pinnedTopRows ?? []).map((row, index) =>
        selectionRowKey('pinnedTop', resolvedGetRowKey(row, index)),
      ),
      ...visibleRows.map(
        (row, index) =>
          visibleRowKeys?.[index] ?? resolvedGetRowKey(row, index),
      ),
      ...(pinnedBottomRows ?? []).map((row, index) =>
        selectionRowKey('pinnedBottom', resolvedGetRowKey(row, index)),
      ),
    ],
    [
      pinnedTopRows,
      visibleRows,
      visibleRowKeys,
      pinnedBottomRows,
      resolvedGetRowKey,
    ],
  );

  // The hook works in one flat row order; the section a row belongs to is a
  // property of where it sits in that order, so it is resolved here rather than
  // asking the consumer to track it.
  const resolveCellSelectable = useEvent(
    (row: T, rowKey: Key, columnKey: string) => {
      if (!isCellSelectable) return true;

      const index = selectionRowKeys.indexOf(rowKey);
      const topCount = pinnedTopRows?.length ?? 0;
      const section: CubeTableRowSection =
        index < topCount
          ? 'pinnedTop'
          : index < topCount + visibleRows.length
            ? 'body'
            : 'pinnedBottom';

      return isCellSelectable({ row, rowKey, columnKey, section });
    },
  );

  const cellSelection = useCellSelection<T>({
    mode: cellSelectionMode,
    columns: layout.columns,
    rows: selectionRows,
    rowKeys: selectionRowKeys,
    isCellSelectable: isCellSelectable ? resolveCellSelectable : undefined,
    range: selectedCellRange,
    defaultRange: defaultSelectedCellRange,
    onRangeChange: onCellRangeChange,
  });

  // Same as `ItemTable`: style props (`height`, `maxHeight`, `margin`, …) land
  // on the root frame. `height` is the one that matters — there is no
  // page-scroll mode, so bounding the grid is what turns the body into a
  // scroller, pins the header, and lets virtualization engage at all.
  const rootStyles = { ...extractStyles(props, CONTAINER_STYLES), ...styles };

  const smallestPageSize = pageSizeOptions?.length
    ? Math.min(...pageSizeOptions)
    : pageSize;

  const showPagination =
    isPaginated &&
    !(
      autoHidePagination &&
      !hasNextPage &&
      pageInfo.totalPages <= 1 &&
      total <= smallestPageSize
    );

  const hasFooter =
    showPagination ||
    footerStart != null ||
    footerCenter != null ||
    footerEnd != null;

  /* ── column reordering ────────────────────────────────────────────────── */

  const headRowRef = useRef<HTMLTableRowElement>(null);
  const draggableColumnKeys = useMemo(
    () => getDraggableColumnKeys(layout.columns, isColumnReorderable),
    [layout.columns, isColumnReorderable],
  );
  const columnCollection = useMemo(
    () =>
      new RowCollection(
        layout.columns.filter((column) =>
          isColumnDraggable(column, isColumnReorderable),
        ),
        (column) => column.key,
        new Set(),
        // The drag announcements read this — otherwise a screen reader hears
        // "Insert between  and ".
        (column) =>
          typeof column.title === 'string' ? column.title : column.key,
      ),
    [layout.columns, isColumnReorderable],
  );
  /**
   * `'single'`, not `'none'`.
   *
   * `useDraggableItem` only deletes its own `onClick` — the one that would
   * hijack a screen-reader click away from the sort — when the selection mode is
   * not `'none'`, and only then does it attach the keyboard drag description.
   * Nothing is ever actually selected here.
   */
  const columnSelectionState = useMultipleSelectionState({
    selectionMode: 'single',
    disabledBehavior: 'all',
  });
  const columnSelectionManager = useMemo(
    () => new SelectionManager(columnCollection, columnSelectionState),
    [columnCollection, columnSelectionState],
  );
  const handleColumnFocus = useEvent((columnKey: string | null) => {
    columnSelectionManager.setFocusedKey(columnKey);
  });

  // One draggable column cannot be reordered, so the machinery stays unmounted
  // and the header keeps its exact DOM.
  const isColumnDragEnabled =
    isColumnReorderable && draggableColumnKeys.length > 1;

  const treeRowNumberOffset = treeModel
    ? paginationMode === 'client'
      ? flattenTableTree(
          processedTreeRoots.slice(0, (pageInfo.page - 1) * pageSize),
          treeState.expandedKeys,
        ).length
      : 0
    : null;

  const renderTable = (
    columnDragState?: any,
    columnDropState?: any,
    headCollectionProps?: Record<string, any>,
  ) => (
    <TableView<T>
      {...rest}
      rootRef={rootRef}
      qa={qa || 'DataTable'}
      rows={visibleRows}
      rowKeys={visibleRowKeys}
      pinnedTopRows={pinnedTopRows}
      pinnedBottomRows={pinnedBottomRows}
      // Continuous across pages: row 101 is row 101, not row 1 of page two.
      //
      // Server mode counts too — the page and its size are known there just the
      // same, and `rows` is that page. Only `'off'` starts at 1, because then
      // there is no page to be on.
      rowNumberOffset={
        treeRowNumberOffset ??
        (paginationMode === 'off' ? 0 : (pageInfo.page - 1) * pageSize)
      }
      // The same offset drives `aria-rowindex`, which is document-absolute by
      // contract — a screen reader on page 3 should hear "row 51 of 240", not
      // "row 1 of 25".
      rowIndexOffset={
        treeModel
          ? 0
          : paginationMode === 'off'
            ? 0
            : (pageInfo.page - 1) * pageSize
      }
      totalRowCount={treeModel ? visibleRows.length : total}
      layout={layout}
      // Always on, unlike `ItemTable`. A result grid is read down a column, and
      // once the values are wide and right-aligned the rule is what keeps a
      // figure attached to its column — which is why Cloud's ag-grid theme sets
      // `columnBorder` for `DataTable` and not for the list grids.
      hasColumnDividers
      cellSelection={cellSelection}
      getRowKey={resolvedGetRowKey}
      onScrollerRef={setScrollerEl}
      isLoading={isLoading}
      loadingIndicator={loadingIndicator}
      skeletonRowCount={skeletonRowCount}
      error={error}
      // Same localized fallbacks as `ItemTable`: a grid that has finished
      // loading and shows an unexplained blank rectangle reads as broken.
      emptyLabel={emptyLabel ?? t('itemTable.noItems', 'No items')}
      noResultsLabel={
        noResultsLabel ?? t('itemTable.noResults', 'No results found')
      }
      isFiltered={isFiltered}
      shape={shape}
      size={size}
      rowSize={rowSize}
      rowHeight={rowHeight}
      headerHeight={headerHeight}
      isStriped={isStriped}
      isRowMoveAnimated={isRowMoveAnimated}
      isHeaderHidden={isHeaderHidden}
      isHeaderSticky={isHeaderSticky}
      // The header shows the column name at body size — a result grid has no
      // room for the uppercase caption a list header uses.
      // `t4` throughout: a result grid is read as a block, and one step down
      // from the list preset fits noticeably more on screen without losing
      // legibility. The header takes the medium weight of the same step.
      contentPreset="t4"
      headerPreset="t4m"
      sortMode={treeSortMode}
      sorts={sorts}
      onColumnSort={toggleSort}
      onColumnSortChange={setColumnSort}
      columnContextMenu={columnContextMenu}
      onColumnMenuAction={onColumnMenuAction}
      columnMenuTriggerProps={columnMenuTriggerProps}
      columnMenuProps={columnMenuProps}
      isVirtualized={isVirtualized}
      virtualizeThreshold={virtualizeThreshold}
      overscan={overscan}
      isResizable={isResizable}
      onColumnResize={handleColumnResize}
      onColumnResizeEnd={handleColumnResizeEnd}
      getRowProps={getRowProps}
      ariaLabel={ariaLabel}
      styles={rootStyles}
      headerStyles={headerStyles}
      headerCellStyles={headerCellStyles}
      bodyStyles={bodyStyles}
      rowStyles={rowStyles}
      cellStyles={cellStyles}
      mods={mods}
      isColumnReorderable={isColumnDragEnabled}
      columnDragState={columnDragState}
      columnDropState={columnDropState}
      headCollectionProps={headCollectionProps}
      headRowRef={headRowRef}
      onColumnFocus={handleColumnFocus}
      tree={
        treeModel
          ? {
              state: treeState.state,
              ariaProps: treeState.ariaProps,
              nodes: treeState.visibleNodes,
              entries: visibleTreeEntries,
              columnKey: resolvedTreeColumnKey!,
            }
          : undefined
      }
      footer={
        hasFooter ? (
          <ItemTableFooter
            start={footerStart}
            center={footerCenter}
            end={footerEnd}
            styles={footerStyles}
            pagination={
              showPagination
                ? {
                    page: pageInfo.page,
                    pageSize,
                    total,
                    totalPages: pageInfo.totalPages,
                    pageSizeOptions,
                    summary,
                    hasNextPage,
                    onPageChange: setPage,
                    onPageSizeChange: setPageSize,
                  }
                : undefined
            }
          />
        ) : null
      }
    />
  );

  return isColumnDragEnabled ? (
    <DraggableCollection
      state={{
        collection: columnCollection as any,
        selectionManager: columnSelectionManager as any,
        disabledKeys: new Set(),
      }}
      // The element that DIRECTLY contains the header cells. React Aria's
      // `ListDropTargetDelegate` resolves a drop by measuring `[data-key]`
      // descendants of this element, so pointing it anywhere else leaves every
      // drop unresolvable — the column lifts but never lands.
      listRef={headRowRef}
      orderedKeys={draggableColumnKeys}
      orientation="horizontal"
      onReorder={columnOrderState.reorder}
    >
      {(dragState, dropState, collectionProps) =>
        renderTable(dragState, dropState, collectionProps)
      }
    </DraggableCollection>
  ) : (
    renderTable()
  );
}

const _DataTable = forwardRef(DataTable) as unknown as (<T = any>(
  props: CubeDataTableProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { displayName?: string };

_DataTable.displayName = 'DataTable';

export { _DataTable as DataTable };
