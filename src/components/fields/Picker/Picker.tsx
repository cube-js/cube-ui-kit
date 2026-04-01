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
  MutableRefObject,
  ReactElement,
  ReactNode,
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
import { CubeListBoxProps, ListBox } from '../ListBox/ListBox';

import type { FieldBaseProps } from '../../../shared';

export interface CubePickerProps<T>
  extends Omit<CubeListBoxProps<T>, 'size' | 'tooltip' | 'shape'>,
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

  /** Ref to access internal ListBox state */
  listStateRef?: MutableRefObject<ListState<T>>;
  /** Additional modifiers for styling the Picker */
  mods?: Record<string, boolean>;
  /** Whether the picker is clearable using a clear button in the rightIcon slot */
  isClearable?: boolean;
  /** Callback called when the clear button is pressed */
  onClear?: () => void;
  /**
   * Sort selected item(s) to the top when the popover opens.
   * Only works when using the `items` prop (data-driven mode).
   * Supports both single and multiple selection modes.
   * @default true when items are provided, false when using JSX children
   */
  sortSelectedToTop?: boolean;
  /** Callback called when the popover open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

const PickerWrapper = tasty({
  qa: 'PickerWrapper',
  styles: {
    display: 'inline-grid',
    flow: 'column',
    gridRows: '1sf',
    placeContent: 'stretch',
    placeItems: 'stretch',
  },
});

export const Picker = forwardRef(function Picker<T extends object>(
  props: CubePickerProps<T>,
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
    id,
    qa,
    label,
    extra,
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
    renderSummary,
    isCheckable,
    allValueProps,
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
    onClear,
    sortSelectedToTop,
    onOpenChange,
    listStateRef: externalListStateRef,
    ...otherProps
  } = props;

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  // Generate a unique ID for this Picker instance
  const pickerId = useMemo(() => generateRandomId(), []);

  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  // Warn if isCheckable is false in single selection mode
  useWarn(isCheckable === false && selectionMode === 'single', {
    key: ['picker-checkable-single-mode'],
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

  // Popover state — used as controlled prop for DialogTrigger
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const triggerRef = useRef<FocusableRefValue<HTMLButtonElement>>(null);
  // Measured lazily on popover open instead of on every render
  const triggerWidthRef = useRef<number | undefined>(undefined);

  const isControlledSingle = selectedKey !== undefined;
  const isControlledMultiple = selectedKeys !== undefined;

  const effectiveSelectedKey = isControlledSingle
    ? selectedKey
    : internalSelectedKey;
  const effectiveSelectedKeys = isControlledMultiple
    ? selectedKeys
    : internalSelectedKeys;

  // Ref to access internal ListBox state for collection API
  const internalListStateRef = useRef<ListState<T>>(null);

  // Sync internal ref with external ref if provided
  useEffect(() => {
    if (externalListStateRef && internalListStateRef.current) {
      externalListStateRef.current = internalListStateRef.current;
    }
  }, [externalListStateRef]);

  // Cache for sorted items array when using `items` prop
  const cachedItemsOrder = useRef<T[] | null>(null);

  const latestSelectionRef = useRef<{
    single: string | null;
    multiple: string[];
  }>({
    single: effectiveSelectedKey != null ? String(effectiveSelectedKey) : null,
    multiple:
      selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
        ? (effectiveSelectedKeys || []).map(String)
        : [],
  });

  useEffect(() => {
    latestSelectionRef.current = {
      single:
        effectiveSelectedKey != null ? String(effectiveSelectedKey) : null,
      multiple:
        selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
          ? (effectiveSelectedKeys || []).map(String)
          : [],
    };
  }, [effectiveSelectedKey, effectiveSelectedKeys, selectionMode]);

  const selectionWhenClosed = useRef<{
    single: string | null;
    multiple: string[];
  }>({ single: null, multiple: [] });

  const sortSelectedToTopExplicit = sortSelectedToTop !== undefined;
  const shouldSortSelectedToTop = sortSelectedToTop ?? (items ? true : false);

  useWarn(sortSelectedToTopExplicit && shouldSortSelectedToTop && !items, {
    key: ['picker-sort-selected-to-top-children'],
    args: [
      'Picker: sortSelectedToTop only works with the items prop. Sorting will be skipped when using JSX children.',
    ],
  });

  useEffect(() => {
    cachedItemsOrder.current = null;
  }, [items]);

  useEffect(() => {
    if (!isPopoverOpen) {
      selectionWhenClosed.current = {
        single:
          effectiveSelectedKey != null ? String(effectiveSelectedKey) : null,
        multiple:
          selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
            ? (effectiveSelectedKeys || []).map(String)
            : [],
      };
    }
  }, [
    effectiveSelectedKey,
    effectiveSelectedKeys,
    isPopoverOpen,
    selectionMode,
  ]);

  const finalItems = useMemo(() => {
    if (!items || !shouldSortSelectedToTop) return items;
    if (!isPopoverOpen) return items;
    if (cachedItemsOrder.current) return cachedItemsOrder.current;

    const selectedKeySet = new Set<string>();

    if (selectionMode === 'multiple') {
      if (
        selectionWhenClosed.current.multiple.length === 0 ||
        effectiveSelectedKeys === 'all'
      ) {
        return items;
      }
      selectionWhenClosed.current.multiple.forEach((k) =>
        selectedKeySet.add(k),
      );
    } else if (selectionWhenClosed.current.single) {
      selectedKeySet.add(selectionWhenClosed.current.single);
    }

    if (selectedKeySet.size === 0) return items;

    const itemsArray = Array.isArray(items) ? items : Array.from(items);
    const selectedItems: T[] = [];
    const unselectedItems: T[] = [];

    itemsArray.forEach((item) => {
      const key = (item as any)?.key ?? (item as any)?.id;
      if (key != null && selectedKeySet.has(String(key))) {
        selectedItems.push(item);
      } else {
        unselectedItems.push(item);
      }
    });

    const sorted = [...selectedItems, ...unselectedItems];

    cachedItemsOrder.current = sorted;

    return sorted;
  }, [items, shouldSortSelectedToTop, selectionMode, isPopoverOpen]);

  // Create local collection state for reading item data (labels, etc.)
  // This allows us to read item labels even before the popover opens
  const localCollectionState = useListState({
    children,
    items: finalItems, // Use sorted items to match what's shown in popover
    selectionMode: 'none', // Don't manage selection in this state
  });

  const selectedLabels = useMemo(() => {
    const collection = localCollectionState?.collection;

    if (selectionMode === 'multiple' && effectiveSelectedKeys === 'all') {
      if (!collection) return [];
      const labels: string[] = [];
      for (const item of collection) {
        if (item.type === 'item') {
          labels.push(item.textValue || String(item.key));
        }
      }
      return labels;
    }

    const keysToGet =
      selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
        ? effectiveSelectedKeys || []
        : effectiveSelectedKey != null
          ? [effectiveSelectedKey]
          : [];

    return keysToGet
      .map((key) => {
        const item = collection?.getItem(key);
        return item?.textValue || String(key);
      })
      .filter(Boolean);
  }, [
    selectionMode,
    effectiveSelectedKeys,
    effectiveSelectedKey,
    localCollectionState?.collection,
  ]);

  const hasSelection = selectedLabels.length > 0;

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
      selectionWhenClosed.current = { ...latestSelectionRef.current };
      cachedItemsOrder.current = null;
    }
    onOpenChange?.(isOpen);
  });

  // Close this picker when another menu opens (event bus)
  useEffect(() => {
    return on('popover:open', (data: { menuId: string }) => {
      if (data.menuId !== pickerId && isPopoverOpen) {
        handleOpenChange(false);
      }
    });
  }, [on, pickerId, isPopoverOpen, handleOpenChange]);

  // Emit event when this picker opens
  useEffect(() => {
    if (isPopoverOpen) {
      emit('popover:open', { menuId: pickerId });
    }
  }, [isPopoverOpen, emit, pickerId]);

  // Position update management
  const [shouldUpdatePosition, setShouldUpdatePosition] = useState(true);

  useEffect(() => {
    if (isPopoverOpen) {
      setShouldUpdatePosition(true);
      const timerId = window.setTimeout(
        () => setShouldUpdatePosition(false),
        160,
      );
      return () => window.clearTimeout(timerId);
    } else {
      setShouldUpdatePosition(true);
    }
  }, [isPopoverOpen]);

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
    onClear?.();

    return false;
  });

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
  const triggerElement = (
    <ItemButton
      ref={triggerRef as any}
      data-popover-trigger
      id={id}
      qa={qa || 'PickerTrigger'}
      type={type}
      theme={validationState === 'invalid' ? 'danger' : theme}
      size={size}
      shape={shape}
      isDisabled={isDisabled || isLoading}
      data-input-type="picker"
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
            qa="PickerClearButton"
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

    if (selectionMode === 'single') {
      latestSelectionRef.current.single =
        selection != null ? String(selection) : null;
    } else {
      if (selection === 'all') {
        latestSelectionRef.current.multiple = [];
      } else if (Array.isArray(selection)) {
        latestSelectionRef.current.multiple = processSelectionArray(selection);
      } else if (
        selection &&
        typeof selection === 'object' &&
        selection instanceof Set
      ) {
        latestSelectionRef.current.multiple = processSelectionArray(
          selection as Set<Key>,
        );
      } else {
        latestSelectionRef.current.multiple = [];
      }
    }

    onSelectionChange?.(selection);

    if (selectionMode === 'single') {
      handleOpenChange(false);
    }
  });

  const handleEscape = useEvent(() => {
    handleOpenChange(false);
  });

  const handleOptionClick = useEvent((key: Key) => {
    if ((selectionMode === 'multiple' && isCheckable) || key === '__ALL__') {
      handleOpenChange(false);
    }
  });

  const pickerField = (
    <PickerWrapper
      styles={styles}
      {...filterBaseProps(otherProps, { eventProps: true })}
    >
      <DialogTrigger
        isDismissable
        type="popover"
        placement="bottom start"
        isOpen={isPopoverOpen}
        containerPadding={containerPadding}
        shouldUpdatePosition={shouldUpdatePosition}
        shouldFlip={shouldFlip && shouldUpdatePosition}
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
            qa="PickerOverlay"
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
              <ListBox
                autoFocus
                items={items ? (finalItems as typeof props.items) : undefined}
                aria-label={`${props['aria-label'] ?? props.label ?? ''} Picker`}
                selectedKey={
                  selectionMode === 'single' ? effectiveSelectedKey : undefined
                }
                selectedKeys={
                  selectionMode === 'multiple'
                    ? effectiveSelectedKeys
                    : undefined
                }
                listStyles={listStyles}
                optionStyles={optionStyles}
                sectionStyles={sectionStyles}
                headingStyles={headingStyles}
                listRef={listRef}
                disallowEmptySelection={disallowEmptySelection}
                disabledKeys={disabledKeys}
                focusOnHover={focusOnHover}
                shouldFocusWrap={shouldFocusWrap}
                selectionMode={selectionMode}
                validationState={validationState}
                isDisabled={isDisabled}
                isLoading={isLoading}
                stateRef={internalListStateRef}
                isCheckable={isCheckable}
                shape="popover"
                size="medium"
                showSelectAll={showSelectAll}
                selectAllLabel={selectAllLabel}
                header={header}
                footer={footer}
                headerStyles={headerStyles}
                footerStyles={footerStyles}
                qa={`${props.qa || 'Picker'}ListBox`}
                allValueProps={allValueProps}
                onEscape={handleEscape}
                onOptionClick={handleOptionClick}
                onSelectionChange={handleSelectionChange}
              >
                {children as CollectionChildren<T>}
              </ListBox>
            </FocusScope>
          </Dialog>
        )}
      </DialogTrigger>
    </PickerWrapper>
  );

  return wrapWithField<Omit<CubePickerProps<T>, 'children' | 'tooltip'>>(
    pickerField,
    ref as any,
    props,
  );
}) as unknown as (<T>(
  props: CubePickerProps<T> & { ref?: ForwardedRef<HTMLElement> },
) => ReactElement) & { Item: typeof ListBox.Item; Section: typeof BaseSection };

Picker.Item = ListBox.Item;

Picker.Section = BaseSection;

Object.defineProperty(Picker, 'cubeInputType', {
  value: 'Picker',
  enumerable: false,
  configurable: false,
});
