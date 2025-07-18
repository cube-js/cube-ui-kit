import { Key } from '@react-types/shared';
import React, {
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFilter, useKeyboard } from 'react-aria';
import { Section as BaseSection, Item } from 'react-stately';

import { LoadingIcon, SearchIcon } from '../../../icons';
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
import { Block } from '../../Block';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
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
    gridRows: 'max-content 1sf',
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
  },
});

const SearchInputElement = tasty({
  as: 'input',
  styles: {
    ...DEFAULT_INPUT_STYLES,
    fill: '#clear',
  },
});

export interface CubeFilterListBoxProps<T>
  extends Omit<CubeListBoxProps<T>, 'children'>,
    FieldBaseProps {
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Whether the search input should have autofocus */
  autoFocus?: boolean;
  /** The filter function used to determine if an option should be included in the filtered list */
  filter?: FilterFn;
  /** Custom label to display when no results are found after filtering */
  emptyLabel?: ReactNode;
  /** Custom styles for the search input */
  searchInputStyles?: Styles;
  /** Whether the FilterListBox as a whole is loading (generic loading indicator) */
  isLoading?: boolean;
  /** Ref for the search input */
  searchInputRef?: RefObject<HTMLInputElement>;
  /** Children (ListBox.Item and ListBox.Section elements) */
  children?: ReactNode;
  /** Allow entering a custom value that is not present in the options */
  allowsCustomValue?: boolean;
  /** Mods for the FilterListBox */
  mods?: Record<string, boolean>;
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
          onChange(key ? (Array.isArray(key) ? key : [key]) : []);
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
    labelSuffix,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange: externalOnSelectionChange,
    allowsCustomValue = false,
    children,
    ...otherProps
  } = props;

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
  const [customItems, setCustomItems] = useState<Record<string, ReactElement>>(
    {},
  );

  // Merge original children with any previously created custom items so they are always displayed afterwards.
  const mergedChildren: ReactNode = useMemo(() => {
    if (!children && !Object.keys(customItems).length) return children;

    const customArray = Object.values(customItems);
    if (!children) return customArray;

    const originalArray = Array.isArray(children) ? children : [children];
    return [...originalArray, ...customArray];
  }, [children, customItems]);

  // Determine an aria-label for the internal ListBox to avoid React Aria warnings.
  const innerAriaLabel =
    (props as any)['aria-label'] ||
    (typeof label === 'string' ? label : undefined);

  const [searchValue, setSearchValue] = useState('');
  const { contains } = useFilter({ sensitivity: 'base' });

  // Choose the text filter function: user-provided `filter` prop (if any)
  // or the default `contains` helper from `useFilter`.
  const textFilterFn = useMemo<FilterFn>(
    () => filter || contains,
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
            filteredNodes.push({
              ...child,
              props: {
                ...child.props,
                children: filteredSectionChildren,
              },
            });
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

  // If custom values are allowed and there is a search term that doesn't
  // exactly match any option, append a temporary option so the user can pick it.
  const enhancedChildren = useMemo(() => {
    if (!allowsCustomValue) return filteredChildren;

    const term = searchValue.trim();
    if (!term) return filteredChildren;

    // Helper to determine if the term is already present (exact match on rendered textValue).
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

            if (term === String(child.key)) {
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
      return filteredChildren;
    }

    // Append the custom option at the end.
    const customOption = (
      <Item key={term} textValue={term}>
        {term}
      </Item>
    );

    if (Array.isArray(filteredChildren)) {
      return [...filteredChildren, customOption];
    }

    if (filteredChildren) {
      return [filteredChildren, customOption];
    }

    return customOption;
  }, [allowsCustomValue, filteredChildren, mergedChildren, searchValue]);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  searchInputRef = useCombinedRefs(searchInputRef);
  listRef = useCombinedRefs(listRef);

  const { isFocused, focusProps } = useFocus({ isDisabled });
  const isInvalid = validationState === 'invalid';

  const listBoxRef = useRef<HTMLDivElement>(null);

  // Ref to access internal ListBox state (selection manager, etc.)
  const listStateRef = useRef<any>(null);

  // Track focused key for virtual focus management
  const [focusedKey, setFocusedKey] = useState<Key | null>(null);

  // When the search value changes, the visible collection of items may change as well.
  // If the currently focused item is no longer visible, move virtual focus to the first
  // available item so that arrow navigation and Enter behaviour continue to work.
  useLayoutEffect(() => {
    const listState = listStateRef.current;

    if (!listState) return;

    const { selectionManager, collection } = listState;

    // Early exit if the current focused key is still present in the collection.
    const currentFocused = selectionManager.focusedKey;
    if (
      currentFocused != null &&
      collection.getItem &&
      collection.getItem(currentFocused)
    ) {
      return;
    }

    // Find the first item key in the (possibly sectioned) collection.
    let firstKey: Key | null = null;

    for (const node of collection) {
      if (node.type === 'item') {
        firstKey = node.key;
        break;
      }

      if (node.childNodes) {
        for (const child of node.childNodes) {
          if (child.type === 'item') {
            firstKey = child.key;
            break;
          }
        }
      }

      if (firstKey != null) break;
    }

    selectionManager.setFocusedKey(firstKey);
    setFocusedKey(firstKey);
  }, [searchValue, enhancedChildren]);

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

        const currentKey =
          focusedKey != null ? focusedKey : selectionManager.focusedKey;

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
            } else {
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
          selectionManager.setFocusedKey(nextKey);
          setFocusedKey(nextKey);
        }
      } else if (e.key === 'Enter') {
        const listState = listStateRef.current;
        if (!listState) return;

        const keyToSelect =
          focusedKey != null
            ? focusedKey
            : listState.selectionManager.focusedKey;

        if (keyToSelect != null) {
          e.preventDefault();
          listState.selectionManager.select(keyToSelect, e);
        }
      } else if (e.key === 'Escape') {
        if (searchValue) {
          e.preventDefault();
          setSearchValue('');
        }
      }
    },
  });

  const mods = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: isDisabled,
      focused: isFocused,
      loading: isLoading,
      searchable: true,
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

      // Keep only those custom items that remain selected and add any new ones
      setCustomItems((prev) => {
        const next: Record<string, ReactElement> = {};

        selectedValues.forEach((val) => {
          // Ignore original (non-custom) options
          if (originalKeys.has(val)) return;

          next[val] = prev[val] ?? (
            <Item key={val} textValue={val}>
              {val}
            </Item>
          );
        });

        return next;
      });
    }

    if (externalOnSelectionChange) {
      (externalOnSelectionChange as any)(selection);
    }
  };

  const searchInput = (
    <SearchWrapperElement mods={mods} data-size="small">
      <SearchInputElement
        ref={searchInputRef}
        data-is-prefix
        type="search"
        placeholder={searchPlaceholder}
        value={searchValue}
        disabled={isDisabled}
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? '' : undefined}
        styles={searchInputStyles}
        data-size="small"
        role="combobox"
        aria-expanded="true"
        aria-haspopup="listbox"
        aria-activedescendant={
          focusedKey != null ? `ListBoxItem-${focusedKey}` : undefined
        }
        onChange={(e) => {
          const value = e.target.value;
          setSearchValue(value);
        }}
        {...keyboardProps}
        {...modAttrs(mods)}
      />
      <div data-element="Prefix">
        <div data-element="InputIcon">
          {isLoading ? <LoadingIcon /> : <SearchIcon />}
        </div>
      </div>
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
      {searchInput}
      {showEmptyMessage ? (
        <div style={{ padding: '0.75rem 1rem' }}>
          <Block preset="t4" color="#dark-03">
            {emptyLabel !== undefined ? emptyLabel : 'No results found'}
          </Block>
        </div>
      ) : (
        <ListBox
          ref={listBoxRef}
          aria-label={innerAriaLabel}
          selectedKey={selectedKey}
          defaultSelectedKey={defaultSelectedKey}
          selectedKeys={selectedKeys}
          defaultSelectedKeys={defaultSelectedKeys}
          selectionMode={props.selectionMode}
          isDisabled={isDisabled}
          listRef={listRef}
          stateRef={listStateRef}
          listStyles={listStyles}
          optionStyles={optionStyles}
          sectionStyles={sectionStyles}
          headingStyles={headingStyles}
          validationState={validationState}
          disallowEmptySelection={props.disallowEmptySelection}
          disabledKeys={props.disabledKeys}
          focusOnHover={false}
          onSelectionChange={handleSelectionChange}
          {...modAttrs({ ...mods, focused: false })}
          styles={{ border: '#clear', radius: '1r bottom' }}
        >
          {enhancedChildren as any}
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

FilterListBox.Item = Item as unknown as (props: {
  description?: ReactNode;
  textValue?: string;
  [key: string]: any;
}) => ReactElement;

FilterListBox.Section = BaseSection;

Object.defineProperty(FilterListBox, 'cubeInputType', {
  value: 'FilterListBox',
  enumerable: false,
  configurable: false,
});
