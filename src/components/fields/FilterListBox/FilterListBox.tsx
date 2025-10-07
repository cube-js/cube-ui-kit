import { Key } from '@react-types/shared';
import React, {
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFilter, useKeyboard } from 'react-aria';
import { Section as BaseSection, Item } from 'react-stately';

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
import { ItemBase } from '../../content/ItemBase';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { CubeItemProps } from '../../Item';
import { CubeListBoxProps, ListBox } from '../ListBox/ListBox';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

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
    height: {
      '': false,
      popover: 'initial max-content (50vh - 4x)',
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
  styles: {
    ...INPUT_WRAPPER_STYLES,
    border: 'bottom',
    radius: '1r top',
    fill: '#clear',
    height: '($size + 1x)',
    $size: {
      '': '$size-md',
      '[data-size="small"]': '$size-sm',
      '[data-size="medium"]': '$size-md',
      '[data-size="large"]': '$size-lg',
    },
  },
});

const SearchInputElement = tasty({
  as: 'input',
  styles: {
    ...DEFAULT_INPUT_STYLES,
    fill: '#clear',
    padding: {
      '': '.5x $inline-padding',
      prefix: '0 $inline-padding 0 .5x',
    },
    '$inline-padding':
      'max($min-inline-padding, (($size - 1lh) / 2 + $inline-compensation))',
    '$inline-compensation': '1x',
    '$min-inline-padding': '1x',
  },
});

const StyledHeaderWithoutBorder = tasty(StyledHeader, {
  styles: {
    border: false,
  },
});

