import { useControlledState } from '@react-stately/utils';
import { CONTAINER_STYLES } from '@tenphi/tasty';
import { forwardRef, useMemo, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { useCombinedRefs } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { clampPage, getPageInfo } from '../../navigation/Pagination';
import { DraggableCollection } from '../../shared/DraggableCollection';
import {
  ROW_MENU_COLUMN_KEY,
  ROW_MENU_COLUMN_WIDTH,
} from '../TableBase/row-menu';
import { TableView } from '../TableBase/TableView';
import { useContainerWidth } from '../TableBase/use-container-width';
import { useTableColumns } from '../TableBase/use-table-columns';
import { useTableSearch } from '../TableBase/use-table-search';
import {
  SELECTION_COLUMN_KEY,
  SELECTION_COLUMN_WIDTH,
  useTableSelection,
} from '../TableBase/use-table-selection';
import { useTableSort } from '../TableBase/use-table-sort';
import { useTableStorage } from '../TableBase/use-table-storage';

import { ItemTableBulkBar } from './ItemTableBulkBar';
import { ItemTableDragPreview } from './ItemTableDragPreview';
import { ItemTableFooter } from './ItemTableFooter';
import {
  ItemTableChromeProvider,
  ItemTableSearch,
  ItemTableToolbar,
} from './ItemTableToolbar';

import type { Key } from '@react-types/shared';
import type { ForwardedRef, ReactElement, ReactNode } from 'react';
import type { CubeTableRowContext, CubeTableSort } from '../TableBase/types';
import type { CubeItemTableProps } from './types';

/** Stable identity, so the uncontrolled default does not change every render. */
const EMPTY_WIDTHS: Record<string, number> = {};

function defaultGetRowKey<T>(rowKey: string) {
  return (row: T, index: number): Key => {
    const value = (row as any)?.[rowKey];

    return value == null ? index : (value as Key);
  };
}

function ItemTable<T = any>(
  props: CubeItemTableProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
): ReactElement {
  const {
    data,
    columns,
    rowKey = 'id',
    getRowKey,
    isLoading = false,
    loadingIndicator = 'overlay',
    selectionMode,
    bulkActions,
    rowLink,
    onRowAction,
    rowMenu,
    rowContextMenu = false,
    onRowMenuAction,
    rowMenuTriggerProps,
    bulkBarPlacement = 'floating',
    bulkBarStyles,
    selectedKeys: selectedKeysProp,
    defaultSelectedKeys,
    onSelectionChange,
    selectAllMode = 'page',
    isRowSelectable,
    selectionTooltip,
    disabledKeys,
    skeletonRowCount = 6,
    emptyLabel,
    noResultsLabel,
    error,
    isFiltered,
    toolbar,
    isSearchable = false,
    searchMode = 'client',
    searchPlaceholder,
    searchValue: searchValueProp,
    defaultSearchValue,
    onSearchChange,
    searchDelay = 500,
    searchFilter,
    filters,
    actions,
    onRefresh,
    paginationMode = 'client',
    pageSize: pageSizeProp,
    defaultPageSize = 50,
    autoHidePagination = true,
    onLoadMore,
    hasMore,
    isLoadingMore,
    loadMoreMargin,
    storageKey,
    persist,
    isReorderable = false,
    onReorder,
    dropOnRow,
    getItemDragInfo,
    isResizable = false,
    columnWidths: columnWidthsProp,
    defaultColumnWidths,
    onColumnResize,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100, 500],
    page: pageProp,
    defaultPage,
    onPageChange,
    total: totalProp,
    totalPages,
    hasNextPage,
    summary = true,
    footer,
    footerStart,
    footerCenter,
    footerEnd,
    sortMode,
    sort: sortProp,
    defaultSort,
    onSortChange,
    shape = 'plain',
    size = 'medium',
    rowHeight,
    headerHeight,
    isStriped = false,
    isHeaderHidden = false,
    isHeaderSticky = true,
    isVirtualized = 'auto',
    virtualizeThreshold = 50,
    overscan = 20,
    getRowProps,
    ariaLabel,
    qa,
    mods,
    styles,
    headerStyles,
    headerCellStyles,
    headerPreset = 'c3',
    toolbarStyles,
    searchStyles,
    footerStyles,
    bodyStyles,
    rowStyles,
    cellStyles,
    isRowMoveAnimated,
  } = props;

  const { t } = useI18n();

  const localRef = useRef<HTMLDivElement>(null);
  const rootRef = useCombinedRefs(ref, localRef);

  // Held in state, not a ref: the virtualized path's scroller is created by
  // Virtuoso and arrives through a callback, and the column layout has to
  // re-derive once it does.
  const [scrollerEl, setScrollerEl] = useState<HTMLDivElement | null>(null);
  const containerWidth = useContainerWidth(scrollerEl);

  // Style props (`height`, `maxHeight`, `margin`, …) land on the root frame.
  // `height` matters most: there is no page-scroll mode, so bounding the table
  // is what turns the body into a scroller and pins the header.
  const rootStyles = { ...extractStyles(props, CONTAINER_STYLES), ...styles };

  const {
    searchValue,
    setSearchValue,
    searchedRows,
    isFiltered: isSearching,
  } = useTableSearch<T>({
    columns,
    rows: data,
    mode: searchMode,
    value: searchValueProp,
    defaultValue: defaultSearchValue,
    onChange: onSearchChange,
    delay: searchDelay,
    filter: searchFilter,
  });

  const storage = useTableStorage(storageKey, persist);

  const {
    sort,
    sortedRows,
    toggleSort,
    mode: resolvedSortMode,
  } = useTableSort<T>({
    columns,
    rows: searchedRows,
    mode: sortMode,
    sort: sortProp,
    // Only restore what the table owns: a controlled `sort` belongs to the page,
    // and overriding it here would fight the page's own source of truth.
    defaultSort:
      sortProp === undefined && storage.has('sort')
        ? storage.initial.sort ?? defaultSort
        : defaultSort,
    onSortChange: useEvent((next: CubeTableSort | null) => {
      if (sortProp === undefined) storage.write({ sort: next });
      onSortChange?.(next);
    }),
  });

  // Search → sort → paginate. Paging last, so a page always reflects the rows
  // the user is actually looking at.
  //
  // Deliberately not `usePagination`: that hook owns an in-memory array, and in
  // server mode `data` is a single page. Deriving the bounds from it would clamp
  // the page to 1 and swallow every page change.
  const [pageSize, setPageSizeState] = useControlledState<number>(
    pageSizeProp as number,
    pageSizeProp === undefined && storage.has('pageSize')
      ? storage.initial.pageSize ?? defaultPageSize
      : defaultPageSize,
    onPageSizeChange as (value: number) => void,
  );
  const [page, setPageState] = useControlledState<number>(
    pageProp as number,
    defaultPage ?? 1,
    onPageChange as (value: number) => void,
  );

  const isInfinite = paginationMode === 'infinite';
  // Infinite scroll replaces the page control rather than adding to it.
  const isPaginated = paginationMode !== 'off' && !isInfinite;
  const isServerPaginated = paginationMode === 'server';
  const total = isServerPaginated ? totalProp ?? 0 : sortedRows.length;

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

    if (pageSizeProp === undefined) storage.write({ pageSize: next });

    // The old page index points at different rows under a new page size, so
    // staying on it would silently move the user.
    setPageState(1);
  });

  const visibleRows =
    paginationMode === 'client'
      ? sortedRows.slice(
          (pageInfo.page - 1) * pageSize,
          pageInfo.page * pageSize,
        )
      : sortedRows;

  const resolvedGetRowKey = useMemo(
    () => getRowKey ?? defaultGetRowKey<T>(rowKey),
    [getRowKey, rowKey],
  );

  // A bulk action with no way to select rows is a contradiction, so supplying
  // any implies multiple selection unless the consumer says otherwise.
  const resolvedSelectionMode =
    selectionMode ?? (bulkActions?.length ? 'multiple' : 'none');

  const selection = useTableSelection<T>({
    rows: visibleRows,
    // The wider set the header checkbox can reach under
    // `selectAllMode="filtered"`. In server mode the client only ever holds one
    // page, so the two coincide.
    filteredRows: paginationMode === 'client' ? sortedRows : visibleRows,
    getRowKey: resolvedGetRowKey,
    selectionMode: resolvedSelectionMode,
    selectedKeys: selectedKeysProp,
    defaultSelectedKeys,
    onSelectionChange,
    selectAllMode,
    isRowSelectable,
    disabledKeys,
  });

  // A `ReactNode` menu applies to every row; a function decides per row. The
  // renderer only ever sees the function form.
  const resolveRowMenu = useMemo(
    () =>
      rowMenu == null
        ? undefined
        : typeof rowMenu === 'function'
          ? (rowMenu as (
              row: T,
              ctx: CubeTableRowContext<T>,
            ) => ReactNode | null)
          : () => rowMenu as ReactNode,
    [rowMenu],
  );

  const trailingColumns = useMemo(
    () =>
      resolveRowMenu && rowContextMenu === true
        ? [
            {
              key: ROW_MENU_COLUMN_KEY,
              width:
                ROW_MENU_COLUMN_WIDTH[size] ?? ROW_MENU_COLUMN_WIDTH.medium,
              align: 'center' as const,
            },
          ]
        : undefined,
    [resolveRowMenu, rowContextMenu, size],
  );

  const leadingColumns = useMemo(
    () =>
      selection.isEnabled
        ? [
            {
              key: SELECTION_COLUMN_KEY,
              width:
                SELECTION_COLUMN_WIDTH[size] ?? SELECTION_COLUMN_WIDTH.medium,
              align: 'center' as const,
            },
          ]
        : undefined,
    [selection.isEnabled, size],
  );

  /**
   * Column widths, in three layers.
   *
   * The draft exists because a resize has to be visible *while* it happens, and
   * a controlled `columnWidths` cannot be: the consumer only learns the new
   * width from `onColumnResize`, which fires when the gesture ends. Without a
   * draft a controlled table simply would not move under the pointer.
   */
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

  /**
   * The same draft, in a ref.
   *
   * A keyboard resize runs `useMove`'s whole start → move → end cycle inside
   * one key press, so the end handler would read the state from before the
   * move. The ref is what it actually settles on; the state exists only to
   * trigger the render.
   */
  const draftColumnWidthsRef = useRef<Record<string, number> | null>(null);

  const baseColumnWidths = columnWidthsProp ?? ownColumnWidths;
  const columnWidths = draftColumnWidths ?? baseColumnWidths;

  const handleColumnResize = useEvent((key: string, width: number) => {
    draftColumnWidthsRef.current = {
      ...(draftColumnWidthsRef.current ?? baseColumnWidths),
      [key]: Math.round(width),
    };
    setDraftColumnWidths(draftColumnWidthsRef.current);
  });

  // Once at the end: a callback per pixel would be unusable, and persisting
  // every frame would hammer `localStorage`.
  const handleColumnResizeEnd = useEvent((key: string) => {
    const next = draftColumnWidthsRef.current ?? baseColumnWidths;

    if (columnWidthsProp === undefined) {
      setOwnColumnWidths(next);
      storage.write({ columnWidths: next });
    }

    onColumnResize?.(key, next[key], next);

    // The prop (or `ownColumnWidths`) is the source of truth again. A
    // controlled consumer that ignores the callback reverts, which is what
    // being controlled means.
    draftColumnWidthsRef.current = null;
    setDraftColumnWidths(null);
  });

  const layout = useTableColumns<T>({
    columns,
    containerWidth,
    columnWidths,
    leadingColumns,
    trailingColumns,
  });

  const hasBulkSelection =
    bulkActions != null &&
    bulkActions.length > 0 &&
    selection.selectedCount > 0;

  const bulkBar = hasBulkSelection ? (
    <ItemTableBulkBar<T>
      actions={bulkActions!}
      placement={bulkBarPlacement}
      styles={bulkBarStyles}
    />
  ) : null;

  const isBulkBarInToolbar = bulkBar != null && bulkBarPlacement === 'toolbar';

  const hasToolbar =
    toolbar !== undefined ||
    isSearchable ||
    filters != null ||
    actions != null ||
    onRefresh != null ||
    isBulkBarInToolbar;

  const toolbarNode = hasToolbar
    ? toolbar ?? (
        <ItemTableToolbar
          isSearchable={isSearchable}
          filters={filters}
          // The bar takes the actions group rather than sitting beside it: the
          // two compete for the same space, and while rows are selected the
          // bulk actions are what the user is reaching for.
          actions={isBulkBarInToolbar ? bulkBar : actions}
          isLoading={isLoading}
          styles={toolbarStyles}
          searchStyles={searchStyles}
          onRefresh={onRefresh}
        />
      )
    : null;

  /**
   * Pagination that cannot do anything is noise: one page of five rows still
   * renders "1–5 of 5", a page-size selector whose every option shows the same
   * five rows, and a solitary "1" button.
   *
   * "Cannot do anything" is both conditions together — a single page *and* a
   * total that even the smallest page size would not split. A 15-row single
   * page stays, because choosing "10 / page" would genuinely paginate it.
   */
  const smallestPageSize = pageSizeOptions?.length
    ? Math.min(...pageSizeOptions)
    : pageSize;

  const isPaginationUseless =
    autoHidePagination &&
    !hasNextPage &&
    pageInfo.totalPages <= 1 &&
    total <= smallestPageSize;

  const showPagination = isPaginated && !isPaginationUseless;

  const hasFooter =
    footer !== undefined ||
    showPagination ||
    footerStart != null ||
    footerCenter != null ||
    footerEnd != null;

  const footerNode = hasFooter
    ? footer ?? (
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
      )
    : null;

  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const rowKeys = useMemo(
    () =>
      visibleRows.map((row, index) => String(resolvedGetRowKey(row, index))),
    [visibleRows, resolvedGetRowKey],
  );

  const handleReorder = useEvent((nextKeys: string[]) => {
    const byKey = new Map(
      visibleRows.map((row, index) => [
        String(resolvedGetRowKey(row, index)),
        row,
      ]),
    );

    onReorder?.(
      nextKeys,
      nextKeys
        .map((key) => byKey.get(key))
        .filter((row): row is T => row !== undefined),
    );
  });

  /**
   * `DraggableCollection` owns the React Aria drag/drop hooks and hands the two
   * states down. It is only mounted when reordering is on, so a plain table
   * pays nothing for it.
   *
   * `RowCollection` and the `SelectionManager` from `useTableSelection` satisfy
   * its structural `state` contract unchanged — both exist even when selection
   * itself is off.
   */
  const renderTable = (
    dragState?: any,
    dropState?: any,
    collectionProps?: Record<string, any>,
  ) => (
    <TableView<T>
      rootRef={rootRef}
      dragState={dragState}
      dropState={dropState}
      collectionProps={collectionProps}
      bodyRef={bodyRef}
      qa={qa || 'ItemTable'}
      rows={visibleRows}
      // `aria-rowindex` is document-absolute by contract: on page 3 a screen
      // reader should hear "row 51 of 240", not "row 1 of 25". Infinite scroll
      // never offsets — every loaded row is already in `visibleRows`.
      // `isPaginated` already excludes infinite scroll, where every loaded row
      // is in `visibleRows` and there is no page to offset by.
      rowIndexOffset={isPaginated ? (pageInfo.page - 1) * pageSize : 0}
      totalRowCount={total}
      getRowKey={resolvedGetRowKey}
      layout={layout}
      onScrollerRef={setScrollerEl}
      size={size}
      shape={shape}
      rowHeight={rowHeight}
      headerHeight={headerHeight}
      isHeaderHidden={isHeaderHidden}
      isHeaderSticky={isHeaderSticky}
      isVirtualized={isVirtualized}
      virtualizeThreshold={virtualizeThreshold}
      overscan={overscan}
      isStriped={isStriped}
      isRowMoveAnimated={isRowMoveAnimated}
      isLoading={isLoading}
      loadingIndicator={loadingIndicator}
      selection={selection}
      selectionTooltip={selectionTooltip}
      rowLink={rowLink}
      onRowAction={onRowAction}
      onLoadMore={isInfinite ? onLoadMore : undefined}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreMargin={loadMoreMargin}
      isReorderable={isDragEnabled}
      isResizable={isResizable}
      onColumnResize={handleColumnResize}
      onColumnResizeEnd={handleColumnResizeEnd}
      rowMenu={resolveRowMenu}
      rowContextMenu={rowContextMenu}
      onRowMenuAction={onRowMenuAction}
      rowMenuTriggerProps={rowMenuTriggerProps}
      skeletonRowCount={skeletonRowCount}
      emptyLabel={emptyLabel ?? t('itemTable.noItems', 'No items')}
      noResultsLabel={
        noResultsLabel ?? t('itemTable.noResults', 'No results found')
      }
      error={error}
      toolbar={toolbarNode}
      footer={footerNode}
      isFiltered={isFiltered ?? isSearching}
      sortMode={resolvedSortMode}
      sort={sort}
      onColumnSort={toggleSort}
      getRowProps={getRowProps}
      ariaLabel={ariaLabel}
      styles={rootStyles}
      headerStyles={headerStyles}
      headerCellStyles={headerCellStyles}
      headerPreset={headerPreset}
      bodyStyles={bodyStyles}
      rowStyles={rowStyles}
      cellStyles={cellStyles}
      mods={mods}
      overlay={bulkBarPlacement === 'floating' ? bulkBar : null}
    />
  );

  const rowByKeyForDrop = useMemo(() => {
    const map = new Map<string, T>();

    visibleRows.forEach((row, index) =>
      map.set(String(resolvedGetRowKey(row, index)), row),
    );

    return map;
  }, [visibleRows, resolvedGetRowKey]);

  const handleItemDrop = useEvent((targetKey: Key, draggedKeys: Key[]) => {
    if (!dropOnRow) return;

    const target = rowByKeyForDrop.get(String(targetKey));

    if (!target) return;

    const dragged = draggedKeys
      .map((key) => rowByKeyForDrop.get(String(key)))
      // A row cannot be dropped on itself.
      .filter((row): row is T => row !== undefined && row !== target);

    if (!dragged.length) return;
    if (dropOnRow.isAllowed && !dropOnRow.isAllowed(dragged, target)) return;

    void dropOnRow.onDrop(dragged, target);
  });

  const renderDragPreview = useEvent((keys: Key[]) => (
    <ItemTableDragPreview<T>
      rows={keys
        .map((key) => rowByKeyForDrop.get(String(key)))
        .filter((row): row is T => row !== undefined)}
      getItemDragInfo={getItemDragInfo!}
    />
  ));

  const shouldAcceptItemDrop = useEvent((targetKey: Key) => {
    const target = rowByKeyForDrop.get(String(targetKey));

    return target != null && (dropOnRow?.isTarget(target) ?? false);
  });

  // Dropping onto a row and reordering both need the drag machinery.
  const isDragEnabled = isReorderable || dropOnRow != null;

  const table = isDragEnabled ? (
    <DraggableCollection
      state={{
        collection: selection.collection,
        selectionManager: selection.selectionManager as any,
        disabledKeys: new Set(disabledKeys ?? []),
      }}
      // The element that directly contains the rows. React Aria's
      // `ListDropTargetDelegate` measures the drop position from this element's
      // children, so pointing it at the table root would leave every drop
      // unresolvable — the row lifts but never lands.
      listRef={bodyRef}
      orderedKeys={rowKeys}
      orientation="vertical"
      onReorder={isReorderable ? handleReorder : undefined}
      onItemDrop={dropOnRow ? handleItemDrop : undefined}
      shouldAcceptItemDrop={dropOnRow ? shouldAcceptItemDrop : undefined}
      renderPreview={getItemDragInfo ? renderDragPreview : undefined}
    >
      {(dragState, dropState, collectionProps) =>
        renderTable(dragState, dropState, collectionProps)
      }
    </DraggableCollection>
  ) : (
    renderTable()
  );

  // The provider always wraps, so `ItemTable.Search` works from a custom
  // `toolbar` as well as from the built-in one.
  return (
    <ItemTableChromeProvider
      value={{
        searchValue,
        setSearchValue,
        searchPlaceholder,
        isLoading,
        onRefresh,
        selectedKeys: selection.selectedKeys,
        selectedRows: selection.selectedRows,
        selectedCount: selection.selectedCount,
        clearSelection: selection.clearSelection,
      }}
    >
      {table}
    </ItemTableChromeProvider>
  );
}

const _ItemTable = Object.assign(
  forwardRef(ItemTable) as unknown as (<T = any>(
    props: CubeItemTableProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
  ) => ReactElement) & { displayName?: string },
  {
    /** The table's search input, bound to the table's own state. */
    Search: ItemTableSearch,
    /** The default toolbar row, for rebuilding it around extra content. */
    Toolbar: ItemTableToolbar,
    /** The selection action bar, for placing it outside the default chrome. */
    BulkBar: ItemTableBulkBar,
  },
);

_ItemTable.displayName = 'ItemTable';

export { _ItemTable as ItemTable };
