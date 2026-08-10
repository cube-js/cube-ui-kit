import { useControlledState } from '@react-stately/utils';
import { CONTAINER_STYLES } from '@tenphi/tasty';
import { forwardRef, useMemo, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { useCombinedRefs } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { clampPage, getPageInfo } from '../../navigation/Pagination';
import { ItemTableFooter } from '../ItemTable/ItemTableFooter';
import { TableView } from '../TableBase/TableView';
import { selectionRowKey } from '../TableBase/types';
import { useCellSelection } from '../TableBase/use-cell-selection';
import { useContainerWidth } from '../TableBase/use-container-width';
import { useTableColumns } from '../TableBase/use-table-columns';
import { ROW_NUMBER_COLUMN_KEY } from '../TableBase/use-table-selection';
import { useTableSorts } from '../TableBase/use-table-sorts';
import { useTableStorage } from '../TableBase/use-table-storage';

import type { Key } from '@react-types/shared';
import type { ForwardedRef, ReactElement } from 'react';
import type { CubeTableRowSection } from '../TableBase/types';
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

  const {
    sorts,
    sortedRows,
    toggleSort,
    mode: resolvedSortMode,
  } = useTableSorts<T>({
    columns: resolvedColumns,
    rows: data,
    mode: sortMode,
    sorts: sortsProp,
    defaultSorts,
    onSortsChange,
  });

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
    setPageState(1);

    if (pageSizeProp === undefined) storage.write({ pageSize: next });
  });

  const visibleRows =
    paginationMode === 'client'
      ? sortedRows.slice(
          (pageInfo.page - 1) * pageSize,
          pageInfo.page * pageSize,
        )
      : sortedRows;

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

  const handleColumnResize = useEvent((key: string, width: number) => {
    draftRef.current = {
      ...(draftRef.current ?? baseColumnWidths),
      [key]: Math.round(width),
    };
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
    columns: resolvedColumns,
    containerWidth,
    columnWidths,
    leadingColumns,
  });

  const { t } = useI18n();

  const resolvedGetRowKey = useMemo(
    () => getRowKey ?? defaultGetRowKey<T>(rowKey),
    [getRowKey, rowKey],
  );

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
      ...visibleRows.map(resolvedGetRowKey),
      ...(pinnedBottomRows ?? []).map((row, index) =>
        selectionRowKey('pinnedBottom', resolvedGetRowKey(row, index)),
      ),
    ],
    [pinnedTopRows, visibleRows, pinnedBottomRows, resolvedGetRowKey],
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

  return (
    <TableView<T>
      {...rest}
      rootRef={rootRef}
      qa={qa || 'DataTable'}
      rows={visibleRows}
      pinnedTopRows={pinnedTopRows}
      pinnedBottomRows={pinnedBottomRows}
      // Continuous across pages: row 101 is row 101, not row 1 of page two.
      //
      // Server mode counts too — the page and its size are known there just the
      // same, and `rows` is that page. Only `'off'` starts at 1, because then
      // there is no page to be on.
      rowNumberOffset={
        paginationMode === 'off' ? 0 : (pageInfo.page - 1) * pageSize
      }
      // The same offset drives `aria-rowindex`, which is document-absolute by
      // contract — a screen reader on page 3 should hear "row 51 of 240", not
      // "row 1 of 25".
      rowIndexOffset={
        paginationMode === 'off' ? 0 : (pageInfo.page - 1) * pageSize
      }
      totalRowCount={total}
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
      sortMode={resolvedSortMode}
      sorts={sorts}
      onColumnSort={toggleSort}
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
}

const _DataTable = forwardRef(DataTable) as unknown as (<T = any>(
  props: CubeDataTableProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { displayName?: string };

_DataTable.displayName = 'DataTable';

export { _DataTable as DataTable };
