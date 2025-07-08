import {
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AriaListBoxProps,
  useFilter,
  useKeyboard,
  useListBox,
  useListBoxSection,
  useOption,
} from 'react-aria';
import { Section as BaseSection, Item, useListState } from 'react-stately';

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
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

import type { CollectionBase, Key } from '@react-types/shared';
import type { FieldBaseProps } from '../../../shared';

type FilterFn = (textValue: string, inputValue: string) => boolean;

const ListBoxWrapperElement = tasty({
  styles: {
    display: 'flex',
    flow: 'column',
    gap: 0,
    position: 'relative',
    radius: true,
    fill: '#white',
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
    },
  },
});

const SearchWrapperElement = tasty({
  styles: {
    ...INPUT_WRAPPER_STYLES,
    border: '#clear',
    radius: '1r top',
    borderBottom: '1bw solid #border',
  },
});

const SearchInputElement = tasty({
  as: 'input',
  styles: DEFAULT_INPUT_STYLES,
});

const ListElement = tasty({
  as: 'ul',
  styles: {
    display: 'flex',
    gap: '1bw',
    flow: 'column',
    margin: '0',
    padding: '.5x',
    listStyle: 'none',
    height: 'auto',
    overflow: 'auto',
    scrollbar: 'styled',
  },
});

const OptionElement = tasty({
  as: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '.25x',
    padding: '.75x 1x',
    radius: '1r',
    cursor: 'pointer',
    transition: 'theme',
    outline: 0,
    border: 0,
    userSelect: 'none',
    color: {
      '': '#dark-02',
      'selected | pressed': '#dark',
      disabled: '#dark-04',
      valid: '#success-text',
      invalid: '#danger-text',
    },
    fill: {
      '': '#clear',
      focused: '#dark.03',
      selected: '#dark.06',
      'selected & focused': '#dark.09',
      pressed: '#dark.06',
      valid: '#success-bg',
      invalid: '#danger-bg',
      disabled: '#clear',
    },

    Label: {
      preset: 't3',
      color: 'inherit',
    },

    Description: {
      preset: 't4',
      color: {
        '': '#dark-03',
      },
    },
  },
});

const SectionWrapperElement = tasty({
  as: 'li',
  styles: {
    display: 'block',
  },
});

const SectionHeadingElement = tasty({
  styles: {
    preset: 't4 strong',
    color: '#dark-03',
    padding: '.5x 1x .25x',
    userSelect: 'none',
  },
});

const SectionListElement = tasty({
  as: 'ul',
  styles: {
    display: 'flex',
    gap: '1bw',
    flow: 'column',
    margin: '0',
    padding: '0',
    listStyle: 'none',
  },
});

const DividerElement = tasty({
  as: 'li',
  styles: {
    height: '1bw',
    fill: '#border',
    margin: '.5x 0',
  },
});

