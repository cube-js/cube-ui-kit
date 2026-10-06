import { ArrowNarrowDownIcon } from '../../../icons/ArrowNarrowDownIcon';
import { ArrowNarrowUpIcon } from '../../../icons/ArrowNarrowUpIcon';

import { TableHeaderItem } from './styled';

import type { ReactNode } from 'react';
import type {
  CubeResolvedColumn,
  CubeTableHeaderContext,
  CubeTableSort,
} from './types';

/** Where a data column stands in the table's sort. */
export interface ColumnSortState {
  isSortable: boolean;
  /** This column's entry in the sort, or `null` when it is unsorted. */
  activeSort: CubeTableSort | null;
  isSorted: boolean;
  /**
   * 1-based precedence while more than one column is sorted (`0` for an
   * unsorted column then), or `null` when it is not worth showing.
   */
  rank: number | null;
}

/**
 * Resolves a column's sort state from `TableView`'s `sorts`, or from `sort`
 * when there is no `sorts`.
 */
export function resolveColumnSort<T>(
  column: CubeResolvedColumn<T>,
  sortMode: 'client' | 'server' | 'off',
  sorts: readonly CubeTableSort[] | undefined,
  sort: CubeTableSort | null | undefined,
): ColumnSortState {
  // One resolution path for both shapes, so every consumer of `isSorted`
  // stays unaware of which one the caller supplied.
  const activeSorts = sorts ?? (sort ? [sort] : []);
  const sortIndex = activeSorts.findIndex(
    (entry) => entry.columnKey === column.key,
  );
  const activeSort = sortIndex === -1 ? null : activeSorts[sortIndex];

  return {
    isSortable:
      sortMode !== 'off' && !column.isStructural && column.isSortable === true,
    activeSort,
    isSorted: activeSort != null,
    // Only worth showing when more than one column is sorted — a lone "1"
    // beside an arrow is noise.
    rank: activeSorts.length > 1 ? sortIndex + 1 : null,
  };
}

/**
 * The sort arrow, or nothing for a column that cannot be sorted.
 *
 * The arrow keeps its slot even when unsorted, so turning a sort on and off
 * never shifts the label.
 *
 * Two glyphs rather than one flipped with `scale`. A narrow arrow flipped
 * vertically does land on its own opposite, but rendering the real icon is
 * what keeps that true — a glyph that is not perfectly symmetric would come
 * out subtly wrong, and nothing would say why.
 *
 * Unsorted shows the UP arrow, because that is what the first press gives:
 * the hint predicts the press rather than advertising that one is possible.
 */
function renderSortIndicator(sort: ColumnSortState) {
  if (!sort.isSortable) return null;

  return (
    <div
      data-element="SortIndicator"
      data-rank={sort.rank ?? undefined}
      data-sorted={sort.isSorted ? '' : undefined}
      data-dir={sort.activeSort?.direction}
      aria-hidden="true"
    >
      {sort.activeSort?.direction === 'desc' ? (
        <ArrowNarrowDownIcon />
      ) : (
        <ArrowNarrowUpIcon />
      )}
    </div>
  );
}

/**
 * What a data column's header cell shows.
 *
 * `header.render` takes the whole cell over. Otherwise a `TableHeaderItem`
 * carries the title and the `header` slots, with the sort arrow and the
 * actions — the consumer's own, then `menuTrigger` — placed into them.
 */
export function renderColumnHeaderContent<T>(
  column: CubeResolvedColumn<T>,
  sort: ColumnSortState,
  menuTrigger: ReactNode,
): ReactNode {
  const header = column.header;

  if (header?.render) {
    const ctx: CubeTableHeaderContext = {
      columnKey: column.key,
      columnIndex: column.index,
      sort: sort.activeSort?.direction ?? null,
      isSortable: sort.isSortable,
      isResizing: false,
      width: column.width,
    };

    return header.render(ctx);
  }

  if (column.title == null && !header) return null;

  const sortIndicator = renderSortIndicator(sort);

  // The arrow belongs in the `rightIcon` slot: that slot is sized and aligned
  // for an icon, while `suffix` is a text slot and puts the glyph on the
  // label's baseline.
  //
  // A `header.rightIcon` the consumer asked for keeps the slot, and the arrow
  // falls back to `suffix` — rare, and better than dropping either one.
  const hasCustomRightIcon = header?.rightIcon != null;
  const rightIcon = hasCustomRightIcon ? header!.rightIcon : sortIndicator;

  const suffixContent = hasCustomRightIcon ? sortIndicator : null;
  const suffix =
    header?.suffix != null || suffixContent ? (
      <>
        {header?.suffix}
        {suffixContent}
      </>
    ) : undefined;

  // The consumer's own actions first, the overflow menu last — matching Tabs.
  const actions =
    header?.actions != null || menuTrigger ? (
      <>
        {header?.actions}
        {menuTrigger}
      </>
    ) : undefined;

  return (
    <TableHeaderItem
      icon={header?.icon}
      rightIcon={rightIcon}
      prefix={header?.prefix}
      suffix={suffix}
      description={header?.description}
      descriptionPlacement={header?.descriptionPlacement}
      tooltip={header?.tooltip ?? true}
      theme={header?.theme}
      actions={actions}
      autoHideActions={header?.autoHideActions ?? true}
      // Without it the actions slot animates its width from 0 on hover, which
      // re-truncates the label — so the header text shifts under the cursor.
      // Only the opacity should move; `TabElement` reserves the space for the
      // same reason.
      preserveActionsSpace={actions != null}
      styles={header?.styles}
    >
      {column.title}
    </TableHeaderItem>
  );
}
