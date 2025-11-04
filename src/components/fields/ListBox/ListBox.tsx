import { useHover } from '@react-aria/interactions';
import { IconMinus } from '@tabler/icons-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AriaListBoxProps,
  useKeyboard,
  useListBox,
  useListBoxSection,
  useOption,
} from 'react-aria';
import { Section as BaseSection, useListState } from 'react-stately';

import { useWarn } from '../../../_internal/hooks/use-warn';
import { CheckIcon } from '../../../icons';
import { Icon } from '../../../icons/index';
import { useProviderProps } from '../../../provider';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  COLOR_STYLES,
  extractStyles,
  OUTER_STYLES,
  Styles,
  tasty,
} from '../../../tasty';
import { SIZES, SIZES_MAP } from '../../../tokens';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
// Import Menu styled components for header and footer
import {
  StyledDivider,
  StyledFooter,
  StyledHeader,
  StyledSectionHeading,
} from '../../actions/Menu/styled';
import { CollectionItem, CubeCollectionItemProps } from '../../CollectionItem';
import { Item } from '../../content/Item/Item';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';

import type { CollectionBase, Key } from '@react-types/shared';
import type { FieldBaseProps } from '../../../shared';

type FirstArg<F> = F extends (...args: infer A) => any ? A[0] : never;

const ListBoxWrapperElement = tasty({
  qa: 'ListBox',
  styles: {
    display: 'grid',
    gridColumns: '1sf',
    gridRows: 'max-content max-content max-content 1sf max-content',
    flow: 'column',
    gap: 0,
    position: 'relative',
    radius: {
      '': '1cr',
      '[data-shape="popover"]': '(1cr - 1bw)',
      '[data-shape="plain"]': '0',
    },
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
      '[data-shape="plain"] | [data-shape="popover"] | searchable': false,
    },
  },
});

const ListElement = tasty({
  as: 'ul',
  styles: {
    display: 'block',
    padding: 0,
    listStyle: 'none',
    boxSizing: 'border-box',
    margin: {
      '': '.5x .5x 0 .5x',
      '[data-shape="plain"]': '0',
    },
    height: 'max-content',
  },
});

// NEW: dedicated scroll container for ListBox
const ListBoxScrollElement = tasty({
  as: 'div',
  styles: {
    display: 'grid',
    gridColumns: '1sf',
    gridRows: '1sf',
    overflow: 'auto',
    scrollbar: 'styled',
  },
});

// Create an extended Item for ListBox options with 'all' modifier support
const ListBoxItem = tasty(Item, {
  as: 'li',
  styles: {
    margin: {
      '': '0 0 1bw 0',
      ':last-of-type': '0',
      all: '.5x',
    },
  },
});

const SectionWrapperElement = tasty({
  as: 'li',
  styles: {
    display: 'block',
    padding: {
      '': 0,
      ':last-of-type': '0 0 .5x 0',
    },
  },
});

const SectionListElement = tasty({
  qa: 'ListBoxSectionList',
  as: 'ul',
  styles: {
    display: 'flex',
    gap: '0',
    flow: 'column',
    margin: '0',
    padding: '0',
    listStyle: 'none',
  },
});

// Checkbox component for multiple selection options
const ListBoxCheckbox = tasty({
  as: 'div',
  styles: {
    display: 'grid',
    placeItems: 'center',
    radius: '.5r',
    width: '(2x - 2bw)',
    height: '(2x - 2bw)',
    flexShrink: 0,
    transition: 'theme',
    opacity: {
      '': 0,
      'selected | indeterminate | hovered | focused': 1,
    },
    fill: {
      '': '#white',
      'selected | indeterminate': '#purple-text',
      'invalid & !(selected | indeterminate)': '#white',
      'invalid & (selected | indeterminate)': '#danger',
      disabled: '#dark.12',
    },
    color: {
      '': '#white',
      'disabled & !selected': '#clear',
    },
    border: {
      '': '#dark.30',
      invalid: '#danger',
      'disabled | ((selected | indeterminate) & !invalid)': '#clear',
    },
  },
});

const ListBoxCheckboxWrapper = tasty({
  as: 'div',
  styles: {
    display: 'grid',
    placeItems: 'center',
    placeContent: 'center',
    cursor: '$pointer',
    placeSelf: 'stretch',
  },
});

