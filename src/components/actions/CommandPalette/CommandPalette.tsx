import { useSyncRef } from '@react-aria/utils';
import { useDOMRef } from '@react-spectrum/utils';
import { DOMRef, FocusStrategy } from '@react-types/shared';
import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFilter, useMenu } from 'react-aria';
// Import Item and Section from Menu for CommandPalette compound component
import { Item, Section, useTreeState } from 'react-stately';

import { LoadingIcon, SearchIcon } from '../../../icons';
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
import { useMenuContext } from '../Menu';
import { CubeMenuProps } from '../Menu/Menu';
import { MenuItem } from '../Menu/MenuItem';
import { MenuSection } from '../Menu/MenuSection';
import { MenuTrigger } from '../Menu/MenuTrigger';
import { StyledDivider, StyledMenu } from '../Menu/styled';

import {
  StyledCommandPalette,
  StyledEmptyState,
  StyledLoadingWrapper,
  StyledMenuWrapper,
  StyledSearchInput,
  StyledSearchWrapper,
} from './styled';

export interface CommandPaletteItem {
  // Standard item props
  id: string;
  textValue: string;

  // Enhanced search features
  keywords?: string[];
  value?: string;
  forceMount?: boolean;

  // Standard Menu item props inherited
  [key: string]: any;
}

export interface CubeCommandPaletteProps<T>
  extends BaseProps,
    ContainerStyleProps,
    CubeMenuProps<T> {
  // Search-specific props
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filter?: (textValue: string, inputValue: string) => boolean;
  emptyLabel?: ReactNode;
  searchInputStyles?: Styles;

  // Advanced search features
  isLoading?: boolean;
  shouldFilter?: boolean;

  // Focus management - override the autoFocus from CubeMenuProps to allow boolean | FocusStrategy
  autoFocus?: boolean | FocusStrategy;
}

