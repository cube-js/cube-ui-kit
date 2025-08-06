import { useSyncRef } from '@react-aria/utils';
import { useDOMRef } from '@react-spectrum/utils';
import { DOMRef, FocusStrategy } from '@react-types/shared';
import React, {
  Key,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFilter, useMenu } from 'react-aria';
// Import Item and Section from Menu for CommandMenu compound component
import { Item, Section, useTreeState } from 'react-stately';

import { LoadingIcon } from '../../../icons';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';
import { MenuContext, MenuContextValue, useMenuContext } from '../Menu';
import { CubeMenuProps } from '../Menu/Menu';
import { MenuItem } from '../Menu/MenuItem';
import { MenuSection } from '../Menu/MenuSection';
import { MenuTrigger } from '../Menu/MenuTrigger';
import {
  StyledDivider,
  StyledFooter,
  StyledHeader,
  StyledMenu,
} from '../Menu/styled';
import { SubMenuTrigger } from '../Menu/SubMenuTrigger';

import {
  StyledCommandMenu,
  StyledEmptyState,
  StyledLoadingWrapper,
  StyledSearchInput,
} from './styled';

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
  extends BaseProps,
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
  ref: DOMRef<HTMLDivElement>,
) {
  const {
    searchPlaceholder = 'Search commands...',
    searchValue: controlledSearchValue,
    onSearchChange,
    filter: customFilter,
    emptyLabel = 'No commands found',
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
    header,
    footer,
    ...restMenuProps
  } = props;

  const domRef = useDOMRef(ref);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    selectedKeys: ariaSelectedKeys,
    defaultSelectedKeys: ariaDefaultSelectedKeys,
    onSelectionChange: handleSelectionChange,
  });

  // Search state management
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const searchValue = controlledSearchValue ?? internalSearchValue;

  const handleSearchChange = useCallback(
    (value: string) => {
      if (controlledSearchValue === undefined) {
        setInternalSearchValue(value);
      }
      onSearchChange?.(value);
    },
    [controlledSearchValue, onSearchChange],
  );

  // Filter setup
  const { contains } = useFilter({ sensitivity: 'base' });
  const textFilterFn = useMemo(
    () => customFilter || contains,
    [customFilter, contains],
  );

  // Enhanced filter function that supports keywords and forceMount
  const enhancedFilter = useCallback(
    (textValue: string, inputValue: string, item?: any) => {
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
    },
    [shouldFilter],
  );

  // Collection filter for React Stately
  const collectionFilter = useCallback(
    (nodes: Iterable<any>): Iterable<any> => {
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
    },
    [searchValue, enhancedFilter],
  );

  // Create tree state with filter for both keyboard navigation and rendering
  const treeStateProps = {
    ...completeProps,
    filter: collectionFilter,
    shouldUseVirtualFocus: true, // Always use virtual focus for CommandMenu
  };

  const treeState = useTreeState(treeStateProps);

  const collectionItems = [...treeState.collection];
  const hasSections = collectionItems.some((item) => item.type === 'section');

  // Track focused key for aria-activedescendant
  const [focusedKey, setFocusedKey] = React.useState<React.Key | null>(null);
  const focusedKeyRef = useRef<React.Key | null>(null);

  // Apply filtering to collection items for rendering and empty state checks
  const filteredCollectionItems = useMemo(() => {
    const term = searchValue.trim();
    if (!term) {
      return collectionItems;
    }

    // Split search term into words for multi-word filtering
    const searchWords = term
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    // If no valid search words, return all items
    if (searchWords.length === 0) {
      return collectionItems;
    }

    const filterNodes = (items: any[]): any[] => {
      const result: any[] = [];

      [...items].forEach((item) => {
        if (item.type === 'section') {
          const filteredChildren = filterNodes(item.childNodes);
          if (filteredChildren.length) {
            result.push({
              ...item,
              childNodes: filteredChildren,
            });
          }
        } else {
          const text = item.textValue ?? String(item.rendered ?? '');
          if (enhancedFilter(text, term, item.props)) {
            result.push(item);
          }
        }
      });

      return result;
    };

    return filterNodes(collectionItems);
  }, [collectionItems, searchValue, enhancedFilter]);

  const hasFilteredItems = filteredCollectionItems.length > 0;
  const viewHasSections = filteredCollectionItems.some(
    (item) => item.type === 'section',
  );

  // Helper function to find the first selectable item from filtered results
  const findFirstSelectableItem = useCallback(() => {
    // Use the filtered collection items instead of the full tree state collection
    for (const item of filteredCollectionItems) {
      if (
        item &&
        item.type === 'item' &&
        !treeState.selectionManager.isDisabled(item.key)
      ) {
        return item.key;
      }
    }

    return null;
  }, [filteredCollectionItems, treeState.selectionManager]);

  // Create a ref for the menu container
  const menuRef = useRef<HTMLUListElement>(null);

  // Use menu hook for accessibility
  const { menuProps } = useMenu(
    {
      ...completeProps,
      'aria-label': 'Command palette menu',
      filter: collectionFilter,
      shouldUseVirtualFocus: true,
    },
    treeState,
    menuRef,
  );

  // Manual rendering of menu items (similar to Menu component)
  const renderedItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    let isFirstSection = true;

    filteredCollectionItems.forEach((item) => {
      if (item.type === 'section') {
        if (!isFirstSection) {
          items.push(
            <StyledDivider
              key={`divider-${String(item.key)}`}
              role="separator"
              aria-orientation="horizontal"
            />,
          );
        }

        items.push(
          <MenuSection
            key={item.key}
            item={item}
            state={treeState}
            styles={completeProps.sectionStyles}
            itemStyles={completeProps.itemStyles}
            headingStyles={completeProps.sectionHeadingStyles}
            selectionIcon={completeProps.selectionIcon}
            size={size}
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
          selectionIcon={completeProps.selectionIcon}
          size={size}
          onAction={item.onAction}
        />
      );

      // Apply tooltip wrapper if tooltip property is provided
      if (item.props.tooltip) {
        const tooltipProps =
          typeof item.props.tooltip === 'string'
            ? { title: item.props.tooltip }
            : item.props.tooltip;

        menuItem = (
          <TooltipProvider
            key={item.key}
            activeWrap
            placement="right"
            {...tooltipProps}
          >
            {menuItem}
          </TooltipProvider>
        );
      }

      // Apply custom wrapper if provided
      if (item.props?.wrapper) {
        menuItem = item.props.wrapper(menuItem);
      } else if ((item as any).wrapper) {
        // Handle wrapper from collection nodes (e.g., SubMenuTrigger)
        menuItem = (item as any).wrapper(menuItem);
      }

      // Ensure every child has a stable key, even if the wrapper component didn't set one.
      items.push(React.cloneElement(menuItem, { key: item.key }));
    });

    return items;
  }, [
    filteredCollectionItems,
    treeState,
    completeProps.sectionStyles,
    completeProps.itemStyles,
    completeProps.selectionIcon,
    completeProps.sectionHeadingStyles,
  ]);

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

      if (firstSelectableKey && hasFilteredItems) {
        // Focus the first item in the selection manager
        treeState.selectionManager.setFocusedKey(firstSelectableKey);
        setFocusedKey(firstSelectableKey);
        focusedKeyRef.current = firstSelectableKey;
      } else {
        // Clear focus if no items are available
        treeState.selectionManager.setFocusedKey(null);
        setFocusedKey(null);
        focusedKeyRef.current = null;
      }
    }

    // Update the previous search value
    prevSearchValueRef.current = currentSearchValue;
  }, [searchValue, findFirstSelectableItem, hasFilteredItems]);

  // Extract styles
  const extractedStyles = useMemo(
    () => extractStyles(props, CONTAINER_STYLES),
    [props],
  );

  // Determine if we should show empty state based on actual filtered collection
  const hasSearchTerm = searchValue.trim().length > 0;
  const showEmptyState = hasSearchTerm && !hasFilteredItems && !isLoading;

  // Sync refs
  useSyncRef(contextProps, menuRef);

  // Create menu context for submenus
  const commandMenuContext = useMemo(
    (): MenuContextValue => ({
      ref: menuRef as React.MutableRefObject<HTMLUListElement>,
      onClose: contextProps.onClose,
      closeOnSelect: true,
      autoFocus: false, // Search input should maintain focus
      mods: {
        popover: !!contextProps.mods?.popover,
        tray: !!contextProps.mods?.tray,
      },
      isClosing: false, // CommandMenu doesn't have its own closing state
    }),
    [contextProps, menuRef],
  );

  const mods = useMemo(() => {
    // Determine mods based on menu context
    let popoverMod = completeProps.mods?.popover;
    let trayMod = completeProps.mods?.tray;

    return {
      sections: viewHasSections,
      footer: !!footer,
      header: !!header,
      popover: popoverMod,
      tray: trayMod,
    };
  }, [viewHasSections, footer, header, completeProps.mods]);

  return (
    <StyledCommandMenu
      {...filterBaseProps(props)}
      ref={domRef}
      qa={qa || 'CommandMenu'}
      data-size={size}
      mods={mods}
      styles={mergeProps(extractedStyles, styles)}
    >
      {/* Header */}
      {header && (
        <StyledHeader
          role="presentation"
          data-size={size}
          styles={{ border: 'none', ...headerStyles }}
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
        aria-controls={`${qa || 'CommandMenu'}-menu`}
        role="combobox"
        aria-expanded="true"
        aria-haspopup="listbox"
        aria-activedescendant={
          focusedKey != null
            ? `${qa || 'CommandMenu'}-menu-option-${focusedKey}`
            : undefined
        }
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();

            const isArrowDown = e.key === 'ArrowDown';
            const { selectionManager } = treeState;
            // Use the ref to get the current focused key synchronously
            const currentKey =
              focusedKeyRef.current || selectionManager.focusedKey;

            // Helper function to get all visible item keys by applying filter to tree state collection
            const getVisibleItemKeys = (): Key[] => {
              const keys: Key[] = [];
              const term = searchValue.trim();

              // Use the tree state's collection and apply filter manually
              for (const item of treeState.collection) {
                if (item.type === 'item') {
                  const text = item.textValue ?? String(item.rendered ?? '');
                  if (enhancedFilter(text, term, item.props)) {
                    keys.push(item.key);
                  }
                }
              }

              return keys;
            };

            // Helper function to find next selectable key in a direction
            const findNextSelectableKey = (
              currentIndex: number,
              direction: 'forward' | 'backward',
              visibleKeys: Key[],
            ) => {
              const increment = direction === 'forward' ? 1 : -1;

              for (
                let i = currentIndex + increment;
                i >= 0 && i < visibleKeys.length;
                i += increment
              ) {
                const key = visibleKeys[i];
                if (!selectionManager.isDisabled(key)) {
                  return key;
                }
              }

              return null;
            };

            // Helper function to find first or last selectable key
            const findFirstLastSelectableKey = (
              direction: 'forward' | 'backward',
              visibleKeys: Key[],
            ) => {
              const keysToCheck =
                direction === 'forward'
                  ? visibleKeys
                  : [...visibleKeys].reverse();

              for (const key of keysToCheck) {
                if (!selectionManager.isDisabled(key)) {
                  return key;
                }
              }

              return null;
            };

            const visibleKeys = getVisibleItemKeys();

            if (visibleKeys.length === 0) {
              return; // No visible items to navigate
            }

            let nextKey;
            const direction = isArrowDown ? 'forward' : 'backward';

            if (currentKey == null) {
              // No current focus, start from the first/last item
              nextKey = findFirstLastSelectableKey(direction, visibleKeys);
            } else {
              // Find current position in visible keys
              const currentIndex = visibleKeys.indexOf(currentKey);

              if (currentIndex === -1) {
                // Current key not in visible items, start from beginning/end
                nextKey = findFirstLastSelectableKey(direction, visibleKeys);
              } else {
                // Find next selectable item from current position
                nextKey = findNextSelectableKey(
                  currentIndex,
                  direction,
                  visibleKeys,
                );

                // If no next key found, wrap to first/last selectable item
                if (nextKey == null) {
                  nextKey = findFirstLastSelectableKey(direction, visibleKeys);
                }
              }
            }

            if (nextKey != null) {
              selectionManager.setFocusedKey(nextKey);
              setFocusedKey(nextKey);
              focusedKeyRef.current = nextKey; // Update ref immediately
            }
          } else if (
            e.key === 'Enter' ||
            (e.key === ' ' && !searchValue.trim())
          ) {
            const currentFocusedKey =
              focusedKey || treeState.selectionManager.focusedKey;
            if (currentFocusedKey != null) {
              e.preventDefault();

              // Trigger action for the focused item (like Menu does)
              // First check if there's a selection mode, if so, handle selection
              if (treeState.selectionManager.selectionMode !== 'none') {
                treeState.selectionManager.select(currentFocusedKey, e);
              } else {
                // Default behavior: trigger action
                const node = treeState.collection.getItem(currentFocusedKey);
                if (node) {
                  // Call the tree state's action handler
                  const onAction = (completeProps as any).onAction;
                  if (onAction) {
                    onAction(currentFocusedKey);
                  }
                  // Also call the item's individual onAction if it exists
                  if (node.props?.onAction) {
                    node.props.onAction(currentFocusedKey);
                  }
                }
              }

              // Close the menu if we're in a trigger context and closeOnSelect is enabled (default behavior)
              const { onClose, closeOnSelect } = contextProps;
              if (onClose && closeOnSelect !== false) {
                onClose();
              }
            }
          } else if (e.key === 'Escape') {
            if (searchValue) {
              e.preventDefault();
              handleSearchChange('');
            }
          }
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <StyledLoadingWrapper>
          <LoadingIcon
            role="progressbar"
            aria-label="Loading commands"
            aria-hidden={false}
          />
        </StyledLoadingWrapper>
      )}

      {/* Menu Content - always render unless loading */}
      {!isLoading && !showEmptyState && (
        <MenuContext.Provider value={commandMenuContext}>
          <StyledMenu
            {...menuProps}
            ref={menuRef}
            id={`${qa || 'CommandMenu'}-menu`}
            aria-label="Command menu"
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
        </MenuContext.Provider>
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
  SubMenuTrigger,
  Item,
  Section,
  displayName: 'CommandMenu',
});

export { __CommandMenu as CommandMenu };
