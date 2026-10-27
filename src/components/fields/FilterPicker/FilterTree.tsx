import { tasty } from '@tenphi/tasty';
import { useRef, useState } from 'react';
import { useFilter, useId, useKeyboard } from 'react-aria';

import { useI18n } from '../../../i18n';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { mergeRefs } from '../../../utils/react/useCombinedRefs';
import { StyledFooter } from '../../actions/Menu/styled';
import { Item } from '../../content/Item/Item';
import {
  deriveCheckedSets,
  toggleCheckedKey,
  toOrderedKeys,
} from '../../content/Tree/checked-keys';
import { getTreeRowId } from '../../content/Tree/rowId';
import { Tree } from '../../content/Tree/Tree';
import { buildTreeIndex, getTreeNodeText } from '../../content/Tree/tree-index';
import {
  FilterListBoxWrapperElement,
  SearchInputElement,
  SearchWrapperElement,
  StyledHeaderWithoutBorder,
} from '../FilterListBox/styled';

import type { Styles } from '@tenphi/tasty';
import type { ReactNode, RefObject } from 'react';
import type { CubeTreeNodeData } from '../../content/Tree/types';

type FilterFn = (textValue: string, inputValue: string) => boolean;

export interface FilterTreeProps {
  treeData: CubeTreeNodeData[];
  /** The value: checked keys over the whole tree. A parent key checks its subtree. */
  checkedKeys: readonly string[];
  /** Every fully checked key, parents included, in tree order. */
  onCheckedKeysChange: (keys: string[]) => void;
  /** The user's expansion. FilterPicker holds it, so it outlives the popover. */
  expandedKeys: string[];
  onExpand: (keys: string[]) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchInputStyles?: Styles;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  filter?: FilterFn | false;
  emptyLabel?: ReactNode;
  header?: ReactNode;
  headerStyles?: Styles;
  footer?: ReactNode;
  footerStyles?: Styles;
  size?: 'medium' | 'large';
  isDisabled?: boolean;
  isLoadingItems?: boolean;
  shouldFocusWrap?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
  /** Escape on an empty search. */
  onEscape?: () => void;
  /** Enter toggled the active row. FilterPicker closes the popover, as it does for a checkable list. */
  onCommit?: () => void;
}

const FilterTreeListElement = tasty({
  qa: 'FilterTreeList',
  styles: {
    display: 'grid',
    gridColumns: '1sf',
    gridRows: '1sf',
    height: 'min 0',
  },
});

/** With a footer, the frame takes a fourth row for it. */
const FOOTER_ROWS_STYLES: Styles = {
  gridRows: 'max-content max-content 1sf max-content',
};

/**
 * Keep the nodes that match, each with its whole subtree, and the ancestors
 * of deeper matches with only their matching branches. `expandKeys` are the
 * nodes with a match below them, matching or not, so they open to show it.
 */
function filterTreeData(
  nodes: CubeTreeNodeData[],
  query: string,
  match: FilterFn,
  expandKeys: string[] = [],
): { nodes: CubeTreeNodeData[]; expandKeys: string[] } {
  const kept: CubeTreeNodeData[] = [];

  for (const node of nodes) {
    if (match(getTreeNodeText(node), query)) {
      kept.push(node);
      if (
        node.children &&
        filterTreeData(node.children, query, match, expandKeys).nodes.length
      ) {
        expandKeys.push(node.key);
      }
      continue;
    }

    const children = node.children
      ? filterTreeData(node.children, query, match, expandKeys).nodes
      : [];

    if (children.length) {
      kept.push({ ...node, children });
      expandKeys.push(node.key);
    }
  }

  return { nodes: kept, expandKeys };
}

/** The rows a keyboard can reach, top to bottom. */
function getNavigableRows(
  nodes: CubeTreeNodeData[],
  expanded: Set<string>,
  out: CubeTreeNodeData[] = [],
): CubeTreeNodeData[] {
  for (const node of nodes) {
    if (!node.isDisabled) out.push(node);
    if (node.children && expanded.has(node.key)) {
      getNavigableRows(node.children, expanded, out);
    }
  }

  return out;
}

/**
 * FilterPicker's popover in tree mode: FilterListBox's header, search row
 * and footer around a checkable `Tree`.
 *
 * The search input keeps focus and points at the active row with
 * `aria-activedescendant`, as FilterListBox does for its options. The
 * checkbox cascade runs over the whole `treeData`, never only the rows a
 * search left visible.
 */
