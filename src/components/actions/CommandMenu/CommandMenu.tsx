import { useObjectRef, useSyncRef } from '@react-aria/utils';
import { CollectionChildren, FocusStrategy, Key } from '@react-types/shared';
import {
  BasePropsWithoutChildren,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  Styles,
} from '@tenphi/tasty';
import React, {
  KeyboardEvent,
  ReactElement,
  ReactNode,
  Ref,
  useId,
  useRef,
  useState,
} from 'react';
import { useFilter, useMenu } from 'react-aria';
import { Section, useTreeState } from 'react-stately';

import { useI18n } from '../../../i18n';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { mergeProps } from '../../../utils/react';
import { extractStyles, mergeStyleLayers } from '../../../utils/styles';
import { useMenuContext } from '../Menu/context';
import { CubeMenuProps } from '../Menu/Menu';
import { MenuCollectionItem as Item } from '../Menu/MenuCollectionItem';
import { MenuItem } from '../Menu/MenuItem';
import { MenuSection } from '../Menu/MenuSection';
import { MenuTrigger } from '../Menu/MenuTrigger';
import {
  StyledDivider,
  StyledFooter,
  StyledHeader,
  StyledMenu,
} from '../Menu/styled';

import {
  StyledCommandMenu,
  StyledEmptyState,
  StyledLoadingWrapper,
  StyledSearchInput,
} from './styled';

/** The keys of the items in `nodes`, in order, including those in sections. */
function collectItemKeys(nodes: Iterable<any>, keys: Key[] = []): Key[] {
  for (const node of nodes) {
    if (node?.type === 'section') {
      collectItemKeys(node.childNodes ?? [], keys);
    } else if (node?.type === 'item') {
      keys.push(node.key);
    }
  }

  return keys;
}

/**
 * The key an arrow press moves to: the next enabled key after `currentKey` in
 * `direction`, wrapping round to the first enabled key in that direction (the
 * last one going up). With nothing focused, or the focused key filtered out,
 * it returns that key.
 */
function getNextEnabledKey(
  keys: Key[],
  currentKey: Key | null,
  direction: 1 | -1,
  isDisabled: (key: Key) => boolean,
): Key | null {
  const isEnabled = (key: Key) => !isDisabled(key);
  const index = currentKey == null ? -1 : keys.indexOf(currentKey);
  const ahead =
    direction === 1
      ? keys.slice(index + 1)
      : keys.slice(0, Math.max(index, 0)).reverse();
  const ordered = direction === 1 ? keys : [...keys].reverse();

  return ahead.find(isEnabled) ?? ordered.find(isEnabled) ?? null;
}

export interface CommandMenuItem {
  // Standard item props
  id: string;
  textValue: string;

  // Enhanced search features
  keywords?: string[];
  forceMount?: boolean;

  // Standard Menu item props inherited
  [key: string]: any;
}

export interface CubeCommandMenuProps<T>
  extends BasePropsWithoutChildren,
    ContainerStyleProps,
    Omit<
      CubeMenuProps<T>,
      'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'
    > {
  // Search-specific props
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filter?: (textValue: string, inputValue: string) => boolean;
  emptyLabel?: ReactNode;
  searchInputStyles?: Styles;
  headerStyles?: Styles;
  footerStyles?: Styles;

  // Advanced search features
  isLoading?: boolean;
  shouldFilter?: boolean;

  // Focus management - override the autoFocus from CubeMenuProps to allow boolean | FocusStrategy
  autoFocus?: boolean | FocusStrategy;

  // Size prop
  size?: 'medium' | 'large' | (string & {});

  /** Currently selected keys (controlled) */
  selectedKeys?: string[];
  /** Initially selected keys (uncontrolled) */
  defaultSelectedKeys?: string[];
  /** Handler for selection changes */
  onSelectionChange?: (keys: string[]) => void;
}

