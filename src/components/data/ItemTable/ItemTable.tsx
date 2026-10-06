import { CONTAINER_STYLES } from '@tenphi/tasty';
import { forwardRef, useMemo, useRef, useState } from 'react';

import { useI18n } from '../../../i18n';
import { useCombinedRefs } from '../../../utils/react';
import { extractStyles, mergeStyleLayers } from '../../../utils/styles';
import { DraggableCollection } from '../../shared/DraggableCollection';
import {
  ROW_MENU_COLUMN_KEY,
  ROW_MENU_COLUMN_WIDTH,
} from '../TableBase/row-menu';
import { filterTableTree } from '../TableBase/table-tree';
import { TableView } from '../TableBase/TableView';
import { useContainerWidth } from '../TableBase/use-container-width';
import { getColumnText } from '../TableBase/use-table-columns';
import {
  matchesTableSearch,
  useTableSearch,
} from '../TableBase/use-table-search';
import {
  SELECTION_COLUMN_KEY,
  SELECTION_COLUMN_WIDTH,
} from '../TableBase/use-table-selection';
import { useTableStorage } from '../TableBase/use-table-storage';
import { useTableTreeState } from '../TableBase/use-table-tree-state';

import { ItemTableBulkBar } from './ItemTableBulkBar';
import { ItemTableFooter } from './ItemTableFooter';
import {
  ItemTableChromeProvider,
  ItemTableSearch,
  ItemTableToolbar,
} from './ItemTableToolbar';
import { useItemTableColumnWidths } from './use-item-table-column-widths';
import { useItemTableDragDrop } from './use-item-table-drag-drop';
import { useItemTablePagination } from './use-item-table-pagination';
import { useItemTableSelection } from './use-item-table-selection';
import { useItemTableSort } from './use-item-table-sort';
import { useItemTableTreeModel } from './use-item-table-tree-model';