export interface CubeListBoxProps<T>
  extends Omit<AriaListBoxProps<T>, 'onSelectionChange'>,
    CollectionBase<T>,
    FieldBaseProps {
  /** Whether the ListBox is searchable */
  isSearchable?: boolean;
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
  /** Custom styles for the list container */
  listStyles?: Styles;
  /** Custom styles for options */
  optionStyles?: Styles;
  /** Custom styles for sections */
  sectionStyles?: Styles;
  /** Custom styles for section headings */
  headingStyles?: Styles;
  /** Whether the ListBox is disabled */
  isDisabled?: boolean;
  /** Whether the ListBox as a whole is loading (generic loading indicator) */
  isLoading?: boolean;
  /** The selected key(s) */
  selectedKey?: Key | null;
  selectedKeys?: Key[] | 'all';
  /** Default selected key(s) */
  defaultSelectedKey?: Key | null;
  defaultSelectedKeys?: Key[] | 'all';
  /** Selection change handler */
  onSelectionChange?: (key: Key | null | Key[]) => void;
  /** Ref for the search input */
  searchInputRef?: RefObject<HTMLInputElement>;
  /** Ref for the list */
  listRef?: RefObject<HTMLElement>;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

export const ListBox = forwardRef(function ListBox<T extends object>(
  props: CubeListBoxProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => {
      const fieldProps: any = {};

      if (props.selectionMode === 'multiple') {
        fieldProps.selectedKeys = Array.isArray(value)
          ? value
          : value
            ? [value]
            : [];
      } else {
        fieldProps.selectedKey = value ?? null;
      }

      fieldProps.onSelectionChange = (key: any) => {
        if (props.selectionMode === 'multiple') {
          if (Array.isArray(key)) {
            onChange(key);
          } else if (key instanceof Set) {
            onChange(Array.from(key));
          } else {
            onChange(key ? [key] : []);
          }
        } else {
          if (key instanceof Set) {
            onChange(key.size === 0 ? null : Array.from(key)[0]);
          } else {
            onChange(key);
          }
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
    isSearchable = false,
    searchPlaceholder = 'Search...',
    autoFocus,
    filter,
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
    onSelectionChange,
    ...otherProps
  } = props;

  const [searchValue, setSearchValue] = useState('');
  const { contains } = useFilter({ sensitivity: 'base' });

  // Choose the text filter function: user-provided `filter` prop (if any)
  // or the default `contains` helper from `useFilter`.
  const textFilterFn = useMemo<FilterFn>(
    () => filter || contains,
    [filter, contains],
  );

  // Collection-level filter function expected by `useListState`.
  // It converts the text filter (textValue, searchValue) ⟶ boolean
  // into the shape `(nodes) => Iterable<Node<T>>`.
  // The current `searchValue` is captured in the closure – every re-render
  // produces a new function so React Stately updates the collection when the
  // search term changes.
  const collectionFilter = useCallback(
    (nodes: Iterable<any>): Iterable<any> => {
      const term = searchValue.trim();

      // If there is no search term, return nodes untouched to avoid
      // unnecessary object allocations.
      if (!term) {
        return nodes;
      }

      // Recursive helper to filter sections and items.
      const filterNodes = (iter: Iterable<any>): any[] => {
        const result: any[] = [];

        for (const node of iter) {
          if (node.type === 'section') {
            const filteredChildren = filterNodes(node.childNodes);

            if (filteredChildren.length) {
              // Preserve the original node but replace `childNodes` with the
              // filtered iterable so that React-Stately can still traverse it.
              result.push({
                ...node,
                childNodes: filteredChildren,
              });
            }
          } else {
            const text = node.textValue ?? String(node.rendered ?? '');

            if (textFilterFn(text, term)) {
              result.push(node);
            }
          }
        }

        return result;
      };

      return filterNodes(nodes);
    },
    [searchValue, textFilterFn],
  );

  // Wrap onSelectionChange to prevent selection when disabled and handle React Aria's Set format
  const externalSelectionHandler = onSelectionChange || (props as any).onChange;

  const wrappedOnSelectionChange = useMemo(() => {
    if (!externalSelectionHandler) return undefined;

    return (keys: any) => {
      // Don't allow selection changes when disabled
      if (isDisabled) {
        return;
      }

      // React Aria always passes a Set for selection changes
      // For single selection mode, we extract the first (and only) key
      if (keys instanceof Set) {
        if (keys.size === 0) {
          externalSelectionHandler(
            props.selectionMode === 'multiple' ? [] : null,
          );
        } else if (props.selectionMode === 'multiple') {
          externalSelectionHandler(Array.from(keys));
        } else {
          externalSelectionHandler(Array.from(keys)[0]);
        }
      } else {
        externalSelectionHandler(keys);
      }
    };
  }, [externalSelectionHandler, isDisabled, props.selectionMode]);

  // Prepare props for useListState with correct selection props
  const listStateProps: any = {
    ...props,
    filter: collectionFilter,
    onSelectionChange: wrappedOnSelectionChange,
    isDisabled,
    selectionMode: props.selectionMode || 'single',
  };

  // Set selection props based on mode
  if (listStateProps.selectionMode === 'multiple') {
    if (selectedKeys !== undefined) {
      listStateProps.selectedKeys =
        selectedKeys === 'all' ? 'all' : new Set(selectedKeys as Key[]);
    }
    if (defaultSelectedKeys !== undefined) {
      listStateProps.defaultSelectedKeys =
        defaultSelectedKeys === 'all'
          ? 'all'
          : new Set(defaultSelectedKeys as Key[]);
    }
    // Remove single-selection props if any
    delete listStateProps.selectedKey;
    delete listStateProps.defaultSelectedKey;
  } else {
    // For single-selection we convert the scalar key props that our public
    // API exposes into the Set-based props that React Stately expects.
    if (selectedKey !== undefined) {
      listStateProps.selectedKeys =
        selectedKey == null ? new Set() : new Set([selectedKey]);
    }

    if (defaultSelectedKey !== undefined) {
      listStateProps.defaultSelectedKeys =
        defaultSelectedKey == null ? new Set() : new Set([defaultSelectedKey]);
    }

    // Remove the single-value props so we don't pass unsupported keys through.
    delete listStateProps.selectedKey;
    delete listStateProps.defaultSelectedKey;
  }

  const listState = useListState(listStateProps);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  searchInputRef = useCombinedRefs(searchInputRef);
  listRef = useCombinedRefs(listRef);

  const { listBoxProps } = useListBox(
    {
      ...props,
      'aria-label': props['aria-label'] || label?.toString(),
      isDisabled,
      shouldUseVirtualFocus: isSearchable,
      shouldFocusWrap: true,
    },
    listState,
    listRef,
  );

  const { isFocused, focusProps } = useFocus({ isDisabled });
  const isInvalid = validationState === 'invalid';

  // Keyboard navigation handler for search input
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        const isArrowDown = e.key === 'ArrowDown';
        const { selectionManager, collection } = listState;
        const currentKey = selectionManager.focusedKey;

        // Helper function to find next selectable item (skip section headers and disabled items)
        const findNextSelectableKey = (
          startKey: any,
          direction: 'forward' | 'backward',
        ) => {
          let nextKey = startKey;
          const keyGetter =
            direction === 'forward'
              ? collection.getKeyAfter.bind(collection)
              : collection.getKeyBefore.bind(collection);

          while (nextKey != null) {
            const item = collection.getItem(nextKey);
            // Use SelectionManager's canSelectItem method for proper validation
            if (
              item &&
              item.type !== 'section' &&
              selectionManager.canSelectItem(nextKey)
            ) {
              return nextKey;
            }
            nextKey = keyGetter(nextKey);
          }

          return null;
        };

        // Helper function to find first/last selectable item
        const findFirstLastSelectableKey = (
          direction: 'forward' | 'backward',
        ) => {
          const allKeys = Array.from(collection.getKeys());
          const keysToCheck =
            direction === 'forward' ? allKeys : allKeys.reverse();

          for (const key of keysToCheck) {
            const item = collection.getItem(key);
            if (
              item &&
              item.type !== 'section' &&
              selectionManager.canSelectItem(key)
            ) {
              return key;
            }
          }

          return null;
        };

        let nextKey: any = null;
        const direction = isArrowDown ? 'forward' : 'backward';

        if (currentKey == null) {
          // No current focus, find first/last selectable item
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
        }
      } else if (e.key === 'Enter' || (e.key === ' ' && !searchValue.trim())) {
        const focusedKey = listState.selectionManager.focusedKey;
        if (focusedKey != null) {
          e.preventDefault();

          // Use the SelectionManager's select method which handles all selection logic
          // including single vs multiple selection modes and modifier keys
          listState.selectionManager.select(focusedKey, e);
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
      searchable: isSearchable,
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isFocused,
      isLoading,
      isSearchable,
    ],
  );

  const searchInput = isSearchable ? (
    <SearchWrapperElement mods={mods} data-size="small">
      <SearchInputElement
        ref={searchInputRef}
        data-is-prefix
        type="search"
        placeholder={searchPlaceholder}
        value={searchValue}
        disabled={isDisabled}
        autoFocus={autoFocus && isSearchable}
        data-autofocus={autoFocus ? '' : undefined}
        styles={searchInputStyles}
        data-size="small"
        aria-controls={listBoxProps.id}
        aria-activedescendant={
          listState.selectionManager.focusedKey != null
            ? `${listBoxProps.id}-option-${listState.selectionManager.focusedKey}`
            : undefined
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
  ) : null;

  const listBoxField = (
    <ListBoxWrapperElement
      ref={ref}
      qa={qa || 'ListBox'}
      {...modAttrs(mods)}
      styles={styles}
      {...focusProps}
    >
      {searchInput}
      <ListElement
        {...listBoxProps}
        ref={listRef}
        styles={listStyles}
        aria-disabled={isDisabled || undefined}
        {...(!isSearchable ? keyboardProps : {})}
      >
        {(() => {
          const renderedItems: ReactNode[] = [];
          let isFirstSection = true;

          for (const item of listState.collection) {
            if (item.type === 'section') {
              if (!isFirstSection) {
                renderedItems.push(
                  <DividerElement
                    key={`divider-${String(item.key)}`}
                    role="separator"
                    aria-orientation="horizontal"
                  />,
                );
              }

              renderedItems.push(
                <ListBoxSection
                  key={item.key}
                  item={item}
                  state={listState}
                  optionStyles={optionStyles}
                  headingStyles={headingStyles}
                  sectionStyles={sectionStyles}
                  isParentDisabled={isDisabled}
                  validationState={validationState}
                />,
              );

              isFirstSection = false;
            } else {
              renderedItems.push(
                <Option
                  key={item.key}
                  item={item}
                  state={listState}
                  styles={optionStyles}
                  isParentDisabled={isDisabled}
                  validationState={validationState}
                />,
              );
            }
          }

          // Show "No results found" message when there are no items after filtration
          if (
            renderedItems.length === 0 &&
            isSearchable &&
            searchValue.trim()
          ) {
            return (
              <li>
                <Block preset="t4" color="#dark-03">
                  {emptyLabel !== undefined ? emptyLabel : 'No results found'}
                </Block>
              </li>
            );
          }

          return renderedItems;
        })()}
      </ListElement>
    </ListBoxWrapperElement>
  );

  return wrapWithField<Omit<CubeListBoxProps<T>, 'children'>>(
    listBoxField,
    ref,
    mergeProps({ ...props, styles: undefined }, {}),
  );
}) as unknown as (<T>(
  props: CubeListBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

function Option({ item, state, styles, isParentDisabled, validationState }) {
  const ref = useRef<HTMLLIElement>(null);
  const isDisabled = isParentDisabled || state.disabledKeys.has(item.key);
  const isSelected = state.selectionManager.isSelected(item.key);
  const isFocused = state.selectionManager.focusedKey === item.key;

  const { optionProps, isPressed } = useOption(
    {
      key: item.key,
      isDisabled,
      isSelected,
      shouldSelectOnPressUp: true,
      shouldFocusOnHover: true,
    },
    state,
    ref,
  );

  const description = (item as any)?.props?.description;

  return (
    <OptionElement
      {...optionProps}
      ref={ref}
      mods={{
        selected: isSelected,
        focused: isFocused,
        disabled: isDisabled,
        pressed: isPressed,
        valid: isSelected && validationState === 'valid',
        invalid: isSelected && validationState === 'invalid',
      }}
      styles={styles}
    >
      <div data-element="Label">{item.rendered}</div>
      {description ? <div data-element="Description">{description}</div> : null}
    </OptionElement>
  );
}

interface ListBoxSectionProps<T> {
  item: any;
  state: any;
  optionStyles?: Styles;
  headingStyles?: Styles;
  sectionStyles?: Styles;
  isParentDisabled?: boolean;
  validationState?: any;
}

function ListBoxSection<T>(props: ListBoxSectionProps<T>) {
  const {
    item,
    state,
    optionStyles,
    headingStyles,
    sectionStyles,
    isParentDisabled,
    validationState,
  } = props;
  const heading = item.rendered;

  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <SectionWrapperElement {...itemProps} styles={sectionStyles}>
      {heading && (
        <SectionHeadingElement {...headingProps} styles={headingStyles}>
          {heading}
        </SectionHeadingElement>
      )}
      <SectionListElement {...groupProps}>
        {[...item.childNodes]
          .filter((node: any) => state.collection.getItem(node.key))
          .map((node: any) => (
            <Option
              key={node.key}
              item={node}
              state={state}
              styles={optionStyles}
              isParentDisabled={isParentDisabled}
              validationState={validationState}
            />
          ))}
      </SectionListElement>
    </SectionWrapperElement>
  );
}

type SectionComponent = typeof BaseSection;

const ListBoxSectionComponent = Object.assign(BaseSection, {
  displayName: 'Section',
}) as SectionComponent;

ListBox.Item = Item as unknown as (props: {
  description?: ReactNode;
  [key: string]: any;
}) => ReactElement;

ListBox.Section = ListBoxSectionComponent;

Object.defineProperty(ListBox, 'cubeInputType', {
  value: 'ListBox',
  enumerable: false,
  configurable: false,
});
