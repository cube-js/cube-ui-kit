import { CollectionChildren } from '@react-types/shared';
import {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  ReactElement,
  ReactNode,
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
import { CubeListBoxProps, ListBox } from '../ListBox/ListBox';

import type { FieldBaseProps } from '../../../shared';

export interface CubePickerProps<T>
  extends Omit<CubeListBoxProps<T>, 'size' | 'tooltip'>,
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
    labelSuffix,
    shouldFocusWrap,
    children,
    shouldFlip = true,
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

  // Track popover open/close and capture children order for session
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isControlledSingle = selectedKey !== undefined;
  const isControlledMultiple = selectedKeys !== undefined;

  const effectiveSelectedKey = isControlledSingle
    ? selectedKey
    : internalSelectedKey;
  const effectiveSelectedKeys = isControlledMultiple
    ? selectedKeys
    : internalSelectedKeys;

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
  const selectionWhenClosed = useRef<{
    single: string | null;
    multiple: string[];
  }>({ single: null, multiple: [] });

  // Track if sortSelectedToTop was explicitly provided
  const sortSelectedToTopExplicit = sortSelectedToTop !== undefined;
  // Default to true if items are provided, false otherwise
  const shouldSortSelectedToTop = sortSelectedToTop ?? (items ? true : false);

  // Invalidate cache when items change
  useEffect(() => {
    cachedItemsOrder.current = null;
  }, [items]);

  // Capture selection when popover closes
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
      cachedItemsOrder.current = null;
    }
  }, [
    isPopoverOpen,
    effectiveSelectedKey,
    effectiveSelectedKeys,
    selectionMode,
  ]);

  // Sort items with selected on top if enabled
  const getSortedItems = useCallback((): typeof items => {
    if (!items || !shouldSortSelectedToTop) return items;

    // Reuse cached order if available
    if (cachedItemsOrder.current) {
      return cachedItemsOrder.current;
    }

    // Warn if explicitly requested but JSX children used
    if (sortSelectedToTopExplicit && !items) {
      console.warn(
        'Picker: sortSelectedToTop only works with the items prop. ' +
          'Sorting will be skipped when using JSX children.',
      );
      return items;
    }

    const selectedKeys = new Set<string>();

    if (selectionMode === 'multiple') {
      // Don't sort when "all" is selected
      if (
        selectionWhenClosed.current.multiple.length === 0 ||
        effectiveSelectedKeys === 'all'
      ) {
        return items;
      }
      selectionWhenClosed.current.multiple.forEach((k) => selectedKeys.add(k));
    } else if (selectionWhenClosed.current.single) {
      selectedKeys.add(selectionWhenClosed.current.single);
    }

    if (selectedKeys.size === 0) return items;

    const itemsArray = Array.isArray(items) ? items : Array.from(items);
    const selectedItems: T[] = [];
    const unselectedItems: T[] = [];

    itemsArray.forEach((item) => {
      const key = (item as any)?.key ?? (item as any)?.id;
      if (key != null && selectedKeys.has(String(key))) {
        selectedItems.push(item);
      } else {
        unselectedItems.push(item);
      }
    });

    const sorted = [...selectedItems, ...unselectedItems];

    if (isPopoverOpen) {
      cachedItemsOrder.current = sorted;
    }

    return sorted;
  }, [
    items,
    shouldSortSelectedToTop,
    sortSelectedToTopExplicit,
    selectionMode,
    effectiveSelectedKeys,
    isPopoverOpen,
  ]);

  const finalItems = getSortedItems();

  // Create local collection state for reading item data (labels, etc.)
  // This allows us to read item labels even before the popover opens
  const localCollectionState = useListState({
    children,
    items: finalItems, // Use sorted items to match what's shown in popover
    selectionMode: 'none', // Don't manage selection in this state
  });

  // Helper to get label from local collection
  const getItemLabel = useCallback(
    (key: Key): string => {
      const item = localCollectionState?.collection?.getItem(key);
      return item?.textValue || String(key);
    },
    [localCollectionState?.collection],
  );

  const selectedLabels = useMemo(() => {
    const keysToGet =
      selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
        ? effectiveSelectedKeys || []
        : effectiveSelectedKey != null
          ? [effectiveSelectedKey]
          : [];

    // Handle "all" selection
    if (selectionMode === 'multiple' && effectiveSelectedKeys === 'all') {
      if (!localCollectionState?.collection) return [];
      const labels: string[] = [];
      for (const item of localCollectionState.collection) {
        if (item.type === 'item') {
          labels.push(item.textValue || String(item.key));
        }
      }
      return labels;
    }

    // Get labels for selected keys
    return keysToGet.map((key) => getItemLabel(key)).filter(Boolean);
  }, [
    selectionMode,
    effectiveSelectedKeys,
    effectiveSelectedKey,
    getItemLabel,
    localCollectionState?.collection,
  ]);

  const hasSelection = selectedLabels.length > 0;

  const renderTriggerContent = () => {
    // When there is a selection and a custom summary renderer is provided – use it.
    if (hasSelection && typeof renderSummary === 'function') {
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
    } else if (hasSelection && renderSummary === false) {
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

  // The trigger is rendered as a function so we can access the dialog state
  const renderTrigger = (state) => {
    // Listen for other menus opening and close this one if needed
    useEffect(() => {
      const unsubscribe = on('popover:open', (data: { menuId: string }) => {
        // If another menu is opening and this Picker is open, close this one
        if (data.menuId !== pickerId && state.isOpen) {
          state.close();
        }
      });

      return unsubscribe;
    }, [on, pickerId, state]);

    // Emit event when this Picker opens
    useEffect(() => {
      if (state.isOpen) {
        emit('popover:open', { menuId: pickerId });
      }
    }, [state.isOpen, emit, pickerId]);

    // Track popover open/close state to control sorting
    useEffect(() => {
      if (state.isOpen !== isPopoverOpen) {
        setIsPopoverOpen(state.isOpen);
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

      onClear?.();

      return false;
    });

    return (
      <ItemButton
        ref={triggerRef as any}
        data-popover-trigger
        isButton={false}
        id={id}
        qa={qa || 'PickerTrigger'}
        type={type}
        theme={validationState === 'invalid' ? 'danger' : theme}
        size={size}
        isDisabled={isDisabled || isLoading}
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

  const pickerField = (
    <PickerWrapper
      styles={styles}
      {...filterBaseProps(otherProps, { eventProps: true })}
    >
      <DialogTrigger
        type="popover"
        placement="bottom start"
        styles={triggerStyles}
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
            display="grid"
            styles={{
              gridRows: '1sf',
              width: '30x max-content 50vw',
              ...popoverStyles,
            }}
          >
            <FocusScope restoreFocus>
              <ListBox
                autoFocus
                items={items ? (finalItems as typeof props.items) : undefined}
                // Pass an aria-label so the internal ListBox is properly labeled and React Aria doesn't warn.
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
                mods={{
                  popover: true,
                }}
                size="medium"
                showSelectAll={showSelectAll}
                selectAllLabel={selectAllLabel}
                header={header}
                footer={footer}
                headerStyles={headerStyles}
                footerStyles={footerStyles}
                qa={`${props.qa || 'Picker'}ListBox`}
                allValueProps={allValueProps}
                onEscape={() => close()}
                onOptionClick={(key) => {
                  // For Picker, clicking the content area should close the popover
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

                  onSelectionChange?.(selection);

                  if (selectionMode === 'single') {
                    close();
                  }
                }}
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
    mergeProps(
      {
        ...props,
        children: undefined,
        styles: undefined,
      },
      {},
    ),
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
