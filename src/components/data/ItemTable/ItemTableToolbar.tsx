import { tasty } from '@tenphi/tasty';
import { createContext, useContext } from 'react';

import { useI18n } from '../../../i18n';
import { ReloadIcon } from '../../../icons';
import { Button } from '../../actions';
import { SearchInput } from '../../fields/SearchInput';

import type { Key } from '@react-types/shared';
import type { Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';

/**
 * Lets `ItemTable.Search` (and future chrome pieces) read the table's state
 * without prop drilling, so a consumer can rebuild the toolbar from parts and
 * still have exactly one owner of the search term.
 */
export interface CubeItemTableChromeState<T = any> {
  searchValue: string;
  setSearchValue: (value: string) => void;
  searchPlaceholder?: string;
  isLoading: boolean;
  onRefresh?: () => void;
  /** `'all'` is the sentinel, so `selectedCount` is what the UI should show. */
  selectedKeys: Key[] | 'all';
  selectedRows: T[];
  selectedCount: number;
  clearSelection: () => void;
}

const ChromeContext = createContext<CubeItemTableChromeState | null>(null);

export const ItemTableChromeProvider = ChromeContext.Provider;

export function useItemTableChrome(component: string) {
  const context = useContext(ChromeContext);

  if (!context) {
    throw new Error(
      `${component} must be rendered inside an ItemTable — it reads the table's search state from context.`,
    );
  }

  return context;
}

const ToolbarElement = tasty({
  qa: 'ItemTableToolbar',
  as: 'div',
  styles: {
    gridRow: 1,
    display: 'flex',
    flow: 'row',
    gap: '1x',
    placeItems: 'center',
    placeContent: 'space-between',
    padding: '1x',
    border: '1bw #border bottom',

    // Left group: search, then filters.
    Start: {
      $: '>',
      display: 'flex',
      flow: 'row',
      gap: '1x',
      placeItems: 'center',
      width: 'min 0',
    },
    // Right group: arbitrary consumer actions, then refresh.
    End: {
      $: '>',
      display: 'flex',
      flow: 'row',
      gap: '1x',
      placeItems: 'center',
    },
  },
});

const SearchElement = tasty(SearchInput, {
  qa: 'ItemTableSearchInput',
  styles: { width: 'max 300px' },
});

/** The table's search input, bound to the table's own state. */
export function ItemTableSearch(props: {
  placeholder?: string;
  styles?: Styles;
  qa?: string;
}) {
  const { searchValue, setSearchValue, searchPlaceholder } =
    useItemTableChrome('ItemTable.Search');
  const { t } = useI18n();

  return (
    <SearchElement
      qa={props.qa}
      size="small"
      isClearable
      aria-label={t('itemTable.search', 'Search')}
      placeholder={
        props.placeholder ??
        searchPlaceholder ??
        t('itemTable.searchPlaceholder', 'Search...')
      }
      value={searchValue}
      styles={props.styles}
      onChange={setSearchValue}
    />
  );
}

export interface ItemTableToolbarProps {
  isSearchable?: boolean;
  filters?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
  styles?: Styles;
  searchStyles?: Styles;
}

export function ItemTableToolbar({
  isSearchable,
  filters,
  actions,
  onRefresh,
  isLoading,
  styles,
  searchStyles,
}: ItemTableToolbarProps) {
  const { t } = useI18n();

  return (
    <ToolbarElement styles={styles} role="toolbar">
      <div data-element="Start">
        {isSearchable ? <ItemTableSearch styles={searchStyles} /> : null}
        {filters}
      </div>
      <div data-element="End">
        {actions}
        {onRefresh ? (
          <Button
            qa="ItemTableRefreshButton"
            size="small"
            icon={<ReloadIcon />}
            isLoading={isLoading}
            aria-label={t('itemTable.refresh', 'Refresh')}
            onPress={onRefresh}
          />
        ) : null}
      </div>
    </ToolbarElement>
  );
}
