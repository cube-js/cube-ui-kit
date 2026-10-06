import { useState } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { useI18n } from '../../../i18n/useI18n';
import { MoreIcon } from '../../../icons/MoreIcon';
import { ItemAction } from '../../actions/ItemAction/ItemAction';
import { Menu } from '../../actions/Menu/Menu';
import { MenuTrigger } from '../../actions/Menu/MenuTrigger';

import {
  COLUMN_MENU_SORT_DIRECTION,
  isColumnMenuSortKey,
  processColumnMenuItems,
} from './column-menu';
import { isMenuEmpty, normalizeMenuAction } from './row-menu';

import type { Key } from '@react-types/shared';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import type { UseContextMenuReturn } from '../../actions/use-context-menu';
import type { ColumnSortState } from './column-header';
import type { CubeColumnMenuContext } from './column-menu';
import type { CubeResolvedColumn, CubeTableSortDirection } from './types';

export interface UseColumnMenuOptions {
  /** The table's one context menu, shared with the row menu. */
  contextMenu: Pick<
    UseContextMenuReturn<HTMLDivElement, any>,
    'open' | 'close'
  >;
  /** See `TableViewProps.columnContextMenu`. */
  columnContextMenu: boolean | 'context-only';
  columnMenuProps?: Record<string, any>;
  columnMenuTriggerProps?: Record<string, any>;
  onColumnSortChange?: (
    columnKey: string,
    direction: CubeTableSortDirection | null,
  ) => void;
  onColumnMenuAction?: (action: string, columnKey: string) => void;
}

/**
 * A column's `header.menu`, on both of its surfaces: the `⋮` trigger in the
 * header's actions slot, and the context menu a right-click or Shift+F10 opens.
 *
 * Both surfaces share the item resolution, the reserved sort keys and the
 * action dispatch here, so they cannot drift apart.
 */
export function useColumnMenu<T>(options: UseColumnMenuOptions) {
  const {
    contextMenu,
    columnContextMenu,
    columnMenuProps,
    columnMenuTriggerProps,
    onColumnSortChange,
    onColumnMenuAction,
  } = options;
  const { t } = useI18n();
  const isContextOnly = columnContextMenu === 'context-only';

  /**
   * The column whose menu is open, held for the whole table rather than per
   * header cell.
   *
   * `renderHeaderCell` is a closure inside `TableView`, not a component of its
   * own, so it cannot hold state — and only one column menu can be open at a
   * time anyway. Controlled rather than letting `MenuTrigger` own it: Shift+F10
   * has to be able to open it from the `<th>`, and the trigger is not a tab stop.
   */
  const [openMenuColumnKey, setOpenMenuColumnKey] = useState<string | null>(
    null,
  );

  /** The column's menu items, or `null` when it has no menu on any surface. */
  function resolveColumnMenu(column: CubeResolvedColumn<T>): ReactNode | null {
    if (columnContextMenu === false || column.isStructural) return null;

    const items = column.header?.menu;

    return isMenuEmpty(items) ? null : items;
  }

  /** The reserved sort keys, labelled here so `column-menu.ts` stays pure. */
  function columnMenuContext(
    column: CubeResolvedColumn<T>,
    sort: ColumnSortState,
  ): CubeColumnMenuContext {
    return {
      isSortable: sort.isSortable,
      sort: sort.activeSort?.direction ?? null,
      disallowSortRemoval: column.disallowSortRemoval === true,
      labels: {
        'sort-asc': t('itemTable.sortAscending', 'Sort ascending'),
        'sort-desc': t('itemTable.sortDescending', 'Sort descending'),
        'clear-sort': t('itemTable.clearSort', 'Clear sort'),
      },
    };
  }

  function columnMenuActionHandler(
    column: CubeResolvedColumn<T>,
    closeAfter: boolean,
  ) {
    return (action: Key) => {
      const normalized = normalizeMenuAction(action);

      // The table's own keys are applied first, then the consumer hears about
      // them anyway — so a key can be both understood here and observed there.
      if (isColumnMenuSortKey(normalized)) {
        onColumnSortChange?.(
          column.key,
          COLUMN_MENU_SORT_DIRECTION[normalized],
        );
      }

      column.header?.onMenuAction?.(normalized);
      onColumnMenuAction?.(normalized, column.key);

      // `useContextMenu` leaves its popover open after an action; see
      // `menuActionHandler` in `TableView`.
      if (closeAfter) contextMenu.close();
    };
  }

  const openColumnContextMenu = useEvent(
    (
      column: CubeResolvedColumn<T>,
      sort: ColumnSortState,
      event: ReactMouseEvent | ReactKeyboardEvent,
    ) => {
      const items = resolveColumnMenu(column);

      if (items == null) return;

      event.preventDefault();
      // The Scroller listens for Shift+F10 too, for the row menu.
      event.stopPropagation();
      contextMenu.open(
        {
          ...columnMenuProps,
          ...column.header?.menuProps,
          children: processColumnMenuItems(
            items,
            columnMenuContext(column, sort),
          ),
          onAction: columnMenuActionHandler(column, true),
        },
        undefined,
        'clientX' in event.nativeEvent
          ? (event.nativeEvent as MouseEvent)
          : undefined,
      );
    },
  );

  /**
   * Shift+F10 on the header cell: the `⋮` trigger's own popover when there is
   * a trigger, the context menu when `columnContextMenu` is `'context-only'`.
   */
  function openColumnMenuFromKeyboard(
    column: CubeResolvedColumn<T>,
    sort: ColumnSortState,
    event: ReactKeyboardEvent,
  ) {
    if (isContextOnly) {
      openColumnContextMenu(column, sort, event);

      return;
    }

    event.preventDefault();
    // The Scroller listens for Shift+F10 too, for the row menu.
    event.stopPropagation();
    setOpenMenuColumnKey(column.key);
  }

  /** The `⋮` trigger, or `null` when the menu is context-only or absent. */
  function renderColumnMenuTrigger(
    column: CubeResolvedColumn<T>,
    items: ReactNode | null,
    sort: ColumnSortState,
  ) {
    if (items == null || isContextOnly) return null;

    const header = column.header;

    return (
      <MenuTrigger
        isOpen={openMenuColumnKey === column.key}
        // `bottom end`: the trigger sits at the column's trailing edge, so a
        // start-aligned popover hangs off the table on the last column.
        placement="bottom end"
        onOpenChange={(open) => setOpenMenuColumnKey(open ? column.key : null)}
      >
        <ItemAction
          // The grid is one tab stop; the trigger is reached from the header
          // cell with Shift+F10, matching the row menu.
          tabIndex={-1}
          icon={<MoreIcon />}
          aria-label={t('itemTable.columnMenu', 'Column menu')}
          {...columnMenuTriggerProps}
          {...header?.menuTriggerProps}
        />
        <Menu
          {...columnMenuProps}
          {...header?.menuProps}
          onAction={columnMenuActionHandler(column, false)}
        >
          {processColumnMenuItems(items, columnMenuContext(column, sort))}
        </Menu>
      </MenuTrigger>
    );
  }

  return {
    openMenuColumnKey,
    resolveColumnMenu,
    openColumnContextMenu,
    openColumnMenuFromKeyboard,
    renderColumnMenuTrigger,
  };
}