export interface CubeFilterListBoxProps<T>
  extends CubeListBoxProps<T>,
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
  customValueProps?: Partial<CubeItemProps<T>>;

  /**
   * Props to apply to new custom values (values typed in the search input that are about to be added).
   * These are merged with customValueProps for new custom values.
   */
  newCustomValueProps?: Partial<CubeItemProps<T>>;

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
          React.isValidElement(rendered) &&
          (rendered as ReactElement).key == null
        ) {
          return React.cloneElement(rendered as ReactElement, {
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

  // Collect original option keys to avoid duplicating them as custom values.
  const originalKeys = useMemo(() => {
    const keys = new Set<string>();

    const collectKeys = (nodes: ReactNode): void => {
      React.Children.forEach(nodes, (child: any) => {
        if (!child || typeof child !== 'object') return;

        if (child.type === Item) {
          if (child.key != null) keys.add(String(child.key));
        }

        if (child.props?.children) {
          collectKeys(child.props.children);
        }
      });
    };

    if (children) collectKeys(children);
    return keys;
  }, [children]);

  // State to keep track of custom (user-entered) items that were selected.
  const [customKeys, setCustomKeys] = useState<Set<string>>(new Set());

  // Initialize custom keys from current selection
  React.useEffect(() => {
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

  // Filter children based on search value
  const filteredChildren = useMemo(() => {
    const term = searchValue.trim();

    if (!term || !mergedChildren) {
      return mergedChildren;
    }

    // Helper to check if a node matches the search term
    const nodeMatches = (node: any): boolean => {
      if (!node?.props) return false;

      // Get text content from the node
      const textValue =
        node.props.textValue ||
        (typeof node.props.children === 'string' ? node.props.children : '') ||
        String(node.props.children || '');

      return textFilterFn(textValue, term);
    };

    // Helper to filter React children recursively
    const filterChildren = (childNodes: ReactNode): ReactNode => {
      if (!childNodes) return null;

      const childArray = Array.isArray(childNodes) ? childNodes : [childNodes];
      const filteredNodes: ReactNode[] = [];

      childArray.forEach((child: any) => {
        if (!child || typeof child !== 'object') {
          return;
        }

        // Handle ListBox.Section
        if (
          child.type === BaseSection ||
          child.type?.displayName === 'Section'
        ) {
          const sectionChildren = Array.isArray(child.props.children)
            ? child.props.children
            : [child.props.children];

          const filteredSectionChildren = sectionChildren.filter(
            (sectionChild: any) => {
              return (
                sectionChild &&
                typeof sectionChild === 'object' &&
                nodeMatches(sectionChild)
              );
            },
          );

          if (filteredSectionChildren.length > 0) {
            // Store filtered children in a way that doesn't require cloning the section
            const filteredSection = {
              ...child,
              filteredChildren: filteredSectionChildren,
            };
            filteredNodes.push(filteredSection);
          }
        }
        // Handle ListBox.Item
        else if (child.type === Item) {
          if (nodeMatches(child)) {
            filteredNodes.push(child);
          }
        }
        // Handle other components
        else if (nodeMatches(child)) {
          filteredNodes.push(child);
        }
      });

      return filteredNodes;
    };

    return filterChildren(mergedChildren);
  }, [mergedChildren, searchValue, textFilterFn]);

  // Handle custom values if allowed
  const enhancedChildren = useMemo(() => {
    let childrenToProcess = filteredChildren;

    // Handle custom values if allowed
    if (!allowsCustomValue) return childrenToProcess;

    const term = searchValue.trim();
    if (!term) return childrenToProcess;

    // Helper to determine if the term is already present (exact match on rendered textValue or the key).
    const doesTermExist = (nodes: ReactNode): boolean => {
      let exists = false;

      const checkNodes = (childNodes: ReactNode): void => {
        React.Children.forEach(childNodes, (child: any) => {
          if (!child || typeof child !== 'object') return;

          // Check items directly
          if (child.type === Item) {
            const childText =
              child.props.textValue ||
              (typeof child.props.children === 'string'
                ? child.props.children
                : '') ||
              String(child.props.children ?? '');

            if (term === childText || String(child.key) === term) {
              exists = true;
            }
          }

          // Recurse into sections or other wrappers
          if (child.props?.children) {
            checkNodes(child.props.children);
          }
        });
      };

      checkNodes(nodes);
      return exists;
    };

    if (doesTermExist(mergedChildren)) {
      return childrenToProcess;
    }

    // Append the custom option at the end.
    const customOption = (
      <Item
        key={term}
        textValue={term}
        {...mergeProps(customValueProps, newCustomValueProps)}
      >
        {term}
      </Item>
    );

    if (Array.isArray(childrenToProcess)) {
      return [...childrenToProcess, customOption];
    }

    if (childrenToProcess) {
      return [childrenToProcess, customOption];
    }

    return customOption;
  }, [allowsCustomValue, filteredChildren, mergedChildren, searchValue]);

  // Convert custom objects back to React elements for rendering
  const finalChildren = useMemo(() => {
    if (!enhancedChildren) return enhancedChildren;

    const convertToReactElements = (nodes: ReactNode): ReactNode => {
      if (!nodes) return nodes;

      const nodeArray = Array.isArray(nodes) ? nodes : [nodes];

      return nodeArray.map((node: any, index) => {
        if (!node || typeof node !== 'object') {
          return node;
        }

        // Handle our custom filtered section objects
        if (node.filteredChildren) {
          const childrenToUse = node.filteredChildren;
          // Return the original section but with the processed children
          return React.cloneElement(node, {
            key: node.key || index,
            children: childrenToUse,
          });
        }

        // Handle regular React elements
        return node;
      });
    };

    return convertToReactElements(enhancedChildren);
  }, [enhancedChildren]);

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
  useLayoutEffect(() => {
    const listState = listStateRef.current;

    if (!listState) return;

    const { selectionManager, collection } = listState;

    // Helper to collect visible item keys (supports sections)
    const collectVisibleKeys = (nodes: Iterable<any>, out: Key[]) => {
      const term = searchValue.trim();
      for (const node of nodes) {
        if (node.type === 'item') {
          const text = node.textValue ?? String(node.rendered ?? '');
          if (!term || textFilterFn(text, term)) {
            out.push(node.key);
          }
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

    // Set focus to the first visible item
    selectionManager.setFocusedKey(visibleKeys[0]);
  }, [searchValue, enhancedChildren, textFilterFn]);

  // Keyboard navigation handler for search input
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        const listState = listStateRef.current;
        if (!listState) return;

        const { selectionManager, collection } = listState;

        // Helper to collect visible item keys (supports sections)
        const collectVisibleKeys = (nodes: Iterable<any>, out: Key[]) => {
          const term = searchValue.trim();
          for (const node of nodes) {
            if (node.type === 'item') {
              const text = node.textValue ?? String(node.rendered ?? '');
              if (!term || textFilterFn(text, term)) {
                out.push(node.key);
              }
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
        const collectVisibleKeys = (nodes: Iterable<any>, out: Key[]) => {
          const term = searchValue.trim();
          for (const node of nodes) {
            if (node.type === 'item') {
              const text = node.textValue ?? String(node.rendered ?? '');
              if (!term || textFilterFn(text, term)) {
                out.push(node.key);
              }
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

  const hasResults =
    enhancedChildren &&
    (Array.isArray(enhancedChildren)
      ? enhancedChildren.length > 0
      : enhancedChildren !== null);

  const showEmptyMessage = !hasResults && searchValue.trim();

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
        data-is-prefix={isLoading ? '' : undefined}
        type="search"
        placeholder={searchPlaceholder}
        value={searchValue}
        disabled={isDisabled}
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? '' : undefined}
        styles={searchInputStyles}
        data-size={size}
        role="combobox"
        aria-expanded="true"
        aria-haspopup="listbox"
        aria-activedescendant={
          listStateRef.current?.selectionManager.focusedKey != null
            ? `ListBoxItem-${listStateRef.current?.selectionManager.focusedKey}`
            : undefined
        }
        onChange={(e) => {
          const value = e.target.value;
          handleSearchChange(value);
        }}
        {...keyboardProps}
        {...modAttrs(mods)}
      />
    </SearchWrapperElement>
  );

  const filterListBoxField = (
    <FilterListBoxWrapperElement
      ref={ref}
      qa={qa || 'FilterListBox'}
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
      {showEmptyMessage ? (
        <ItemBase
          preset="t4"
          color="#dark-03"
          size={size}
          padding="(.5x - 1bw)"
        >
          {emptyLabel !== undefined ? emptyLabel : 'No results found'}
        </ItemBase>
      ) : (
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
          size={size}
          styles={listBoxStyles}
          isCheckable={isCheckable}
          items={items as any}
          allValueProps={allValueProps}
          onSelectionChange={handleSelectionChange}
          onEscape={onEscape}
          onOptionClick={handleOptionClick}
        >
          {finalChildren as any}
        </ListBox>
      )}
    </FilterListBoxWrapperElement>
  );

  return wrapWithField<Omit<CubeFilterListBoxProps<T>, 'children'>>(
    filterListBoxField,
    ref,
    mergeProps({ ...props, styles: undefined }, {}),
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