export interface CubeListBoxProps<T>
  extends AriaListBoxProps<T>,
    CollectionBase<T>,
    FieldBaseProps,
    BasePropsWithoutChildren {
  /** Custom styles for the list container */
  listStyles?: Styles;
  /** Custom styles for individual options */
  optionStyles?: Styles;
  /** Custom styles for section containers */
  sectionStyles?: Styles;
  /** Custom styles for section headings */
  headingStyles?: Styles;
  /** Whether the ListBox is disabled */
  isDisabled?: boolean;
  /** The selected key in controlled single selection mode */
  selectedKey?: Key | null;
  /** The selected keys in controlled multiple selection mode. Use "all" to select all items or an array of keys */
  selectedKeys?: 'all' | Key[];
  /** The default selected key in uncontrolled single selection mode */
  defaultSelectedKey?: Key | null;
  /** The default selected keys in uncontrolled multiple selection mode. Use "all" to select all items or an array of keys */
  defaultSelectedKeys?: 'all' | Key[];
  /** Callback fired when selection changes */
  onSelectionChange?: (key: Key | null | 'all' | Key[]) => void;
  /** The selection mode of the ListBox */
  selectionMode?: 'single' | 'multiple';
  /** Ref for accessing the list DOM element */
  listRef?: RefObject<HTMLUListElement | null>;
  /** Whether to disallow empty selection */
  disallowEmptySelection?: boolean;
  /** Whether to wrap focus when reaching the end of the list */
  shouldFocusWrap?: boolean;
  /**
   * Ref to access the internal ListState instance.
   * This allows parent components to access selection state and other list functionality.
   */
  stateRef?: RefObject<any | null>;

  /**
   * Whether moving the pointer over an option will move DOM focus to that option.
   * Set to false for components that keep DOM focus outside (e.g. searchable FilterListBox).
   * Defaults to true.
   */
  focusOnHover?: boolean;
  /** Custom header content displayed above the list */
  header?: ReactNode;
  /** Custom footer content displayed below the list */
  footer?: ReactNode;
  /** Custom styles for the header */
  headerStyles?: Styles;
  /** Custom styles for the footer */
  footerStyles?: Styles;
  /** Additional modifiers for styling the ListBox */
  mods?: Record<string, boolean>;
  /** Size variant of the ListBox */
  size?: 'small' | 'medium' | 'large';

  /**
   * When `true`, clicking an already-selected item keeps it selected instead of toggling it off.
   * Useful when embedding ListBox inside components like ComboBox.
   */
  disableSelectionToggle?: boolean;

  /**
   * Whether to use virtual focus for keyboard navigation.
   * When true, DOM focus stays outside individual option elements (useful for searchable lists).
   * Defaults to false for backward compatibility.
   */
  shouldUseVirtualFocus?: boolean;

  /**
   * Callback fired when the user presses Escape key.
   * When provided, this prevents React Aria's default Escape behavior (selection reset).
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
   * Whether to show the "Select All" option in multiple selection mode.
   * This adds a select all option to the header that allows selecting/deselecting all items.
   */
  showSelectAll?: boolean;

  /**
   * Label for the "Select All" option. Defaults to "Select All".
   */
  selectAllLabel?: ReactNode;

  /**
   * Props to apply to the "Select All" option.
   */
  allValueProps?: Partial<CubeCollectionItemProps<T>>;

  /**
   * Filter function to apply to the collection nodes.
   * Takes an iterable of nodes and returns a filtered iterable.
   * Useful for implementing search/filter functionality.
   */
  filter?: (nodes: Iterable<any>) => Iterable<any>;

  /**
   * Label to display when the list is empty (no items available).
   * Defaults to "No items".
   */
  emptyLabel?: ReactNode;

  /**
   * Visual shape of the ListBox styling.
   * - `card` (default): Standard card styling with border and margin
   * - `plain`: No border, no margin, no radius - suitable for embedded use
   * - `popover`: No border, but keeps margin and radius - suitable for overlay use
   * Defaults to 'card'.
   */
  shape?: 'card' | 'plain' | 'popover';
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

const SelectAllOption = ({
  label = 'Select All',
  isSelected,
  isIndeterminate,
  isDisabled,
  isCheckable,
  size = 'medium',
  state,
  lastFocusSourceRef,
  onClick,
  allValueProps = {},
}: {
  label?: ReactNode;
  isSelected: boolean;
  isIndeterminate: boolean;
  isDisabled?: boolean;
  isCheckable?: boolean;
  size?: 'small' | 'medium' | 'large';
  state: any;
  lastFocusSourceRef: MutableRefObject<'keyboard' | 'mouse' | 'other'>;
  onClick: (propagate?: boolean) => void;
  allValueProps?: Partial<CubeCollectionItemProps<any>>;
}) => {
  const { hoverProps, isHovered } = useHover({ isDisabled });

  const markIcon = isIndeterminate ? (
    <Icon size={12} stroke={3}>
      <IconMinus />
    </Icon>
  ) : (
    <CheckIcon size={12} stroke={3} />
  );

  const localRef = useRef<HTMLLIElement>(null);

  // Create checkbox icon for select all option
  const checkboxIcon = useMemo(() => {
    if (!isCheckable) {
      return null;
    }

    return (
      <ListBoxCheckboxWrapper
        data-element="CheckboxWrapper"
        mods={{
          selected: isSelected,
          disabled: isDisabled,
          hovered: isHovered,
          indeterminate: isIndeterminate,
        }}
      >
        <ListBoxCheckbox
          data-element="Checkbox"
          mods={{
            selected: isSelected,
            disabled: isDisabled,
            hovered: isHovered,
            indeterminate: isIndeterminate,
          }}
        >
          {(isIndeterminate || isSelected) && markIcon}
        </ListBoxCheckbox>
      </ListBoxCheckboxWrapper>
    );
  }, [
    isCheckable,
    isSelected,
    isDisabled,
    isHovered,
    isIndeterminate,
    markIcon,
  ]);

  const handleOptionClick = (e) => {
    // Mark focus changes from mouse clicks
    if (lastFocusSourceRef) {
      lastFocusSourceRef.current = 'mouse';
    }

    // If there's an onOptionClick callback and this is checkable in multiple mode,
    // we need to distinguish between checkbox and content clicks
    if (state.selectionManager.selectionMode === 'multiple') {
      // Check if the click target is within the checkbox area
      const clickTarget = e.target as HTMLElement;
      const checkboxElement = localRef.current?.querySelector(
        '[data-element="CheckboxWrapper"]',
      );

      if (
        checkboxElement &&
        (checkboxElement === clickTarget ||
          checkboxElement.contains(clickTarget))
      ) {
        onClick?.(false);
      } else {
        // Then call the callback (which will close the popover in FilterPicker)
        onClick?.(true);
      }
    } else {
      onClick?.(true);
    }
  };

  return (
    <>
      <ListBoxItem
        ref={localRef}
        data-size={size}
        size={size}
        role="option"
        aria-selected={isSelected}
        isSelected={isSelected}
        isDisabled={isDisabled}
        icon={checkboxIcon}
        mods={{
          listboxitem: true,
          disabled: isDisabled,
          checkable: isCheckable,
          hovered: isHovered,
          indeterminate: isIndeterminate,
          all: true, // Important: this preserves the 'all' modifier
        }}
        {...mergeProps(hoverProps, allValueProps, {
          onClick: handleOptionClick,
        })}
      >
        {label}
      </ListBoxItem>
      <StyledDivider />
    </>
  );
};

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
    id,
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    isDisabled,
    listStyles,
    optionStyles,
    sectionStyles,
    headingStyles,
    listRef,
    message,
    description,
    styles,
    mods: externalMods,
    size = 'medium',
    labelSuffix,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    shouldUseVirtualFocus,
    onSelectionChange,
    disableSelectionToggle = false,
    stateRef,
    focusOnHover,
    header,
    footer,
    headerStyles,
    footerStyles,
    onEscape,
    isCheckable,
    onOptionClick,
    showSelectAll,
    selectAllLabel,
    allValueProps,
    filter,
    emptyLabel = 'No items',
    shape = 'card',
    form,
    ...otherProps
  } = props;

  const [, forceUpdate] = useState({});
  const lastSelectedKeyRef = useRef<Key | null>(null);

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
      // Handle the special "all" case and convert to our public API format
      if (keys === 'all') {
        externalSelectionHandler('all');
      } else if (keys instanceof Set) {
        if (keys.size === 0) {
          if (disableSelectionToggle && props.selectionMode === 'single') {
            const prevKey = lastSelectedKeyRef.current;
            if (prevKey != null) {
              externalSelectionHandler(prevKey);
              return;
            }
          }
          externalSelectionHandler(
            props.selectionMode === 'multiple' ? [] : null,
          );
        } else if (props.selectionMode === 'multiple') {
          externalSelectionHandler(Array.from(keys));
        } else {
          const key = Array.from(keys)[0];
          lastSelectedKeyRef.current = key ?? null;
          externalSelectionHandler(key);
        }
      } else {
        lastSelectedKeyRef.current = keys as Key | null;
        externalSelectionHandler(keys);
      }
    };
  }, [
    externalSelectionHandler,
    isDisabled,
    props.selectionMode,
    showSelectAll,
  ]);

  // Prepare props for useListState with correct selection props
  const listStateProps: FirstArg<typeof useListState> = {
    ...props,
    onSelectionChange: wrappedOnSelectionChange,
    isDisabled,
    disabledBehavior: 'all',
    filter,
    selectionMode: props.selectionMode || 'single',
  };

  // Set selection props based on mode
  if (listStateProps.selectionMode === 'multiple') {
    if (selectedKeys !== undefined) {
      // Handle "all" selection by passing it directly to React Aria
      listStateProps.selectedKeys =
        selectedKeys === 'all' ? 'all' : new Set(selectedKeys as Key[]);
    }
    if (defaultSelectedKeys !== undefined) {
      // Handle "all" default selection
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

  useLayoutEffect(() => {
    const selected = listState.selectionManager.selectedKeys;
    if (selected && (selected as any).size > 0) {
      const first = Array.from(selected as Set<Key>)[0];
      lastSelectedKeyRef.current = first ?? null;
    }
  }, [listState.selectionManager.selectedKeys]);

  // Calculate select all state for multiple selection mode
  const selectAllState = useMemo(() => {
    // Select-all only makes sense for multiple selection mode *and* when the UI is enabled
    if (props.selectionMode !== 'multiple' || !showSelectAll) {
      return { isSelected: false, isIndeterminate: false };
    }

    // React Stately exposes the raw selection value which is either the string "all"
    // (when `selectAll(true)` was used) **or** a Set of item keys.
    const rawSelection: any = (listState.selectionManager as any).rawSelection;

    // Fast path – user pressed our "Select All" control previously.
    if (rawSelection === 'all') {
      return { isSelected: true, isIndeterminate: false };
    }

    const selectedKeys = listState.selectionManager.selectedKeys as Set<Key>;

    // When there is nothing selected, we are in a clear state
    if (selectedKeys.size === 0) {
      return { isSelected: false, isIndeterminate: false };
    }

    // Otherwise it must be a partial (indeterminate) selection.
    return { isSelected: false, isIndeterminate: true };
  }, [
    props.selectionMode,
    showSelectAll,
    listState.collection,
    listState.disabledKeys,
    listState.selectionManager.selectedKeys,
    listState.selectionManager.rawSelection,
  ]);

  // Handle select all click
  const handleSelectAllClick = (propagate?: boolean) => {
    if (isDisabled || props.selectionMode !== 'multiple') return;

    if (selectAllState.isSelected) {
      // All selected, deselect all
      listState.selectionManager.clearSelection();
      // Manually call the wrapped handler since React Aria might not trigger it
      wrappedOnSelectionChange?.(new Set());
    } else {
      // Some or none selected, select all
      listState.selectionManager.selectAll(true);
      // Manually call the wrapped handler since React Aria might not trigger it
      wrappedOnSelectionChange?.('all');
      forceUpdate({});
    }

    if (propagate && !selectAllState.isSelected) {
      onOptionClick?.('__ALL__');
    }
  };

  // Track whether the last focus change was due to keyboard navigation
  const lastFocusSourceRef = useRef<'keyboard' | 'mouse' | 'other'>('other');

  // Expose the list state instance via the provided ref (if any)
  if (stateRef) {
    stateRef.current = {
      ...listState,
      lastFocusSourceRef,
    };
  }

  // Warn if isCheckable is false in single selection mode
  useWarn(isCheckable === false && props.selectionMode === 'single', {
    key: ['listbox-checkable-single-mode'],
    args: [
      'CubeUIKit: isCheckable=false is not recommended in single selection mode as it may confuse users about selection behavior.',
    ],
  });

  // Custom keyboard handling to prevent selection clearing on Escape while allowing overlay dismiss
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      // Mark focus changes from keyboard navigation
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === 'PageUp' ||
        e.key === 'PageDown'
      ) {
        lastFocusSourceRef.current = 'keyboard';
      }

      if (e.key === 'Escape' && onEscape) {
        // Don't prevent default - let the overlay system handle closing
        // But we'll call onEscape to potentially override the default selection clearing
        onEscape();
      }
    },
  });

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  listRef = useCombinedRefs(listRef);

  const { listBoxProps } = useListBox(
    {
      ...props,
      id: id,
      'aria-label': props['aria-label'] || label?.toString(),
      isDisabled,
      isVirtualized: true,
      shouldUseVirtualFocus: shouldUseVirtualFocus ?? false,
      escapeKeyBehavior: onEscape ? 'none' : 'clearSelection',
    },
    listState,
    listRef,
  );

  const { isFocused, focusProps } = useFocus({ isDisabled });
  const isInvalid = validationState === 'invalid';

  // ----- Virtualization logic -----
  const itemsArray = useMemo(
    () => [...listState.collection],
    [listState.collection],
  );

  const hasSections = useMemo(
    () => itemsArray.some((i) => i.type === 'section'),
    [itemsArray],
  );

  const shouldVirtualize = !hasSections;

  // Use ref to ensure estimateSize always accesses current itemsArray
  const itemsArrayRef = useRef(itemsArray);
  itemsArrayRef.current = itemsArray;

  // Scroll container ref for virtualization
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? itemsArray.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index: number) => {
      const currentItem: any = itemsArrayRef.current[index];

      if (currentItem?.props?.description) {
        return SIZES.XL + 1;
      }
      return SIZES[SIZES_MAP[size] as keyof typeof SIZES] + 1;
    },
    measureElement: (el) => {
      return el.offsetHeight + 1;
    },
    overscan: 10,
  });

  // Trigger remeasurement when items change (for filtering scenarios)
  useEffect(() => {
    if (shouldVirtualize) {
      rowVirtualizer.measure();
    }
  }, [shouldVirtualize, itemsArray, rowVirtualizer]);

  // Keep focused item visible, but only for keyboard navigation
  useLayoutEffect(() => {
    const focusedKey = listState.selectionManager.focusedKey;
    if (focusedKey == null) return;

    // Only scroll on keyboard navigation
    if (lastFocusSourceRef.current !== 'keyboard') return;

    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const itemElement = scrollElement.querySelector(
      `[data-key="${CSS.escape(String(focusedKey))}"]`,
    ) as HTMLElement;
    if (!itemElement) return;

    const scrollTop = scrollElement.scrollTop;
    const viewportHeight = scrollElement.clientHeight;
    const viewportBottom = scrollTop + viewportHeight;

    const itemRect = itemElement.getBoundingClientRect();
    const scrollRect = scrollElement.getBoundingClientRect();

    // Calculate item position relative to scroll container
    const itemTop = itemRect.top - scrollRect.top + scrollTop;
    const itemBottom = itemTop + itemRect.height;

    // Check if the item is fully visible in the viewport
    const isAlreadyVisible =
      itemTop >= scrollTop && itemBottom <= viewportBottom;

    if (!isAlreadyVisible) {
      // Use scrollIntoView with block: 'nearest' to minimize scroll jumps
      itemElement.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
  }, [listState.selectionManager.focusedKey, itemsArray]);

  // Merge React Aria listbox props with custom keyboard props so both sets of
  // event handlers (e.g. Arrow navigation *and* our Escape handler) are
  // preserved.
  const mergedListBoxProps = mergeProps(listBoxProps, keyboardProps);

  const mods = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: isDisabled,
      focused: isFocused,
      header: !!header || (showSelectAll && props.selectionMode === 'multiple'),
      footer: !!footer,
      selectAll: showSelectAll && props.selectionMode === 'multiple',
      ...externalMods,
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isFocused,
      header,
      footer,
      showSelectAll,
      props.selectionMode,
      externalMods,
    ],
  );

  const listBoxField = (
    <ListBoxWrapperElement
      ref={ref}
      qa="ListBoxWrapper"
      mods={mods}
      styles={styles}
      data-shape={shape}
    >
      {header ? (
        <StyledHeader styles={headerStyles} data-size={size}>
          {header}
        </StyledHeader>
      ) : (
        <div role="presentation" />
      )}
      {showSelectAll && props.selectionMode === 'multiple' ? (
        <SelectAllOption
          label={selectAllLabel || 'Select All'}
          state={listState}
          lastFocusSourceRef={lastFocusSourceRef}
          isSelected={selectAllState.isSelected}
          isIndeterminate={selectAllState.isIndeterminate}
          isDisabled={isDisabled}
          isCheckable={isCheckable}
          size={size}
          allValueProps={allValueProps}
          onClick={handleSelectAllClick}
        />
      ) : (
        <>
          <div role="presentation" />
          <div role="presentation" />
        </>
      )}
      {/* Scroll container wrapper */}
      <ListBoxScrollElement ref={scrollRef} mods={mods} {...focusProps}>
        {listState.collection.size === 0 ? (
          <Item preset="t4" color="#dark-03" size={size} padding="(.5x - 1bw)">
            {emptyLabel}
          </Item>
        ) : (
          <ListElement
            qa={qa || 'ListBox'}
            {...mergedListBoxProps}
            ref={listRef}
            styles={listStyles}
            aria-disabled={isDisabled || undefined}
            mods={{ sections: hasSections }}
            data-shape={shape}
            style={
              shouldVirtualize
                ? {
                    position: 'relative',
                    height: `${rowVirtualizer.getTotalSize() + 3}px`,
                  }
                : undefined
            }
          >
            {shouldVirtualize
              ? rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const item = itemsArray[virtualItem.index];

                  return (
                    <Option
                      key={virtualItem.key}
                      size={size}
                      item={item}
                      state={listState}
                      styles={optionStyles}
                      isParentDisabled={isDisabled}
                      validationState={validationState}
                      focusOnHover={focusOnHover}
                      isCheckable={isCheckable}
                      // We don't need to measure the element here, because the height is already set by the virtualizer
                      // This is a workaround to avoid glitches when selecting/deselecting items
                      virtualRef={rowVirtualizer.measureElement as any}
                      virtualStyle={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      virtualIndex={virtualItem.index}
                      lastFocusSourceRef={lastFocusSourceRef}
                      onClick={onOptionClick}
                    />
                  );
                })
              : (() => {
                  const renderedItems: ReactNode[] = [];
                  let isFirstSection = true;

                  for (const item of listState.collection) {
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
                        <ListBoxSection
                          key={item.key}
                          item={item}
                          state={listState}
                          optionStyles={optionStyles}
                          headingStyles={headingStyles}
                          sectionStyles={sectionStyles}
                          isParentDisabled={isDisabled}
                          validationState={validationState}
                          focusOnHover={focusOnHover}
                          isCheckable={isCheckable}
                          size={size}
                          lastFocusSourceRef={lastFocusSourceRef}
                          onClick={onOptionClick}
                        />,
                      );

                      isFirstSection = false;
                    } else {
                      renderedItems.push(
                        <Option
                          key={item.key}
                          size={size}
                          item={item}
                          state={listState}
                          styles={optionStyles}
                          isParentDisabled={isDisabled}
                          validationState={validationState}
                          focusOnHover={focusOnHover}
                          isCheckable={isCheckable}
                          lastFocusSourceRef={lastFocusSourceRef}
                          onClick={onOptionClick}
                        />,
                      );
                    }
                  }

                  return renderedItems;
                })()}
          </ListElement>
        )}
      </ListBoxScrollElement>
      {footer ? (
        <StyledFooter styles={footerStyles} data-size={size}>
          {footer}
        </StyledFooter>
      ) : (
        <div role="presentation" />
      )}
    </ListBoxWrapperElement>
  );

  const finalProps = { ...props, styles: undefined };

  return wrapWithField<Omit<CubeListBoxProps<T>, 'children'>>(
    listBoxField,
    ref,
    mergeProps(finalProps, {}),
  );
}) as unknown as (<T>(
  props: CubeListBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & {
  Item: typeof CollectionItem;
  Section: typeof BaseSection;
};

function Option({
  size = 'medium',
  item,
  state,
  styles,
  isParentDisabled,
  validationState,
  focusOnHover = false,
  isCheckable,
  onClick: onOptionClick,
  virtualStyle,
  virtualRef,
  virtualIndex,
  lastFocusSourceRef,
}: {
  size?: 'small' | 'medium' | 'large';
  item: any;
  state: any;
  styles?: Styles;
  isParentDisabled?: boolean;
  validationState?: any;
  focusOnHover?: boolean;
  isCheckable?: boolean;
  onClick?: (key: Key) => void;
  /** Inline style applied when virtualized (absolute positioning etc.) */
  virtualStyle?: CSSProperties;
  /** Ref callback from react-virtual to measure row height */
  virtualRef?: (element: HTMLElement | null) => void;
  /** Virtual index from react-virtual for data-index attribute */
  virtualIndex?: number;
  /** Ref to track the source of focus changes */
  lastFocusSourceRef?: MutableRefObject<'keyboard' | 'mouse' | 'other'>;
}) {
  const localRef = useRef<HTMLLIElement>(null);
  // Merge local ref with react-virtual measure ref when provided
  const combinedRef = useCombinedRefs(localRef, virtualRef);

  const isDisabled = isParentDisabled || state.disabledKeys.has(item.key);
  const isSelected = state.selectionManager.isSelected(item.key);
  const isFocused = state.selectionManager.focusedKey === item.key;

  const { hoverProps, isHovered } = useHover({ isDisabled });

  const { optionProps, isPressed, labelProps, descriptionProps } = useOption(
    {
      key: item.key,
      isDisabled,
      isSelected,
      shouldSelectOnPressUp: true,
      shouldFocusOnHover: focusOnHover,
    },
    state,
    combinedRef,
  );

  // Create checkbox icon for multiple selection mode
  const effectiveIcon = useMemo(() => {
    if (
      !isCheckable ||
      state.selectionManager.selectionMode !== 'multiple' ||
      item.icon
    ) {
      return (
        (item as any)?.props?.icon ??
        (state.selectionManager.selectionMode !== 'multiple' ? null : undefined)
      );
    }

    return (
      <ListBoxCheckboxWrapper
        data-element="CheckboxWrapper"
        mods={{
          selected: isSelected,
          disabled: isDisabled,
          focused: isFocused,
          hovered: isHovered,
          invalid: validationState === 'invalid',
        }}
      >
        <ListBoxCheckbox
          data-element="Checkbox"
          mods={{
            selected: isSelected,
            disabled: isDisabled,
            focused: isFocused,
            hovered: isHovered,
            invalid: validationState === 'invalid',
          }}
        >
          <CheckIcon size={12} stroke={3} />
        </ListBoxCheckbox>
      </ListBoxCheckboxWrapper>
    );
  }, [
    isCheckable,
    state.selectionManager.selectionMode,
    isSelected,
    isDisabled,
    isFocused,
    isHovered,
    validationState,
    item.icon,
  ]);

  // Custom click handler for the entire option
  const handleOptionClick = (e) => {
    // Mark focus changes from mouse clicks
    if (lastFocusSourceRef) {
      lastFocusSourceRef.current = 'mouse';
    }

    // If there's an onOptionClick callback and this is checkable in multiple mode,
    // we need to distinguish between checkbox and content clicks
    if (
      onOptionClick &&
      isCheckable &&
      state.selectionManager.selectionMode === 'multiple'
    ) {
      // Check if the click target is within the checkbox area
      const clickTarget = e.target as HTMLElement;
      const checkboxElement = localRef.current?.querySelector(
        '[data-element="CheckboxWrapper"]',
      );

      if (
        checkboxElement &&
        (checkboxElement === clickTarget ||
          checkboxElement.contains(clickTarget))
      ) {
        // Checkbox area clicked - only toggle, don't call onOptionClick
        // Let React Aria handle the selection
        optionProps.onClick?.(e);
        // Set focus to the clicked item
        state.selectionManager.setFocusedKey(item.key);
      } else {
        // Content area clicked - toggle and trigger callback
        // Let React Aria handle the selection first
        optionProps.onClick?.(e);
        // Set focus to the clicked item
        state.selectionManager.setFocusedKey(item.key);
        // Then call the callback (which will close the popover in FilterPicker)
        if (onOptionClick) {
          onOptionClick(item.key);
        }
      }
    } else {
      // Normal behavior - let React Aria handle it
      optionProps.onClick?.(e);
      // Set focus to the clicked item
      state.selectionManager.setFocusedKey(item.key);
      // Call onOptionClick if provided
      if (onOptionClick) {
        onOptionClick(item.key);
      }
    }
  };

  // Filter out React Aria props that shouldn't reach the DOM
  const {
    onKeyDown,
    onKeyUp,
    tabIndex,
    'aria-selected': ariaSelected,
    'aria-disabled': ariaDisabled,
    role,
    ...filteredOptionProps
  } = optionProps;

  const theme =
    { valid: 'success', invalid: 'danger' }[validationState] || 'default';

  return (
    <ListBoxItem
      ref={combinedRef}
      qa={item.props?.qa}
      id={`ListBoxItem-${String(item.key)}`}
      data-key={String(item.key)}
      {...mergeProps(filteredOptionProps, hoverProps, {
        onClick: handleOptionClick,
        onKeyDown,
        onKeyUp,
        tabIndex,
        'aria-selected': ariaSelected,
        'aria-disabled': ariaDisabled,
        role,
      })}
      theme={theme}
      style={virtualStyle}
      data-size={size}
      data-index={virtualIndex}
      size={size}
      isSelected={isSelected}
      isDisabled={isDisabled}
      icon={effectiveIcon}
      rightIcon={item.props?.rightIcon}
      hotkeys={item.props?.hotkeys}
      suffix={item.props?.suffix}
      description={item.props?.description}
      descriptionPlacement={item.props?.descriptionPlacement}
      labelProps={labelProps}
      descriptionProps={descriptionProps}
      styles={styles}
      tooltip={item.props?.tooltip}
      defaultTooltipPlacement="right"
      mods={{
        listboxitem: true,
        focused: isFocused,
        pressed: isPressed,
        valid: isSelected && validationState === 'valid',
        invalid: isSelected && validationState === 'invalid',
        checkable: isCheckable,
        hovered: isHovered,
        all: false, // This will be set to true for SelectAllOption
      }}
    >
      {item.rendered}
    </ListBoxItem>
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
  focusOnHover?: boolean;
  isCheckable?: boolean;
  onClick?: (key: Key) => void;
  size?: 'small' | 'medium' | 'large';
  lastFocusSourceRef?: MutableRefObject<'keyboard' | 'mouse' | 'other'>;
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
    focusOnHover,
    isCheckable,
    onClick: onOptionClick,
    lastFocusSourceRef,
  } = props;
  const heading = item.rendered;

  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <SectionWrapperElement {...itemProps} styles={sectionStyles}>
      {heading && (
        <StyledSectionHeading
          {...headingProps}
          size={props.size}
          styles={headingStyles}
        >
          {heading}
        </StyledSectionHeading>
      )}
      <SectionListElement {...groupProps}>
        {[...item.childNodes]
          .filter((node: any) => state.collection.getItem(node.key))
          .map((node: any) => (
            <Option
              key={node.key}
              size={props.size}
              item={node}
              state={state}
              styles={optionStyles}
              isParentDisabled={isParentDisabled}
              validationState={validationState}
              focusOnHover={focusOnHover}
              isCheckable={isCheckable}
              lastFocusSourceRef={lastFocusSourceRef}
              onClick={onOptionClick}
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

ListBox.Item = CollectionItem;

ListBox.Section = ListBoxSectionComponent;

Object.defineProperty(ListBox, 'cubeInputType', {
  value: 'ListBox',
  enumerable: false,
  configurable: false,
});
