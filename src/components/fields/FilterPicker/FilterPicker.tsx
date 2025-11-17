import { CollectionChildren } from '@react-types/shared';
import {
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FocusScope, Key, useKeyboard } from 'react-aria';
import { Section as BaseSection, ListState, useListState } from 'react-stately';

import { useEvent } from '../../../_internal';
import { useWarn } from '../../../_internal/hooks/use-warn';
import { CloseIcon, DirectionIcon, LoadingIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  extractStyles,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { generateRandomId } from '../../../utils/random';
import { mergeProps } from '../../../utils/react';
import { useEventBus } from '../../../utils/react/useEventBus';
import { CubeItemButtonProps, ItemAction, ItemButton } from '../../actions';
import { CubeItemProps } from '../../content/Item';
import { Text } from '../../content/Text';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import {
  CubeFilterListBoxProps,
  FilterListBox,
} from '../FilterListBox/FilterListBox';
import { ListBox } from '../ListBox';

import type { FieldBaseProps } from '../../../shared';

// Define interface for items that can have keys
interface ItemWithKey {
  key?: string | number;
  id?: string | number;
  textValue?: string;
  children?: ItemWithKey[];
  [key: string]: unknown;
}

export interface CubeFilterPickerProps<T>
  extends Omit<CubeFilterListBoxProps<T>, 'size' | 'tooltip' | 'shape'>,
    Omit<CubeItemProps, 'children' | 'size'>,
    BasePropsWithoutChildren,
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps,
    Omit<FieldBaseProps, 'tooltip'>,
    Pick<
      CubeItemButtonProps,
      'type' | 'theme' | 'icon' | 'rightIcon' | 'prefix' | 'suffix' | 'hotkeys'
    > {
  /** Placeholder text when no selection is made */
  placeholder?: string;
  /** Size of the picker component */
  size?: 'small' | 'medium' | 'large';
  /** Custom styles for the list box popover */
  listBoxStyles?: Styles;
  /** Custom styles for the popover container */
  popoverStyles?: Styles;
  /** Custom styles for the trigger button */
  triggerStyles?: Styles;
  /** Whether to show checkboxes for multiple selection mode */
  isCheckable?: boolean;
  /** Whether to flip the popover placement */
  shouldFlip?: boolean;
  /** Minimum padding in pixels between the popover and viewport edges */
  containerPadding?: number;
  /** Tooltip for the trigger button (separate from field tooltip) */
  triggerTooltip?: CubeItemProps['tooltip'];
  /** Description for the trigger button (separate from field description) */
  triggerDescription?: CubeItemProps['description'];

  /**
   * Custom renderer for the summary shown inside the trigger when there is a selection.
   *
   * For `selectionMode="multiple"` the function receives:
   *  - `selectedLabels`: array of labels of the selected items.
   *  - `selectedKeys`: array of keys of the selected items or "all".
   *
   * For `selectionMode="single"` the function receives:
   *  - `selectedLabel`: label of the selected item.
   *  - `selectedKey`: key of the selected item.
   *
   * The function should return a `ReactNode` that will be rendered inside the trigger.
   * Set to `false` to hide the summary text completely.
   */
  renderSummary?:
    | ((args: {
        selectedLabels?: string[];
        selectedKeys?: 'all' | (string | number)[];
        selectedLabel?: string;
        selectedKey?: string | number | null;
        selectionMode?: 'single' | 'multiple';
      }) => ReactNode)
    | false;

  /** Ref to access internal ListBox state (from FilterListBox) */
  listStateRef?: RefObject<ListState<T>>;
  /** Additional modifiers for styling the FilterPicker */
  mods?: Record<string, boolean>;
  /** Whether the filter picker is clearable using a clear button in the rightIcon slot */
  isClearable?: boolean;
  /** Callback called when the clear button is pressed */
  onClear?: () => void;
  /**
   * Sort selected items to the top when the popover opens.
   * Only works when using the `items` prop (data-driven mode).
   * Ignored when using JSX children.
   * @default true when items are provided, false when using JSX children
   */
  sortSelectedToTop?: boolean;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

const FilterPickerWrapper = tasty({
  qa: 'FilterPicker',
  styles: {
    display: 'inline-grid',
    flow: 'column',
    gridRows: '1sf',
    placeContent: 'stretch',
    placeItems: 'stretch',
  },
});

export const FilterPicker = forwardRef(function FilterPicker<T extends object>(
  props: CubeFilterPickerProps<T>,
  ref: ForwardedRef<HTMLElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => {
      const fieldProps: Record<string, unknown> = {};

      if (props.selectionMode === 'multiple') {
        fieldProps.selectedKeys = value || [];
      } else {
        fieldProps.selectedKey = value ?? null;
      }

      fieldProps.onSelectionChange = (key: Key | null | 'all' | Key[]) => {
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
    icon,
    rightIcon,
    prefix,
    suffix,
    hotkeys,
    triggerTooltip,
    triggerDescription,
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    isDisabled,
    isLoading,
    message,
    mods: externalMods,
    description,
    descriptionPlacement,
    placeholder,
    size = 'medium',
    styles,
    listBoxStyles,
    popoverStyles,
    type = 'outline',
    theme = 'default',
    labelSuffix,
    shouldFocusWrap,
    children,
    shouldFlip = true,
    containerPadding = 8,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    disabledKeys,
    onSelectionChange,
    selectionMode = 'single',
    listStateRef,
    focusOnHover,
    showSelectAll,
    selectAllLabel = 'All',
    items,
    header,
    footer,
    headerStyles,
    footerStyles,
    triggerStyles,
    allowsCustomValue,
    renderSummary,
    isCheckable,
    allValueProps,
    customValueProps,
    newCustomValueProps,
    searchPlaceholder,
    autoFocus,
    filter,
    emptyLabel,
    searchInputStyles,
    searchInputRef,
    listStyles,
    optionStyles,
    sectionStyles,
    headingStyles,
    listRef,
    disallowEmptySelection,
    shouldUseVirtualFocus,
    onEscape,
    onOptionClick,
    isClearable,
    searchValue,
    onSearchChange,
    sortSelectedToTop: sortSelectedToTopProp,
    isButton = false,
    form,
    ...otherProps
  } = props;

  // Track if sortSelectedToTop was explicitly provided
  const sortSelectedToTopExplicit = sortSelectedToTopProp !== undefined;
  // Default to true if items are provided, false otherwise
  const sortSelectedToTop = sortSelectedToTopProp ?? (items ? true : false);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  // Generate a unique ID for this FilterPicker instance
  const filterPickerId = useMemo(() => generateRandomId(), []);

  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  // Warn if isCheckable is false in single selection mode
  useWarn(isCheckable === false && selectionMode === 'single', {
    key: ['filterpicker-checkable-single-mode'],
    args: [
      'CubeUIKit: isCheckable=false is not recommended in single selection mode as it may confuse users about selection behavior.',
    ],
  });

  // Internal selection state (uncontrolled scenario)
  const [internalSelectedKey, setInternalSelectedKey] = useState<Key | null>(
    defaultSelectedKey ?? null,
  );
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<
    'all' | Key[]
  >(defaultSelectedKeys ?? []);

  // Track popover open/close and capture children order for session
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // Cache for sorted items array when using `items` prop
  const cachedItemsOrder = useRef<T[] | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ---------------------------------------------------------------------------
  // Invalidate cached sorting whenever the available options change.
  // This ensures newly provided options are displayed and properly sorted on
  // the next popover open instead of re-using a stale order from a previous
  // session (which caused only the previously selected options to be rendered
  // or the list to appear unsorted).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    cachedItemsOrder.current = null;
  }, [items]);

  const isControlledSingle = selectedKey !== undefined;
  const isControlledMultiple = selectedKeys !== undefined;

  const effectiveSelectedKey = isControlledSingle
    ? selectedKey
    : internalSelectedKey;
  const effectiveSelectedKeys = isControlledMultiple
    ? selectedKeys
    : internalSelectedKeys;

  // Create a local collection for label extraction only (not for rendering)
  // This gives us immediate access to textValue without waiting for FilterListBox
  const localCollectionState = useListState({
    children: children as any,
    items: items as any,
    selectionMode: 'none' as any, // We don't need selection management
  });

  // ---------------------------------------------------------------------------
  // Map user-provided keys to collection keys using the local collection.
  // The collection handles key normalization internally, so we use direct
  // string comparison.
  // ---------------------------------------------------------------------------

  const findCollectionKey = useCallback(
    (lookup: Key): Key => {
      if (lookup == null) return lookup;

      // Direct comparison - collection handles normalization internally
      for (const item of localCollectionState.collection) {
        if (String(item.key) === String(lookup)) {
          return item.key;
        }
      }

      // Fallback: return the lookup key as-is
      return lookup;
    },
    [localCollectionState.collection],
  );

  const mappedSelectedKey = useMemo(() => {
    if (selectionMode !== 'single') return null;
    return effectiveSelectedKey
      ? findCollectionKey(effectiveSelectedKey)
      : null;
  }, [selectionMode, effectiveSelectedKey, findCollectionKey]);

  const mappedSelectedKeys = useMemo(() => {
    if (selectionMode !== 'multiple') return undefined;

    if (effectiveSelectedKeys === 'all') return 'all' as const;

    if (Array.isArray(effectiveSelectedKeys)) {
      return (effectiveSelectedKeys as Key[]).map((k) => findCollectionKey(k));
    }

    return effectiveSelectedKeys;
  }, [selectionMode, effectiveSelectedKeys, findCollectionKey]);

  // Given an iterable of keys (array or Set) toggle membership for duplicates
  const processSelectionArray = (iterable: Iterable<Key>): string[] => {
    const resultSet = new Set<string>();
    for (const key of iterable) {
      const nKey = String(key);
      if (resultSet.has(nKey)) {
        resultSet.delete(nKey); // toggle off if clicked twice
      } else {
        resultSet.add(nKey); // select
      }
    }
    return Array.from(resultSet);
  };

  // Helper to get selected item labels for display using local collection
  const getSelectedLabels = () => {
    const collection = localCollectionState.collection;

    // Helper to recursively collect all item labels from collection (including nested in sections)
    const collectAllLabels = (): string[] => {
      const allLabels: string[] = [];

      const traverse = (nodes: Iterable<any>) => {
        for (const node of nodes) {
          if (node.type === 'item') {
            allLabels.push(node.textValue || String(node.key));
          } else if (node.childNodes) {
            traverse(node.childNodes);
          }
        }
      };

      traverse(collection);
      return allLabels;
    };

    // Handle "all" selection - return all available labels
    if (selectionMode === 'multiple' && effectiveSelectedKeys === 'all') {
      return collectAllLabels();
    }

    const selectedSet = new Set(
      selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
        ? (effectiveSelectedKeys || []).map((k) => String(k))
        : effectiveSelectedKey != null
          ? [String(effectiveSelectedKey)]
          : [],
    );

    const labels: string[] = [];
    const processedKeys = new Set<string>();

    // Use collection.getItem() to directly retrieve items by key (works with sections)
    selectedSet.forEach((key) => {
      const item = collection.getItem(key);
      if (item) {
        labels.push(item.textValue || String(item.key));
        processedKeys.add(String(item.key));
      }
    });

    // Handle custom values that aren't in the collection
    const selectedKeysArr =
      selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
        ? (effectiveSelectedKeys || []).map(String)
        : effectiveSelectedKey != null
          ? [String(effectiveSelectedKey)]
          : [];

    // Add labels for any selected keys that weren't found in collection (custom values)
    selectedKeysArr.forEach((key) => {
      if (!processedKeys.has(String(key))) {
        // This is a custom value, use the key as the label
        labels.push(key);
      }
    });

    return labels;
  };

  const selectedLabels = getSelectedLabels();
  const hasSelection = selectedLabels.length > 0;

  // Always keep the latest selection in a ref (with normalized keys) so that we can read it synchronously in the popover close effect.
  const latestSelectionRef = useRef<{
    single: string | null;
    multiple: 'all' | string[];
  }>({
    single: effectiveSelectedKey != null ? String(effectiveSelectedKey) : null,
    multiple:
      effectiveSelectedKeys === 'all'
        ? 'all'
        : (effectiveSelectedKeys ?? []).map(String),
  });

  useEffect(() => {
    latestSelectionRef.current = {
      single:
        effectiveSelectedKey != null ? String(effectiveSelectedKey) : null,
      multiple:
        effectiveSelectedKeys === 'all'
          ? 'all'
          : (effectiveSelectedKeys ?? []).map(String),
    };
  }, [effectiveSelectedKey, effectiveSelectedKeys]);
  const selectionsWhenClosed = useRef<{
    single: string | null;
    multiple: 'all' | string[];
  }>({ single: null, multiple: [] });

  // Capture the initial selection (from defaultSelectedKey(s)) so that
  // the very first popover open can already use it for sorting.
  useEffect(() => {
    selectionsWhenClosed.current = { ...latestSelectionRef.current };
  }, []); // run only once on mount

  // Function to sort children with selected items on top
  const getSortedChildren = useCallback(() => {
    // Warn if sorting is explicitly requested but not supported
    if (sortSelectedToTopExplicit && sortSelectedToTop && !items) {
      console.warn(
        'FilterPicker: sortSelectedToTop only works with the items prop. ' +
          'Sorting will be skipped when using JSX children.',
      );
    }

    // Return children as-is (no sorting for JSX children)
    return children;
  }, [children, sortSelectedToTop, sortSelectedToTopExplicit, items]);

  // Compute sorted items array when using `items` prop
  const getSortedItems = useCallback(() => {
    if (!items) return items;

    // Only sort if explicitly enabled
    if (!sortSelectedToTop) {
      return items;
    }

    // Reuse the cached order if we have it. We only compute the sorted array
    // once when the pop-over is opened. Cache is cleared on close.
    if (cachedItemsOrder.current) {
      return cachedItemsOrder.current;
    }

    const selectedSet = new Set<string>();

    const addSelected = (key: Key) => {
      if (key != null) selectedSet.add(String(key));
    };

    if (selectionMode === 'multiple') {
      if (selectionsWhenClosed.current.multiple === 'all') {
        // Do not sort when all selected – keep original order
        return items;
      }
      (selectionsWhenClosed.current.multiple as string[]).forEach(addSelected);
    } else {
      if (selectionsWhenClosed.current.single != null) {
        addSelected(selectionsWhenClosed.current.single);
      }
    }

    if (selectedSet.size === 0) {
      return items;
    }

    // Helpers to extract key from item object
    const getItemKey = (obj: unknown): string | undefined => {
      if (obj == null || typeof obj !== 'object') return undefined;

      const item = obj as ItemWithKey;
      if (item.key != null) return String(item.key);
      if (item.id != null) return String(item.id);
      return undefined;
    };

    const sortArray = (arr: unknown[]): unknown[] => {
      const selectedArr: unknown[] = [];
      const unselectedArr: unknown[] = [];

      arr.forEach((obj) => {
        const item = obj as ItemWithKey;
        if (obj && Array.isArray(item.children)) {
          // Section-like object – keep order, but sort its children
          const sortedChildren = sortArray(item.children);
          unselectedArr.push({ ...item, children: sortedChildren });
        } else {
          const key = getItemKey(obj);
          if (key && selectedSet.has(key)) {
            selectedArr.push(obj);
          } else {
            unselectedArr.push(obj);
          }
        }
      });

      return [...selectedArr, ...unselectedArr];
    };

    const itemsArray = Array.isArray(items)
      ? items
      : Array.from(items as Iterable<unknown>);
    const sorted = sortArray(itemsArray) as T[];

    if (isPopoverOpen || !cachedItemsOrder.current) {
      cachedItemsOrder.current = sorted;
    }

    return sorted;
  }, [
    items,
    sortSelectedToTop,
    selectionMode,
    isPopoverOpen,
    selectionsWhenClosed.current.multiple,
    selectionsWhenClosed.current.single,
  ]);

  const finalItems = getSortedItems();

  // FilterListBox handles custom values internally when allowsCustomValue={true}
  // We provide sorted children (if any) and sorted items
  const finalChildren = getSortedChildren();

  const renderTriggerContent = () => {
    // When there is a selection and a custom summary renderer is provided – use it.
    if (typeof renderSummary === 'function') {
      if (selectionMode === 'single') {
        return renderSummary({
          selectedLabel: selectedLabels[0],
          selectedKey: effectiveSelectedKey ?? null,
          selectedLabels,
          selectedKeys: effectiveSelectedKeys,
          selectionMode: 'single',
        });
      }

      return renderSummary({
        selectedLabels,
        selectedKeys: effectiveSelectedKeys,
        selectionMode: 'multiple',
      });
    } else if (renderSummary === false) {
      return null;
    }

    let content: ReactNode = '';

    if (!hasSelection) {
      content = placeholder;
    } else if (selectionMode === 'single') {
      content = selectedLabels[0];
    } else if (effectiveSelectedKeys === 'all') {
      content = selectAllLabel;
    } else {
      content = selectedLabels.join(', ');
    }

    if (!content) {
      return null;
    }

    return (
      <Text
        ellipsis
        style={{ opacity: hasSelection ? 1 : 'var(--disabled-opacity)' }}
      >
        {content}
      </Text>
    );
  };

  const [shouldUpdatePosition, setShouldUpdatePosition] = useState(true);

  // Capture trigger width for overlay min-width
  const triggerWidth = triggerRef?.current?.offsetWidth;

  // The trigger is rendered as a function so we can access the dialog state
  const renderTrigger = (state) => {
    // Listen for other menus opening and close this one if needed
    useEffect(() => {
      const unsubscribe = on('popover:open', (data: { menuId: string }) => {
        // If another menu is opening and this FilterPicker is open, close this one
        if (data.menuId !== filterPickerId && state.isOpen) {
          state.close();
        }
      });

      return unsubscribe;
    }, [on, filterPickerId, state]);

    // Emit event when this FilterPicker opens
    useEffect(() => {
      if (state.isOpen) {
        emit('popover:open', { menuId: filterPickerId });
      }
    }, [state.isOpen, emit, filterPickerId]);

    // Track popover open/close state to control sorting
    useEffect(() => {
      if (state.isOpen !== isPopoverOpen) {
        setIsPopoverOpen(state.isOpen);
        if (!state.isOpen) {
          // Popover just closed – record the latest selection for the next opening
          // and clear the cached order so the next session can compute afresh.
          selectionsWhenClosed.current = { ...latestSelectionRef.current };
          cachedItemsOrder.current = null;
        }
      }
    }, [state.isOpen, isPopoverOpen]);

    // Add keyboard support for arrow keys to open the popover
    const { keyboardProps } = useKeyboard({
      onKeyDown: (e) => {
        if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !state.isOpen) {
          e.preventDefault();
          state.open();
        }
      },
    });

    useEffect(() => {
      // Allow initial positioning & flipping when opening, then lock placement after transition
      // Popover transition is ~120ms, give it a bit more time to finalize placement
      if (state.isOpen) {
        setShouldUpdatePosition(true);
        const id = window.setTimeout(() => setShouldUpdatePosition(false), 160);
        return () => window.clearTimeout(id);
      } else {
        setShouldUpdatePosition(true);
      }
    }, [state.isOpen]);

    // Clear button logic
    let showClearButton =
      isClearable && hasSelection && !isDisabled && !props.isReadOnly;

    // Clear function
    let clearValue = useEvent(() => {
      if (selectionMode === 'multiple') {
        if (!isControlledMultiple) {
          setInternalSelectedKeys([]);
        }
        onSelectionChange?.([]);
      } else {
        if (!isControlledSingle) {
          setInternalSelectedKey(null);
        }
        onSelectionChange?.(null);
      }

      if (state.isOpen) {
        state.close();
      }

      triggerRef?.current?.focus?.();

      props.onClear?.();

      return false;
    });

    return (
      <ItemButton
        ref={triggerRef as any}
        data-popover-trigger
        isButton={isButton}
        qa={qa || 'FilterPicker'}
        id={id}
        type={type}
        theme={validationState === 'invalid' ? 'danger' : theme}
        size={size}
        isDisabled={isDisabled || isLoading}
        data-input-type="filterpicker"
        mods={{
          placeholder: !hasSelection && !renderSummary,
          ...externalMods,
        }}
        icon={icon}
        rightIcon={
          isLoading ? (
            <LoadingIcon />
          ) : rightIcon !== undefined ? (
            rightIcon
          ) : showClearButton ? (
            <ItemAction
              icon={<CloseIcon />}
              size={size}
              theme={validationState === 'invalid' ? 'danger' : undefined}
              qa="FilterPickerClearButton"
              mods={{ pressed: false }}
              onPress={clearValue}
            />
          ) : (
            <DirectionIcon to={state.isOpen ? 'top' : 'bottom'} />
          )
        }
        prefix={prefix}
        suffix={suffix}
        hotkeys={hotkeys}
        tooltip={triggerTooltip}
        description={triggerDescription}
        descriptionPlacement={descriptionPlacement}
        styles={styles}
        {...keyboardProps}
        aria-label={`${props['aria-label'] ?? props.label ?? ''}`}
      >
        {renderTriggerContent()}
      </ItemButton>
    );
  };

  const filterPickerField = (
    <FilterPickerWrapper
      qa="FilterPickerWrapper"
      styles={styles}
      {...filterBaseProps(otherProps, { eventProps: true })}
    >
      <DialogTrigger
        type="popover"
        placement="bottom start"
        styles={triggerStyles}
        containerPadding={containerPadding}
        shouldUpdatePosition={shouldUpdatePosition}
        shouldFlip={shouldFlip && shouldUpdatePosition}
        isDismissable={true}
        shouldCloseOnInteractOutside={(el) => {
          const menuTriggerEl = el.closest('[data-popover-trigger]');
          // If no menu trigger was clicked, allow closing
          if (!menuTriggerEl) return true;
          // If the same trigger that opened this popover was clicked, allow closing (toggle)
          if (menuTriggerEl === (triggerRef as any)?.current) return true;
          // Otherwise, don't close here. Let the event bus handle closing when the other opens.
          return false;
        }}
      >
        {renderTrigger}
        {(close) => (
          <Dialog
            qa="FilterPickerOverlay"
            display="grid"
            styles={{
              gridRows: '1sf',
              width: '$overlay-min-width max-content 50vw',
              '$overlay-min-width': 'min 30x',
              ...popoverStyles,
            }}
            style={
              triggerWidth
                ? ({ '--overlay-min-width': `${triggerWidth}px` } as any)
                : undefined
            }
          >
            <FocusScope restoreFocus>
              <FilterListBox
                autoFocus
                items={items ? (finalItems as typeof props.items) : undefined}
                // Pass an aria-label so the internal ListBox is properly labeled and React Aria doesn't warn.
                aria-label={`${props['aria-label'] ?? props.label ?? ''} Picker`}
                _internalCollection={localCollectionState.collection}
                selectedKey={
                  selectionMode === 'single' ? mappedSelectedKey : undefined
                }
                selectedKeys={
                  selectionMode === 'multiple' ? mappedSelectedKeys : undefined
                }
                searchPlaceholder={searchPlaceholder}
                filter={filter}
                searchValue={searchValue}
                listStyles={listStyles}
                optionStyles={optionStyles}
                sectionStyles={sectionStyles}
                headingStyles={headingStyles}
                listRef={listRef}
                disallowEmptySelection={disallowEmptySelection}
                emptyLabel={emptyLabel}
                searchInputStyles={searchInputStyles}
                searchInputRef={searchInputRef}
                disabledKeys={disabledKeys}
                focusOnHover={focusOnHover}
                shouldFocusWrap={shouldFocusWrap}
                allowsCustomValue={allowsCustomValue}
                selectionMode={selectionMode}
                validationState={validationState}
                isDisabled={isDisabled}
                isLoading={isLoading}
                stateRef={listStateRef}
                isCheckable={isCheckable}
                mods={{
                  popover: true,
                }}
                size={size === 'small' ? 'medium' : size}
                showSelectAll={showSelectAll}
                selectAllLabel={selectAllLabel}
                header={header}
                footer={footer}
                headerStyles={headerStyles}
                footerStyles={footerStyles}
                allValueProps={allValueProps}
                customValueProps={customValueProps}
                newCustomValueProps={newCustomValueProps}
                onSearchChange={onSearchChange}
                onEscape={() => close()}
                onOptionClick={(key) => {
                  // For FilterPicker, clicking the content area should close the popover
                  // in multiple selection mode (single mode already closes via onSelectionChange)
                  if (
                    (selectionMode === 'multiple' && isCheckable) ||
                    key === '__ALL__'
                  ) {
                    close();
                  }
                }}
                onSelectionChange={(selection) => {
                  // No need to change any flags - children order is cached

                  // Update internal state if uncontrolled
                  if (selectionMode === 'single') {
                    if (!isControlledSingle) {
                      setInternalSelectedKey(selection as Key | null);
                    }
                  } else {
                    if (!isControlledMultiple) {
                      let normalized: 'all' | Key[] = selection as
                        | 'all'
                        | Key[];

                      if (selection === 'all') {
                        normalized = 'all';
                      } else if (Array.isArray(selection)) {
                        normalized = processSelectionArray(selection);
                      } else if (
                        selection &&
                        typeof selection === 'object' &&
                        (selection as any) instanceof Set
                      ) {
                        normalized = processSelectionArray(
                          selection as Set<Key>,
                        );
                      }

                      setInternalSelectedKeys(normalized);
                    }
                  }

                  // Update latest selection ref synchronously
                  if (selectionMode === 'single') {
                    latestSelectionRef.current.single =
                      selection != null ? String(selection) : null;
                  } else {
                    if (selection === 'all') {
                      latestSelectionRef.current.multiple = 'all';
                    } else if (Array.isArray(selection)) {
                      latestSelectionRef.current.multiple = Array.from(
                        new Set(processSelectionArray(selection)),
                      );
                    } else if (
                      selection &&
                      typeof selection === 'object' &&
                      (selection as any) instanceof Set
                    ) {
                      latestSelectionRef.current.multiple = Array.from(
                        new Set(processSelectionArray(selection as Set<Key>)),
                      );
                    } else {
                      latestSelectionRef.current.multiple =
                        selection === 'all'
                          ? 'all'
                          : Array.isArray(selection)
                            ? selection.map(String)
                            : [];
                    }
                  }

                  onSelectionChange?.(selection);

                  if (selectionMode === 'single') {
                    close();
                  }
                }}
              >
                {
                  (children
                    ? (finalChildren as CollectionChildren<T>)
                    : undefined) as CollectionChildren<T>
                }
              </FilterListBox>
            </FocusScope>
          </Dialog>
        )}
      </DialogTrigger>
    </FilterPickerWrapper>
  );

  const finalProps = {
    ...props,
    children: undefined,
    styles: undefined,
  };

  return wrapWithField<Omit<CubeFilterPickerProps<T>, 'children' | 'tooltip'>>(
    filterPickerField,
    ref as any,
    mergeProps(finalProps, {}),
  );
}) as unknown as (<T>(
  props: CubeFilterPickerProps<T> & { ref?: ForwardedRef<HTMLElement> },
) => ReactElement) & { Item: typeof ListBox.Item; Section: typeof BaseSection };

FilterPicker.Item = ListBox.Item;

FilterPicker.Section = BaseSection;

Object.defineProperty(FilterPicker, 'cubeInputType', {
  value: 'FilterPicker',
  enumerable: false,
  configurable: false,
});
