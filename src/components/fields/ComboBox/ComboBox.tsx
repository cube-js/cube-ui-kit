import { FocusableRef, Key } from '@react-types/shared';
import React, {
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
import { Section as BaseSection, useListState } from 'react-stately';

import { useEvent } from '../../../_internal';
import { CloseIcon, DirectionIcon, LoadingIcon } from '../../../icons';
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
import { chainRaf } from '../../../utils/raf';
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
import { DisplayTransition } from '../../helpers';
import { Item } from '../../Item';
import { Portal } from '../../portal';
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
  qa: 'ComboBoxWrapper',
  styles: INPUT_WRAPPER_STYLES,
});

const InputElement = tasty({
  as: 'input',
  styles: DEFAULT_INPUT_STYLES,
});

const ComboBoxOverlayWrapper = tasty({
  qa: 'ComboBoxOverlayWrapper',
  styles: {
    position: 'absolute',
    zIndex: 1000,
  },
});

const ComboBoxOverlayElement = tasty({
  qa: 'ComboBoxOverlay',
  styles: {
    display: 'grid',
    gridRows: '1sf',
    gridColumns: '1sf',
    width: '$min-width max-content 50vw',
    height: 'initial max-content (50vh - 5x)',
    overflow: 'auto',
    background: '#white',
    radius: '1cr',
    shadow: true,
    padding: '0',
    border: '#border',
    hide: {
      '': false,
      hidden: true,
    },
    transition:
      'translate $transition ease-out, scale $transition ease-out, theme $transition ease-out',
    translate: {
      '': '0 0',
      'open & [data-placement="top"]': '0 0',
      '!open & [data-placement="top"]': '0 1x',
      'open & ([data-placement="bottom"] | ![data-placement]': '0 0',
      '!open & ([data-placement="bottom"] | ![data-placement])': '0 -1x',
    },
    transformOrigin: {
      '': 'top center',
      '[data-placement="top"]': 'bottom center',
    },
    scale: {
      '': '1 1',
      '!open': '1 .9',
    },
    opacity: {
      '': 1,
      '!open': 0.001,
    },

    '$min-width': 'min 30x',
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
  /** The default input value in uncontrolled mode */
  defaultInputValue?: string;
  /** Callback fired when input value changes */
  onInputChange?: (value: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input should have autofocus */
  autoFocus?: boolean;
  /** HTML autocomplete attribute for the input */
  autoComplete?: string;
  /** Callback fired when focus enters the component (input, trigger, or popover). Does not receive event object. */
  onFocus?: () => void;
  /** Callback fired when focus leaves the component entirely. Does not receive event object. */
  onBlur?: () => void;
  /** Callback fired when a key is pressed on the input */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

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
  /** Whether to commit custom value on blur in allowsCustomValue mode (default: true) */
  shouldCommitOnBlur?: boolean;
  /** Whether to clear selection and input on blur (default: false, only applies to non-custom-value mode) */
  clearOnBlur?: boolean;
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
  triggerRef?: FocusableRef<HTMLButtonElement>;

  /** Custom styles for the input */
  inputStyles?: Styles;
  /** Custom styles for the trigger button */
  triggerStyles?: Styles;
  /** Custom styles for the field wrapper */
  fieldStyles?: Styles;
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
   * Sort selected item to the top when the popover opens.
   * Only works when using the `items` prop (data-driven mode).
   * Ignored when using JSX children.
   * @default true when items are provided, false when using JSX children
   */
  sortSelectedToTop?: boolean;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

// ============================================================================
// Hook: useComboBoxState
// ============================================================================
interface UseComboBoxStateProps {
  selectedKey?: string | null;
  defaultSelectedKey?: string | null;
  inputValue?: string;
  defaultInputValue?: string;
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
  defaultInputValue,
  comboBoxId,
}: UseComboBoxStateProps): UseComboBoxStateReturn {
  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  // Internal state for uncontrolled mode
  const [internalSelectedKey, setInternalSelectedKey] = useState<Key | null>(
    defaultSelectedKey ?? null,
  );
  const [internalInputValue, setInternalInputValue] = useState(
    defaultInputValue ?? '',
  );

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
  effectiveInputValue: string;
  filter: FilterFn | false | undefined;
}

interface UseComboBoxFilteringReturn {
  filterFn: (nodes: Iterable<any>) => Iterable<any>;
  isFilterActive: boolean;
  setIsFilterActive: (active: boolean) => void;
}

function useComboBoxFiltering({
  effectiveInputValue,
  filter,
}: UseComboBoxFilteringProps): UseComboBoxFilteringReturn {
  const [isFilterActive, setIsFilterActive] = useState(false);

  const { contains } = useFilter({ sensitivity: 'base' });

  const textFilterFn = useMemo<FilterFn>(
    () => (filter === false ? () => true : filter || contains),
    [filter, contains],
  );

  // Create a filter function for collection nodes
  const filterFn = useCallback(
    (nodes: Iterable<any>) => {
      const term = effectiveInputValue.trim();

      // Don't filter if not active or no search term
      if (!isFilterActive || !term) {
        return nodes;
      }

      // Filter nodes based on their textValue and preserve section structure
      return [...nodes]
        .map((node: any) => {
          if (node.type === 'section' && node.childNodes) {
            const filteredChildren = [...node.childNodes].filter((child: any) =>
              textFilterFn(child.textValue || '', term),
            );

            if (filteredChildren.length === 0) {
              return null;
            }

            return {
              ...node,
              childNodes: filteredChildren,
              hasChildNodes: true,
            };
          }

          return textFilterFn(node.textValue || '', term) ? node : null;
        })
        .filter(Boolean);
    },
    [isFilterActive, effectiveInputValue, textFilterFn],
  );

  return {
    filterFn,
    isFilterActive,
    setIsFilterActive,
  };
}

// ============================================================================
// Hook: useCompositeFocus
// ============================================================================
interface UseCompositeFocusProps {
  wrapperRef: RefObject<HTMLElement>;
  popoverRef: RefObject<HTMLElement>;
  onFocus?: () => void;
  onBlur?: () => void;
  isDisabled?: boolean;
}

interface UseCompositeFocusReturn {
  compositeFocusProps: {
    onFocus: (e: React.FocusEvent) => void;
    onBlur: (e: React.FocusEvent) => void;
  };
}

function useCompositeFocus({
  wrapperRef,
  popoverRef,
  onFocus,
  onBlur,
  isDisabled,
}: UseCompositeFocusProps): UseCompositeFocusReturn {
  const wasInsideRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const checkFocus = useCallback(() => {
    if (isDisabled) return;

    const activeElement = document.activeElement;
    const isInside =
      (wrapperRef.current?.contains(activeElement) ?? false) ||
      (popoverRef.current?.contains(activeElement) ?? false);

    if (isInside !== wasInsideRef.current) {
      wasInsideRef.current = isInside;
      if (isInside) {
        onFocus?.();
      } else {
        onBlur?.();
      }
    }
  }, [wrapperRef, popoverRef, onFocus, onBlur, isDisabled]);

  const handleFocusOrBlur = useCallback(
    (e: React.FocusEvent) => {
      // Cancel any pending check
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // Schedule focus check for next frame
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        checkFocus();
      });
    },
    [checkFocus],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    compositeFocusProps: {
      onFocus: handleFocusOrBlur,
      onBlur: handleFocusOrBlur,
    },
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
  setIsFilterActive: (active: boolean) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
  setIsFilterActive,
  onKeyDown,
}: UseComboBoxKeyboardProps) {
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      // Call user's handler first
      onKeyDown?.(e as React.KeyboardEvent<HTMLInputElement>);

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        // Open popover if closed
        if (!isPopoverOpen) {
          // If opening with no filtered results, disable filter to show all items
          if (!hasResults) {
            setIsFilterActive(false);
          }
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
        // If popover is open, try to select the focused item first
        if (isPopoverOpen) {
          const listState = listStateRef.current;
          if (listState) {
            const keyToSelect = listState.selectionManager.focusedKey;

            if (keyToSelect != null) {
              e.preventDefault();
              listState.selectionManager.select(keyToSelect, e);
              // Ensure the popover closes even if selection stays the same
              onClosePopover();
              inputRef.current?.focus();
              return;
            }
          }
        }

        // If no results, handle empty input or custom values
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

        // Clear selection if input is empty and popover is closed (or no focused item)
        const trimmed = (effectiveInputValue || '').trim();
        if (trimmed === '') {
          e.preventDefault();
          onSelectionChange(null);
          return;
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
  qa?: string;
  inputRef: RefObject<HTMLInputElement>;
  id?: string;
  value: string;
  placeholder?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
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
      qa,
      inputRef,
      id,
      value,
      placeholder,
      isDisabled,
      isReadOnly,
      autoFocus,
      autoComplete,
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
        qa={qa}
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        isDisabled={isDisabled}
        readOnly={isReadOnly}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
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
  compositeFocusProps: {
    onFocus: (e: React.FocusEvent) => void;
    onBlur: (e: React.FocusEvent) => void;
  };
  filter?: (nodes: Iterable<any>) => Iterable<any>;
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
  compositeFocusProps,
  filter,
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

  // Update position when overlay opens or content changes
  useLayoutEffect(() => {
    if (isOpen && updatePosition) {
      // Use triple RAF to ensure layout is complete before positioning
      // This gives enough time for the DisplayTransition and content to render
      return chainRaf(() => {
        updatePosition();
      }, 3);
    }
  }, [isOpen]);

  // Extract primary placement direction for consistent styling
  const placementDirection = placement?.split(' ')[0] || direction;

  const overlayContent = (
    <DisplayTransition isShown={isOpen}>
      {({ phase, isShown, ref: transitionRef }) => (
        <ComboBoxOverlayWrapper
          {...mergeProps(
            overlayPositionProps,
            overlayBehaviorProps,
            compositeFocusProps,
          )}
          ref={popoverRef}
          style={overlayPositionProps.style}
        >
          <ComboBoxOverlayElement
            ref={transitionRef}
            data-placement={placementDirection}
            data-phase={phase}
            mods={{
              open: isShown,
              hidden: phase === 'unmounted',
            }}
            styles={overlayStyles}
            style={{
              '--min-width': comboBoxWidth ? `${comboBoxWidth}px` : undefined,
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
              filter={filter}
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
        </ComboBoxOverlayWrapper>
      )}
    </DisplayTransition>
  );

  return <Portal>{overlayContent}</Portal>;
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
        // Form value maps to selectedKey (the committed value) in both modes
        selectedKey: value ?? null,
        onSelectionChange(val: string | null) {
          // Commit selection changes to the form
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
    id,
    icon,
    prefix,
    isDisabled,
    autoFocus,
    autoComplete = 'off',
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
    fieldStyles,
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
    defaultInputValue,
    onInputChange,
    isClearable,
    onClear,
    placeholder,
    allowsCustomValue,
    shouldCommitOnBlur = true,
    clearOnBlur,
    items,
    children: renderChildren,
    sectionStyles,
    headingStyles,
    isReadOnly,
    overlayOffset = 8,
    onSelectionChange: externalOnSelectionChange,
    sortSelectedToTop: sortSelectedToTopProp,
    onFocus,
    onBlur,
    onKeyDown,
    form,
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
    defaultInputValue,
    comboBoxId,
  });

  // Track if sortSelectedToTop was explicitly provided
  const sortSelectedToTopExplicit = sortSelectedToTopProp !== undefined;
  // Default to true if items are provided, false otherwise
  const sortSelectedToTop = sortSelectedToTopProp ?? (items ? true : false);

  // Cache for sorted items array when using `items` prop
  const cachedItemsOrder = useRef<T[] | null>(null);
  const selectionWhenClosed = useRef<string | null>(null);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  wrapperRef = useCombinedRefs(wrapperRef);
  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  popoverRef = useCombinedRefs(popoverRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  // Sort items with selected on top if enabled
  const getSortedItems = useCallback((): typeof items => {
    if (!items) return items;

    if (!sortSelectedToTop) return items;

    // Reuse cached order if available
    if (cachedItemsOrder.current) {
      return cachedItemsOrder.current;
    }

    // Warn if explicitly requested but not supported
    if (sortSelectedToTopExplicit && !items) {
      console.warn(
        'ComboBox: sortSelectedToTop only works with the items prop. ' +
          'Sorting will be skipped when using JSX children.',
      );
      return items;
    }

    const selectedKey = isPopoverOpen
      ? effectiveSelectedKey
      : selectionWhenClosed.current;

    if (!selectedKey) return items;

    const itemsArray = Array.isArray(items) ? items : Array.from(items);
    const selectedItem = itemsArray.find((item) => {
      const key = (item as any)?.key ?? (item as any)?.id;
      return key != null && String(key) === String(selectedKey);
    });

    if (!selectedItem) return items;

    const sorted = [
      selectedItem,
      ...itemsArray.filter((item) => {
        const key = (item as any)?.key ?? (item as any)?.id;
        return key == null || String(key) !== String(selectedKey);
      }),
    ] as T[];

    if (isPopoverOpen) {
      cachedItemsOrder.current = sorted;
    }

    return sorted;
  }, [
    items,
    sortSelectedToTop,
    sortSelectedToTopExplicit,
    effectiveSelectedKey,
    isPopoverOpen,
  ]);

  const sortedItems = getSortedItems();

  // Preserve the original `children` (may be a render function) before we
  // potentially overwrite it.
  let children: ReactNode = renderChildren as ReactNode;

  const renderFn = renderChildren as unknown;

  if (sortedItems && typeof renderFn === 'function') {
    try {
      const itemsArray = Array.from(sortedItems as Iterable<any>);
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

  // Invalidate cached sorting whenever items change
  useEffect(() => {
    cachedItemsOrder.current = null;
  }, [items]);

  // Capture selection when popover closes
  useEffect(() => {
    if (!isPopoverOpen) {
      selectionWhenClosed.current =
        effectiveSelectedKey != null ? String(effectiveSelectedKey) : null;
      cachedItemsOrder.current = null;
    }
  }, [isPopoverOpen, effectiveSelectedKey]);

  // Filtering hook
  const { filterFn, isFilterActive, setIsFilterActive } = useComboBoxFiltering({
    effectiveInputValue,
    filter,
  });

  // Create local collection state for reading item data (labels, etc.)
  // This allows us to read item labels even before the popover opens
  const localCollectionState = useListState({
    children,
    items: sortedItems,
    selectionMode: 'none', // Don't manage selection in this state
  });

  const { isFocused, focusProps } = useFocus({ isDisabled });

  // Helper to check if current input value is valid
  const checkInputValidity = useCallback(() => {
    if (!effectiveInputValue.trim()) {
      return { isValid: false, singleMatchKey: null, filteredCount: 0 };
    }

    // Get filtered collection based on current input
    const filteredNodes = filterFn(localCollectionState.collection);
    const filteredItems: Array<{ key: Key; textValue: string }> = [];

    // Flatten filtered nodes (handle sections)
    for (const node of filteredNodes) {
      if (node.type === 'section' && node.childNodes) {
        for (const child of node.childNodes) {
          if (child.type === 'item') {
            filteredItems.push({
              key: child.key,
              textValue: child.textValue || '',
            });
          }
        }
      } else if (node.type === 'item') {
        filteredItems.push({
          key: node.key,
          textValue: node.textValue || '',
        });
      }
    }

    const filteredCount = filteredItems.length;

    // Check for exact match
    const exactMatch = filteredItems.find(
      (item) =>
        item.textValue.toLowerCase() ===
        effectiveInputValue.trim().toLowerCase(),
    );

    if (exactMatch) {
      return { isValid: true, singleMatchKey: exactMatch.key, filteredCount };
    }

    // If exactly one filtered result, consider it valid
    if (filteredCount === 1) {
      return {
        isValid: true,
        singleMatchKey: filteredItems[0].key,
        filteredCount,
      };
    }

    return { isValid: false, singleMatchKey: null, filteredCount };
  }, [effectiveInputValue, filterFn, localCollectionState.collection]);

  // Composite blur handler - fires when focus leaves the entire component
  const handleCompositeBlur = useEvent(() => {
    // NOTE: Do NOT disable filter yet; we need it active for validity check

    // In allowsCustomValue mode
    if (allowsCustomValue) {
      // Commit the input value if it's non-empty and nothing is selected
      if (
        shouldCommitOnBlur &&
        effectiveInputValue &&
        effectiveSelectedKey == null
      ) {
        externalOnSelectionChange?.(effectiveInputValue as string);
        if (!isControlledKey) {
          setInternalSelectedKey(effectiveInputValue as Key);
        }
        onBlur?.();
        setIsFilterActive(false);
        return;
      }

      // Clear selection if input is empty
      if (!String(effectiveInputValue).trim()) {
        externalOnSelectionChange?.(null);
        if (!isControlledKey) {
          setInternalSelectedKey(null);
        }
        if (!isControlledInput) {
          setInternalInputValue('');
        }
        onInputChange?.('');
        onBlur?.();
        setIsFilterActive(false);
        return;
      }
    }

    // In non-custom-value mode, validate input and handle accordingly
    if (!allowsCustomValue) {
      const { isValid, singleMatchKey } = checkInputValidity();

      // If there's exactly one filtered result, auto-select it
      if (
        isValid &&
        singleMatchKey != null &&
        singleMatchKey !== effectiveSelectedKey
      ) {
        const label = getItemLabel(singleMatchKey);

        if (!isControlledKey) {
          setInternalSelectedKey(singleMatchKey);
        }
        if (!isControlledInput) {
          setInternalInputValue(label);
        }
        onInputChange?.(label);
        externalOnSelectionChange?.(singleMatchKey as string | null);
        onBlur?.();
        setIsFilterActive(false);
        return;
      }

      // If input is invalid (no exact match, not a single result)
      if (!isValid) {
        const trimmedInput = effectiveInputValue.trim();

        // Clear if clearOnBlur is set or input is empty
        if (clearOnBlur || !trimmedInput) {
          externalOnSelectionChange?.(null);
          if (!isControlledKey) {
            setInternalSelectedKey(null);
          }
          if (!isControlledInput) {
            setInternalInputValue('');
          }
          onInputChange?.('');
          onBlur?.();
          setIsFilterActive(false);
          return;
        }

        // Reset input to current selected value (or empty if none)
        const nextValue =
          effectiveSelectedKey != null
            ? getItemLabel(effectiveSelectedKey)
            : '';

        if (!isControlledInput) {
          setInternalInputValue(nextValue);
        }
        onInputChange?.(nextValue);
        onBlur?.();
        setIsFilterActive(false);
        return;
      }
    }

    // Fallback: Reset input to show current selection (or empty if none)
    const nextValue =
      effectiveSelectedKey != null ? getItemLabel(effectiveSelectedKey) : '';

    if (!isControlledInput) {
      setInternalInputValue(nextValue);
    }
    onInputChange?.(nextValue);
    onBlur?.();
    setIsFilterActive(false);
  });

  // Composite focus hook - handles focus tracking across wrapper and portaled popover
  const { compositeFocusProps } = useCompositeFocus({
    wrapperRef,
    popoverRef,
    onFocus,
    onBlur: handleCompositeBlur,
    isDisabled,
  });

  let isInvalid = validationState === 'invalid';

  let validationIcon = isInvalid ? InvalidIcon : ValidIcon;
  let validation = cloneElement(validationIcon);

  // Ref to access internal ListBox state
  const listStateRef = useRef<any>(null);
  const focusInitAttemptsRef = useRef(0);

  // Helper to get label from local collection
  const getItemLabel = useCallback(
    (key: Key): string => {
      const item = localCollectionState?.collection?.getItem(key);
      return item?.textValue || String(key);
    },
    [localCollectionState?.collection],
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

      const label = getItemLabel(key);

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

      // Only clear selection in allowsCustomValue mode
      // In normal mode, typing just filters - selection stays until explicitly changed
      if (allowsCustomValue && effectiveSelectedKey != null) {
        if (!isControlledKey) {
          setInternalSelectedKey(null);
        }
        externalOnSelectionChange?.(null);
      }

      // Open popover based on trigger
      if (popoverTrigger !== 'manual' && value && !isPopoverOpen) {
        setIsPopoverOpen(true);
      }
    },
  );

  // Initialize input value from defaultInputValue or defaultSelectedKey (uncontrolled mode only, one-time)
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only initialize once, in uncontrolled input mode
    if (hasInitialized || isControlledInput) return;

    // Priority 1: defaultInputValue takes precedence
    if (defaultInputValue !== undefined) {
      setInternalInputValue(defaultInputValue);
      setHasInitialized(true);
      return;
    }

    // Priority 2: fall back to defaultSelectedKey's label
    if (defaultSelectedKey) {
      const label = getItemLabel(defaultSelectedKey);

      setInternalInputValue(label);
      setHasInitialized(true);
    }
  }, [
    hasInitialized,
    isControlledInput,
    defaultInputValue,
    defaultSelectedKey,
    getItemLabel,
    children,
  ]);

  // Sync input value with controlled selectedKey
  const lastSyncedSelectedKey = useRef<Key | null | undefined>(undefined);

  useEffect(() => {
    // Only run when selectedKey is controlled but inputValue is uncontrolled
    if (!isControlledKey || isControlledInput) return;

    // Skip if the key hasn't actually changed (prevents unnecessary resets when collection rebuilds)
    if (
      lastSyncedSelectedKey.current !== undefined &&
      lastSyncedSelectedKey.current === effectiveSelectedKey
    ) {
      return;
    }

    lastSyncedSelectedKey.current = effectiveSelectedKey;

    // Get the expected label for the current selection
    const expectedLabel =
      effectiveSelectedKey != null ? getItemLabel(effectiveSelectedKey) : '';

    // Update the input value to match the selected key's label
    setInternalInputValue(expectedLabel);
  }, [isControlledKey, isControlledInput, effectiveSelectedKey, getItemLabel]);

  // Input focus handler
  const handleInputFocus = useEvent((e: React.FocusEvent<HTMLInputElement>) => {
    // Call focus props handler if it exists
    focusProps.onFocus?.(e as any);

    if (popoverTrigger === 'focus' && !isPopoverOpen) {
      setIsPopoverOpen(true);
    }
  });

  // Input blur handler - just handles internal focus props
  const handleInputBlur = useEvent((e: React.FocusEvent<HTMLInputElement>) => {
    focusProps.onBlur?.(e as any);
  });

  // Clear button logic
  let hasValue = allowsCustomValue
    ? effectiveInputValue !== ''
    : effectiveSelectedKey != null;
  let showClearButton = isClearable && hasValue && !isDisabled && !isReadOnly;

  // Check if there are any results after filtering
  const hasResults = useMemo(() => {
    if (!children) return false;
    if (!Array.isArray(children) && children === null) return false;

    // If we have a collection, check if filtering will produce any results
    if (localCollectionState?.collection) {
      const filteredNodes = filterFn(localCollectionState.collection);
      const resultArray = Array.from(filteredNodes).flatMap((node: any) => {
        if (node.type === 'section' && node.childNodes) {
          return [...node.childNodes];
        }

        return [node];
      });
      return resultArray.length > 0;
    }

    // Fallback: check if children exists
    return Array.isArray(children) ? children.length > 0 : true;
  }, [children, localCollectionState?.collection, filterFn]);

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
    setIsFilterActive,
    onKeyDown,
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
      mods={mods}
      styles={styles}
      style={{
        zIndex: isFocused ? 1 : 'initial',
      }}
      data-size={size}
      {...compositeFocusProps}
    >
      {prefix ? <div data-element="Prefix">{prefix}</div> : null}
      <ComboBoxInput
        qa={qa || 'ComboBox'}
        inputRef={inputRef}
        id={id}
        value={effectiveInputValue}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        size={size}
        mods={mods}
        inputStyles={inputStyles}
        keyboardProps={keyboardProps}
        focusProps={{ ...focusProps, onBlur: handleInputBlur }}
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
            aria-label="Clear value"
            onPress={clearValue}
          />
        )}
        {!hideTrigger ? (
          <ItemAction
            ref={triggerRef}
            data-popover-trigger
            icon={<DirectionIcon to={isPopoverOpen ? 'up' : 'down'} />}
            qa="ComboBoxTrigger"
            mods={{
              pressed: isPopoverOpen,
              disabled: isDisabled,
              loading: isLoading,
            }}
            data-size={size}
            isDisabled={isDisabled}
            styles={triggerStyles}
            aria-expanded={isPopoverOpen}
            aria-haspopup="listbox"
            aria-label="Show options"
            onPress={() => {
              if (!isDisabled) {
                const willOpen = !isPopoverOpen;
                setIsPopoverOpen(willOpen);
                if (willOpen) {
                  inputRef.current?.focus();
                  // If opening with no filtered results, disable filter to show all items
                  if (!hasResults) {
                    setIsFilterActive(false);
                  }
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
        items={sortedItems}
        listStateRef={listStateRef}
        label={label}
        ariaLabel={(props as any)['aria-label']}
        compositeFocusProps={compositeFocusProps}
        filter={filterFn}
        onSelectionChange={handleSelectionChange}
        onClose={() => setIsPopoverOpen(false)}
      >
        {children}
      </ComboBoxOverlay>
    </ComboBoxWrapperElement>
  );

  const { children: _, ...propsWithoutChildren } = props;
  const finalProps = {
    ...propsWithoutChildren,
    styles: fieldStyles,
  };

  return wrapWithField<Omit<CubeComboBoxProps<T>, 'children'>>(
    comboBoxField,
    ref,
    mergeProps(finalProps, {}),
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
