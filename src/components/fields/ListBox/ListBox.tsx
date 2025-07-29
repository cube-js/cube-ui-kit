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
  useMemo,
  useRef,
} from 'react';
import {
  AriaListBoxProps,
  useKeyboard,
  useListBox,
  useListBoxSection,
  useOption,
} from 'react-aria';
import { Section as BaseSection, Item, useListState } from 'react-stately';

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
import { SIZES } from '../../../tokens';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
// Import Menu styled components for header and footer
import {
  StyledDivider,
  StyledFooter,
  StyledHeader,
  StyledSectionHeading,
} from '../../actions/Menu/styled';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';

import type { CollectionBase, Key } from '@react-types/shared';
import type { FieldBaseProps } from '../../../shared';

const ListBoxWrapperElement = tasty({
  qa: 'ListBox',
  styles: {
    display: 'grid',
    gridColumns: '1sf',
    gridRows: 'max-content max-content max-content 1sf max-content',
    flow: 'column',
    gap: 0,
    position: 'relative',
    radius: '1cr',
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
      'popover | searchable': false,
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
      sections: '.5x .5x 0 .5x',
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

const OptionElement = tasty({
  as: 'li',
  styles: {
    display: 'flex',
    flow: 'row',
    placeItems: 'center start',
    gap: '.75x',
    padding: '.5x 1x',
    margin: {
      '': '0 0 1bw 0',
      ':last-of-type': '0',
      all: '.5x',
    },
    height: {
      '': 'min @size-md',
      '[data-size="large"]': 'min @size-lg',
    },
    boxSizing: 'border-box',
    radius: '1r',
    cursor: {
      '': 'default',
      disabled: 'not-allowed',
    },
    transition: 'theme',
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
      'hovered | focused': '#dark.03',
      selected: '#dark.09',
      'selected & (hovered | focused)': '#dark.12',
      'selected & hovered & focused': '#dark.15',
      pressed: '#dark.09',
      valid: '#success-bg',
      invalid: '#danger-bg',
      disabled: '#clear',
    },
    outline: 0,
    backgroundClip: 'padding-box',

    CheckboxWrapper: {
      cursor: 'pointer',
      padding: '.75x',
      margin: '-.75x',
    },

    Checkbox: {
      display: 'grid',
      placeItems: 'center',
      radius: '.5r',
      width: '(2x - 2bw)',
      height: '(2x - 2bw)',
      flexShrink: 0,
      transition: 'theme',
      opacity: {
        '': 0,
        'selected | indeterminate | :hover | focused': 1,
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

    Content: {
      display: 'flex',
      flow: 'column',
      gap: '.25x',
      flex: 1,
      width: 'max 100%',
    },

    Label: {
      preset: 't3',
      color: 'inherit',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: 'max 100%',
    },

    Description: {
      preset: 't4',
      color: {
        '': '#dark-03',
      },
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: 'max 100%',
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

export interface CubeListBoxProps<T>
  extends Omit<AriaListBoxProps<T>, 'onSelectionChange'>,
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
  /** Ref for accessing the list DOM element */
  listRef?: RefObject<HTMLDivElement>;
  /**
   * Ref to access the internal ListState instance.
   * This allows parent components to access selection state and other list functionality.
   */
  stateRef?: MutableRefObject<any | null>;

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
  size?: 'medium' | 'large';

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
}: {
  label?: ReactNode;
  isSelected: boolean;
  isIndeterminate: boolean;
  isDisabled?: boolean;
  isCheckable?: boolean;
  size?: 'medium' | 'large';
  state: any;
  lastFocusSourceRef: MutableRefObject<'keyboard' | 'mouse' | 'other'>;
  onClick: (propagate?: boolean) => void;
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

  const handleOptionClick = (e) => {
    // Mark focus changes from mouse clicks
    if (lastFocusSourceRef) {
      lastFocusSourceRef.current = 'mouse';
    }

    // If there's an onOptionClick callback and this is checkable in multiple mode,
    // we need to distinguish between checkbox and content clicks
    if (isCheckable && state.selectionManager.selectionMode === 'multiple') {
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
      <OptionElement
        ref={localRef}
        as="div"
        {...hoverProps}
        data-size={size}
        role="option"
        aria-selected={isSelected}
        mods={{
          selected: isSelected,
          disabled: isDisabled,
          checkable: isCheckable,
          hovered: isHovered,
          indeterminate: isIndeterminate,
          all: true,
        }}
        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
        onClick={handleOptionClick}
      >
        {isCheckable && (
          <div data-element="CheckboxWrapper">
            <div data-element="Checkbox">
              {(isIndeterminate || isSelected) && markIcon}
            </div>
          </div>
        )}
        <div data-element="Content">
          <div data-element="Label">{label}</div>
        </div>
      </OptionElement>
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
    stateRef,
    focusOnHover,
    header,
    footer,
    headerStyles,
    footerStyles,
    escapeKeyBehavior,
    onEscape,
    isCheckable,
    onOptionClick,
    showSelectAll,
    selectAllLabel,
    ...otherProps
  } = props;

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
  }, [
    externalSelectionHandler,
    isDisabled,
    props.selectionMode,
    showSelectAll,
  ]);

  // Prepare props for useListState with correct selection props
  const listStateProps: any = {
    ...props,
    onSelectionChange: wrappedOnSelectionChange,
    isDisabled,
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

  const listState = useListState({
    ...listStateProps,
  });

  // Calculate select all state for multiple selection mode
  const selectAllState = useMemo(() => {
    if (props.selectionMode !== 'multiple' || !showSelectAll) {
      return { isSelected: false, isIndeterminate: false };
    }

    const totalItems = [...listState.collection].filter(
      (item) => item.type === 'item',
    ).length;
    const selectedCount =
      listState.selectionManager.selectedKeys === 'all'
        ? totalItems
        : listState.selectionManager.selectedKeys.size;

    if (selectedCount === 0) {
      return { isSelected: false, isIndeterminate: false };
    } else if (
      selectedCount === totalItems ||
      listState.selectionManager.selectedKeys === 'all'
    ) {
      return { isSelected: true, isIndeterminate: false };
    } else {
      return { isSelected: false, isIndeterminate: true };
    }
  }, [
    props.selectionMode,
    showSelectAll,
    listState.collection,
    listState.selectionManager.selectedKeys,
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
      listState.selectionManager.selectAll();
      // Manually call the wrapped handler since React Aria might not trigger it
      wrappedOnSelectionChange?.('all');
    }

    if (propagate) {
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
      'aria-label': props['aria-label'] || label?.toString(),
      isDisabled,
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
      return size === 'large' ? SIZES.XL + 1 : SIZES.MD + 1;
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

  // Keep focused item visible when virtualizing, but only for keyboard navigation
  useEffect(() => {
    if (!shouldVirtualize) return;
    const focusedKey = listState.selectionManager.focusedKey;
    if (focusedKey != null) {
      const idx = itemsArrayRef.current.findIndex(
        (it) => it.key === focusedKey,
      );
      if (idx !== -1) {
        // Check if the focused item is actually visible in the current viewport
        // (not just rendered due to overscan)
        const scrollElement = scrollRef.current;
        if (scrollElement) {
          const scrollTop = scrollElement.scrollTop;
          const viewportHeight = scrollElement.clientHeight;
          const viewportBottom = scrollTop + viewportHeight;

          // Find the virtual item for this index
          const virtualItems = rowVirtualizer.getVirtualItems();
          const virtualItem = virtualItems.find((item) => item.index === idx);

          let isAlreadyVisible = false;
          if (virtualItem) {
            const itemTop = virtualItem.start;
            const itemBottom = virtualItem.start + virtualItem.size;

            // Check if the item is fully visible in the viewport
            // We should scroll if the item is partially hidden
            isAlreadyVisible =
              itemTop >= scrollTop && itemBottom <= viewportBottom;
          }

          // Only scroll if the item is not already visible AND the focus change was due to keyboard navigation
          if (!isAlreadyVisible && lastFocusSourceRef.current === 'keyboard') {
            rowVirtualizer.scrollToIndex(idx, { align: 'auto' });
          }
        }
      }
    }
  }, [shouldVirtualize, listState.selectionManager.focusedKey, itemsArray]);

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
      qa={qa || 'ListBox'}
      mods={mods}
      styles={styles}
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
        <ListElement
          {...mergedListBoxProps}
          ref={listRef}
          styles={listStyles}
          aria-disabled={isDisabled || undefined}
          mods={{ sections: hasSections }}
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

  return wrapWithField<Omit<CubeListBoxProps<T>, 'children'>>(
    listBoxField,
    ref,
    mergeProps({ ...props, styles: undefined }, {}),
  );
}) as unknown as (<T>(
  props: CubeListBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

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
  size?: 'medium' | 'large';
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

  const { optionProps, isPressed } = useOption(
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

  const description = (item as any)?.props?.description;

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

  return (
    <OptionElement
      id={`ListBoxItem-${String(item.key)}`}
      {...mergeProps(optionProps, hoverProps)}
      ref={combinedRef}
      style={virtualStyle}
      data-size={size}
      data-index={virtualIndex}
      mods={{
        selected: isSelected,
        focused: isFocused,
        disabled: isDisabled,
        pressed: isPressed,
        valid: isSelected && validationState === 'valid',
        invalid: isSelected && validationState === 'invalid',
        checkable: isCheckable,
        hovered: isHovered, // We'll treat focus as hover for the checkbox visibility
      }}
      styles={styles}
      onClick={handleOptionClick}
    >
      {isCheckable && state.selectionManager.selectionMode === 'multiple' && (
        <div data-element="CheckboxWrapper">
          <div data-element="Checkbox">
            <CheckIcon size={12} stroke={3} />
          </div>
        </div>
      )}
      <div data-element="Content">
        <div data-element="Label">{item.rendered}</div>
        {description ? (
          <div data-element="Description">{description}</div>
        ) : null}
      </div>
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
  focusOnHover?: boolean;
  isCheckable?: boolean;
  onClick?: (key: Key) => void;
  size?: 'medium' | 'large';
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
        <StyledSectionHeading {...headingProps} styles={headingStyles}>
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

ListBox.Item = Item as unknown as (props: {
  description?: ReactNode;
  textValue?: string;
  [key: string]: any;
}) => ReactElement;

ListBox.Section = ListBoxSectionComponent;

Object.defineProperty(ListBox, 'cubeInputType', {
  value: 'ListBox',
  enumerable: false,
  configurable: false,
});
