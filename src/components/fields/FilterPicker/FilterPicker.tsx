import { CollectionChildren, FocusableRefValue } from '@react-types/shared';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
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
import { generateRandomId } from '../../../utils/random';
import { useEventBus } from '../../../utils/react/useEventBus';
import { processSelectionArray } from '../../../utils/selection';
import { extractStyles } from '../../../utils/styles';
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
      | 'type'
      | 'theme'
      | 'icon'
      | 'rightIcon'
      | 'prefix'
      | 'suffix'
      | 'hotkeys'
      | 'shape'
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
   * Whether items are currently loading. Shows a loading spinner in the search
   * input suffix inside the popover. Unlike `isLoading`, this does NOT disable
   * the trigger.
   */
  isLoadingItems?: boolean;
  /**
   * Sort selected items to the top when the popover opens.
   * Only works when using the `items` prop (data-driven mode).
   * Ignored when using JSX children.
   * @default true when items are provided, false when using JSX children
   */
  sortSelectedToTop?: boolean;
  /** Callback called when the popover open state changes */
  onOpenChange?: (isOpen: boolean) => void;
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
    shape,
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
    isLoadingItems,
    searchValue,
    onSearchChange,
    sortSelectedToTop: sortSelectedToTopProp,
    onOpenChange,
    isReorderable,
    onReorder,
    form,
    ...otherProps
  } = props;

  const sortSelectedToTopExplicit = sortSelectedToTopProp !== undefined;
  const sortSelectedToTop = sortSelectedToTopProp ?? (items ? true : false);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  const filterPickerId = useMemo(() => generateRandomId(), []);

  const { emit, on } = useEventBus();

  useWarn(isCheckable === false && selectionMode === 'single', {
    key: ['filterpicker-checkable-single-mode'],
    args: [
      'CubeUIKit: isCheckable=false is not recommended in single selection mode as it may confuse users about selection behavior.',
    ],
  });

  useWarn(sortSelectedToTopExplicit && sortSelectedToTop && !items, {
    key: ['filterpicker-sort-selected-to-top-children'],
    args: [
      'FilterPicker: sortSelectedToTop only works with the items prop. Sorting will be skipped when using JSX children.',
    ],
  });

  // Internal selection state (uncontrolled scenario)
  const [internalSelectedKey, setInternalSelectedKey] = useState<Key | null>(
    defaultSelectedKey ?? null,
  );
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<
    'all' | Key[]
  >(defaultSelectedKeys ?? []);

  // Popover state — used as controlled prop for DialogTrigger
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const cachedItemsOrder = useRef<T[] | null>(null);
  const triggerRef = useRef<FocusableRefValue<HTMLButtonElement>>(null);
  // Measured lazily on popover open instead of on every render
  const triggerWidthRef = useRef<number | undefined>(undefined);

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

  // Collection for label extraction (shared with FilterListBox via _internalCollection)
  const localCollectionState = useListState({
    children: children as any,
    items: items as any,
    selectionMode: 'none' as any,
  });

  // Build Maps for O(1) label and key lookups from the collection
  const { labelMap, keyMap } = useMemo(() => {
    const lm = new Map<string, string>();
    const km = new Map<string, Key>();

    const traverse = (nodes: Iterable<any>) => {
      for (const node of nodes) {
        if (node.type === 'item') {
          const strKey = String(node.key);
          lm.set(strKey, node.textValue || strKey);
          km.set(strKey, node.key);
        } else if (node.childNodes) {
          traverse(node.childNodes);
        }
      }
    };

    traverse(localCollectionState.collection);
    return { labelMap: lm, keyMap: km };
  }, [localCollectionState.collection]);

  // O(1) key mapping via Map (replaces O(n) iteration per key)
  const mappedSelectedKey = useMemo(() => {
    if (selectionMode !== 'single' || effectiveSelectedKey == null) return null;
    const strKey = String(effectiveSelectedKey);
    return keyMap.get(strKey) ?? effectiveSelectedKey;
  }, [selectionMode, effectiveSelectedKey, keyMap]);

  const mappedSelectedKeys = useMemo(() => {
    if (selectionMode !== 'multiple') return undefined;
    if (effectiveSelectedKeys === 'all') return 'all' as const;
    if (Array.isArray(effectiveSelectedKeys)) {
      return effectiveSelectedKeys.map((k) => {
        const strKey = String(k);
        return keyMap.get(strKey) ?? k;
      });
    }
    return effectiveSelectedKeys;
  }, [selectionMode, effectiveSelectedKeys, keyMap]);

  // Memoized label extraction using the labelMap
  const selectedLabels = useMemo(() => {
    if (selectionMode === 'multiple' && effectiveSelectedKeys === 'all') {
      return Array.from(labelMap.values());
    }

    const selectedKeyStrs =
      selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
        ? (effectiveSelectedKeys || []).map(String)
        : effectiveSelectedKey != null
          ? [String(effectiveSelectedKey)]
          : [];

    return selectedKeyStrs.map((k) => labelMap.get(k) ?? k);
  }, [selectionMode, effectiveSelectedKey, effectiveSelectedKeys, labelMap]);

  const hasSelection = selectedLabels.length > 0;

  // Refs for tracking selection state synchronously
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

  useEffect(() => {
    if (!isPopoverOpen) {
      selectionsWhenClosed.current = {
        single:
          effectiveSelectedKey != null ? String(effectiveSelectedKey) : null,
        multiple:
          effectiveSelectedKeys === 'all'
            ? 'all'
            : (effectiveSelectedKeys ?? []).map(String),
      };
    }
  }, [effectiveSelectedKey, effectiveSelectedKeys, isPopoverOpen]);

  // ---------------------------------------------------------------------------
  // Popover lifecycle — all effects moved out of the inline renderTrigger
  // function so they have a stable component identity and don't tear
  // down/setup on every parent re-render.
  // DialogTrigger is controlled via isOpen/onOpenChange.
  // ---------------------------------------------------------------------------

  const handleOpenChange = useEvent((isOpen: boolean) => {
    if (isOpen === isPopoverOpen) return;

    if (isOpen) {
      triggerWidthRef.current =
        triggerRef?.current?.UNSAFE_getDOMNode()?.offsetWidth;
    }
    setIsPopoverOpen(isOpen);
    if (!isOpen) {
      selectionsWhenClosed.current = { ...latestSelectionRef.current };
      cachedItemsOrder.current = null;
      onSearchChange?.('');
    }
    onOpenChange?.(isOpen);
  });

  // Close this picker when another menu opens (event bus)
  useEffect(() => {
    return on('popover:open', (data: { menuId: string }) => {
      if (data.menuId !== filterPickerId && isPopoverOpen) {
        handleOpenChange(false);
      }
    });
  }, [on, filterPickerId, isPopoverOpen, handleOpenChange]);

  // Emit event when this picker opens
  useEffect(() => {
    if (isPopoverOpen) {
      emit('popover:open', { menuId: filterPickerId });
    }
  }, [isPopoverOpen, emit, filterPickerId]);

  // Keyboard handler for arrow keys to open popover
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !isPopoverOpen) {
        e.preventDefault();
        handleOpenChange(true);
      }
    },
  });

  // Clear handler
  const clearValue = useEvent(() => {
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

    handleOpenChange(false);
    triggerRef?.current?.focus?.();
    props.onClear?.();

    return false;
  });

  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------

  // Ref values (selectionsWhenClosed.current) are read synchronously inside
  // the memo body; isPopoverOpen changing triggers recomputation at the right
  // time (the ref is updated before the next render).
  const finalItems = useMemo(() => {
    if (!items) return items;
    if (!sortSelectedToTop) return items;
    if (!isPopoverOpen) return items;
    if (cachedItemsOrder.current) return cachedItemsOrder.current;

    const selectedSet = new Set<string>();

    const addSelected = (key: Key) => {
      if (key != null) selectedSet.add(String(key));
    };

    if (selectionMode === 'multiple') {
      if (selectionsWhenClosed.current.multiple === 'all') {
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

    cachedItemsOrder.current = sorted;

    return sorted;
  }, [items, sortSelectedToTop, selectionMode, isPopoverOpen]);

  // ---------------------------------------------------------------------------
  // Trigger content
  // ---------------------------------------------------------------------------

  const triggerContent = useMemo((): ReactNode => {
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

    if (!hasSelection) {
      return <Text.Placeholder>{placeholder}</Text.Placeholder>;
    } else if (selectionMode === 'single') {
      return selectedLabels[0] || null;
    } else if (effectiveSelectedKeys === 'all') {
      return selectAllLabel;
    } else {
      return selectedLabels.join(', ') || null;
    }
  }, [
    renderSummary,
    selectionMode,
    selectedLabels,
    effectiveSelectedKey,
    effectiveSelectedKeys,
    hasSelection,
    placeholder,
    selectAllLabel,
  ]);

  const showClearButton =
    isClearable && hasSelection && !isDisabled && !props.isReadOnly;

  // Trigger element — plain JSX with no hooks.
  // The element type (ItemButton) is stable so React can reconcile efficiently.
  const triggerElement = (
    <ItemButton
      ref={triggerRef as any}
      data-popover-trigger
      qa={qa || 'FilterPicker'}
      id={id}
      type={type}
      theme={validationState === 'invalid' ? 'danger' : theme}
      size={size}
      shape={shape}
      isDisabled={isDisabled || isLoading}
      data-input-type="filterpicker"
      mods={{
        placeholder: !hasSelection,
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
          <DirectionIcon to={isPopoverOpen ? 'top' : 'bottom'} />
        )
      }
      prefix={prefix}
      suffix={suffix}
      hotkeys={hotkeys}
      tooltip={triggerTooltip}
      description={triggerDescription}
      descriptionPlacement={descriptionPlacement}
      styles={triggerStyles}
      {...keyboardProps}
      aria-label={`${props['aria-label'] ?? props.label ?? ''}`}
    >
      {triggerContent}
    </ItemButton>
  );

  // ---------------------------------------------------------------------------
  // Selection change handler
  // ---------------------------------------------------------------------------

  const handleSelectionChange = useEvent((selection: any) => {
    if (selectionMode === 'single') {
      if (!isControlledSingle) {
        setInternalSelectedKey(selection as Key | null);
      }
    } else {
      if (!isControlledMultiple) {
        let normalized: 'all' | Key[] = selection;

        if (selection === 'all') {
          normalized = 'all';
        } else if (Array.isArray(selection)) {
          normalized = processSelectionArray(selection);
        } else if (
          selection &&
          typeof selection === 'object' &&
          selection instanceof Set
        ) {
          normalized = processSelectionArray(selection as Set<Key>);
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
        selection instanceof Set
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
      handleOpenChange(false);
    }
  });

  // Stable callbacks for popover content (avoid inline closures that change every render)
  const handleEscape = useEvent(() => {
    handleOpenChange(false);
  });

  const handleOptionClick = useEvent((key: Key) => {
    if ((selectionMode === 'multiple' && isCheckable) || key === '__ALL__') {
      handleOpenChange(false);
    }
  });

  const filterPickerField = (
    <FilterPickerWrapper
      qa="FilterPickerWrapper"
      styles={styles}
      {...filterBaseProps(otherProps, { eventProps: true })}
    >
      <DialogTrigger
        isDismissable
        type="popover"
        placement="bottom start"
        isOpen={isPopoverOpen}
        containerPadding={containerPadding}
        shouldFlip={shouldFlip}
        shouldCloseOnInteractOutside={(el) => {
          const menuTriggerEl = el.closest('[data-popover-trigger]');
          if (!menuTriggerEl) return true;
          if (menuTriggerEl === triggerRef?.current?.UNSAFE_getDOMNode())
            return true;
          return false;
        }}
        onOpenChange={handleOpenChange}
      >
        {triggerElement}
        {() => (
          <Dialog
            qa="FilterPickerOverlay"
            display="grid"
            styles={{
              gridRows: '1sf',
              width: 'max($overlay-min-width, 30x) max-content 50vw',
              '$overlay-min-width': '30x',
              ...popoverStyles,
            }}
            style={
              triggerWidthRef.current
                ? ({
                    '--overlay-min-width': `${triggerWidthRef.current}px`,
                  } as any)
                : undefined
            }
          >
            <FocusScope restoreFocus>
              <FilterListBox
                autoFocus
                items={items ? (finalItems as typeof props.items) : undefined}
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
                isLoadingItems={isLoadingItems}
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
                isReorderable={isReorderable}
                onSearchChange={onSearchChange}
                onReorder={onReorder}
                onEscape={handleEscape}
                onOptionClick={handleOptionClick}
                onSelectionChange={handleSelectionChange}
              >
                {
                  (children
                    ? (children as CollectionChildren<T>)
                    : undefined) as CollectionChildren<T>
                }
              </FilterListBox>
            </FocusScope>
          </Dialog>
        )}
      </DialogTrigger>
    </FilterPickerWrapper>
  );

  return wrapWithField<Omit<CubeFilterPickerProps<T>, 'children' | 'tooltip'>>(
    filterPickerField,
    ref as any,
    props,
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
