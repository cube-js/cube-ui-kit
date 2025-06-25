import {
  cloneElement,
  ForwardedRef,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AriaListBoxProps,
  useFilter,
  useListBox,
  useListBoxSection,
  useOption,
} from 'react-aria';
import { Section as BaseSection, Item, useListState } from 'react-stately';

import { SearchIcon } from '../../../icons';
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
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
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
      selected: '#dark',
      disabled: '#dark-04',
    },
    fill: {
      '': '#clear',
      focused: '#dark.03',
      selected: '#dark.06',
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
  /** The filter function used to determine if an option should be included in the filtered list */
  filter?: FilterFn;
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
  /** Whether the ListBox is loading */
  isLoading?: boolean;
  /** The selected key(s) */
  selectedKey?: Key | null;
  selectedKeys?: Set<Key> | 'all';
  /** Default selected key(s) */
  defaultSelectedKey?: Key | null;
  defaultSelectedKeys?: Set<Key> | 'all';
  /** Selection change handler */
  onSelectionChange?: (key: Key | null | Set<Key>) => void;
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
      return {
        selectedKey: value ?? null,
        onSelectionChange: (key: any) => {
          // React Aria always passes a Set for selection changes
          // For single selection mode, we extract the first (and only) key
          if (key instanceof Set) {
            if (key.size === 0) {
              onChange(null);
            } else if (props.selectionMode === 'multiple') {
              onChange(key); // Return the Set for multiple selection
            } else {
              // Single selection - extract the first key
              onChange(Array.from(key)[0]);
            }
          } else {
            onChange(key);
          }
        },
      };
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
    filter,
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

  // Create filtered children based on search
  const filteredChildren = useMemo(() => {
    if (!isSearchable || !searchValue.trim() || !props.children) {
      return props.children;
    }

    const filterFn = filter || contains;

    // Filter React children elements
    const filterChild = (child: any): boolean => {
      if (!child || typeof child !== 'object') return false;

      // Handle regular items
      const textValue =
        child.props?.children?.toString() || child.key?.toString() || '';
      return filterFn(textValue, searchValue);
    };

    const filterSection = (section: any): any => {
      if (!section || typeof section !== 'object') return null;

      const sectionChildren = section.props?.children;
      if (!sectionChildren) return null;

      let filteredSectionChildren;
      if (Array.isArray(sectionChildren)) {
        filteredSectionChildren = sectionChildren.filter(filterChild);
      } else {
        filteredSectionChildren = filterChild(sectionChildren)
          ? [sectionChildren]
          : [];
      }

      // Only return the section if it has matching children
      if (filteredSectionChildren.length === 0) return null;

      // Clone the section with filtered children
      return {
        ...section,
        props: {
          ...section.props,
          children: filteredSectionChildren,
        },
      };
    };

    if (Array.isArray(props.children)) {
      return props.children
        .map((child) => {
          // Handle sections
          if (
            isValidElement(child) &&
            (child.type === BaseSection || child.props?.title)
          ) {
            return filterSection(child);
          }
          // Handle regular items
          return filterChild(child) ? child : null;
        })
        .filter(Boolean);
    }

    // Single child case
    if (
      isValidElement(props.children) &&
      (props.children.type === BaseSection || props.children.props?.title)
    ) {
      return filterSection(props.children);
    }

    return filterChild(props.children) ? props.children : null;
  }, [isSearchable, searchValue, props.children, filter, contains]);

  // Create filtered items based on search
  const filteredItems = useMemo(() => {
    if (!isSearchable || !searchValue.trim()) {
      return props.items;
    }

    const filterFn = filter || contains;

    if (props.items) {
      return Array.from(props.items).filter((item: any) => {
        const textValue =
          typeof item === 'string'
            ? item
            : item?.textValue || item?.name || String(item);
        return filterFn(textValue, searchValue);
      });
    }

    return undefined;
  }, [isSearchable, searchValue, props.items, filter, contains]);

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
          externalSelectionHandler(null);
        } else if (props.selectionMode === 'multiple') {
          externalSelectionHandler(keys); // Return the Set for multiple selection
        } else {
          // Single selection - extract the first key
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
    items: filteredItems,
    children: filteredChildren,
    onSelectionChange: wrappedOnSelectionChange,
    isDisabled,
    selectionMode: props.selectionMode || 'single',
  };

  // Set selection props based on mode
  if (listStateProps.selectionMode === 'multiple') {
    if (selectedKeys !== undefined) {
      listStateProps.selectedKeys = selectedKeys;
    }
    if (defaultSelectedKeys !== undefined) {
      listStateProps.defaultSelectedKeys = defaultSelectedKeys;
    }
    // Remove single-selection props if any
    delete listStateProps.selectedKey;
    delete listStateProps.defaultSelectedKey;
  } else {
    if (selectedKey !== undefined) {
      listStateProps.selectedKey = selectedKey;
    }
    if (defaultSelectedKey !== undefined) {
      listStateProps.defaultSelectedKey = defaultSelectedKey;
    }
    // Remove set-based props if any
    delete listStateProps.selectedKeys;
    delete listStateProps.defaultSelectedKeys;
  }

  const listState = useListState(listStateProps);

  // Manually sync controlled selection if needed
  useEffect(() => {
    if (selectedKey !== undefined) {
      const currentSelection = listState.selectionManager.selectedKeys;
      const expectedSelection =
        selectedKey !== null ? new Set([selectedKey]) : new Set();

      // Check if the current selection matches the expected selection
      const currentKeys = Array.from(currentSelection);
      const expectedKeys = Array.from(expectedSelection);

      const selectionChanged =
        currentKeys.length !== expectedKeys.length ||
        currentKeys.some((key) => !expectedSelection.has(key)) ||
        expectedKeys.some((key) => !currentSelection.has(key));

      if (selectionChanged) {
        listState.selectionManager.setSelectedKeys(expectedSelection);
      }
    }
  }, [selectedKey, listState.selectionManager]);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  searchInputRef = useCombinedRefs(searchInputRef);
  listRef = useCombinedRefs(listRef);

  const { listBoxProps } = useListBox(
    {
      ...props,
      'aria-label': props['aria-label'] || label?.toString(),
      isDisabled,
    },
    listState,
    listRef,
  );

  const { isFocused, focusProps } = useFocus({ isDisabled });
  const isInvalid = validationState === 'invalid';

  const validationIcon = isInvalid ? InvalidIcon : ValidIcon;
  const validation = cloneElement(validationIcon);

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
        styles={searchInputStyles}
        data-size="small"
        onChange={(e) => setSearchValue(e.target.value)}
        {...modAttrs(mods)}
      />
      <div data-element="Prefix">
        <div data-element="InputIcon">
          <SearchIcon />
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
                />,
              );
            }
          }

          return renderedItems;
        })()}
      </ListElement>
      {(validationState && !isLoading) || isLoading ? (
        <div
          data-element="ValidationState"
          style={{ position: 'absolute', top: '1x', right: '1x' }}
        >
          {validationState && !isLoading ? validation : null}
          {isLoading && <div>Loading...</div>}
        </div>
      ) : null}
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

function Option({ item, state, styles, isParentDisabled }) {
  const ref = useRef<HTMLLIElement>(null);
  const isDisabled = isParentDisabled || state.disabledKeys.has(item.key);
  const isSelected = state.selectionManager.isSelected(item.key);

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

  const { isFocused, focusProps } = useFocus({ isDisabled });

  const description = (item as any)?.props?.description;

  return (
    <OptionElement
      {...mergeProps(optionProps, focusProps)}
      ref={ref}
      mods={{
        selected: isSelected,
        focused: isFocused,
        disabled: isDisabled,
        pressed: isPressed,
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
}

function ListBoxSection<T>(props: ListBoxSectionProps<T>) {
  const {
    item,
    state,
    optionStyles,
    headingStyles,
    sectionStyles,
    isParentDisabled,
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