function CommandPaletteBase<T extends object>(
  props: CubeCommandPaletteProps<T>,
  ref: DOMRef<HTMLDivElement>,
) {
  const {
    searchPlaceholder = 'Search commands...',
    searchValue: controlledSearchValue,
    onSearchChange,
    filter: customFilter,
    emptyLabel = 'No commands found',
    searchInputStyles,
    isLoading = false,
    shouldFilter = true,
    autoFocus = true,
    qa,
    styles,
    ...restMenuProps
  } = props;

  const domRef = useDOMRef(ref);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contextProps = useMenuContext();
  const completeProps = mergeProps(contextProps, restMenuProps);

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

      // Check main text value
      if (textFilterFn(textValue, inputValue)) {
        return true;
      }

      // Check keywords if available
      if (item?.keywords && Array.isArray(item.keywords)) {
        return item.keywords.some((keyword: string) =>
          textFilterFn(keyword, inputValue),
        );
      }

      // Check custom value if available
      if (item?.value && typeof item.value === 'string') {
        return textFilterFn(item.value, inputValue);
      }

      return false;
    },
    [textFilterFn, shouldFilter],
  );

  // Collection filter for React Stately
  const collectionFilter = useCallback(
    (nodes: Iterable<any>): Iterable<any> => {
      const term = searchValue.trim();

      // If no search term, return all nodes
      if (!term) {
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
    shouldUseVirtualFocus: true, // Always use virtual focus for CommandPalette
  };

  const treeState = useTreeState(treeStateProps);
  const collectionItems = [...treeState.collection];
  const hasSections = collectionItems.some((item) => item.type === 'section');

  // Track focused key for aria-activedescendant
  const [focusedKey, setFocusedKey] = React.useState<React.Key | null>(null);

  // Apply filtering to collection items for rendering and empty state checks
  const filteredCollectionItems = useMemo(() => {
    const term = searchValue.trim();
    if (!term) {
      return collectionItems;
    }

    const filterNodes = (items: any[]): any[] => {
      const result: any[] = [];

      items.forEach((item) => {
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
    { ...treeStateProps, 'aria-label': 'Command palette menu' },
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
      if (item.props.wrapper) {
        menuItem = item.props.wrapper(menuItem);
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
      // This is especially important when the CommandPalette is opened in a popover
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

  // Auto-focus first item when search value changes (but not on initial render)
  React.useEffect(() => {
    // Only auto-focus when search value changes, not on initial mount
    if (searchValue.trim() !== '') {
      const firstSelectableKey = findFirstSelectableItem();

      if (firstSelectableKey && hasFilteredItems) {
        // Focus the first item in the selection manager
        treeState.selectionManager.setFocusedKey(firstSelectableKey);
        setFocusedKey(firstSelectableKey);
      } else {
        // Clear focus if no items are available
        treeState.selectionManager.setFocusedKey(null);
        setFocusedKey(null);
      }
    }
  }, [
    searchValue,
    findFirstSelectableItem,
    hasFilteredItems,
    treeState.selectionManager,
  ]);

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

  return (
    <StyledCommandPalette
      {...filterBaseProps(props)}
      ref={domRef}
      qa={qa || 'CommandPalette'}
      styles={mergeProps(extractedStyles, styles)}
    >
      {/* Search Input */}
      <StyledSearchWrapper>
        <SearchIcon />
        <StyledSearchInput
          ref={searchInputRef}
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          styles={searchInputStyles}
          aria-controls={`${qa || 'CommandPalette'}-menu`}
          role="combobox"
          aria-expanded="true"
          aria-haspopup="listbox"
          aria-activedescendant={
            focusedKey != null
              ? `${qa || 'CommandPalette'}-menu-option-${focusedKey}`
              : undefined
          }
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();

              const isArrowDown = e.key === 'ArrowDown';
              const { selectionManager, collection } = treeState;
              const currentKey = selectionManager.focusedKey;

              // Helper function to find next selectable key in a direction
              const findNextSelectableKey = (
                startKey: any,
                direction: 'forward' | 'backward',
              ) => {
                if (startKey == null) {
                  return null;
                }

                // First check if the startKey itself is selectable
                const startNode = collection.getItem(startKey);
                if (
                  startNode &&
                  startNode.type === 'item' &&
                  !selectionManager.isDisabled(startKey)
                ) {
                  return startKey;
                }

                // If startKey is not selectable, find the next selectable key
                let keys = [...collection.getKeys()];

                if (direction === 'backward') {
                  keys = keys.reverse();
                }

                let startIndex = keys.indexOf(startKey);

                if (startIndex === -1) {
                  return null;
                }

                for (let i = startIndex + 1; i < keys.length; i++) {
                  const key = keys[i];
                  const node = collection.getItem(key);

                  if (
                    node &&
                    node.type === 'item' &&
                    !selectionManager.isDisabled(key)
                  ) {
                    return key;
                  }
                }

                return null;
              };

              // Helper function to find first or last selectable key
              const findFirstLastSelectableKey = (
                direction: 'forward' | 'backward',
              ) => {
                const keys = [...collection.getKeys()];
                const keysToCheck =
                  direction === 'forward' ? keys : keys.reverse();

                for (const key of keysToCheck) {
                  const node = collection.getItem(key);

                  if (
                    node &&
                    node.type === 'item' &&
                    !selectionManager.isDisabled(key)
                  ) {
                    return key;
                  }
                }

                return null;
              };

              let nextKey;
              const direction = isArrowDown ? 'forward' : 'backward';

              if (currentKey == null) {
                // No current focus, start from the first/last item
                nextKey = findFirstLastSelectableKey(direction);
              } else {
                // Find next selectable item from current position
                const candidateKey =
                  direction === 'forward'
                    ? collection.getKeyAfter(currentKey)
                    : collection.getKeyBefore(currentKey);

                nextKey = findNextSelectableKey(candidateKey, direction);

                // If no next key found and focus wrapping is enabled, wrap to first/last selectable item
                if (nextKey == null) {
                  nextKey = findFirstLastSelectableKey(direction);
                }
              }

              if (nextKey != null) {
                selectionManager.setFocusedKey(nextKey);
                setFocusedKey(nextKey);
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
      </StyledSearchWrapper>

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
        <StyledMenuWrapper>
          <StyledMenu
            {...menuProps}
            ref={menuRef}
            id={`${qa || 'CommandPalette'}-menu`}
            aria-label="Command palette menu"
            qa="Menu"
            mods={{
              sections: viewHasSections,
              footer: false,
              header: false,
            }}
            styles={{
              border: 'none',
              boxShadow: 'none',
              radius: 0,
              padding: '0.5x',
            }}
          >
            {renderedItems}
          </StyledMenu>
        </StyledMenuWrapper>
      )}

      {/* Empty State - show when search term exists but no results */}
      {!isLoading && showEmptyState && (
        <StyledEmptyState>{emptyLabel}</StyledEmptyState>
      )}
    </StyledCommandPalette>
  );
}

// forwardRef doesn't support generic parameters, so cast the result to the correct type
const _CommandPalette = React.forwardRef(CommandPaletteBase) as <T>(
  props: CubeCommandPaletteProps<T> & React.RefAttributes<HTMLDivElement>,
) => ReactElement;

// Attach Trigger alias from MenuTrigger for consistent API
// Also attach Item and Section for compound component pattern
const __CommandPalette = Object.assign(_CommandPalette, {
  Trigger: MenuTrigger,
  Item,
  Section,
  displayName: 'CommandPalette',
});

export { __CommandPalette as CommandPalette };
