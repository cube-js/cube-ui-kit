import { Key } from '@react-types/shared';
import {
  cloneElement,
  ForwardedRef,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFilter, useKeyboard } from 'react-aria';
import { Section as BaseSection, Item, useListState } from 'react-stately';
import { CubeCollectionItemProps } from 'src/components/CollectionItem';

import { LoadingIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import {
  BASE_STYLES,
  COLOR_STYLES,
  extractStyles,
  OUTER_STYLES,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, modAttrs, useCombinedRefs } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { StyledHeader } from '../../actions/Menu/styled';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { CubeListBoxProps, ListBox } from '../ListBox/ListBox';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

import type { Collection, Node } from '@react-types/shared';
import type { FieldBaseProps } from '../../../shared';

type FilterFn = (textValue: string, inputValue: string) => boolean;

const FilterListBoxWrapperElement = tasty({
  styles: {
    display: 'grid',
    flow: 'column',
    gridColumns: '1sf',
    gridRows: 'max-content max-content 1sf',
    gap: 0,
    position: 'relative',
    radius: true,
    color: '#dark-02',
    transition: 'theme',
    outline: {
      '': '#purple-03.0',
      'invalid & focused': '#danger.50',
      focused: '#purple-03',
    },
    border: {
      '': true,
      focused: '#purple-text',
      valid: '#success-text.50',
      invalid: '#danger-text.50',
      disabled: true,
      popover: false,
    },
  },
});

const SearchWrapperElement = tasty({
  qa: 'FilterListBoxSearchWrapper',
  styles: {
    ...INPUT_WRAPPER_STYLES,
    border: 'bottom',
    radius: '1r top',
    fill: '#clear',
    height: '($size + 1x)',
    $size: {
      '': '$size-md',
      'size=small': '$size-sm',
      'size=medium': '$size-md',
      'size=large': '$size-lg',
    },
  },
});

const SearchInputElement = tasty({
  as: 'input',
  styles: {
    ...DEFAULT_INPUT_STYLES,
    fill: '#clear',
    padding: {
      '': '.5x 1.5x',
      prefix: '0 1.5x 0 .5x',
    },
  },
});

const StyledHeaderWithoutBorder = tasty(StyledHeader, {
  styles: {
    border: false,
  },
});

export interface CubeFilterListBoxProps<T>
  extends Omit<CubeListBoxProps<T>, 'filter'>,
    FieldBaseProps {
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Whether the search input should have autofocus */
  autoFocus?: boolean;
  /**
   * Custom filter function for determining if an option should be included in search results.
   * Pass `false` to disable internal filtering completely (useful for external filtering).
   */
  filter?: FilterFn | false;
  /** Custom label to display when no results are found after filtering */
  emptyLabel?: ReactNode;
  /** Custom styles for the search input */
  searchInputStyles?: Styles;
  /** Whether the FilterListBox is in loading state (shows loading icon in search input) */
  isLoading?: boolean;
  /** Ref for accessing the search input element */
  searchInputRef?: RefObject<HTMLInputElement | null>;
  /** Whether to allow entering custom values that are not present in the predefined options */
  allowsCustomValue?: boolean;
  /** Additional modifiers for styling the FilterListBox */
  mods?: Record<string, boolean>;
  /** Custom styles for the list box */
  listBoxStyles?: Styles;

  /**
   * Callback fired when the user presses Escape key while the search input is empty.
   * Can be used by parent components (e.g. FilterPicker) to close an enclosing Dialog.
   */
  onEscape?: () => void;

  /**
   * Whether to show checkboxes for multiple selection mode.
   * This adds a checkbox icon to the left of each option.
   */
  isCheckable?: boolean;

  /**
   * Callback fired when an option is clicked but not on the checkbox area.
   * Used by FilterPicker to close the popover on non-checkbox clicks.
   */
  onOptionClick?: (key: Key) => void;

  /**
   * Props to apply to existing custom values (values that are already selected but not in the predefined options).
   */
  customValueProps?: Partial<CubeCollectionItemProps<T>>;

  /**
   * Props to apply to new custom values (values typed in the search input that are about to be added).
   * These are merged with customValueProps for new custom values.
   */
  newCustomValueProps?: Partial<CubeCollectionItemProps<T>>;

  /**
   * Controlled search value. When provided, the search input becomes controlled.
   * Use with `onSearchChange` to manage the search state externally.
   */
  searchValue?: string;

  /**
   * Callback fired when the search input value changes.
   * Use with `searchValue` for controlled search input.
   */
  onSearchChange?: (value: string) => void;

  /**
   * Pre-built collection to use instead of creating a new one.
   * Used internally by FilterPicker to avoid duplicate collection creation.
   * @internal
   */
  _internalCollection?: Collection<Node<any>>;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

export const FilterListBox = forwardRef(function FilterListBox<
  T extends object,
>(props: CubeFilterListBoxProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => {
      const fieldProps: any = {};

      if (props.selectionMode === 'multiple') {
        fieldProps.selectedKeys = value || [];
      } else {
        fieldProps.selectedKey = value ?? null;
      }

      fieldProps.onSelectionChange = (key: any) => {
        if (props.selectionMode === 'multiple') {
          // Handle "all" selection and array selections
          if (key === 'all') {
            onChange('all');
          } else {
            onChange(key ? (Array.isArray(key) ? key : [key]) : []);
          }
        } else {
          onChange(Array.isArray(key) ? key[0] : key);
        }
      };

      return fieldProps;
    },
  });

  let {
    qa,
    label,
    extra,
    id,
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    isDisabled,
    isLoading,
    searchPlaceholder = 'Search...',
    autoFocus,
    filter,
    mods: externalMods,
    emptyLabel,
    searchInputStyles,
    listStyles,
    optionStyles,
    sectionStyles,
    headingStyles,
    searchInputRef,
    listRef,
    message,
    description,
    styles,
    focusOnHover,
    shouldFocusWrap,
    labelSuffix,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange: externalOnSelectionChange,
    allowsCustomValue = false,
    showSelectAll,
    selectAllLabel,
    header,
    footer,
    size = 'medium',
    headerStyles,
    footerStyles,
    listBoxStyles,
    items,
    children: renderChildren,
    onEscape,
    isCheckable,
    onOptionClick,
    selectionMode = 'single',
    allValueProps,
    customValueProps,
    newCustomValueProps,
    searchValue: controlledSearchValue,
    onSearchChange,
    _internalCollection,
    form,
    ...otherProps
  } = props;

  // Preserve the original `children` (may be a render function) before we
  // potentially overwrite it.
  let children: ReactNode = renderChildren as ReactNode;

  const renderFn = renderChildren as unknown;

  if (items && typeof renderFn === 'function') {
    try {
      const itemsArray = Array.from(items as Iterable<any>);
      // Execute the render function for each item to obtain <Item/> / <Section/> nodes.
      children = itemsArray.map((item, idx) => {
        const rendered = (renderFn as (it: any) => ReactNode)(item);
        // Ensure every element has a stable key: rely on the user-provided key
        // inside the render function, otherwise fall back to the item itself or
        // the index. This mirrors React Aria examples where the render function
        // is expected to set keys, but we add a fallback for robustness.
        if (
          isValidElement(rendered) &&
          (rendered as ReactElement).key == null
        ) {
          return cloneElement(rendered as ReactElement, {
            key: (rendered as any)?.key ?? item?.key ?? idx,
          });
        }

        return rendered as ReactNode;
      });
    } catch {
      // If conversion fails for some reason, we silently ignore and proceed
      // with the original children value so we don't break runtime.
    }
  }

  // Use provided collection from FilterPicker or create our own
  // Hook call order is stable: _internalCollection is consistent per component instance
  const localCollectionState = _internalCollection
    ? { collection: _internalCollection }
    : useListState({
        children: children as any,
        items: items as any,
        selectionMode: 'none' as any,
      });

  // Collect original option keys to avoid duplicating them as custom values.
  const originalKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const item of localCollectionState.collection) {
      if (item.type === 'item') {
        keys.add(String(item.key));
      }
    }
    return keys;
  }, [localCollectionState.collection]);

  // State to keep track of custom (user-entered) items that were selected.
  const [customKeys, setCustomKeys] = useState<Set<string>>(new Set());

  // Initialize custom keys from current selection
  useEffect(() => {
    if (!allowsCustomValue) return;

    const currentSelectedKeys = selectedKeys
      ? selectedKeys === 'all'
        ? [] // Skip custom key detection when 'all' is selected
        : Array.from(selectedKeys).map(String)
      : selectedKey != null
        ? [String(selectedKey)]
        : [];

    if (currentSelectedKeys.length === 0) return;

    const keysToAdd = currentSelectedKeys.filter((k) => !originalKeys.has(k));

    if (keysToAdd.length) {
      setCustomKeys((prev) => new Set([...Array.from(prev), ...keysToAdd]));
    }
  }, [allowsCustomValue, selectedKeys, selectedKey, originalKeys]);

  // Merge original children with any custom items so they persist in the list.
  // If there are selected custom values, they should appear on top with other
  // selected items (which are already sorted by the parent component, e.g. FilterPicker).
  const mergedChildren: ReactNode = useMemo(() => {
    if (!children && customKeys.size === 0) return children;

    // Build React elements for custom values (kept stable via their key).
    const customArray = Array.from(customKeys).map((key) => (
      <Item key={key} textValue={key} {...customValueProps}>
        {key}
      </Item>
    ));

    // Identify which custom keys are currently selected so we can promote them.
    const selectedKeysSet = new Set<string>();

    if (selectionMode === 'multiple') {
      if (selectedKeys === 'all') {
        // When 'all' is selected, no custom items should be treated as selected
        // since 'all' means all available items, not custom ones
      } else {
        Array.from(selectedKeys ?? []).forEach((k) =>
          selectedKeysSet.add(String(k)),
        );
      }
    } else {
      if (selectedKey != null) selectedKeysSet.add(String(selectedKey));
    }

    const selectedCustom: ReactNode[] = [];
    const unselectedCustom: ReactNode[] = [];

    customArray.forEach((item: any) => {
      if (selectedKeysSet.has(String(item.key))) {
        selectedCustom.push(item);
      } else {
        unselectedCustom.push(item);
      }
    });

    if (!children) {
      // No original items – just return selected custom followed by the rest.
      return [...selectedCustom, ...unselectedCustom];
    }

    const originalArray = Array.isArray(children) ? children : [children];

    // Final order: selected custom items -> original array (already possibly
    // sorted by parent) -> unselected custom items.
    return [...selectedCustom, ...originalArray, ...unselectedCustom];
  }, [children, customKeys, selectionMode, selectedKey, selectedKeys]);

  // Determine an aria-label for the internal ListBox to avoid React Aria warnings.
  const innerAriaLabel =
    (props as any)['aria-label'] ||
    (typeof label === 'string' ? label : undefined);

  // Controlled/uncontrolled search value pattern
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const isSearchControlled = controlledSearchValue !== undefined;
  const searchValue = isSearchControlled
    ? controlledSearchValue
    : internalSearchValue;

  const handleSearchChange = useCallback(
    (value: string) => {
      if (!isSearchControlled) {
        setInternalSearchValue(value);
      }
      onSearchChange?.(value);
    },
    [isSearchControlled, onSearchChange],
  );

  const { contains } = useFilter({ sensitivity: 'base' });

  // Choose the text filter function: user-provided `filter` prop (if any),
  // or the default `contains` helper from `useFilter`.
  // When filter={false}, disable filtering completely.
  const textFilterFn = useMemo<FilterFn>(
    () => (filter === false ? () => true : filter || contains),
    [filter, contains],
  );

  // Create a filter function for collection nodes (similar to ComboBox pattern)
  const filterFn = useCallback(
    (nodes: Iterable<any>) => {
      const term = searchValue.trim();

      // Don't filter if no search term
      if (!term) {
        return nodes;
      }

      // Filter nodes based on their textValue and preserve section structure
      return [...nodes]
        .map((node: any) => {
          if (node.type === 'section' && node.childNodes) {
            const filteredNodes = [...node.childNodes].filter((child: any) =>
              textFilterFn(child.textValue || '', term),
            );

            if (filteredNodes.length === 0) {
              return null;
            }

            return {
              ...node,
              childNodes: filteredNodes,
              hasChildNodes: true,
            };
          }

          return textFilterFn(node.textValue || '', term) ? node : null;
        })
        .filter(Boolean);
    },
    [searchValue, textFilterFn],
  );

  // Handle custom values if allowed
  const enhancedChildren = useMemo(() => {
    let childrenToProcess = mergedChildren;

    // Handle custom values if allowed
    if (!allowsCustomValue) return childrenToProcess;

    const term = searchValue.trim();
    if (!term) return childrenToProcess;

    // Helper to determine if the term is already present (exact match on rendered textValue or the key).
    const doesTermExist = (term: string): boolean => {
      // Check if term exists in custom keys
      if (customKeys.has(term)) {
        return true;
      }

      // Check if term exists in original collection
      for (const item of localCollectionState.collection) {
        if (item.type === 'item') {
          const textValue = item.textValue || String(item.rendered || '');
          if (term === textValue || String(item.key) === term) {
            return true;
          }
        }
      }
      return false;
    };

    if (doesTermExist(term)) {
      return childrenToProcess;
    }

    // Check if there are any items that will match the filter
    // This determines whether we need to visually separate the custom value
    const hasVisibleFilteredItems = (() => {
      for (const item of localCollectionState.collection) {
        if (item.type === 'item') {
          const textValue = item.textValue || String(item.rendered || '');
          if (textFilterFn(textValue, term)) {
            return true;
          }
        } else if (item.type === 'section' && item.childNodes) {
          for (const child of item.childNodes) {
            const textValue = child.textValue || String(child.rendered || '');
            if (textFilterFn(textValue, term)) {
              return true;
            }
          }
        }
      }
      return false;
    })();

    // Create the custom option
    const customOption = (
      <Item
        key={term}
        textValue={term}
        {...mergeProps(customValueProps, newCustomValueProps)}
      >
        {term}
      </Item>
    );

    // If there are visible filtered items, add visual separation for custom value
    if (hasVisibleFilteredItems && childrenToProcess) {
      // Check if the collection contains any sections
      // If it does, we can't wrap childrenToProcess in another section (would create nested sections)
      const hasSections = [...localCollectionState.collection].some(
        (item) => item.type === 'section',
      );

      const customValueSection = (
        <BaseSection key="__custom_value__" aria-label="Custom value">
          {customOption}
        </BaseSection>
      );

      if (hasSections) {
        // Collection has sections - just append the custom value section without wrapping
        if (Array.isArray(childrenToProcess)) {
          return [...childrenToProcess, customValueSection];
        }
        return [childrenToProcess, customValueSection];
      }

      // No sections in collection - wrap items in a section for visual separation
      const filteredItemsSection = (
        <BaseSection key="__filtered_items__" aria-label="Filtered items">
          {childrenToProcess}
        </BaseSection>
      );

      return [filteredItemsSection, customValueSection];
    }

    // No visible filtered items, just return the custom option without sections
    if (Array.isArray(childrenToProcess)) {
      return [...childrenToProcess, customOption];
    }

    if (childrenToProcess) {
      return [childrenToProcess, customOption];
    }

    return customOption;
  }, [
    allowsCustomValue,
    mergedChildren,
    searchValue,
    customKeys,
    localCollectionState.collection,
    customValueProps,
    newCustomValueProps,
    textFilterFn,
  ]);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  searchInputRef = useCombinedRefs(searchInputRef);
  listRef = useCombinedRefs(listRef);

  const { isFocused, focusProps } = useFocus({ isDisabled });
  const isInvalid = validationState === 'invalid';

  const listBoxRef = useRef<HTMLDivElement>(null);

  // Ref to access internal ListBox state (selection manager, etc.)
  const listStateRef = useRef<any>(null);

  // No separate focusedKey state needed; rely directly on selectionManager.focusedKey.

  // When the search value changes, the visible collection of items may change as well.
  // If the currently focused item is no longer visible, move virtual focus to the first
  // available item so that arrow navigation and Enter behaviour continue to work.
  // If there are no available items, reset the selection so Enter won't select anything.
  // Priority: focus on selected items first, then fall back to first visible item.
  useLayoutEffect(() => {
    const listState = listStateRef.current;

    if (!listState) return;

    const { selectionManager, collection } = listState;

    // Helper to collect visible item keys (supports sections)
    // Collection is already filtered by React Stately via filterFn
    const collectVisibleKeys = (nodes: Iterable<any>, out: Key[]) => {
      for (const node of nodes) {
        if (node.type === 'item') {
          out.push(node.key);
        } else if (node.childNodes) {
          collectVisibleKeys(node.childNodes, out);
        }
      }
    };

    const visibleKeys: Key[] = [];
    collectVisibleKeys(collection, visibleKeys);

    // If there are no visible items, reset the focused key so Enter won't select anything
    if (visibleKeys.length === 0) {
      selectionManager.setFocusedKey(null);
      return;
    }

    // Early exit if the current focused key is still present in the visible items.
    const currentFocused = selectionManager.focusedKey;
    if (currentFocused != null && visibleKeys.includes(currentFocused)) {
      return;
    }

    // Helper to find the first selected item that's visible
    const findFirstVisibleSelectedKey = (): Key | null => {
      if (selectionMode === 'single') {
        // Single selection: check if selectedKey is visible
        if (selectedKey != null) {
          const selectedKeyStr = String(selectedKey);
          if (visibleKeys.some((k) => String(k) === selectedKeyStr)) {
            return selectedKey;
          }
        }
      } else if (selectionMode === 'multiple') {
        // Multiple selection: find first selected key that's visible
        if (selectedKeys && selectedKeys !== 'all') {
          for (const key of selectedKeys) {
            const keyStr = String(key);
            if (visibleKeys.some((k) => String(k) === keyStr)) {
              return key;
            }
          }
        }
      }
      return null;
    };

    // Determine which key to focus
    let keyToFocus: Key | null = null;

    // If there's no focus yet (initial state), prioritize selected items
    if (currentFocused == null) {
      keyToFocus = findFirstVisibleSelectedKey();
    } else {
      // If current focused item was filtered out, try to focus another selected item
      keyToFocus = findFirstVisibleSelectedKey();
    }

    // Fallback to first visible item if no selected item found
    if (keyToFocus == null) {
      keyToFocus = visibleKeys[0];
    }

    // Mark this focus change as keyboard navigation so ListBox will scroll to it
    if (listState.lastFocusSourceRef) {
      listState.lastFocusSourceRef.current = 'keyboard';
    }

    // Set focus to the determined key
    selectionManager.setFocusedKey(keyToFocus);
  }, [searchValue, enhancedChildren, selectionMode, selectedKey, selectedKeys]);

  // Keyboard navigation handler for search input
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        const listState = listStateRef.current;
        if (!listState) return;

        const { selectionManager, collection } = listState;

        // Helper to collect visible item keys (supports sections)
        // Collection is already filtered by React Stately via filterFn
        const collectVisibleKeys = (nodes: Iterable<any>, out: Key[]) => {
          for (const node of nodes) {
            if (node.type === 'item') {
              out.push(node.key);
            } else if (node.childNodes) {
              collectVisibleKeys(node.childNodes, out);
            }
          }
        };

        const visibleKeys: Key[] = [];
        collectVisibleKeys(collection, visibleKeys);

        if (visibleKeys.length === 0) return;

        const isArrowDown = e.key === 'ArrowDown';
        const direction = isArrowDown ? 1 : -1;

        const currentKey = selectionManager.focusedKey;

        let nextKey: Key | null = null;

        if (currentKey == null) {
          // If nothing focused yet, pick first/last depending on direction
          nextKey = isArrowDown
            ? visibleKeys[0]
            : visibleKeys[visibleKeys.length - 1];
        } else {
          const currentIndex = visibleKeys.indexOf(currentKey);
          if (currentIndex !== -1) {
            const newIndex = currentIndex + direction;
            if (newIndex >= 0 && newIndex < visibleKeys.length) {
              nextKey = visibleKeys[newIndex];
            } else if (shouldFocusWrap) {
              // Wrap around
              nextKey = isArrowDown
                ? visibleKeys[0]
                : visibleKeys[visibleKeys.length - 1];
            }
          } else {
            // Fallback
            nextKey = isArrowDown
              ? visibleKeys[0]
              : visibleKeys[visibleKeys.length - 1];
          }
        }

        if (nextKey != null) {
          // Mark this focus change as keyboard navigation
          if (listState.lastFocusSourceRef) {
            listState.lastFocusSourceRef.current = 'keyboard';
          }
          selectionManager.setFocusedKey(nextKey);
        }
      } else if (
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === 'PageUp' ||
        e.key === 'PageDown'
      ) {
        e.preventDefault();

        const listState = listStateRef.current;
        if (!listState) return;

        const { selectionManager, collection } = listState;

        // Helper to collect visible item keys (supports sections)
        // Collection is already filtered by React Stately via filterFn
        const collectVisibleKeys = (nodes: Iterable<any>, out: Key[]) => {
          for (const node of nodes) {
            if (node.type === 'item') {
              out.push(node.key);
            } else if (node.childNodes) {
              collectVisibleKeys(node.childNodes, out);
            }
          }
        };

        const visibleKeys: Key[] = [];
        collectVisibleKeys(collection, visibleKeys);

        if (visibleKeys.length === 0) return;

        const targetKey =
          e.key === 'Home' || e.key === 'PageUp'
            ? visibleKeys[0]
            : visibleKeys[visibleKeys.length - 1];

        // Mark this focus change as keyboard navigation
        if (listState.lastFocusSourceRef) {
          listState.lastFocusSourceRef.current = 'keyboard';
        }
        selectionManager.setFocusedKey(targetKey);
      } else if (e.key === 'Enter' || (e.key === ' ' && !searchValue)) {
        const listState = listStateRef.current;

        if (!listState) return;

        const keyToSelect = listState.selectionManager.focusedKey;

        if (keyToSelect != null) {
          e.preventDefault();
          listState.selectionManager.select(keyToSelect, e);

          if (
            e.key === 'Enter' &&
            isCheckable &&
            onEscape &&
            selectionMode === 'multiple'
          ) {
            onEscape();
          }
        }
      } else if (e.key === 'Escape') {
        if (searchValue) {
          // Clear the current search if any text is present.
          e.preventDefault();
          handleSearchChange('');
        } else {
          // Notify parent that Escape was pressed on an empty input.
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
        }
      }
    },
  });

  const mods = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: !!isDisabled,
      focused: isFocused,
      loading: !!isLoading,
      searchable: true,
      prefix: !!isLoading,
      ...externalMods,
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isFocused,
      isLoading,
      externalMods,
    ],
  );

  // Handler must be defined before we render ListBox so we can pass it.
  const handleSelectionChange = (selection: any) => {
    if (allowsCustomValue) {
      // Normalize current selection into an array of string keys
      let selectedValues: string[] = [];

      if (selection != null) {
        if (Array.isArray(selection)) {
          selectedValues = selection.map(String);
        } else {
          selectedValues = [String(selection)];
        }
      }

      // Build next custom keys set based on selected values
      const nextSet = new Set<string>();

      selectedValues.forEach((val) => {
        if (!originalKeys.has(val)) {
          nextSet.add(val);
        }
      });

      // Update internal custom keys state
      setCustomKeys(nextSet);
    }

    if (externalOnSelectionChange) {
      (externalOnSelectionChange as any)(selection);
    }
  };

  // Custom option click handler that ensures search input receives focus
  const handleOptionClick = (key: Key) => {
    // Focus the search input to enable keyboard navigation
    // Use setTimeout to ensure this happens after React state updates
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);

    // Call the original onOptionClick if provided
    if (onOptionClick) {
      onOptionClick(key);
    }
  };

  const searchInput = (
    <SearchWrapperElement mods={mods} data-size={size}>
      {isLoading && (
        <div data-element="Prefix">
          <div data-element="InputIcon">
            {isLoading ? <LoadingIcon /> : null}
          </div>
        </div>
      )}
      <SearchInputElement
        ref={searchInputRef}
        qa={qa || 'FilterListBox'}
        id={id}
        data-prefix={isLoading ? '' : undefined}
        type="search"
        placeholder={searchPlaceholder}
        value={searchValue}
        disabled={isDisabled}
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? '' : undefined}
        styles={searchInputStyles}
        data-size={size}
        data-input-type="filterlistbox"
        role="combobox"
        aria-expanded="true"
        aria-haspopup="listbox"
        aria-activedescendant={
          listStateRef.current?.selectionManager.focusedKey != null
            ? `ListBoxItem-${listStateRef.current?.selectionManager.focusedKey}`
            : undefined
        }
        onChange={(e) => {
          handleSearchChange(e.target.value);
        }}
        {...keyboardProps}
        {...modAttrs(mods)}
      />
    </SearchWrapperElement>
  );

  const filterListBoxField = (
    <FilterListBoxWrapperElement
      ref={ref}
      qa="FilterListBoxWrapper"
      {...modAttrs(mods)}
      styles={styles}
      {...focusProps}
    >
      {header ? (
        <StyledHeaderWithoutBorder data-size={size} styles={headerStyles}>
          {header}
        </StyledHeaderWithoutBorder>
      ) : (
        <div role="presentation" />
      )}
      {searchInput}
      <ListBox
        ref={listBoxRef}
        aria-label={innerAriaLabel}
        selectedKey={selectedKey}
        defaultSelectedKey={defaultSelectedKey}
        selectedKeys={selectedKeys}
        defaultSelectedKeys={defaultSelectedKeys}
        selectionMode={selectionMode}
        isDisabled={isDisabled}
        listRef={listRef}
        stateRef={listStateRef}
        listStyles={listStyles}
        shouldFocusWrap={shouldFocusWrap}
        optionStyles={optionStyles}
        sectionStyles={sectionStyles}
        headingStyles={headingStyles}
        validationState={validationState}
        disallowEmptySelection={props.disallowEmptySelection}
        disabledKeys={props.disabledKeys}
        focusOnHover={focusOnHover}
        shouldUseVirtualFocus={true}
        showSelectAll={showSelectAll}
        selectAllLabel={selectAllLabel}
        footer={footer}
        footerStyles={footerStyles}
        mods={mods}
        size="medium"
        styles={listBoxStyles}
        isCheckable={isCheckable}
        items={items as any}
        allValueProps={allValueProps}
        filter={filterFn}
        emptyLabel={
          searchValue.trim()
            ? emptyLabel !== undefined
              ? emptyLabel
              : 'No results found'
            : 'No items'
        }
        onSelectionChange={handleSelectionChange}
        onEscape={onEscape}
        onOptionClick={handleOptionClick}
      >
        {enhancedChildren as any}
      </ListBox>
    </FilterListBoxWrapperElement>
  );

  return wrapWithField<Omit<CubeFilterListBoxProps<T>, 'children'>>(
    filterListBoxField,
    ref,
    props,
  );
}) as unknown as (<T>(
  props: CubeFilterListBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

FilterListBox.Item = ListBox.Item;

FilterListBox.Section = BaseSection;

Object.defineProperty(FilterListBox, 'cubeInputType', {
  value: 'FilterListBox',
  enumerable: false,
  configurable: false,
});