import type { Key } from '@react-types/shared';
import type { ForwardedRef, ReactElement, ReactNode } from 'react';
import type { CubeTableRowContext } from '../TableBase/types';
import type { CubeItemTableProps } from './types';

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
    getRowChildren,
    treeColumnKey,
    expandedKeys,
    defaultExpandedKeys,
    onExpand,
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
    treeSelectionBehavior = 'cascade',
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
    columnContextMenu,
    onColumnMenuAction,
    columnMenuTriggerProps,
    columnMenuProps,
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
    isAutoHeight = false,
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
  const rootStyles = mergeStyleLayers(
    extractStyles(props, CONTAINER_STYLES),
    styles,
  );

  const resolvedGetRowKey = useMemo(
    () => getRowKey ?? defaultGetRowKey<T>(rowKey),
    [getRowKey, rowKey],
  );

  const { treeModel, treeColumnKey: resolvedTreeColumnKey } =
    useItemTableTreeModel<T>({
      data,
      columns,
      getRowKey: resolvedGetRowKey,
      getRowChildren,
      treeColumnKey,
      isReorderable,
    });

  const {
    searchValue,
    setSearchValue,
    searchedRows,
    query,
    isFiltered: isSearching,
  } = useTableSearch<T>({
    columns,
    rows: data,
    // Tree filtering needs to preserve ancestors and descendants, so the flat
    // hook owns only the controlled/debounced value in this mode.
    mode: treeModel ? 'server' : searchMode,
    value: searchValueProp,
    defaultValue: defaultSearchValue,
    onChange: onSearchChange,
    delay: searchDelay,
    filter: searchFilter,
  });

  const searchedTree = useMemo(() => {
    if (!treeModel) return null;
    if (searchMode !== 'client' || !query) {
      return { roots: treeModel.roots, forcedExpandedKeys: new Set<Key>() };
    }

    return filterTableTree(treeModel.roots, (node) =>
      searchFilter
        ? searchFilter(node.row, query)
        : matchesTableSearch(columns, node.row, node.sourceIndex, query),
    );
  }, [treeModel, searchMode, query, searchFilter, columns]);

  const storage = useTableStorage(storageKey, persist);

  const {
    sort,
    sortedRows,
    sortedTreeRoots,
    mode: resolvedSortMode,
    toggleSort,
    setColumnSort,
  } = useItemTableSort<T>({
    columns,
    rows: searchedRows,
    tree: searchedTree,
    mode: sortMode,
    sort: sortProp,
    defaultSort,
    onSortChange,
    storage,
  });

  // Search → sort → paginate. Paging last, so a page always reflects the rows
  // the user is actually looking at.
  const pagination = useItemTablePagination<T>({
    mode: paginationMode,
    rows: sortedRows,
    treeRoots: sortedTreeRoots,
    isTree: treeModel != null,
    pageSize: pageSizeProp,
    defaultPageSize,
    onPageSizeChange,
    pageSizeOptions,
    page: pageProp,
    defaultPage,
    onPageChange,
    total: totalProp,
    totalPages,
    hasNextPage,
    summary,
    autoHide: autoHidePagination,
    storage,
  });

  const treeState = useTableTreeState<T>({
    roots: pagination.pageTreeRoots,
    allNodesByKey: treeModel?.byKey ?? new Map(),
    expandedKeys,
    defaultExpandedKeys,
    forcedExpandedKeys: searchedTree?.forcedExpandedKeys,
    disabledKeys,
    getTextValue: (node) => {
      const column = columns.find(
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
    : pagination.pageRows;
  const visibleRowKeys = treeModel
    ? visibleTreeEntries.map((entry) => entry.key)
    : undefined;

  const selection = useItemTableSelection<T>({
    rows: visibleRows,
    rowKeys: visibleRowKeys,
    sortedRows,
    isTree: treeModel != null,
    sortedTreeRoots,
    pageTreeRoots: pagination.pageTreeRoots,
    paginationMode,
    getRowKey: resolvedGetRowKey,
    selectionMode,
    bulkActions,
    selectedKeys: selectedKeysProp,
    defaultSelectedKeys,
    onSelectionChange,
    selectAllMode,
    isRowSelectable,
    disabledKeys,
    treeSelectionBehavior,
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

  const { layout, handleColumnResize, handleColumnResizeEnd } =
    useItemTableColumnWidths<T>({
      columns,
      containerWidth,
      leadingColumns,
      trailingColumns,
      columnWidths: columnWidthsProp,
      defaultColumnWidths,
      onColumnResize,
      storage,
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

  const hasFooter =
    footer !== undefined ||
    pagination.control != null ||
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
          pagination={pagination.control}
        />
      )
    : null;

  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const drag = useItemTableDragDrop<T>({
    rows: visibleRows,
    rowKeys: visibleRowKeys,
    getRowKey: resolvedGetRowKey,
    treeModel,
    isReorderable,
    onReorder,
    dropOnRow,
    getItemDragInfo,
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
      rowKeys={visibleRowKeys}
      // `aria-rowindex` is document-absolute by contract: on page 3 a screen
      // reader should hear "row 51 of 240", not "row 1 of 25". Infinite scroll
      // never offsets — every loaded row is already in `visibleRows`.
      // `isPaginated` already excludes infinite scroll, where every loaded row
      // is in `visibleRows` and there is no page to offset by.
      rowIndexOffset={
        treeModel
          ? 0
          : pagination.isPaginated
            ? (pagination.page - 1) * pagination.pageSize
            : 0
      }
      totalRowCount={treeModel ? visibleRows.length : pagination.total}
      getRowKey={resolvedGetRowKey}
      layout={layout}
      onScrollerRef={setScrollerEl}
      size={size}
      shape={shape}
      rowHeight={rowHeight}
      headerHeight={headerHeight}
      isHeaderHidden={isHeaderHidden}
      isHeaderSticky={isHeaderSticky}
      isAutoHeight={isAutoHeight}
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
      onLoadMore={pagination.isInfinite ? onLoadMore : undefined}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreMargin={loadMoreMargin}
      isReorderable={drag.isEnabled}
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
      onColumnSortChange={setColumnSort}
      columnContextMenu={columnContextMenu}
      onColumnMenuAction={onColumnMenuAction}
      columnMenuTriggerProps={columnMenuTriggerProps}
      columnMenuProps={columnMenuProps}
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
    />
  );

  const table = drag.isEnabled ? (
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
      orderedKeys={drag.orderedKeys}
      orientation="vertical"
      onReorder={drag.onReorder}
      onItemDrop={drag.onItemDrop}
      shouldAcceptItemDrop={drag.shouldAcceptItemDrop}
      renderPreview={drag.renderPreview}
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
