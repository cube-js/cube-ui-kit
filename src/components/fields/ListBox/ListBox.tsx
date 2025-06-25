import {
  Children,
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
      valid: '#success-text',
      invalid: '#danger-text',
    },
    fill: {
      '': '#clear',
      focused: '#dark.03',
      selected: '#dark.06',
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

    // Returns `true` if the given element's text value matches the search.
    const filterChild = (child: any): boolean => {
      if (!isValidElement(child)) return false;

      const { textValue, children } = child.props as any;

      // Prefer an explicit textValue prop (React Aria's Item), then children, then key.
      let candidate: string = '';

      if (typeof textValue === 'string') {
        candidate = textValue;
      } else if (typeof children === 'string') {
        candidate = children;
      } else if (Array.isArray(children)) {
        candidate = children.join(' ');
      } else if (child.key != null) {
        candidate = String(child.key);
      }

      return filterFn(candidate, searchValue);
    };

    // Filters a Section element and returns a cloned element with only the matching children.
    const filterSection = (section: any) => {
      if (!isValidElement(section)) return null;

      const childrenArray = Children.toArray(
        (section as any).props.children as any,
      );
      const filteredSectionChildren = childrenArray.filter(filterChild);

      if (filteredSectionChildren.length === 0) return null;

      return cloneElement(
        section as any,
        { children: filteredSectionChildren } as any,
      );
    };

    const childrenArray = Children.toArray(props.children as any);

    const result = childrenArray
      .map((child) => {
        if (
          isValidElement(child) &&
          (child.type === BaseSection || (child.props as any)?.title)
        ) {
          return filterSection(child);
        }

        return filterChild(child) ? child : null;
      })
      .filter(Boolean);

    return result.length === 0 ? null : result;
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
    items: filteredItems,
    children: filteredChildren,
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
    if (selectedKey !== undefined) {
      listStateProps.selectedKey = selectedKey;
    }
    if (defaultSelectedKey !== undefined) {
      // useListState expects a Set for uncontrolled selections, even in single-selection mode
      // so convert the provided key into a Set. Passing an empty Set means no default selection.
      listStateProps.defaultSelectedKeys =
        defaultSelectedKey == null ? new Set() : new Set([defaultSelectedKey]);
    }
    // Remove set-based props if any
    delete listStateProps.selectedKeys;
    delete listStateProps.defaultSelectedKey;
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
      shouldUseVirtualFocus: isSearchable,
      shouldFocusWrap: true,
    },
    listState,
    listRef,
  );

  const { isFocused, focusProps } = useFocus({ isDisabled });
  const isInvalid = validationState === 'invalid';

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
        aria-controls={listBoxProps.id}
        aria-activedescendant={
          listState.selectionManager.focusedKey != null
            ? `${listBoxProps.id}-option-${listState.selectionManager.focusedKey}`
            : undefined
        }
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();

            const keyGetter =
              e.key === 'ArrowDown'
                ? listState.collection.getKeyAfter.bind(listState.collection)
                : listState.collection.getKeyBefore.bind(listState.collection);

            const firstKey =
              e.key === 'ArrowDown'
                ? listState.collection.getFirstKey()
                : listState.collection.getLastKey();

            let nextKey;
            const currentKey = listState.selectionManager.focusedKey;
            if (currentKey == null) {
              nextKey = firstKey;
            } else {
              nextKey = keyGetter(currentKey) ?? firstKey;
            }

            if (nextKey != null) {
              listState.selectionManager.setFocusedKey(nextKey);
            }
          } else if (
            e.key === 'Enter' ||
            (e.key === ' ' && props.selectionMode === 'multiple')
          ) {
            const focusedKey = listState.selectionManager.focusedKey;
            if (focusedKey != null) {
              e.preventDefault();
              if (props.selectionMode === 'multiple') {
                (listState.selectionManager as any).toggleSelection(focusedKey);
              } else {
                (listState.selectionManager as any).select(focusedKey);
              }
            }
          }
        }}
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

  const {
    optionProps,
    isPressed,
    isFocused: optionFocused,
  } = useOption(
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
        focused: optionFocused,
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
