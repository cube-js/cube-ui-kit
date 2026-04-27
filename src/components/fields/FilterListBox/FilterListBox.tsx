import { Key } from '@react-types/shared';
import {
  BASE_STYLES,
  COLOR_STYLES,
  OUTER_STYLES,
  Styles,
  tasty,
} from '@tenphi/tasty';
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
import { mergeProps, modAttrs, useCombinedRefs } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { extractStyles } from '../../../utils/styles';
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
      focused: '#primary-text',
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
      suffix: '.5x .5x .5x 1.5x',
      'prefix & suffix': '0 .5x 0 .5x',
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
  /** Label shown when the list is empty. When provided, overrides both the "No results found" and "No items" defaults. */
  emptyLabel?: ReactNode;
  /** Custom styles for the search input */
  searchInputStyles?: Styles;
  /** Whether the FilterListBox is in loading state (shows loading icon in search input) */
  isLoading?: boolean;
  /** Whether items are currently loading. Shows a loading icon in the search input suffix. */
  isLoadingItems?: boolean;
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
    isLoadingItems,
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
    isReorderable = false,
    onReorder,
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

  // Controlled/uncontrolled search value pattern
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const isSearchControlled = controlledSearchValue !== undefined;
  const searchValue = isSearchControlled
    ? controlledSearchValue
    : internalSearchValue;

  const { contains } = useFilter({ sensitivity: 'base' });

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

    // Selected custom values are injected by FilterListBox itself, not by the
    // parent. They must respect the search input regardless of the `filter`
    // prop — `filter={false}` only describes the parent's authority over its
    // own items. Filter them with the user-provided filter (if any) or the
    // default `contains`.
    const term = searchValue.trim();
    const localFilter: FilterFn =
      typeof filter === 'function' ? filter : contains;

    // Build React elements for custom values (kept stable via their key).
    const customArray = Array.from(customKeys)
      .filter((key) => !term || localFilter(key, term))
      .map((key) => (
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
  }, [
    children,
    customKeys,
    selectionMode,
    selectedKey,
    selectedKeys,
    searchValue,
    filter,
    contains,
    customValueProps,
  ]);

  // Determine an aria-label for the internal ListBox to avoid React Aria warnings.
  const innerAriaLabel =
    (props as any)['aria-label'] ||
    (typeof label === 'string' ? label : undefined);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (!isSearchControlled) {
        setInternalSearchValue(value);
      }
      onSearchChange?.(value);
    },
    [isSearchControlled, onSearchChange],
  );

  // Choose the text filter function: user-provided `filter` prop (if any),
  // or the default `contains` helper from `useFilter`.
  // When `filter={false}`, the parent owns filtering — we normally pass items
  // through unchanged. The exception is when `isLoadingItems` is `true`: a
  // server fetch is in flight and currently visible items are stale, so we
  // fall back to client-side `contains` to hide non-matching stale items
  // until the new items arrive.
  const textFilterFn = useMemo<FilterFn>(() => {
    if (filter === false) {
      return isLoadingItems ? contains : () => true;
    }
    return filter || contains;
  }, [filter, contains, isLoadingItems]);

  // Create a filter function for collection nodes (similar to ComboBox pattern)
  const filterFn = useCallback(
    (nodes: Iterable<any>) => {
      // Server-side filtering with no fetch in flight — items are
      // authoritative and shown as-is.
      if (filter === false && !isLoadingItems) return nodes;

      const term = searchValue.trim();

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
    [filter, searchValue, textFilterFn, isLoadingItems],
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

    // Check if there are any items that will match the filter.
    // This determines whether we need to visually separate the custom value
    // from real items (i.e. render a divider between sections). When there
    // are no visible items, we skip the section wrapper so no divider is
    // drawn above a lone custom-value option.
    //
    // Selected custom values (from `customKeys`) are filtered by `localFilter`
    // in `mergedChildren` regardless of `filter={false}`, so this check must
    // use the same logic — otherwise we'd report "items visible" and draw a
    // divider while the actual collection only contains the custom value.
    const localFilter: FilterFn =
      typeof filter === 'function' ? filter : contains;

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

      for (const customKey of customKeys) {
        if (localFilter(customKey, term)) {
          return true;
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
    filter,
    contains,
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

    // Walk the collection and:
    //   1. Collect visible item keys (supports sections).
    //   2. Detect the synthetic "new custom value" option — the one generated
    //      from the current search term when `allowsCustomValue` is true.
    //
    // The custom value is rendered in one of two layouts depending on whether
    // any real item text-matches the search term (`hasVisibleFilteredItems`
    // in `enhancedChildren`):
    //   • Some items match → wrapped in a `__custom_value__` section
    //     (`customValueHasMatches = true`)
    //   • No items match    → appended at the top level with key === term
    //     (`customValueHasMatches = false`)
    //
    // The layout itself is the signal we use to decide whether the custom
    // value should be the focus target (no matches) or whether focus should
    // move to a real item (matches present).
    const term = searchValue.trim();
    let newCustomValueKey: Key | null = null;
    let customValueHasMatches = false;

    const collectVisibleKeys = (
      nodes: Iterable<any>,
      out: Key[],
      inCustomSection = false,
    ) => {
      for (const node of nodes) {
        if (node.type === 'item') {
          out.push(node.key);
          if (inCustomSection) {
            newCustomValueKey = node.key;
            customValueHasMatches = true;
          }
        } else if (node.childNodes) {
          const isCustomSection =
            inCustomSection || node.key === '__custom_value__';
          collectVisibleKeys(node.childNodes, out, isCustomSection);
        }
      }
    };

    const visibleKeys: Key[] = [];
    collectVisibleKeys(collection, visibleKeys);

    // Detect the appended-at-top-level case (no items text-match). The custom
    // option is added with key === trimmed search term and lives directly in
    // the top-level collection (not nested in any section).
    if (newCustomValueKey == null && allowsCustomValue && term) {
      for (const node of collection) {
        if (node.type === 'item' && String(node.key) === term) {
          newCustomValueKey = node.key;
          customValueHasMatches = false;
          break;
        }
      }
    }

    // If there are no visible items, reset the focused key so Enter won't select anything
    if (visibleKeys.length === 0) {
      selectionManager.setFocusedKey(null);
      return;
    }

    // The custom value should be the focus target when it exists and there
    // are no real text-matches — the user's typed value is then the only
    // actionable option. During an in-flight server fetch (`filter === false`
    // + `isLoadingItems`) `textFilterFn` falls back to client-side `contains`
    // so non-matching stale items are hidden, which keeps this signal honest.
    const customValueShouldBeFocused =
      newCustomValueKey != null && !customValueHasMatches;

    // Decide whether the current focus is already on the right thing. If yes,
    // don't disturb it. Otherwise fall through and re-pick a focus target.
    const currentFocused = selectionManager.focusedKey;
    if (currentFocused != null && visibleKeys.includes(currentFocused)) {
      const currentIsNewCustomValue =
        newCustomValueKey != null && currentFocused === newCustomValueKey;
      if (customValueShouldBeFocused) {
        if (currentIsNewCustomValue) return;
      } else if (newCustomValueKey != null) {
        // Custom value exists but isn't the priority (matches available) —
        // any non-custom focus is fine.
        if (!currentIsNewCustomValue) return;
      } else {
        // No custom value involved at all.
        return;
      }
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

    if (customValueShouldBeFocused) {
      // No real matches — promote the custom value over any selected/stale
      // item so the user can press Enter to add the value they just typed.
      keyToFocus = newCustomValueKey;
    } else {
      keyToFocus = findFirstVisibleSelectedKey();

      // Fallback to first visible item if no selected item found. Prefer the
      // first real (non-custom-value) item so focus doesn't land on the
      // bottom-of-list custom-value suggestion when real items are available.
      if (keyToFocus == null) {
        const firstRealKey = visibleKeys.find((k) => k !== newCustomValueKey);
        keyToFocus = firstRealKey ?? visibleKeys[0];
      }
    }

    // Mark this focus change as keyboard navigation so ListBox will scroll to it
    if (listState.lastFocusSourceRef) {
      listState.lastFocusSourceRef.current = 'keyboard';
    }

    // Set focus to the determined key
    selectionManager.setFocusedKey(keyToFocus);
  }, [
    searchValue,
    enhancedChildren,
    selectionMode,
    selectedKey,
    selectedKeys,
    allowsCustomValue,
  ]);

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
      'loading-items': !!isLoadingItems,
      searchable: true,
      prefix: !!isLoading,
      suffix: !!isLoadingItems,
      ...externalMods,
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isFocused,
      isLoading,
      isLoadingItems,
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
        data-suffix={isLoadingItems ? '' : undefined}
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
      {isLoadingItems && (
        <div data-element="Suffix">
          <LoadingIcon data-element="InputIcon" />
        </div>
      )}
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
        shouldUseVirtualFocus={!(isReorderable && !searchValue.trim())}
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
          emptyLabel !== undefined
            ? emptyLabel
            : searchValue.trim()
              ? 'No results found'
              : 'No items'
        }
        isReorderable={isReorderable && !searchValue.trim()}
        onReorder={onReorder}
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