export function FilterTree(props: FilterTreeProps) {
  const {
    treeData,
    checkedKeys,
    onCheckedKeysChange,
    expandedKeys,
    onExpand,
    searchValue: controlledSearchValue,
    onSearchChange,
    searchInputStyles,
    searchInputRef,
    filter,
    header,
    headerStyles,
    footer,
    footerStyles,
    size = 'medium',
    isDisabled,
    isLoadingItems,
    shouldFocusWrap,
    autoFocus,
    onEscape,
    onCommit,
  } = props;
  const { t } = useI18n();
  const {
    searchPlaceholder = t('filterListBox.searchPlaceholder', 'Search...'),
    emptyLabel,
  } = props;
  const ariaLabel = props['aria-label'];

  const treeId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { contains } = useFilter({ sensitivity: 'base' });

  const [internalSearchValue, setInternalSearchValue] = useState('');
  const searchValue = controlledSearchValue ?? internalSearchValue;
  const query = searchValue.trim();
  const isSearching = !!query && filter !== false;

  // Expansion during a search is its own: it starts from the ancestors of
  // the matches and resets with every edit of the query. Clearing the search
  // brings back the expansion the user had, untouched.
  const [searchExpansion, setSearchExpansion] = useState<{
    query: string;
    keys: string[];
  } | null>(null);

  const setSearchValue = (value: string) => {
    if (controlledSearchValue === undefined) setInternalSearchValue(value);
    setSearchExpansion(null);
    onSearchChange?.(value);
  };

  const index = buildTreeIndex(treeData);
  const { checked, halfChecked } = deriveCheckedSets(
    treeData,
    index,
    checkedKeys,
  );

  const filtered = isSearching
    ? filterTreeData(
        treeData,
        query,
        typeof filter === 'function' ? filter : contains,
      )
    : { nodes: treeData, expandKeys: [] };

  const expanded = isSearching
    ? searchExpansion?.query === query
      ? searchExpansion.keys
      : filtered.expandKeys
    : expandedKeys;
  const expandedSet = new Set(expanded);

  const setExpanded = (keys: string[]) => {
    if (isSearching) {
      setSearchExpansion({ query, keys });
      return;
    }
    onExpand(keys);
  };

  const rows = getNavigableRows(filtered.nodes, expandedSet);
  const rowKeys = rows.map((row) => row.key);

  // The row the search input points at. One that a search or a collapse
  // hid falls back to the first checked row in view, then the first row.
  const [storedActiveKey, setActiveKey] = useState<string | null>(null);
  const activeKey =
    storedActiveKey != null && rowKeys.includes(storedActiveKey)
      ? storedActiveKey
      : (rowKeys.find((key) => checked.has(key)) ?? rowKeys[0] ?? null);

  // Whether the node could be toggled: one with its checkbox disabled or
  // opted out stays as it is.
  const toggle = (key: string): boolean => {
    const next = toggleCheckedKey(index, checked, key);
    if (!next) return false;
    onCheckedKeysChange(
      toOrderedKeys(index, deriveCheckedSets(treeData, index, next).checked),
    );
    return true;
  };

  // Toggle the active row and keep it active, though the fallback above
  // would move away from a row that is no longer checked.
  const toggleActive = (key: string) => {
    setActiveKey(key);
    return toggle(key);
  };

  // A press on a row, its checkbox or its chevron moves DOM focus into the
  // tree; hand it back so typing and arrow keys keep working.
  const refocusSearch = () => {
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const moveActive = (key: string | undefined) => {
    if (key != null) setActiveKey(key);
  };

  const getActiveRow = () =>
    activeKey == null ? undefined : rows.find((row) => row.key === activeKey);

  const handleArrow = (direction: 1 | -1) => {
    const position = activeKey == null ? -1 : rowKeys.indexOf(activeKey);
    let next = position + direction;
    if (position < 0) next = direction === 1 ? 0 : rowKeys.length - 1;
    if (next < 0 || next >= rowKeys.length) {
      if (!shouldFocusWrap) return;
      next = (next + rowKeys.length) % rowKeys.length;
    }
    moveActive(rowKeys[next]);
  };

  // Right and Left reach the tree only where they can no longer move the
  // caret: at the end of the text, and at its start.
  const handleExpandKey = (
    input: HTMLInputElement,
    direction: 'open' | 'close',
  ): boolean => {
    const row = getActiveRow();
    if (!row) return false;

    const caret = input.selectionStart ?? 0;
    const atEdge =
      input.selectionStart === input.selectionEnd &&
      (direction === 'open' ? caret === input.value.length : caret === 0);
    if (!atEdge) return false;

    const hasChildren = !!row.children?.length;
    const isExpanded = expandedSet.has(row.key);

    if (direction === 'open') {
      if (!hasChildren) return false;
      if (!isExpanded) {
        setExpanded([...expanded, row.key]);
      } else {
        moveActive(row.children?.find((child) => !child.isDisabled)?.key);
      }
      return true;
    }

    if (hasChildren && isExpanded) {
      setExpanded(expanded.filter((key) => key !== row.key));
      return true;
    }

    // The nearest ancestor the keyboard can reach; a disabled one is skipped.
    let parentKey = index.parentOf.get(row.key);
    while (parentKey != null && !rowKeys.includes(parentKey)) {
      parentKey = index.parentOf.get(parentKey);
    }
    if (parentKey == null) return false;
    moveActive(parentKey);
    return true;
  };

  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          handleArrow(e.key === 'ArrowDown' ? 1 : -1);
          break;
        case 'Home':
        case 'End':
        case 'PageUp':
        case 'PageDown':
          e.preventDefault();
          moveActive(
            e.key === 'Home' || e.key === 'PageUp'
              ? rowKeys[0]
              : rowKeys[rowKeys.length - 1],
          );
          break;
        case 'ArrowRight':
        case 'ArrowLeft':
          if (
            handleExpandKey(
              e.target as HTMLInputElement,
              e.key === 'ArrowRight' ? 'open' : 'close',
            )
          ) {
            e.preventDefault();
          }
          break;
        case 'Enter':
          if (activeKey == null) break;
          e.preventDefault();
          if (toggleActive(activeKey)) onCommit?.();
          break;
        case ' ':
          if (activeKey == null || searchValue) break;
          e.preventDefault();
          toggleActive(activeKey);
          break;
        case 'Escape':
          if (searchValue) {
            e.preventDefault();
            setSearchValue('');
          } else if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;
        default:
          break;
      }
    },
  });

  const searchMods = {
    disabled: !!isDisabled,
    'loading-items': !!isLoadingItems,
    searchable: true,
    suffix: !!isLoadingItems,
  };

  const resolvedEmptyLabel =
    emptyLabel !== undefined
      ? emptyLabel
      : query
        ? t('filterListBox.noResults', 'No results found')
        : t('filterListBox.noItems', 'No items');

  return (
    <FilterListBoxWrapperElement
      qa="FilterTreeWrapper"
      mods={{ popover: true }}
      styles={footer ? FOOTER_ROWS_STYLES : undefined}
    >
      {header ? (
        <StyledHeaderWithoutBorder data-size={size} styles={headerStyles}>
          {header}
        </StyledHeaderWithoutBorder>
      ) : (
        <div role="presentation" />
      )}
      <SearchWrapperElement mods={searchMods} data-size={size}>
        <SearchInputElement
          ref={mergeRefs(inputRef, searchInputRef)}
          qa="FilterTreeSearch"
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-haspopup="tree"
          aria-controls={filtered.nodes.length ? treeId : undefined}
          aria-activedescendant={
            activeKey == null ? undefined : getTreeRowId(treeId, activeKey)
          }
          aria-label={ariaLabel}
          placeholder={searchPlaceholder}
          value={searchValue}
          disabled={isDisabled}
          autoFocus={autoFocus}
          {...(autoFocus ? { 'data-autofocus': '' } : undefined)}
          data-size={size}
          mods={searchMods}
          styles={searchInputStyles}
          onChange={(e) => setSearchValue(e.target.value)}
          {...keyboardProps}
        />
        {isLoadingItems && (
          <div data-element="Suffix">
            <LoadingIcon data-element="InputIcon" />
          </div>
        )}
      </SearchWrapperElement>
      <FilterTreeListElement
        // Only the tree's own focus goes back: an empty label may hold a
        // control, such as Retry, that the keyboard has to reach.
        onFocus={filtered.nodes.length ? refocusSearch : undefined}
      >
        {filtered.nodes.length ? (
          <Tree
            id={treeId}
            qa="FilterTree"
            ariaLabel={ariaLabel}
            treeData={filtered.nodes}
            size={size}
            isCheckable
            isDisabled={isDisabled}
            selectionMode="none"
            checkedKeys={{
              checked: [...checked],
              halfChecked: [...halfChecked],
            }}
            expandedKeys={expanded}
            _activeKey={activeKey}
            onExpand={(keys) => setExpanded(keys.map(String))}
            onCheck={(_, info) => toggle(info.node.key)}
            _onRowAction={toggleActive}
          />
        ) : (
          <Item preset="t4" color="#dark-03" size={size} padding="(.5x - 1bw)">
            {resolvedEmptyLabel}
          </Item>
        )}
      </FilterTreeListElement>
      {footer ? (
        <StyledFooter styles={footerStyles} data-size={size}>
          {footer}
        </StyledFooter>
      ) : null}
    </FilterListBoxWrapperElement>
  );
}
