import { Key } from '@react-types/shared';
import React, {
  Children,
  cloneElement,
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
import {
  useFilter,
  useKeyboard,
  useOverlay,
  useOverlayPosition,
} from 'react-aria';
import { Section as BaseSection, Item } from 'react-stately';

import { useEvent } from '../../../_internal';
import { CloseIcon, DownIcon, LoadingIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { generateRandomId } from '../../../utils/random';
import {
  mergeProps,
  useCombinedRefs,
  useLayoutEffect,
} from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { useEventBus } from '../../../utils/react/useEventBus';
import { ItemAction } from '../../actions';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { CubeItemProps } from '../../Item';
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
import { ListBox } from '../ListBox/ListBox';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

type FilterFn = (textValue: string, inputValue: string) => boolean;

export type PopoverTriggerAction = 'focus' | 'input' | 'manual';

const ComboBoxWrapperElement = tasty({
  styles: INPUT_WRAPPER_STYLES,
});

const InputElement = tasty({
  as: 'input',
  styles: DEFAULT_INPUT_STYLES,
});

const ComboBoxOverlayElement = tasty({
  qa: 'ComboBoxOverlay',
  styles: {
    display: 'grid',
    gridRows: '1sf',
    width: '30x max-content 50vw',
    maxHeight: '50vh',
    overflow: 'auto',
    background: '#white',
    radius: '1cr',
    shadow: '0px .5x 2x #shadow',
    padding: '0',
    border: '#dark.08',
    outline: '#purple-03.0',
  },
});

export interface CubeComboBoxProps<T>
  extends BasePropsWithoutChildren,
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps,
    FieldBaseProps {
  /** The selected key in controlled mode */
  selectedKey?: string | null;
  /** The default selected key in uncontrolled mode */
  defaultSelectedKey?: string | null;
  /** Callback fired when selection changes */
  onSelectionChange?: (key: string | null) => void;

  /** The input value in controlled mode */
  inputValue?: string;
  /** Callback fired when input value changes */
  onInputChange?: (value: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input should have autofocus */
  autoFocus?: boolean;

  /** Popover trigger behavior: 'focus', 'input', or 'manual'. Defaults to 'input' */
  popoverTrigger?: PopoverTriggerAction;

  /** Items for the listbox (alternative to children) */
  items?: Iterable<T>;
  /** Children for the listbox (static items or render function) */
  children?: ReactNode | ((item: T) => ReactElement);

  /**
   * Custom filter function for determining if an option should be included.
   * Pass `false` to disable internal filtering completely.
   */
  filter?: FilterFn | false;

  /** Whether to allow entering custom values that are not in the predefined options */
  allowsCustomValue?: boolean;
  /** Whether the combobox is clearable using ESC key or clear button */
  isClearable?: boolean;
  /** Callback called when the clear button is pressed */
  onClear?: () => void;

  /** Left input icon */
  icon?: ReactElement;
  /** Input decoration before the main input */
  prefix?: ReactNode;
  /** Input decoration after the main input */
  suffix?: ReactNode;
  /** Whether to hide the trigger button */
  hideTrigger?: boolean;
  /** Size of the combobox */
  size?: 'small' | 'medium' | 'large' | (string & {});

  /** Ref for accessing the input element */
  inputRef?: RefObject<HTMLInputElement>;
  /** Ref for accessing the wrapper element */
  wrapperRef?: RefObject<HTMLDivElement>;
  /** Ref for accessing the listbox element */
  listBoxRef?: RefObject<HTMLDivElement>;
  /** Ref for accessing the popover element */
  popoverRef?: RefObject<HTMLDivElement>;
  /** Ref for accessing the trigger button element */
  triggerRef?: RefObject<HTMLButtonElement>;

  /** Custom styles for the input */
  inputStyles?: Styles;
  /** Custom styles for the input wrapper */
  wrapperStyles?: Styles;
  /** Custom styles for the trigger button */
  triggerStyles?: Styles;
  /** Custom styles for the listbox */
  listBoxStyles?: Styles;
  /** Custom styles for the popover overlay */
  overlayStyles?: Styles;
  /** Custom styles for individual options */
  optionStyles?: Styles;
  /** Custom styles for sections */
  sectionStyles?: Styles;
  /** Custom styles for section headings */
  headingStyles?: Styles;

  /** Whether the combobox is disabled */
  isDisabled?: boolean;
  /** Whether the combobox is in loading state */
  isLoading?: boolean;
  /** Validation state of the combobox */
  validationState?: 'valid' | 'invalid';
  /** Custom label to display when no results are found after filtering */
  emptyLabel?: ReactNode;
  /** Keys of disabled items */
  disabledKeys?: Iterable<Key>;
  /** Whether to flip the popover placement */
  shouldFlip?: boolean;
  /** Placement direction for the popover */
  direction?: 'bottom' | 'top';
  /** Offset for the popover */
  overlayOffset?: number;
  /** Whether the combobox is read-only */
  isReadOnly?: boolean;
  /** Suffix position goes before or after the validation and loading statuses */
  suffixPosition?: 'before' | 'after';

  /**
   * Props to apply to existing custom values.
   */
  customValueProps?: Partial<CubeItemProps<T>>;

  /**
   * Props to apply to new custom values.
   */
  newCustomValueProps?: Partial<CubeItemProps<T>>;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

// ============================================================================
// Hook: useComboBoxState
// ============================================================================
interface UseComboBoxStateProps {
  selectedKey?: string | null;
  defaultSelectedKey?: string | null;
  inputValue?: string;
  comboBoxId: string;
}

interface UseComboBoxStateReturn {
  effectiveSelectedKey: Key | null;
  effectiveInputValue: string;
  isPopoverOpen: boolean;
  setIsPopoverOpen: (open: boolean) => void;
  setInternalSelectedKey: (key: Key | null) => void;
  setInternalInputValue: (value: string) => void;
  isControlledKey: boolean;
  isControlledInput: boolean;
}

function useComboBoxState({
  selectedKey,
  defaultSelectedKey,
  inputValue,
  comboBoxId,
}: UseComboBoxStateProps): UseComboBoxStateReturn {
  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  // Internal state for uncontrolled mode
  const [internalSelectedKey, setInternalSelectedKey] = useState<Key | null>(
    defaultSelectedKey ?? null,
  );
  const [internalInputValue, setInternalInputValue] = useState('');

  const isControlledKey = selectedKey !== undefined;
  const isControlledInput = inputValue !== undefined;

  const effectiveSelectedKey = isControlledKey
    ? selectedKey
    : internalSelectedKey;
  const effectiveInputValue = isControlledInput
    ? inputValue
    : internalInputValue;

  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Listen for other menus opening and close this one if needed
  useEffect(() => {
    const unsubscribe = on('popover:open', (data: { menuId: string }) => {
      if (data.menuId !== comboBoxId && isPopoverOpen) {
        setIsPopoverOpen(false);
      }
    });

    return unsubscribe;
  }, [on, comboBoxId, isPopoverOpen]);

  // Emit event when this combobox opens
  useEffect(() => {
    if (isPopoverOpen) {
      emit('popover:open', { menuId: comboBoxId });
    }
  }, [isPopoverOpen, emit, comboBoxId]);

  return {
    effectiveSelectedKey,
    effectiveInputValue,
    isPopoverOpen,
    setIsPopoverOpen,
    setInternalSelectedKey,
    setInternalInputValue,
    isControlledKey,
    isControlledInput,
  };
}

// ============================================================================
// Hook: useComboBoxFiltering
// ============================================================================
interface UseComboBoxFilteringProps {
  children: ReactNode;
  effectiveInputValue: string;
  filter: FilterFn | false | undefined;
}

interface UseComboBoxFilteringReturn {
  filteredChildren: ReactNode;
  isFilterActive: boolean;
  setIsFilterActive: (active: boolean) => void;
}

function useComboBoxFiltering({
  children,
  effectiveInputValue,
  filter,
}: UseComboBoxFilteringProps): UseComboBoxFilteringReturn {
  const [isFilterActive, setIsFilterActive] = useState(false);

  const { contains } = useFilter({ sensitivity: 'base' });

  const textFilterFn = useMemo<FilterFn>(
    () => (filter === false ? () => true : filter || contains),
    [filter, contains],
  );

  // Filter children based on input value
  const filteredChildren = useMemo(() => {
    const term = effectiveInputValue.trim();

    if (!isFilterActive || !term || !children) {
      return children;
    }

    const nodeMatches = (node: any): boolean => {
      if (!node?.props) return false;

      const textValue =
        node.props.textValue ||
        (typeof node.props.children === 'string' ? node.props.children : '') ||
        String(node.props.children || '');

      return textFilterFn(textValue, term);
    };

    const filterChildren = (childNodes: ReactNode): ReactNode => {
      if (!childNodes) return null;

      const childArray = Array.isArray(childNodes) ? childNodes : [childNodes];
      const filteredNodes: ReactNode[] = [];

      childArray.forEach((child: any) => {
        if (!child || typeof child !== 'object') {
          return;
        }

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
            filteredNodes.push(
              cloneElement(child, {
                key: child.key,
                children: filteredSectionChildren,
              }),
            );
          }
        } else if (child.type === Item) {
          if (nodeMatches(child)) {
            filteredNodes.push(child);
          }
        } else if (nodeMatches(child)) {
          filteredNodes.push(child);
        }
      });

      return filteredNodes;
    };

    return filterChildren(children);
  }, [isFilterActive, children, effectiveInputValue, textFilterFn]);

  return {
    filteredChildren,
    isFilterActive,
    setIsFilterActive,
  };
}

// ============================================================================
// Hook: useComboBoxKeyboard
// ============================================================================
interface UseComboBoxKeyboardProps {
  isPopoverOpen: boolean;
  listStateRef: RefObject<any>;
  hasResults: boolean;
  allowsCustomValue?: boolean;
  effectiveInputValue: string;
  isClearable?: boolean;
  onSelectionChange: (selection: Key | Key[] | null) => void;
  onClearValue: () => void;
  onOpenPopover: () => void;
  onClosePopover: () => void;
  inputRef: RefObject<HTMLInputElement>;
}

function useComboBoxKeyboard({
  isPopoverOpen,
  listStateRef,
  hasResults,
  allowsCustomValue,
  effectiveInputValue,
  isClearable,
  onSelectionChange,
  onClearValue,
  onOpenPopover,
  onClosePopover,
  inputRef,
}: UseComboBoxKeyboardProps) {
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        // Open popover if closed
        if (!isPopoverOpen) {
          onOpenPopover();
          return;
        }

        const listState = listStateRef.current;
        if (!listState) return;

        const { selectionManager, collection, disabledKeys } = listState;

        // Helper to collect visible item keys (supports sections)
        const collectVisibleKeys = (nodes: Iterable<any>, out: Key[]) => {
          for (const node of nodes) {
            if (node.type === 'item') {
              if (!disabledKeys?.has(node.key)) {
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
        const currentKey = selectionManager.focusedKey;

        let nextKey: Key | null = null;

        if (currentKey == null) {
          nextKey = isArrowDown
            ? visibleKeys[0]
            : visibleKeys[visibleKeys.length - 1];
        } else {
          const currentIndex = visibleKeys.indexOf(currentKey);
          if (currentIndex !== -1) {
            const newIndex = currentIndex + (isArrowDown ? 1 : -1);
            if (newIndex >= 0 && newIndex < visibleKeys.length) {
              nextKey = visibleKeys[newIndex];
            }
          } else {
            nextKey = isArrowDown
              ? visibleKeys[0]
              : visibleKeys[visibleKeys.length - 1];
          }
        }

        if (nextKey != null) {
          if (listState.lastFocusSourceRef) {
            listState.lastFocusSourceRef.current = 'keyboard';
          }
          selectionManager.setFocusedKey(nextKey);
        }
      } else if (e.key === 'Enter') {
        if (!hasResults) {
          e.preventDefault();

          if (allowsCustomValue) {
            const value = effectiveInputValue;

            onSelectionChange(
              (value as unknown as Key) ?? (null as unknown as Key),
            );
          } else {
            onSelectionChange(null);
          }

          return;
        }

        if (isPopoverOpen) {
          const listState = listStateRef.current;
          if (!listState) return;

          const keyToSelect = listState.selectionManager.focusedKey;

          if (keyToSelect != null) {
            e.preventDefault();
            listState.selectionManager.select(keyToSelect, e);
            // Ensure the popover closes even if selection stays the same
            onClosePopover();
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }
      } else if (e.key === 'Escape') {
        if (isPopoverOpen) {
          e.preventDefault();
          onClosePopover();
          inputRef.current?.focus();
        } else if (effectiveInputValue && isClearable) {
          e.preventDefault();
          onClearValue();
        }
      } else if (e.key === 'Home' || e.key === 'End') {
        if (isPopoverOpen) {
          e.preventDefault();

          const listState = listStateRef.current;
          if (!listState) return;

          const { selectionManager, collection, disabledKeys } = listState;

          // Helper to collect visible item keys (supports sections)
          const collectVisibleKeys = (nodes: Iterable<any>, out: Key[]) => {
            for (const node of nodes) {
              if (node.type === 'item') {
                if (!disabledKeys?.has(node.key)) {
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

          const targetKey =
            e.key === 'Home'
              ? visibleKeys[0]
              : visibleKeys[visibleKeys.length - 1];

          if (listState.lastFocusSourceRef) {
            listState.lastFocusSourceRef.current = 'keyboard';
          }
          selectionManager.setFocusedKey(targetKey);
        }
      }
    },
  });

  return { keyboardProps };
}

// ============================================================================
// Component: ComboBoxInput
// ============================================================================
interface ComboBoxInputProps {
  inputRef: RefObject<HTMLInputElement>;
  value: string;
  placeholder?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  autoFocus?: boolean;
  size: string;
  mods: Record<string, any>;
  inputStyles?: Styles;
  keyboardProps: any;
  focusProps: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  isPopoverOpen: boolean;
  hasResults: boolean;
  comboBoxId: string;
  listStateRef: RefObject<any>;
}

const ComboBoxInput = forwardRef<HTMLInputElement, ComboBoxInputProps>(
  function ComboBoxInput(
    {
      inputRef,
      value,
      placeholder,
      isDisabled,
      isReadOnly,
      autoFocus,
      size,
      mods,
      inputStyles,
      keyboardProps,
      focusProps,
      onChange,
      onFocus,
      isPopoverOpen,
      hasResults,
      comboBoxId,
      listStateRef,
    },
    ref,
  ) {
    const combinedRef = useCombinedRefs(ref, inputRef);

    return (
      <InputElement
        ref={combinedRef}
        qa="Input"
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadOnly}
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? '' : undefined}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={focusProps.onBlur}
        {...keyboardProps}
        styles={inputStyles}
        mods={mods}
        data-size={size}
        role="combobox"
        aria-expanded={isPopoverOpen && hasResults}
        aria-haspopup="listbox"
        aria-controls={
          isPopoverOpen && hasResults
            ? `ComboBoxListBox-${comboBoxId}`
            : undefined
        }
        aria-activedescendant={
          isPopoverOpen &&
          hasResults &&
          listStateRef.current?.selectionManager.focusedKey != null
            ? `ListBoxItem-${listStateRef.current?.selectionManager.focusedKey}`
            : undefined
        }
      />
    );
  },
);

// ============================================================================
// Component: ComboBoxOverlay
// ============================================================================
interface ComboBoxOverlayProps {
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement>;
  popoverRef: RefObject<HTMLDivElement>;
  listBoxRef: RefObject<HTMLDivElement>;
  direction: 'bottom' | 'top';
  shouldFlip: boolean;
  overlayOffset: number;
  comboBoxWidth?: number;
  comboBoxId: string;
  overlayStyles?: Styles;
  listBoxStyles?: Styles;
  optionStyles?: Styles;
  sectionStyles?: Styles;
  headingStyles?: Styles;
  effectiveSelectedKey: Key | null;
  isDisabled?: boolean;
  disabledKeys?: Iterable<Key>;
  items?: Iterable<any>;
  children: ReactNode;
  listStateRef: RefObject<any>;
  onSelectionChange: (selection: Key | Key[] | null) => void;
  onClose: () => void;
  label?: ReactNode;
  ariaLabel?: string;
}

function ComboBoxOverlay({
  isOpen,
  triggerRef,
  popoverRef,
  listBoxRef,
  direction,
  shouldFlip,
  overlayOffset,
  comboBoxWidth,
  comboBoxId,
  overlayStyles,
  listBoxStyles,
  optionStyles,
  sectionStyles,
  headingStyles,
  effectiveSelectedKey,
  isDisabled,
  disabledKeys,
  items,
  children,
  listStateRef,
  onSelectionChange,
  onClose,
  label,
  ariaLabel,
}: ComboBoxOverlayProps) {
  // Overlay positioning
  const {
    overlayProps: overlayPositionProps,
    placement,
    updatePosition,
  } = useOverlayPosition({
    targetRef: triggerRef as any,
    overlayRef: popoverRef as any,
    placement: `${direction} start` as any,
    shouldFlip,
    isOpen,
    offset: overlayOffset,
  });

  // Overlay behavior (dismiss on outside click, escape)
  const { overlayProps: overlayBehaviorProps } = useOverlay(
    {
      onClose,
      shouldCloseOnBlur: true,
      isOpen,
      isDismissable: true,
      shouldCloseOnInteractOutside: (el) => {
        const menuTriggerEl = el.closest('[data-popover-trigger]');
        if (!menuTriggerEl) return true;
        if (menuTriggerEl === triggerRef?.current) return true;
        return false;
      },
    },
    popoverRef as any,
  );

  // Update position when overlay opens
  useLayoutEffect(() => {
    if (isOpen) {
      // Use double RAF to ensure layout is complete before positioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePosition?.();
        });
      });
    }
  }, [isOpen, updatePosition]);

  if (!isOpen) return null;

  return (
    <OverlayWrapper isOpen placement={placement as any}>
      <ComboBoxOverlayElement
        {...mergeProps(overlayPositionProps, overlayBehaviorProps)}
        ref={popoverRef as any}
        styles={overlayStyles}
        style={{
          minWidth: comboBoxWidth ? `${comboBoxWidth}px` : undefined,
          ...overlayPositionProps.style,
        }}
      >
        <ListBox
          ref={listBoxRef}
          focusOnHover
          disableSelectionToggle
          id={`ComboBoxListBox-${comboBoxId}`}
          aria-label={
            ariaLabel || (typeof label === 'string' ? label : 'Options')
          }
          selectedKey={effectiveSelectedKey}
          selectionMode="single"
          isDisabled={isDisabled}
          disabledKeys={disabledKeys}
          shouldUseVirtualFocus={true}
          items={items as any}
          styles={listBoxStyles}
          optionStyles={optionStyles}
          sectionStyles={sectionStyles}
          headingStyles={headingStyles}
          stateRef={listStateRef}
          mods={{
            popover: true,
          }}
          onSelectionChange={onSelectionChange}
        >
          {children as any}
        </ListBox>
      </ComboBoxOverlayElement>
    </OverlayWrapper>
  );
}

// ============================================================================
// Main Component: ComboBox
// ============================================================================
export const ComboBox = forwardRef(function ComboBox<T extends object>(
  props: CubeComboBoxProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => {
      return {
        selectedKey: !props.allowsCustomValue ? value ?? null : undefined,
        inputValue: props.allowsCustomValue ? value ?? '' : undefined,
        onInputChange(val) {
          if (!props.allowsCustomValue) {
            return;
          }

          onChange(val);
        },
        onSelectionChange(val: string | null) {
          if (val == null && props.allowsCustomValue) {
            return;
          }

          onChange(val);
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
    icon,
    prefix,
    isDisabled,
    autoFocus,
    wrapperRef,
    inputRef,
    triggerRef,
    popoverRef,
    listBoxRef,
    isLoading,
    inputStyles,
    optionStyles,
    triggerStyles,
    listBoxStyles,
    overlayStyles,
    wrapperStyles,
    suffix,
    hideTrigger,
    message,
    description,
    size = 'medium',
    direction = 'bottom',
    shouldFlip = true,
    popoverTrigger = 'input',
    suffixPosition = 'before',
    filter,
    styles,
    labelSuffix,
    selectedKey,
    defaultSelectedKey,
    inputValue,
    onInputChange,
    isClearable,
    onClear,
    placeholder,
    allowsCustomValue,
    emptyLabel,
    items,
    children: renderChildren,
    customValueProps,
    newCustomValueProps,
    sectionStyles,
    headingStyles,
    isReadOnly,
    overlayOffset = 8,
    onSelectionChange: externalOnSelectionChange,
    ...otherProps
  } = props;

  // Generate a unique ID for this combobox instance
  const comboBoxId = useMemo(() => generateRandomId(), []);

  // State management hook
  const {
    effectiveSelectedKey,
    effectiveInputValue,
    isPopoverOpen,
    setIsPopoverOpen,
    setInternalSelectedKey,
    setInternalInputValue,
    isControlledKey,
    isControlledInput,
  } = useComboBoxState({
    selectedKey,
    defaultSelectedKey,
    inputValue,
    comboBoxId,
  });

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  wrapperRef = useCombinedRefs(wrapperRef);
  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  popoverRef = useCombinedRefs(popoverRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  // Preserve the original `children` (may be a render function) before we
  // potentially overwrite it.
  let children: ReactNode = renderChildren as ReactNode;

  const renderFn = renderChildren as unknown;

  if (items && typeof renderFn === 'function') {
    try {
      const itemsArray = Array.from(items as Iterable<any>);
      children = itemsArray.map((item, idx) => {
        const rendered = (renderFn as (it: any) => ReactNode)(item);
        if (
          React.isValidElement(rendered) &&
          (rendered as ReactElement).key == null
        ) {
          return React.cloneElement(rendered as ReactElement, {
            key: (rendered as any)?.key ?? item?.key ?? idx,
          });
        }

        return rendered as ReactNode;
      });
    } catch {
      // If conversion fails, proceed with the original children
    }
  }

  // Filtering hook
  const { filteredChildren, isFilterActive, setIsFilterActive } =
    useComboBoxFiltering({
      children,
      effectiveInputValue,
      filter,
    });

  const { isFocused, focusProps } = useFocus({ isDisabled });

  let isInvalid = validationState === 'invalid';

  let validationIcon = isInvalid ? InvalidIcon : ValidIcon;
  let validation = cloneElement(validationIcon);

  // Ref to access internal ListBox state
  const listStateRef = useRef<any>(null);
  const focusInitAttemptsRef = useRef(0);

  // Find item by key to get its label
  const findItemByKey = useCallback(
    (key: Key): any => {
      let foundItem: any = null;

      const traverse = (nodes: ReactNode): void => {
        Children.forEach(nodes, (child: any) => {
          if (!child || typeof child !== 'object') return;

          if (child.type === Item && String(child.key) === String(key)) {
            foundItem = child;
          }

          if (child.props?.children) {
            traverse(child.props.children);
          }
        });
      };

      if (children) traverse(children);

      return foundItem;
    },
    [children],
  );

  // Selection change handler
  const handleSelectionChange = useEvent((selection: Key | Key[] | null) => {
    // Extract single key from selection (we only support single selection)
    const key = Array.isArray(selection) ? selection[0] : selection;

    // Update selected key
    if (!isControlledKey) {
      setInternalSelectedKey(key ?? null);
    }

    // Update input value to show selected item label
    if (key != null) {
      setIsFilterActive(false);

      const selectedItem = findItemByKey(key);
      const label =
        selectedItem?.props?.textValue ||
        (typeof selectedItem?.props?.children === 'string'
          ? selectedItem.props.children
          : '') ||
        String(key);

      if (!isControlledInput) {
        setInternalInputValue(label);
      }
      onInputChange?.(label);
    } else {
      // Clear input when selection is cleared
      if (!isControlledInput) {
        setInternalInputValue('');
      }
      onInputChange?.('');
      setIsFilterActive(false);
    }

    externalOnSelectionChange?.(key as string | null);

    // Close popover after selection
    setIsPopoverOpen(false);

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  });

  // Input change handler
  const handleInputChange = useEvent(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Update input value
      if (!isControlledInput) {
        setInternalInputValue(value);
      }
      onInputChange?.(value);

      const trimmed = value.trim();
      setIsFilterActive(trimmed.length > 0);

      // Clear selection when input changes
      if (effectiveSelectedKey != null) {
        if (!isControlledKey) {
          setInternalSelectedKey(null);
        }
        externalOnSelectionChange?.(null);
      }

      // Open popover based on trigger
      if (popoverTrigger === 'input' && value && !isPopoverOpen) {
        setIsPopoverOpen(true);
      }
    },
  );

  // Sync input value with selected key in controlled mode
  useEffect(() => {
    // Only sync when input is not controlled to avoid overriding controlled input
    if (isControlledInput) return;

    if (effectiveSelectedKey != null) {
      const selectedItem = findItemByKey(effectiveSelectedKey);
      const label =
        selectedItem?.props?.textValue ||
        (typeof selectedItem?.props?.children === 'string'
          ? selectedItem.props.children
          : '') ||
        String(effectiveSelectedKey);

      setInternalInputValue(label);
    } else {
      setInternalInputValue('');
    }
  }, [effectiveSelectedKey, findItemByKey, isControlledInput, children]);

  // Input focus handler
  const handleInputFocus = useEvent((e: React.FocusEvent<HTMLInputElement>) => {
    // Call focus props handler if it exists
    focusProps.onFocus?.(e as any);

    if (popoverTrigger === 'focus' && !isPopoverOpen) {
      setIsPopoverOpen(true);
    }
  });

  // Clear button logic
  let hasValue = allowsCustomValue
    ? effectiveInputValue !== ''
    : effectiveSelectedKey != null;
  let showClearButton = isClearable && hasValue && !isDisabled && !isReadOnly;

  const hasResults = Boolean(
    filteredChildren &&
      (Array.isArray(filteredChildren)
        ? filteredChildren.length > 0
        : filteredChildren !== null),
  );

  // Clear function
  let clearValue = useEvent(() => {
    // Clear input
    if (!isControlledInput) {
      setInternalInputValue('');
    }
    onInputChange?.('');

    // Clear selection
    if (!isControlledKey) {
      setInternalSelectedKey(null);
    }
    externalOnSelectionChange?.(null);

    // Close popover
    if (isPopoverOpen) {
      setIsPopoverOpen(false);
    }

    // Focus input
    inputRef.current?.focus();

    onClear?.();
  });

  // Keyboard navigation hook
  const { keyboardProps } = useComboBoxKeyboard({
    isPopoverOpen,
    listStateRef,
    hasResults,
    allowsCustomValue,
    effectiveInputValue,
    isClearable,
    onSelectionChange: handleSelectionChange,
    onClearValue: clearValue,
    onOpenPopover: () => setIsPopoverOpen(true),
    onClosePopover: () => setIsPopoverOpen(false),
    inputRef,
  });

  if (icon) {
    icon = <div data-element="InputIcon">{icon}</div>;

    if (prefix) {
      prefix = (
        <>
          {icon}
          {prefix}
        </>
      );
    } else {
      prefix = icon;
    }
  }

  let mods = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: isDisabled,
      hovered: false,
      focused: isFocused,
      loading: isLoading,
      prefix: !!prefix,
      suffix: true,
      clearable: showClearButton,
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isFocused,
      isLoading,
      prefix,
      showClearButton,
    ],
  );

  const comboBoxWidth = wrapperRef?.current?.offsetWidth;

  const shouldShowPopover = Boolean(isPopoverOpen && hasResults);

  // Close popover if no results
  useEffect(() => {
    if (isPopoverOpen && !hasResults) {
      setIsPopoverOpen(false);
    }
  }, [isPopoverOpen, hasResults]);

  const ensureInitialFocus = useCallback(() => {
    if (!shouldShowPopover) return;

    const listState = listStateRef.current;
    if (!listState) return;

    const { selectionManager, collection, disabledKeys, lastFocusSourceRef } =
      listState;
    if (!selectionManager || !collection) return;

    const collectFirstKey = (): Key | null => {
      for (const node of collection) {
        if (node.type === 'item') {
          if (!disabledKeys?.has(node.key)) return node.key;
        } else if (node.childNodes) {
          for (const child of node.childNodes) {
            if (child.type === 'item' && !disabledKeys?.has(child.key)) {
              return child.key;
            }
          }
        }
      }
      return null;
    };

    if (lastFocusSourceRef) lastFocusSourceRef.current = 'keyboard';

    if (selectionManager.focusedKey == null) {
      const keyToFocus =
        effectiveSelectedKey != null ? effectiveSelectedKey : collectFirstKey();
      if (keyToFocus != null) selectionManager.setFocusedKey(keyToFocus);
    }
  }, [shouldShowPopover, effectiveSelectedKey]);

  useLayoutEffect(() => {
    if (!shouldShowPopover) return;
    focusInitAttemptsRef.current = 0;

    const tick = () => {
      if (!shouldShowPopover) return;
      ensureInitialFocus();
      focusInitAttemptsRef.current += 1;
      // Try a few frames to wait for collection to mount
      if (
        focusInitAttemptsRef.current < 8 &&
        listStateRef.current?.selectionManager?.focusedKey == null
      ) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(tick));
  }, [shouldShowPopover, ensureInitialFocus]);

  const comboBoxField = (
    <ComboBoxWrapperElement
      ref={wrapperRef}
      qa={qa || 'ComboBox'}
      mods={mods}
      styles={wrapperStyles}
      style={{
        zIndex: isFocused ? 1 : 'initial',
      }}
      data-size={size}
    >
      {prefix ? <div data-element="Prefix">{prefix}</div> : null}
      <ComboBoxInput
        inputRef={inputRef}
        value={effectiveInputValue}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        autoFocus={autoFocus}
        size={size}
        mods={mods}
        inputStyles={inputStyles}
        keyboardProps={keyboardProps}
        focusProps={focusProps}
        isPopoverOpen={isPopoverOpen}
        hasResults={hasResults}
        comboBoxId={comboBoxId}
        listStateRef={listStateRef}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
      />
      <div data-element="Suffix">
        {suffixPosition === 'before' ? suffix : null}
        {validationState || isLoading ? (
          <>
            {validationState && !isLoading ? validation : null}
            {isLoading ? <LoadingIcon /> : null}
          </>
        ) : null}
        {suffixPosition === 'after' ? suffix : null}
        {showClearButton && (
          <ItemAction
            icon={<CloseIcon />}
            size={size}
            theme={validationState === 'invalid' ? 'danger' : undefined}
            qa="ComboBoxClearButton"
            data-no-trigger={hideTrigger ? '' : undefined}
            onPress={clearValue}
          />
        )}
        {!hideTrigger ? (
          <ItemAction
            ref={triggerRef}
            data-popover-trigger
            icon={<DownIcon />}
            qa="ComboBoxTrigger"
            mods={{
              pressed: isPopoverOpen,
              disabled: isDisabled,
              loading: isLoading,
            }}
            data-size={size}
            isDisabled={isDisabled}
            styles={triggerStyles}
            onClick={() => {
              if (!isDisabled) {
                setIsPopoverOpen(!isPopoverOpen);
                if (!isPopoverOpen) {
                  inputRef.current?.focus();
                }
              }
            }}
          />
        ) : null}
      </div>
      <ComboBoxOverlay
        isOpen={shouldShowPopover}
        triggerRef={wrapperRef as RefObject<HTMLElement>}
        popoverRef={popoverRef}
        listBoxRef={listBoxRef}
        direction={direction}
        shouldFlip={shouldFlip}
        overlayOffset={overlayOffset}
        comboBoxWidth={comboBoxWidth}
        comboBoxId={comboBoxId}
        overlayStyles={overlayStyles}
        listBoxStyles={listBoxStyles}
        optionStyles={optionStyles}
        sectionStyles={sectionStyles}
        headingStyles={headingStyles}
        effectiveSelectedKey={effectiveSelectedKey}
        isDisabled={isDisabled}
        disabledKeys={props.disabledKeys}
        items={items}
        listStateRef={listStateRef}
        label={label}
        ariaLabel={(props as any)['aria-label']}
        onSelectionChange={handleSelectionChange}
        onClose={() => setIsPopoverOpen(false)}
      >
        {filteredChildren}
      </ComboBoxOverlay>
    </ComboBoxWrapperElement>
  );

  return wrapWithField<Omit<CubeComboBoxProps<T>, 'children'>>(
    comboBoxField,
    ref,
    mergeProps({ ...props, styles }, {}),
  );
}) as unknown as (<T>(
  props: CubeComboBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

ComboBox.Item = Item;

ComboBox.Section = BaseSection;

Object.defineProperty(ComboBox, 'cubeInputType', {
  value: 'ComboBox',
  enumerable: false,
  configurable: false,
});