function CommandMenu<T extends object>(
  props: CubeCommandMenuProps<T>,
  ref: Ref<HTMLDivElement>,
) {
  const { t } = useI18n();

  const {
    searchPlaceholder = t(
      'commandMenu.searchPlaceholder',
      'Search commands...',
    ),
    searchValue: controlledSearchValue,
    onSearchChange,
    filter: customFilter,
    emptyLabel = t('commandMenu.empty', 'No commands found'),
    searchInputStyles,
    headerStyles,
    footerStyles,
    isLoading = false,
    shouldFilter = true,
    autoFocus = true,
    size = 'medium',
    qa,
    styles,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    onAction,
    header,
    footer,
    ...restMenuProps
  } = props;

  const domRef = useObjectRef(ref);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const instanceId = useId();
  const menuId = `${qa || 'CommandMenu'}-${instanceId}-menu`;
  const contextProps = useMenuContext();

  // Convert string[] to Set<Key> for React Aria compatibility
  const ariaSelectedKeys = selectedKeys ? new Set(selectedKeys) : undefined;
  const ariaDefaultSelectedKeys = defaultSelectedKeys
    ? new Set(defaultSelectedKeys)
    : undefined;

  const handleSelectionChange = onSelectionChange
    ? (keys: 'all' | Set<Key>) => {
        if (keys === 'all') {
          // Handle 'all' selection case - collect all available keys
          const allKeys = Array.from(treeState.collection.getKeys()).map(
            (key: any) => String(key),
          );
          onSelectionChange(allKeys);
        } else if (keys instanceof Set) {
          onSelectionChange(Array.from(keys).map((key) => String(key)));
        } else {
          onSelectionChange([]);
        }
      }
    : undefined;

  const completeProps = mergeProps(contextProps, restMenuProps, {
    onAction: onAction ? (key: Key) => onAction(key) : undefined,
    selectedKeys: ariaSelectedKeys,
    defaultSelectedKeys: ariaDefaultSelectedKeys,
    onSelectionChange: handleSelectionChange,
  });

  // Search state management
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const searchValue = controlledSearchValue ?? internalSearchValue;

  const handleSearchChange = (value: string) => {
    if (controlledSearchValue === undefined) {
      setInternalSearchValue(value);
    }
    onSearchChange?.(value);
  };

  // Filter setup
  const { contains } = useFilter({ sensitivity: 'base' });
  const textFilterFn = customFilter || contains;

  // Enhanced filter function that supports keywords and forceMount
  const enhancedFilter = (
    textValue: string,
    inputValue: string,
    item?: any,
  ) => {
    // Always show force-mounted items
    if (item?.forceMount) {
      return true;
    }

    // If shouldFilter is false, show all items
    if (!shouldFilter) {
      return true;
    }

    // Split input value into individual words and filter out empty strings
    const searchWords = inputValue
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    // If no search words, show all items
    if (searchWords.length === 0) {
      return true;
    }

    // Collect all searchable text for this item
    const searchableTexts: string[] = [];

    // Add main text value
    searchableTexts.push(textValue.toLowerCase());

    // Add keywords if available
    if (item?.keywords && Array.isArray(item.keywords)) {
      searchableTexts.push(
        ...item.keywords.map((keyword: string) => keyword.toLowerCase()),
      );
    }

    // Check if ALL search words match at least one of the searchable texts
    return searchWords.every((searchWord) =>
      searchableTexts.some((text) => text.includes(searchWord)),
    );
  };

  // Collection filter for React Stately
  const collectionFilter = (nodes: Iterable<any>): Iterable<any> => {
    const term = searchValue.trim();

    // If no search term, return all nodes
    if (!term) {
      return nodes;
    }

    // Split search term into words for multi-word filtering
    const searchWords = term
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    // If no valid search words, return all nodes
    if (searchWords.length === 0) {
      return nodes;
    }

    // Recursive helper to filter sections and items
    const filterNodes = (iter: Iterable<any>): any[] => {
      const result: any[] = [];

      for (const node of iter) {
        if (node.type === 'section') {
          const filteredChildren = filterNodes(node.childNodes);

          if (filteredChildren.length) {
            result.push({
              ...node,
              childNodes: filteredChildren,
            });
          }
        } else {
          const text = node.textValue ?? String(node.rendered ?? '');

          if (enhancedFilter(text, term, node.props)) {
            result.push(node);
          }
        }
      }

      return result;
    };

    return filterNodes(nodes);
  };

  // Create tree state with filter for both keyboard navigation and rendering
  const treeStateProps = {
    ...completeProps,
    children: completeProps.children as CollectionChildren<T>,
    filter: collectionFilter,
    shouldUseVirtualFocus: true, // Always use virtual focus for CommandMenu
  };

  const treeState = useTreeState(treeStateProps);
  const itemId = (key: Key) => {
    const item = treeState.collection.getItem(key);
    const actions = item?.props.actions;
    // A plain command's layout and semantic target share the consumer's DOM id.
    if (
      item?.props.id != null &&
      item.props.href == null &&
      (!actions || actions === true)
    )
      return String(item.props.id);
    return `${menuId}-option-${encodeURIComponent(String(key))}`;
  };

  const collectionItems = [...treeState.collection];
  const hasSections = collectionItems.some((item) => item.type === 'section');

  const focusedKey = treeState.selectionManager.focusedKey;

  // Apply filtering to collection items for rendering and empty state checks
  const filteredCollectionItems = [...collectionFilter(collectionItems)];

  const hasFilteredItems = filteredCollectionItems.length > 0;
  const viewHasSections = filteredCollectionItems.some(
    (item) => item.type === 'section',
  );

  // Helper function to find the first selectable item from filtered results
  const findFirstSelectableItem = () =>
    collectItemKeys(filteredCollectionItems).find(
      (key) => !treeState.selectionManager.isDisabled(key),
    ) ?? null;

  // Create a ref for the menu container
  const menuRef = useRef<HTMLUListElement>(null);

  // Use menu hook for accessibility
  const { menuProps } = useMenu(
    {
      ...completeProps,
      'aria-label': t('commandMenu.menu', 'Command menu'),
      shouldUseVirtualFocus: true,
    },
    treeState,
    menuRef,
  );

  // Manual rendering of menu items (similar to Menu component)
  const renderedItems: React.ReactNode[] = [];
  let isFirstSection = true;

  filteredCollectionItems.forEach((item) => {
    if (item.type === 'section') {
      if (!isFirstSection) {
        renderedItems.push(
          <StyledDivider
            key={`divider-${String(item.key)}`}
            role="separator"
            aria-orientation="horizontal"
          />,
        );
      }

      renderedItems.push(
        <MenuSection
          key={item.key}
          item={item}
          state={treeState}
          styles={completeProps.sectionStyles}
          itemStyles={completeProps.itemStyles}
          headingStyles={completeProps.sectionHeadingStyles}
          size={size}
          itemId={itemId}
        />,
      );

      isFirstSection = false;
      return;
    }

    let menuItem = (
      <MenuItem
        key={item.key}
        item={item}
        state={treeState}
        styles={completeProps.itemStyles}
        size={size}
        id={itemId(item.key)}
      />
    );

    // Apply custom wrapper if provided
    if (item.props.wrapper) {
      menuItem = item.props.wrapper(menuItem);
    }

    // Ensure every child has a stable key, even if the wrapper component didn't set one.
    renderedItems.push(React.cloneElement(menuItem, { key: item.key }));
  });

  // Auto-focus search input
  React.useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      // Use a small timeout to ensure the element is visible and focusable
      // This is especially important when the CommandMenu is opened in a popover
      const timeoutId = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [autoFocus]);

  // Also focus when the component becomes visible (for trigger/popover usage)
  React.useEffect(() => {
    // Check if autoFocus is enabled and we're in a trigger context
    if (autoFocus && contextProps.autoFocus && searchInputRef.current) {
      // Use a small timeout to ensure the popover is fully rendered
      const timeoutId = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50); // Slightly longer timeout for popover context

      return () => clearTimeout(timeoutId);
    }
  }, [autoFocus, contextProps.autoFocus]);

  // Track the previous search value to only run auto-focus when search actually changes
  const prevSearchValueRef = useRef<string>('');

  // Auto-focus first item when search value changes (but not on initial render)
  React.useEffect(() => {
    const currentSearchValue = searchValue.trim();
    const prevSearchValue = prevSearchValueRef.current;

    // Only auto-focus when search value actually changes
    if (currentSearchValue !== prevSearchValue && currentSearchValue !== '') {
      const firstSelectableKey = findFirstSelectableItem();

      if (firstSelectableKey != null && hasFilteredItems) {
        // Focus the first item in the selection manager
        treeState.selectionManager.setFocusedKey(firstSelectableKey);
      } else {
        // Clear focus if no items are available
        treeState.selectionManager.setFocusedKey(null);
      }
    }

    // Update the previous search value
    prevSearchValueRef.current = currentSearchValue;
  }, [searchValue, findFirstSelectableItem, hasFilteredItems]);

  // ---- search input keyboard ----------------------------------------------
  const handleArrowKey = (e: KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const { selectionManager } = treeState;
    const currentKey = selectionManager.focusedKey;
    const nextKey = getNextEnabledKey(
      collectItemKeys(filteredCollectionItems),
      currentKey,
      e.key === 'ArrowDown' ? 1 : -1,
      (key) => selectionManager.isDisabled(key),
    );

    if (nextKey != null) {
      selectionManager.setFocusedKey(nextKey);
    }
  };

  // Use the rendered item's Aria handlers for commands, selection and navigation.
  const handleActionKey = (e: KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      e.repeat ||
      focusedKey == null ||
      treeState.selectionManager.isDisabled(focusedKey)
    )
      return;
    const item = menuRef.current?.ownerDocument.getElementById(
      itemId(focusedKey),
    );
    if (!item || !menuRef.current?.contains(item)) return;
    const shouldActivate = item.dispatchEvent(
      new window.KeyboardEvent('keydown', {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        bubbles: true,
        cancelable: true,
      }),
    );
    // An anchor's Enter handler leaves its native default action to the browser.
    if (shouldActivate && e.key === 'Enter') {
      item.dispatchEvent(
        new window.MouseEvent('click', {
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          bubbles: true,
          cancelable: true,
          detail: 1,
        }),
      );
    }
    // The real keyup belongs to the search input, so balance the item's press here.
    item.dispatchEvent(
      new window.KeyboardEvent('keyup', {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        bubbles: true,
        cancelable: true,
      }),
    );
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      handleArrowKey(e);
    } else if (e.key === 'Enter' || (e.key === ' ' && !searchValue.trim())) {
      handleActionKey(e);
    } else if (e.key === 'Escape' && searchValue) {
      e.preventDefault();
      handleSearchChange('');
    }
  };

  // Extract styles
  const extractedStyles = extractStyles(props, CONTAINER_STYLES);

  // Determine if we should show empty state based on actual filtered collection
  const hasSearchTerm = searchValue.trim().length > 0;
  const showEmptyState = hasSearchTerm && !hasFilteredItems && !isLoading;
  const activeDescendant =
    !isLoading &&
    !showEmptyState &&
    focusedKey != null &&
    collectItemKeys(filteredCollectionItems).includes(focusedKey)
      ? itemId(focusedKey)
      : undefined;

  // Sync refs
  useSyncRef(contextProps, menuRef);

  // Determine mods based on menu context
  const mods = {
    sections: viewHasSections,
    footer: !!footer,
    header: !!header,
    popover: completeProps.mods?.popover,
    tray: completeProps.mods?.tray,
  };

  const {
    'aria-label': _ariaLabel,
    'aria-labelledby': _ariaLabelledBy,
    'aria-describedby': _ariaDescribedBy,
    'aria-details': _ariaDetails,
    ...wrapperProps
  } = filterBaseProps(props) as Record<string, unknown>;

  return (
    <StyledCommandMenu
      {...wrapperProps}
      ref={domRef}
      qa={qa || 'CommandMenu'}
      data-size={size}
      mods={mods}
      styles={mergeStyleLayers(extractedStyles, styles)}
    >
      {/* Header */}
      {header && (
        <StyledHeader
          role="presentation"
          data-size={size}
          styles={mergeStyleLayers({ border: 'none' }, headerStyles)}
        >
          {header}
        </StyledHeader>
      )}

      {/* Search Input */}
      <StyledSearchInput
        ref={searchInputRef}
        type="search"
        placeholder={searchPlaceholder}
        value={searchValue}
        styles={searchInputStyles}
        data-size={size}
        aria-label={completeProps['aria-label'] ?? searchPlaceholder}
        aria-labelledby={completeProps['aria-labelledby']}
        aria-describedby={completeProps['aria-describedby']}
        aria-details={completeProps['aria-details']}
        aria-controls={!isLoading && !showEmptyState ? menuId : undefined}
        role="searchbox"
        aria-activedescendant={activeDescendant}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={handleSearchKeyDown}
      />

      {/* Loading State */}
      {isLoading && (
        <StyledLoadingWrapper>
          <LoadingIcon
            role="progressbar"
            aria-label={t('commandMenu.loading', 'Loading commands')}
            aria-hidden={false}
          />
        </StyledLoadingWrapper>
      )}

      {/* Menu Content - always render unless loading */}
      {!isLoading && !showEmptyState && (
        <StyledMenu
          {...menuProps}
          ref={menuRef}
          id={menuId}
          aria-label={t('commandMenu.menu', 'Command menu')}
          qa="Menu"
          data-size={size}
          mods={mods}
          styles={{
            border: 'none',
            boxShadow: 'none',
            radius: 0,
            padding: '0.5x',
          }}
        >
          {renderedItems}
        </StyledMenu>
      )}

      {/* Empty State - show when search term exists but no results */}
      {!isLoading && showEmptyState && (
        <StyledEmptyState>{emptyLabel}</StyledEmptyState>
      )}

      {/* Footer */}
      {footer && (
        <StyledFooter
          role="presentation"
          data-size={size}
          styles={footerStyles}
        >
          {footer}
        </StyledFooter>
      )}
    </StyledCommandMenu>
  );
}

// forwardRef doesn't support generic parameters, so cast the result to the correct type
const _CommandMenu = React.forwardRef(CommandMenu) as <T>(
  props: CubeCommandMenuProps<T> & React.RefAttributes<HTMLDivElement>,
) => ReactElement;

// Attach Trigger alias from MenuTrigger for consistent API
// Also attach Item and Section for compound component pattern
const __CommandMenu = Object.assign(_CommandMenu, {
  Trigger: MenuTrigger,
  Item,
  Section,
  displayName: 'CommandMenu',
});

export { __CommandMenu as CommandMenu };
